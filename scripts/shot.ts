// Takes pictures of one theme so you can judge it by eye.
//
//   bun scripts/shot.ts <name> <output folder>
//
// For each mode it writes four PNGs, 1280x800:
//   <name>.<mode>.png        the scene under a plain chat frame, as a person would see it
//   <name>.<mode>.bare.png   the scene alone, held still (what shows while reading)
//   <name>.<mode>.move1.png  the scene alone, moving, one second in
//   <name>.<mode>.move2.png  the same, two and a half seconds in

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

import { frame } from './frame'
import { forceMode, loadThemes } from './themes'

const [name, out] = process.argv.slice(2)

if (name === undefined || out === undefined) {
  console.error('usage: bun scripts/shot.ts <name> <output folder>')
  process.exit(2)
}

const [theme] = await loadThemes(name)

if (theme === undefined) {
  console.error(`no theme named ${name}`)
  process.exit(2)
}

await mkdir(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

for (const mode of theme.modes) {
  const moving = forceMode(theme.scene, mode)
  const still = moving.replace('<svg ', '<svg class="still" ')
  const save = (suffix: string) => page.screenshot({ path: join(out, `${name}.${mode}${suffix}.png`) })

  await page.setContent(frame(theme, mode, still, true))
  await save('')

  await page.setContent(frame(theme, mode, still, false))
  await save('.bare')

  await page.setContent(frame(theme, mode, moving, false))
  await page.waitForTimeout(1000)
  await save('.move1')
  await page.waitForTimeout(1500)
  await save('.move2')
}

await browser.close()
console.log(`wrote ${theme.modes.length * 4} pictures to ${out}`)
