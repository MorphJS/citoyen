import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
const shots = JSON.parse(process.env.SHOTS)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const click = async (t) => { const h = await p.evaluateHandle((s) => [...document.querySelectorAll('button')].find((x) => x.innerText.includes(s)), t); const e = h.asElement(); if (e) await e.click(); return !!e }
for (const [name, qs, ...acts] of shots) {
  await p.goto(`http://localhost:4173/#/ensayo?bar=0&${qs}`, { waitUntil: 'networkidle0' })
  await sleep(1600)
  for (const a of acts) {
    if (a.startsWith('click:')) { await click(a.slice(6)); await sleep(900) }
    else if (a.startsWith('scroll:')) { await p.evaluate((y) => window.scrollTo(0, y), Number(a.slice(7))); await sleep(500) }
    else if (a === 'article') { const el = await p.$('article'); await el.screenshot({ path: `${process.env.OUT}/${name}.png` }); continue }
    else if (a.startsWith('wait:')) await sleep(Number(a.slice(5)))
  }
  if (!acts.includes('article')) await p.screenshot({ path: `${process.env.OUT}/${name}.png` })
}
console.log('errores:', errs.length ? errs.join(' | ') : 'ninguno')
await b.close()
