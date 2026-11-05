// Descarga imágenes de dominio público de Wikimedia Commons a public/img y genera CREDITS.json.
// Uso: node scripts/fetch-images.mjs            (descarga todo)
//      node scripts/fetch-images.mjs --search "texto"   (lista candidatos)
import { mkdir, writeFile } from 'node:fs/promises'

const UA = 'CitoyenClassProject/1.0 (student presentation; kyetaeterna@gmail.com)'
const API = 'https://commons.wikimedia.org/w/api.php'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(params, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const url = `${API}?${new URLSearchParams({ format: 'json', ...params })}`
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      await sleep(4000 * (i + 1)) // rate limited
    }
  }
  throw new Error('API limitada: ' + JSON.stringify(params))
}

if (process.argv[2] === '--search') {
  const j = await api({ action: 'query', generator: 'search', gsrnamespace: 6, gsrlimit: 8, gsrsearch: process.argv[3], prop: 'imageinfo', iiprop: 'size' })
  for (const p of Object.values(j.query?.pages ?? {}).sort((a, b) => a.index - b.index)) console.log(p.title, p.imageinfo?.[0]?.width + 'x' + p.imageinfo?.[0]?.height)
  process.exit(0)
}

// key -> título exacto en Commons, ancho objetivo
const IMAGES = JSON.parse(process.env.IMAGES_JSON ?? 'null') ?? (await import('./images.json', { with: { type: 'json' } })).default

await mkdir('public/img', { recursive: true })
const credits = process.env.ONLY ? JSON.parse((await import('node:fs')).readFileSync('public/img/CREDITS.json', 'utf8')) : {}
for (const [key, { title, width = 1600 }] of Object.entries(IMAGES)) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(key)) continue
  const j = await api({
    action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: width,
  })
  const page = Object.values(j.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) { console.log('FALTA', key, title); continue }
  const src = info.thumburl ?? info.url
  let buf
  for (let i = 0; i < 5; i++) {
    const r = await fetch(src, { headers: { 'User-Agent': UA } })
    if (r.ok) { buf = Buffer.from(await r.arrayBuffer()); break }
    await sleep(4000 * (i + 1))
  }
  if (!buf) { console.log('ERROR descarga', key); continue }
  const ext = src.split('?')[0].split('.').pop().toLowerCase()
  const file = `${key}.${ext}`
  await writeFile(`public/img/${file}`, buf)
  const m = info.extmetadata ?? {}
  credits[key] = {
    file, title, page: info.descriptionurl,
    artist: (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(),
    license: m.LicenseShortName?.value ?? '',
  }
  console.log('OK', key, file, (buf.length / 1024) | 0, 'KB', credits[key].license)
  await sleep(1500)
}
await writeFile('public/img/CREDITS.json', JSON.stringify(credits, null, 2))
