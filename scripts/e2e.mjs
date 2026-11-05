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
const clickText = async (p, t, root = 'button') => {
  const h = await p.evaluateHandle((s, r) => [...document.querySelectorAll(r)].find((b) => b.innerText.includes(s)), t, root)
  const el = h.asElement(); if (!el) return false
  await el.click(); return true
}
/** Flujo móvil: abre el panel “Decidir” (si existe) y pulsa la opción por texto o por posición. Confirma si pide confirmación. */
async function decide(p, opt, confirm) {
  if (!(await p.$('[role=dialog]'))) { await clickText(p, 'Decidir'); await sleep(700) }
  if (typeof opt === 'number') {
    const h = await p.evaluateHandle((n) => [...document.querySelectorAll('[role=dialog] button')].filter((b) => !b.innerText.includes('Volver'))[n], opt)
    const el = h.asElement(); if (el) await el.click()
  } else await clickText(p, opt, '[role=dialog] button')
  await sleep(600)
  if (confirm) { await clickText(p, confirm); await sleep(600) }
}
const sceneNow = async () => (await sb.from('sessions').select('scene').eq('code', code).single()).data?.scene
const press = async (k) => { await hostPage.bringToFront(); await hostPage.keyboard.press(k) }
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
const SID = (await sb.from('sessions').select('id').eq('code', code).single()).data.id

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
  check(`celular ${i} se une y recibe sus papeles`, await waitText(page, 'Tus papeles', 15000))
  phones.push(page)
}
await sleep(2500)
const hostTxt = await text(hostPage)
check('el proyector cuenta 3 ciudadanos y lista nombres franceses (no apodos)', /3\s*\n?\s*ciudadanos/i.test(hostTxt) && !hostTxt.includes('jugador0'))
await shot(phones[0], 'phone_01_papeles')
await phones[1].reload({ waitUntil: 'networkidle0' })
check('recargar un celular lo reincorpora con la misma identidad', await waitText(phones[1], 'Tus papeles', 12000))

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

  if (scene === 'a1_rumor') {
    const t0 = await text(phones[0])
    check('a1: el celular muestra el panfleto como documento y un botón Decidir', /imprimerie/i.test(t0) && /decidir/i.test(t0))
    await shot(phones[0], 'phone_02_panfleto')
    await decide(phones[1], 'Compartirlo')
    await decide(phones[2], 'Denunciarlo', 'Sí, denunciar') // decisión grave: pide confirmación
    await decide(phones[0], 'Ir a verificarlo')
    check('a1: verificar cuesta tiempo y luego revela lo que encuentras', await waitText(phones[0], 'Lo que encuentras', 14000))
    await decide(phones[0], 'Contárselo a tus vecinos')
    await sleep(1500)
    const n = (await sb.from('decisions').select('id').eq('scene', 'a1_rumor').eq('session_id', SID)).data?.length
    check('a1: se registran 3 decisiones principales + 1 de seguimiento', n === 4, `n=${n}`)
    check('a1: el celular muestra la consecuencia (eco) de lo decidido', /hoy/i.test(await text(phones[1])))
    await shot(phones[1], 'phone_03_eco')
  }
  if (scene === 'a1_rumor_resultados') {
    await sleep(1800)
    const hostT = await text(hostPage)
    check('a1: el proyector muestra resultados y la verdad de cada panfleto', hostT.includes('3 respuestas') && /FALSO|CIERTO|MEDIA VERDAD/i.test(hostT))
    const ph = await text(phones[0])
    check('a1: el celular revela la verdad sobre SU panfleto', /EL PANFLETO (ERA|DECÍA)/i.test(ph))
    await shot(phones[0], 'phone_04_verdad')
    await press('d'); await sleep(900)
    check('tecla D: el proyector muestra preguntas para debatir', /para debatir/i.test(await text(hostPage)))
    await shot(hostPage, 'host_debate')
    await press('d')
  }
  if (scene === 'a2_rey') {
    await sleep(1200)
    const texts = await Promise.all(phones.map(text))
    const reyIdx = texts.findIndex((t) => t.includes('Eres el'))
    check('a2: exactamente un jugador es el “rey”', texts.filter((t) => t.includes('Eres el')).length === 1)
    if (reyIdx >= 0) {
      for (let k = 0; k < 3; k++) { await decide(phones[reyIdx], 1); await sleep(900) }
      await sleep(1500)
      check('a2: el proyector muestra lo que decide el “rey” en vivo', !(await text(hostPage)).includes('Esperando…'))
      await shot(phones[reyIdx], 'phone_05_rey')
    }
  }
  if (scene === 'a2_contrapesos') { await sleep(800); for (const p of phones) await decide(p, 0); await sleep(1000) }
  if (scene === 'a3_decreto') {
    check('a3: el celular muestra el cartel del Comité y cuántos reaccionaron', /comité de salvación/i.test(await text(phones[0])) && /la plaza ahora/i.test(await text(phones[0])))
    await shot(phones[0], 'phone_06_cartel')
    await decide(phones[0], 'Criticar', 'Sí, criticar') // grave
    await decide(phones[1], 'Aplaudir')
    await decide(phones[2], 'Callar')
    await sleep(1200)
  }
  if (scene === 'a3_cordelier') {
    await sleep(800)
    await clickText(phones[0], 'Decidir'); await sleep(600)
    await clickText(phones[0], 'Escribir', '[role=dialog] button'); await sleep(600)
    await phones[0].type('textarea', 'Piedad, ciudadanos: la libertad no se defiende con miedo.')
    check('cordelier: el texto se compone en vivo en la hoja impresa', (await text(phones[0])).includes('iedad, ciudadanos'))
    await shot(phones[0], 'phone_07_cordelier')
    await clickText(phones[0], 'Enviar a moderación')
    for (const p of phones.slice(1)) await decide(p, 'No escribir')
    await sleep(2500)
    const pend = await sb.rpc('host_list_pending_posts', { p_code: code, p_host_secret: secret })
    check('cordelier: el texto queda PENDIENTE y no aparece en el proyector', pend.data?.length === 1 && !(await text(hostPage)).includes('Piedad, ciudadanos'))
    await sb.rpc('host_moderate_post', { p_code: code, p_host_secret: secret, p_post: pend.data[0].id, p_status: 'approved' })
    await sleep(3200)
    check('cordelier: tras aprobar, aparece en el proyector sin nombre', (await text(hostPage)).includes('Piedad, ciudadanos') && (await text(hostPage)).includes('un ciudadano'))
  }
  if (scene === 'a3_danton') {
    await press('a'); await sleep(2800)
    const fates = (await sb.from('players').select('fate').eq('session_id', SID)).data
    check('danton: la tecla A arresta por azar (≥1 jugador)', fates.filter((f) => f.fate === 'arrestado').length >= 1)
    const ts = await Promise.all(phones.map(text))
    check('danton: el arrestado ve su orden y aclara que fue el AZAR; los demás enfrentan a Duval', ts.some((t) => /AZAR del juego/i.test(t)) && ts.some((t) => /Duval/i.test(t)))
    await shot(phones[Math.max(0, ts.findIndex((t) => /AZAR del juego/i.test(t)))], 'phone_08_detenido')
    for (const [i, p] of phones.entries()) if (!/AZAR del juego/i.test(ts[i])) await decide(p, 'Pedir que se le dé un juicio justo', 'Sí, hablar')
    await sleep(900)
  }
  if (scene === 'a3_tribunal_garantias') {
    await sleep(800)
    for (const p of phones) if (/Decidir/.test(await text(p))) await decide(p, 'Defenderme')
    await sleep(1000)
    await press('f'); await sleep(3000)
    const f = (await sb.from('players').select('fate').eq('session_id', SID)).data.map((x) => x.fate)
    check('tribunal: la tecla F publica destinos (absuelto/condenado/no_citado)', f.every((x) => ['absuelto', 'condenado', 'no_citado'].includes(x)), f.join(','))
    check('tribunal: los celulares muestran el resultado en texto sobrio', /Tu caso fue|No fuiste citado/.test((await Promise.all(phones.map(text))).join('|')))
    await shot(phones[0], 'phone_09_sentencia')
  }
  if (scene === 'a3_pradial') { await sleep(500); await shot(phones[0], 'phone_10_pradial'); await sleep(7000) }
  if (scene === 'a3_tribunal_sin_garantias') {
    await sleep(800)
    for (const p of phones) if (/Decidir/.test(await text(p))) await decide(p, 'Esperar la sentencia')
    await press('f'); await sleep(3000)
  }
  if (scene === 'a3_resultados') { await sleep(1800); check('debrief: números agregados sin nombres', /callaron/.test(await text(hostPage))) }
  if (['a4_fiesta', 'a4_union', 'a4_vecino', 'a5_kant', 'a5_mill'].includes(scene)) {
    await sleep(700)
    if (scene === 'a4_vecino') {
      check('a4: el celular muestra la carta del pueblo vecino (ficticio y neutral)', /hohenau/i.test(await text(phones[0])))
      await shot(phones[0], 'phone_11_carta')
      await decide(phones[0], 'Presionar', 'Sí, presionar')
      await decide(phones[1], 'Respetar')
      await decide(phones[2], 'Convencer')
    } else for (const [i, p] of phones.entries()) await decide(p, i % 2)
    await sleep(900)
  }
  if (scene === 'a5_final') {
    await sleep(1500)
    const t = await text(phones[0])
    check('final: el celular muestra su final y la tarjeta descargable', /Tu historia/.test(t) && t.includes('Descargar tarjeta'))
    await shot(phones[0], 'phone_12_final')
  }
}
check('se recorrieron todas las escenas hasta Fuentes', scene === 'fuentes', `${seen.size} escenas`)

// ---- Cierre: el botón discreto borra TODOS los datos de la sala ----
await sleep(1200)
const endSel = 'button[aria-label="Cerrar la actividad y borrar los datos"]'
const endBtn = await hostPage.$(endSel)
check('cierre: hay un botón pequeño y discreto en la última escena', !!endBtn)
const op = endBtn ? await hostPage.evaluate((s) => getComputedStyle(document.querySelector(s)).opacity, endSel) : '1'
check('cierre: el botón es disimulado (baja opacidad)', Number(op) < 0.4, 'opacity=' + op)
await endBtn.click(); await sleep(500)
check('cierre: pide el código y deshabilita el borrado hasta escribirlo', await hostPage.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Borrar todo'))?.disabled === true))
await hostPage.type('[role=dialog] input', code)
await clickText(hostPage, 'Borrar todo')
await sleep(2500)
const left = {
  sessions: (await sb.from('sessions').select('id').eq('code', code)).data?.length,
  players: (await sb.from('players').select('id').eq('session_id', SID)).data?.length,
  decisions: (await sb.from('decisions').select('id').eq('session_id', SID)).data?.length,
  posts: (await sb.from('posts').select('id').eq('session_id', SID)).data?.length,
}
check('cierre: se borraron sala, jugadores, decisiones y textos', Object.values(left).every((n) => n === 0), JSON.stringify(left))
check('cierre: los celulares avisan que la actividad terminó', await waitText(phones[0], 'Gracias por jugar', 12000))
await shot(phones[0], 'phone_13_cierre')
check('cierre: el celular olvida su sesión guardada', await phones[0].evaluate((c) => localStorage.getItem('citoyen:player:' + c) === null, code))
console.log('\nSala de prueba borrada por la propia app: ' + code)
const failed = results.filter((x) => !x).length
console.log(failed === 0 ? 'E2E VERDE' : `E2E ROJO: ${failed} fallo(s)`)
await browser.close()
process.exit(failed === 0 ? 0 : 1)
