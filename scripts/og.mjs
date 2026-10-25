// Gera public/og-pt.png e public/og-en.png (1200×630) a partir da cena 3D real.
// Uso: com `npm run dev` rodando →  node scripts/og.mjs [http://localhost:5173]
// (requer Chromium: npx playwright install chromium, ou CHROMIUM_PATH)
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:5173'
const font = (p) => `data:font/woff2;base64,${readFileSync(new URL(`../node_modules/${p}`, import.meta.url)).toString('base64')}`
const display = font('@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2')
const mono = font('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')

const COPY = {
  pt: { eyebrow: 'SIMULAÇÃO 3D INTERATIVA', title: ['Editar o genoma.', 'Pensar as consequências.'], sub: 'CRISPR-Cas9 do guia ao reparo: mecanismo, boas práticas e bioética.' },
  en: { eyebrow: 'INTERACTIVE 3D SIMULATION', title: ['Edit the genome.', 'Weigh the consequences.'], sub: 'CRISPR-Cas9 from guide to repair: mechanism, best practice and bioethics.' },
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 })
// sem cursor customizado nem animações de entrada na captura
await page.emulateMedia({ reducedMotion: 'reduce' })

// 1) quadro da cena: Cas9 sobre o DNA com o R-loop formado
await page.goto(`${base}/?lang=pt`, { waitUntil: 'networkidle' })
await page.evaluate(() => document.getElementById('playground')?.scrollIntoView())
await page.waitForTimeout(2500)
await page.addStyleTag({ content: '.stage > *:not(:first-child), .label3d { display: none !important } .stage { border-radius: 0 !important; border: 0 !important }' })
await page.evaluate(() => window.__sim.setState({ quality: 'high', qualityAuto: false, step: 2, progress: 0.97, playing: false, camTick: 99 }))
await page.waitForTimeout(6000)
const scene = (await page.locator('.stage').screenshot()).toString('base64')

// 2) composição com título
for (const lang of ['pt', 'en']) {
  const c = COPY[lang]
  await page.setViewportSize({ width: 1200, height: 630 })
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: D; src: url(${display}) format('woff2'); font-weight: 300 700; }
    @font-face { font-family: M; src: url(${mono}) format('woff2'); font-weight: 300 700; }
    html, body { margin: 0; width: 1200px; height: 630px; background: #04060b; overflow: hidden; }
    .bg { position: absolute; inset: 0; background: url(data:image/png;base64,${scene}) 62% 50% / cover no-repeat; }
    .shade { position: absolute; inset: 0; background: linear-gradient(90deg, #04060b 0%, rgba(4,6,11,.92) 38%, rgba(4,6,11,.25) 72%, rgba(4,6,11,.1) 100%); }
    .box { position: absolute; left: 64px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; color: #fff; font-family: D; }
    .eyebrow { font-family: M; font-size: 17px; letter-spacing: .3em; color: #3ef0d0; }
    h1 { margin: 22px 0 0; font-size: 70px; line-height: .95; letter-spacing: -.03em; font-weight: 650; }
    h1 span { background: linear-gradient(90deg, #3ef0d0, #7dff9b, #ffb547); -webkit-background-clip: text; color: transparent; }
    p { margin: 26px 0 0; font-size: 25px; line-height: 1.35; color: #a9b8c9; max-width: 560px; }
    .brand { position: absolute; left: 64px; bottom: 44px; display: flex; gap: 12px; align-items: center; font-family: D; font-weight: 600; font-size: 22px; color: #fff; }
    .brand b { color: #3ef0d0; font-weight: 600; }
  </style></head><body>
    <div class="bg"></div><div class="shade"></div>
    <div class="box"><div class="eyebrow">${c.eyebrow}</div><h1>${c.title[0]}<br><span>${c.title[1]}</span></h1><p>${c.sub}</p></div>
    <div class="brand"><svg width="30" height="30" viewBox="0 0 32 32"><path d="M9 2c0 9 14 10 14 18s-14 9-14 10M23 2c0 9-14 10-14 18s14 9 14 10" stroke="#3ef0d0" stroke-width="2.5" fill="none"/></svg><span>Proto<b>space</b></span></div>
  </body></html>`)
  await page.waitForTimeout(400)
  await page.screenshot({ path: new URL(`../public/og-${lang}.png`, import.meta.url).pathname })
  console.log(`ok public/og-${lang}.png`)
}
await browser.close()
