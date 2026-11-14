// Pictures of the built site, to judge it by eye, and a check for sideways scroll on a phone.
//
//   bun scripts/shots.ts <output folder> [plate names...]     (after `bun run build`)
//
// Serves dist/ on a free port for as long as it runs, then stops.

import { mkdir } from 'node:fs/promises'
import { join, normalize } from 'node:path'
import { chromium } from 'playwright'

const [out, ...named] = process.argv.slice(2)
const platesToShoot = named.length > 0 ? named : ['pluvia']
const plate = platesToShoot[0]!

if (out === undefined) {
  console.error('usage: bun scripts/shots.ts <output folder> [plate names...]')
  process.exit(2)
}

const dist = join(import.meta.dir, '..', 'dist')
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const path = normalize(decodeURIComponent(new URL(request.url).pathname))
    const file = Bun.file(join(dist, path.endsWith('/') ? `${path}index.html` : path))

    return (await file.exists()) ? new Response(file) : new Response(Bun.file(join(dist, '404.html')), { status: 404 })
  },
})

await mkdir(out, { recursive: true })
const browser = await chromium.launch()
const problems: string[] = []

for (const width of [1440, 390]) {
  for (const scheme of ['light', 'dark'] as const) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 }, colorScheme: scheme, deviceScaleFactor: 1 })
    const page = await context.newPage()
    page.on('pageerror', error => problems.push(`${width} ${scheme}: ${error.message}`))

    for (const [name, path] of [['home', '/'], ...platesToShoot.map(name => [name, `/${name}/`])]) {
      await page.goto(`http://localhost:${server.port}${path}`, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

      if (overflow > 0) {
        problems.push(`${name} at ${width} ${scheme} scrolls sideways by ${overflow}px`)
      }

      await page.screenshot({ path: join(out, `${name}.${width}.${scheme}.top.png`) })
      await page.screenshot({ path: join(out, `${name}.${width}.${scheme}.full.png`), fullPage: true })
    }

    await context.close()
  }
}

// The behaviour: a tile moves on hover, the plate page plays and switches mode.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const still = (selector: string) =>
    page.evaluate(s => document.querySelector(s)?.shadowRoot?.querySelector('svg')?.classList.contains('still'), selector)
  await page.goto(`http://localhost:${server.port}/`)
  const before = await still('[data-tile] [data-scene]')
  await page.hover('[data-tile]')
  const during = await still('[data-tile] [data-scene]')
  await page.goto(`http://localhost:${server.port}/${plate}/`)
  await page.click('[data-play]')
  const playing = await still('.window.light [data-scene]')
  await page.click('[data-set-mode="dark"]')
  const darkShown = await page.evaluate(() => getComputedStyle(document.querySelector('.window.dark')!).display !== 'none')
  if (!(before === true && during === false && playing === false && darkShown)) {
    problems.push(`behaviour: tile still ${before} then ${during}, plate playing still=${playing}, dark shown ${darkShown}`)
  }
  await page.close()
}

await browser.close()
server.stop(true)
console.log(problems.length > 0 ? problems.join('\n') : 'no sideways scroll, no page errors')
console.log(`pictures in ${out}`)
