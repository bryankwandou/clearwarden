// Renders public/favicon.svg into the PNG icons the web app manifest needs.
// Usage: node scripts/icons.mjs
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
// fileURLToPath decodes %20; URL.pathname does not, and the repo path has spaces.
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

// pad = share of the canvas left empty around the mark; maskable icons need a safe zone of about 20%.
const icons = [
  { name: 'icon-192.png', size: 192, pad: 0.08, bg: 'transparent' },
  { name: 'icon-512.png', size: 512, pad: 0.08, bg: 'transparent' },
  { name: 'icon-maskable-512.png', size: 512, pad: 0.22, bg: '#0A0F0E' },
  { name: 'apple-touch-icon.png', size: 180, pad: 0.14, bg: '#0A0F0E' },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { name, size, pad, bg } of icons) {
  await page.setViewportSize({ width: size, height: size })
  const inner = Math.round(size * (1 - pad * 2))
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg}"><img src="${uri}" width="${inner}" height="${inner}"></body>`)
  await page.screenshot({ path: out(name), omitBackground: bg === 'transparent' })
  console.log(name)
}
await browser.close()
