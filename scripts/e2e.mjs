// Prueba de punta a punta REAL: 1 host (proyector) + 3 celulares (390×844) jugando contra Supabase.
// Uso: npm run build && npx vite preview --port 4173   (en otra terminal)   y luego   npm run e2e
// Variables: BASE (default http://localhost:4173/), CHROME (ruta a chrome.exe), SHOTS (carpeta de capturas)
import { createClient } from '@supabase/supabase-js'
import { mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env
const BASE = process.env.BASE ?? 'http://localhost:4173/'
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const SHOTS = process.env.SHOTS ?? 'e2e-shots'
mkdirSync(SHOTS, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sb = createClient(url, key, { auth: { persistSession: false } })

const results = []
const check = (name, pass, detail = '') => { results.push(pass); console.log(`${pass ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`) }

const code = ('E' + Math.random().toString(36).slice(2, 5)).toUpperCase()
const secret = 'e2e-' + Math.random().toString(36).slice(2, 8)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const hostPage = await browser.newPage()
await hostPage.setViewport({ width: 1280, height: 720 })
hostPage.on('pageerror', (e) => console.log('  [host pageerror]', e.message))

const text = (p) => p.evaluate(() => document.body.innerText)
const waitText = (p, t, ms = 12000) => p.waitForFunction((s) => document.body.innerText.toLowerCase().includes(s.toLowerCase()), { timeout: ms }, t).then(() => true).catch(() => false)
const clickText = async (p, t) => { const h = await p.evaluateHandle((s) => [...document.querySelectorAll('button')].find((b) => b.innerText.includes(s)), t); const el = h.asElement(); if (!el) return false; await el.click(); return true }
const sceneNow = async () => (await sb.from('sessions').select('scene').eq('code', code).single()).data?.scene
const press = async (k) => { await hostPage.bringToFront(); await hostPage.keyboard.press(k) }
const buttons = (p) => p.$$('button.min-h-16')
const shot = async (p, name) => p.screenshot({ path: `${SHOTS}/${name}.png` })

// ---- Host crea la sala POR LA INTERFAZ ----
await hostPage.goto(BASE + '#/presentar', { waitUntil: 'networkidle0' })
await hostPage.click('input[maxlength="6"]')
await hostPage.keyboard.down('Control'); await hostPage.keyboard.press('KeyA'); await hostPage.keyboard.up('Control')
await hostPage.keyboard.type(code)
await hostPage.type('input[type="password"]', secret)
await clickText(hostPage, 'Crear sala')
check('host crea la sala desde la interfaz', await waitText(hostPage, 'ciudadanos', 15000))
await sleep(1500)
check('el lobby muestra el código para el QR', (await text(hostPage)).includes(code))
await shot(hostPage, 'host_00_lobby_vacio')
const SID = (await sb.from('sessions').select('id').eq('code', code).single()).data.id // todas las consultas se limitan a ESTA sala

// ---- 3 celulares (contextos aislados = localStorage independiente) ----
const phones = []
for (let i = 0; i < 3; i++) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  page.on('pageerror', (e) => console.log(`  [p${i} pageerror]`, e.message))
  await page.goto(`${BASE}#/jugar?code=${code}`, { waitUntil: 'networkidle0' })
  await page.type('input[placeholder="Tu apodo"]', 'jugador' + i)
  await clickText(page, 'Entrar')
  const ok = await waitText(page, 'Tu identidad', 15000)
  check(`celular ${i} se une y recibe identidad`, ok)
  phones.push(page)
}
await sleep(2500)
const hostTxt = await text(hostPage)
check('el proyector cuenta 3 ciudadanos y lista sus nombres franceses (no apodos)', /3\s*\n?\s*ciudadanos/i.test(hostTxt) && !hostTxt.includes('jugador0'))
await shot(hostPage, 'host_01_lobby')
await shot(phones[0], 'phone_01_identidad')

// recarga: el celular conserva su identidad
const nameBefore = (await text(phones[1])).split('\n').find((l) => /[A-Z]/.test(l)) ?? ''
await phones[1].reload({ waitUntil: 'networkidle0' })
check('recargar un celular lo reincorpora con la misma identidad', await waitText(phones[1], 'Tu identidad', 12000))

// ---- Recorre la presentación con el teclado del host ----
const seen = new Set()
async function next() {
  const before = await sceneNow()
  await press('ArrowRight')
  for (let i = 0; i < 50; i++) { await sleep(200); const s = await sceneNow(); if (s !== before) { await sleep(1600); return s } }
  return before
}
let scene = await sceneNow()
let guard = 0
while (scene !== 'fuentes' && guard++ < 40) {
  scene = await next()
  if (!scene) { check('la sala existe y la escena avanza', false); break }
  if (seen.has(scene)) continue
  seen.add(scene)

  if (['a1_rumor'].includes(scene)) {
    check('a1: el celular muestra el panfleto', await waitText(phones[0], 'panfleto'))
    await shot(phones[0], 'phone_02_panfleto')
    for (const [i, p] of phones.entries()) { const b = await buttons(p); await b[[1, 2, 3][i]]?.click() } // creer / compartir / denunciar
    await sleep(1500)
    const n = (await sb.from('decisions').select('id').eq('scene', 'a1_rumor').eq('session_id', SID)).data?.length
    check('a1: las 3 respuestas se registran', n === 3, `n=${n}`)
  }
  if (scene === 'a1_rumor_resultados') { await sleep(1800); await shot(hostPage, 'host_02_resultados_a1'); check('a1: el proyector muestra resultados agregados', (await text(hostPage)).includes('3 respuestas')) }
  if (scene === 'a2_rey') {
    await sleep(1200)
    const texts = await Promise.all(phones.map(text))
    const reyIdx = texts.findIndex((t) => t.includes('Eres el'))
    check('a2: exactamente un jugador es el “rey”', texts.filter((t) => t.includes('Eres el')).length === 1)
    if (reyIdx >= 0) {
      for (let k = 0; k < 3; k++) { const b = await buttons(phones[reyIdx]); await b[1]?.click(); await sleep(1300) }
      await sleep(1500)
      check('a2: el proyector muestra lo que decide el “rey” en vivo', !(await text(hostPage)).includes('Esperando…'))
      await shot(hostPage, 'host_03_rey')
      await shot(phones[reyIdx], 'phone_03_rey')
    }
  }
  if (scene === 'a2_contrapesos') { await sleep(800); for (const p of phones) { const b = await buttons(p); await b[0]?.click() } await sleep(1200); await shot(phones[0], 'phone_04_grupo') }
  if (scene === 'a3_decreto') {
    // p0 critica (riesgo alto), p1 aplaude, p2 calla
    for (const [i, p] of phones.entries()) { const b = await buttons(p); await b[[2, 0, 1][i]]?.click() }
    await sleep(1200)
  }
  if (scene === 'a3_cordelier') {
    await sleep(800)
    await shot(phones[0], 'phone_05_cordelier')
    await clickText(phones[0], 'Escribir')
    await phones[0].type('textarea', 'Piedad, ciudadanos: la libertad no se defiende con miedo.')
    await clickText(phones[0], 'Enviar a moderación')
    for (const p of phones.slice(1)) await clickText(p, 'No escribir')
    await sleep(2500)
    const pend = await sb.rpc('host_list_pending_posts', { p_code: code, p_host_secret: secret })
    check('cordelier: el texto queda PENDIENTE y no aparece en el proyector', pend.data?.length === 1 && !(await text(hostPage)).includes('Piedad, ciudadanos'))
    await shot(hostPage, 'host_04_cordelier_pendiente')
    await sb.rpc('host_moderate_post', { p_code: code, p_host_secret: secret, p_post: pend.data[0].id, p_status: 'approved' })
    await sleep(3200)
    check('cordelier: tras aprobar, el texto aparece en el proyector (sin nombre)', (await text(hostPage)).includes('Piedad, ciudadanos') && (await text(hostPage)).includes('un ciudadano'))
    await shot(hostPage, 'host_05_cordelier_aprobado')
  }
  if (scene === 'a3_danton') {
    await press('a'); await sleep(2500)
    const fates = (await sb.from('players').select('fate').eq('session_id', SID)).data
    check('danton: la tecla A arresta por azar (≥1 jugador)', fates.filter((f) => f.fate === 'arrestado').length >= 1)
    await shot(hostPage, 'host_06_danton')
    await shot(phones[0], 'phone_06_danton')
  }
  if (scene === 'a3_tribunal_garantias') {
    await sleep(800)
    for (const p of phones) await clickText(p, 'Defenderme')
    await sleep(1200)
    await shot(phones[0], 'phone_07_tribunal')
    await press('f'); await sleep(3000)
    const f = (await sb.from('players').select('fate').eq('session_id', SID)).data.map((x) => x.fate)
    check('tribunal: la tecla F publica destinos (absuelto/condenado/no_citado)', f.every((x) => ['absuelto', 'condenado', 'no_citado'].includes(x)), f.join(','))
    const t = (await Promise.all(phones.map(text))).join('|')
    check('tribunal: los celulares muestran el resultado en texto sobrio', /Tu caso fue|No fuiste citado/.test(t))
    await shot(phones[0], 'phone_08_sentencia')
  }
  if (scene === 'a3_pradial') { await sleep(500); await shot(phones[0], 'phone_09_pradial_inicio'); await sleep(7500); await shot(phones[0], 'phone_10_pradial_fin'); await shot(hostPage, 'host_07_pradial') }
  if (scene === 'a3_tribunal_sin_garantias') { await sleep(800); for (const p of phones) await clickText(p, 'Esperar la sentencia'); await press('f'); await sleep(3000) }
  if (scene === 'a3_resultados') { await sleep(1800); await shot(hostPage, 'host_08_debrief'); check('debrief: números agregados sin nombres', /callaron/.test(await text(hostPage))) }
  if (['a4_fiesta', 'a4_union', 'a4_vecino', 'a5_kant', 'a5_mill'].includes(scene)) {
    await sleep(700)
    for (const [i, p] of phones.entries()) { const b = await buttons(p); await b[i % Math.max(1, b.length)]?.click() }
    await sleep(900)
  }
  if (scene === 'a4_resultados') { await sleep(1800); await shot(hostPage, 'host_09_resultados_a4') }
  if (scene === 'a5_kant') await shot(phones[0], 'phone_11_kant')
  if (scene === 'a5_final') {
    await sleep(1500)
    const t = await text(phones[0])
    check('final: el celular muestra su final y la tarjeta descargable', /Tu historia/.test(t) && t.includes('Descargar tarjeta'))
    await shot(phones[0], 'phone_12_final')
    await shot(phones[1], 'phone_13_final_p1')
    await shot(phones[2], 'phone_14_final_p2')
  }
  await shot(hostPage, `host_scene_${String(seen.size).padStart(2, '0')}_${scene}`)
}
check('se recorrieron todas las escenas hasta Fuentes', scene === 'fuentes', `${seen.size} escenas`)

console.log(`\nSala de prueba: ${code} → delete from public.sessions where code = '${code}';`)
const failed = results.filter((x) => !x).length
console.log(failed === 0 ? 'E2E VERDE' : `E2E ROJO: ${failed} fallo(s)`)
await browser.close()
process.exit(failed === 0 ? 0 : 1)
