import puppeteer from '/home/dombold/puppeteer/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js'
import { writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

const url   = process.argv[2] || 'http://localhost:3000'
const label = process.argv[3] || ''

const dir = './temporary screenshots'
mkdirSync(dir, { recursive: true })

// Find next screenshot number
const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'))
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? '0')).filter(n => !isNaN(n))
const n = nums.length ? Math.max(...nums) + 1 : 1

const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`
const filepath = join(dir, filename)

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  headless: true,
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

const screenshot = await page.screenshot({ fullPage: false })
writeFileSync(filepath, screenshot)
await browser.close()

console.log(filepath)
