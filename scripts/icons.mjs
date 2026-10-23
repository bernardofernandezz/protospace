// Rasteriza public/favicon.svg nos tamanhos de ícone usados pelo manifest/iOS.
// Uso: node scripts/icons.mjs   (requer Chromium: npx playwright install chromium, ou CHROMIUM_PATH)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage()
for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;background:#04060b}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`)
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: false })
  console.log('ok', name)
}
await browser.close()
