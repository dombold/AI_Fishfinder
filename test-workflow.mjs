import puppeteer from '/home/dombold/puppeteer/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const dir = './temporary screenshots'
mkdirSync(dir, { recursive: true })

let n = 0
const snap = async (page, label) => {
  n++
  const f = join(dir, `screenshot-wf-${n}-${label}.png`)
  await page.screenshot({ path: f, fullPage: false })
  console.log('📸', f)
  return f
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true,
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// Capture browser console errors
const consoleErrors = []
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text())
    console.log('❌ Console error:', msg.text())
  }
})
page.on('pageerror', err => {
  consoleErrors.push(err.message)
  console.log('❌ Page error:', err.message)
})

// Step 1: Login
console.log('\n--- Step 1: Login ---')
await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
await snap(page, 'login')

await page.type('input[type="text"]', 'screenshottest')
await page.type('input[type="password"]', 'TestPass123!')
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
  page.click('button[type="submit"]'),
])
console.log('Current URL after login:', page.url())
await snap(page, 'after-login')

// Step 2: Dashboard with map
console.log('\n--- Step 2: Dashboard ---')
// Wait for map to load
await page.waitForSelector('.leaflet-container', { timeout: 10000 }).catch(() => console.log('⚠ Leaflet container not found'))
await snap(page, 'dashboard-map')

// Step 3: Click a location on the map (Rottnest Island area, Perth coast)
console.log('\n--- Step 3: Click map location ---')
const mapEl = await page.$('.leaflet-container')
if (mapEl) {
  const box = await mapEl.boundingBox()
  // Click roughly centre of the map (which should be somewhere in WA waters)
  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.75)
  await new Promise(r => setTimeout(r, 1000))
  await snap(page, 'map-pin-dropped')
}

// Step 4: Set dates (today is already set — just check the forecast appears)
console.log('\n--- Step 4: Wait for forecast graphs ---')
await new Promise(r => setTimeout(r, 5000)) // wait for forecast API call
await snap(page, 'forecast-graphs')

// Report
console.log('\n--- Summary ---')
if (consoleErrors.length === 0) {
  console.log('✅ No console errors detected')
} else {
  console.log(`❌ ${consoleErrors.length} console error(s):`)
  consoleErrors.forEach(e => console.log('  •', e))
}

await browser.close()
