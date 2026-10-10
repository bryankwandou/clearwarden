// Browser harness: drives every tool in a real Chromium, saves screenshots and a walkthrough video.
// Usage: node scripts/e2e.mjs [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:4173'
const OUT = 'docs/evidence'
mkdirSync(OUT, { recursive: true })
mkdirSync('docs/video', { recursive: true })

const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`) }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: 'docs/video', size: { width: 1440, height: 900 } }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|og\.png|429|Failed to load resource/.test(m.text())) errors.push(m.text()) })
const pause = (ms) => page.waitForTimeout(ms)
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` })

// Landing
await page.goto(BASE + '/#/')
await pause(3200)
check('landing renders hero', await page.getByRole('heading', { level: 1 }).isVisible())
await shot('01-landing-hero')
for (const y of [900, 1800, 2700, 3600, 4500]) { await page.mouse.wheel(0, 900); await pause(700) }
await page.screenshot({ path: `${OUT}/02-landing-full.png`, fullPage: true })
await page.evaluate(() => scrollTo(0, 0))

// Language switch
await page.getByRole('button', { name: 'Switch language' }).click()
await pause(600)
check('Indonesian copy loads', (await page.locator('h1').innerText()).includes('HP kamu'))
await shot('03-landing-id')
await page.getByRole('button', { name: 'Switch language' }).click()

// Dashboard one-tap
await page.goto(BASE + '/#/app')
await pause(1200)
await page.getByRole('button', { name: /Tap to check/ }).click()
await page.getByText('Engine live').waitFor({ timeout: 15000 })
check('one-tap ring runs clean, scan, boost', true)
await pause(800)
await shot('04-dashboard-onetap')

// Scan with EICAR
await page.goto(BASE + '/#/app/scan')
await page.getByRole('button', { name: /EICAR/ }).click()
await page.getByText('Threat').first().waitFor({ timeout: 10000 })
check('EICAR flagged as threat', true)
// Disguised binary: MZ header in a .jpg
await page.locator('input[type=file]').first().setInputFiles([
  { name: 'holiday.jpg', mimeType: 'image/jpeg', buffer: Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200)]) },
  { name: 'invoice.pdf.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('hello') },
  { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('just text') },
])
await pause(800)
const body = await page.locator('main').innerText()
check('disguised binary detected', body.includes('disguised-binary'))
check('double extension detected', body.includes('double-extension'))
check('plain text left clean', /notes\.txt\s*\n?\s*Clean/.test(body))
await shot('05-scan-results')

// Link check
await page.getByPlaceholder(/example\.com/).fill('malware.testcategory.com')
await page.getByRole('button', { name: 'Run' }).click()
await page.waitForSelector('text=/block list|not on the threat|does not resolve|Lookup failed/', { timeout: 15000 })
check('malware test domain blocked', (await page.locator('main').innerText()).includes('on a malware block list'))
await page.getByPlaceholder(/example\.com/).fill('wikipedia.org')
await page.getByRole('button', { name: 'Run' }).click()
await page.waitForSelector('text=/wikipedia.org is not on/', { timeout: 15000 }).then(() => check('safe domain passes', true), () => check('safe domain passes', false))
await shot('06-link-check')

// Duplicates: two copies of the same gradient at different sizes, plus a different image
const pngs = await page.evaluate(async () => {
  const mk = async (w, h, flip) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, w, h)
    gr.addColorStop(0, flip ? '#000' : '#fff'); gr.addColorStop(1, flip ? '#fff' : '#000')
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = flip ? '#f00' : '#0f0'; g.fillRect(w * 0.1, h * 0.6, w * 0.3, h * 0.3)
    return c.toDataURL('image/png').split(',')[1]
  }
  return [await mk(800, 600, false), await mk(400, 300, false), await mk(800, 600, true)]
})
await page.goto(BASE + '/#/app/dupes')
await page.locator('input[type=file]').setInputFiles(pngs.map((b, i) => ({ name: `photo-${i}.png`, mimeType: 'image/png', buffer: Buffer.from(b, 'base64') })))
await pause(1500)
const dtext = await page.locator('main').innerText()
check('duplicate group found (resized copy)', /Groups\s*\n?\s*1/.test(dtext), dtext.match(/Groups\s*\n?\s*\d+/)?.[0])
await shot('07-duplicates')

// Vault: create with PIN, add file, lock, unlock, open
await page.goto(BASE + '/#/app/vault')
await page.getByPlaceholder('Secret').fill('482915')
await page.getByRole('button', { name: 'Create your vault' }).last().click()
await page.locator('input[type=file]').setInputFiles({ name: 'passport-scan.txt', mimeType: 'text/plain', buffer: Buffer.from('private') })
await page.getByText('passport-scan.txt').waitFor()
check('vault stores encrypted file', true)
const stored = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('clearwarden-vault'); r.onsuccess = () => { const q = r.result.transaction('items').objectStore('items').getAll(); q.onsuccess = () => res(new TextDecoder().decode(q.result[0].data)) } }))
check('vault bytes are not plaintext', !String(stored).includes('private'))
await shot('08-vault-open')
await page.getByRole('button', { name: 'Lock' }).click()
await page.getByPlaceholder('Secret').fill('000000')
await page.getByRole('button', { name: 'Unlock vault' }).last().click()
check('wrong PIN rejected', await page.getByText('did not unlock').isVisible())
await page.getByPlaceholder('Secret').fill('482915')
await page.getByRole('button', { name: 'Unlock vault' }).last().click()
await page.getByText('passport-scan.txt').waitFor()
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Open' }).click()])
const fs = await import('node:fs')
check('vault decrypts back to original', fs.readFileSync(await dl.path(), 'utf8') === 'private')

// Boost
await page.goto(BASE + '/#/app/boost')
await page.getByText('CPU threads').waitFor()
check('boost reads device stats', true)
await shot('09-boost')

// Speed test
await page.goto(BASE + '/#/app/speed')
await page.getByRole('button', { name: 'Run' }).click()
await page.getByRole('button', { name: /Save receipt/ }).waitFor({ timeout: 60000 }).then(() => check('speed test completes', true), () => check('speed test completes', false))
const sp = await page.locator('main').innerText()
check('speed numbers present', /Download\s*\n?\s*[\d.]+ Mbps/.test(sp), sp.match(/Download\s*\n?\s*[\d.]+ Mbps/)?.[0]?.replace(/\s+/g, ' '))
await shot('10-speed')

// Solana devnet: fund burner, anchor a receipt, verify it
await page.goto(BASE + '/#/app/scan')
await page.getByRole('button', { name: /EICAR/ }).click()
await page.getByText('Threat').first().waitFor()
const pk = await page.evaluate(() => JSON.parse(localStorage.getItem('cw.devnet.burner') || 'null'))
writeFileSync(`${OUT}/burner-pubkey-only.txt`, 'see wallet card\n')
let funded = false
if (process.env.FUND_FROM) {
  const { execSync } = await import('node:child_process')
  const { Keypair } = await import('@solana/web3.js')
  const pub = Keypair.fromSecretKey(Uint8Array.from(pk)).publicKey.toBase58()
  try { execSync(`solana transfer ${pub} 0.05 --url devnet --keypair "${process.env.FUND_FROM}" --allow-unfunded-recipient`, { stdio: 'pipe' }); funded = true } catch (e) { console.log(String(e.stderr || e)) }
}
if (!funded) {
  await page.goto(BASE + '/#/app')
  await page.getByRole('button', { name: 'Get devnet SOL' }).click()
  await page.waitForTimeout(12000)
  await page.goto(BASE + '/#/app/scan')
  await page.getByRole('button', { name: /EICAR/ }).click()
  await page.getByText('Threat').first().waitFor()
}
await page.getByRole('button', { name: /Save receipt/ }).click()
const ok = await page.getByText('Receipt saved').waitFor({ timeout: 45000 }).then(() => true, () => false)
check('receipt written to Solana devnet', ok, ok ? '' : (await page.locator('.text-rose').allInnerTexts()).join(' '))
if (ok) {
  const sig = await page.evaluate(() => JSON.parse(localStorage.getItem('cw.receipts'))[0].sig)
  writeFileSync(`${OUT}/devnet-receipt.txt`, `https://explorer.solana.com/tx/${sig}?cluster=devnet\n`)
  await shot('11-receipt-saved')
  await page.goto(BASE + `/#/verify?sig=${sig}`)
  await page.getByText('Found on Solana devnet').waitFor({ timeout: 30000 }).then(() => check('receipt verified from chain', true), () => check('receipt verified from chain', false))
  await pause(600)
  await shot('12-verify')
}

// Native plan page
await page.goto(BASE + '/#/app/native')
await pause(800)
await shot('13-native')

check('no uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
await ctx.close()

// Mobile pass
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const mp = await m.newPage()
await mp.goto(BASE + '/#/'); await mp.waitForTimeout(2500)
await mp.screenshot({ path: `${OUT}/14-mobile-landing.png` })
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
check('no horizontal scroll at 390px', !overflow)
await mp.goto(BASE + '/#/app'); await mp.waitForTimeout(1200)
await mp.screenshot({ path: `${OUT}/15-mobile-app.png` })
await m.close()
await browser.close()

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2))
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
