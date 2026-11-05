import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] })
const ids = process.env.IDS.split(',')
for (const s of ids) {
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(`http://localhost:4173/#/presentar?demo=1&s=${s}`, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 2200))
  await p.screenshot({ path: `${process.env.OUT}/MD_${s}.png` })
  if (errs.length) console.log(s, errs.join('|'))
  await p.close()
}
console.log('listo'); await b.close()
