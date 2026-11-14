// Puts every theme on one picture per mode, to compare the set at a glance.
//
//   bun scripts/sheet.ts <output folder>
//
// Writes sheet.dark.png and sheet.light.png (each theme under the chat frame,
// held still) and bare.dark.png and bare.light.png (the scenes alone).

import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

import { frame } from './frame'
import { forceMode, loadThemes, type Mode } from './themes'

const out = process.argv[2]

if (out === undefined) {
  console.error('usage: bun scripts/sheet.ts <output folder>')
  process.exit(2)
}

await mkdir(out, { recursive: true })

const themes = await loadThemes()
const escape = (html: string) => html.replaceAll('&', '&amp;').replaceAll('"', '&quot;')

const sheet = (mode: Mode, hasChat: boolean) => {
  const cells = themes
    .filter(theme => theme.modes.includes(mode))
    .map(theme => {
      const still = forceMode(theme.scene, mode).replace('<svg ', '<svg class="still" ')

      return `<figure><iframe srcdoc="${escape(frame(theme, mode, still, hasChat))}"></iframe><figcaption>${theme.numeral}. ${theme.title}</figcaption></figure>`
    })
    .join('')

  return `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:16px;background:#777;font:600 15px system-ui,sans-serif;color:#fff}
    main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
    figure{margin:0}figcaption{padding:4px 2px}
    .cell{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden}
    iframe{border:0;width:1280px;height:800px;transform-origin:0 0;transform:scale(calc(628 / 1280));display:block;margin-bottom:calc(-800px + 800px * 628 / 1280)}
    figure{width:628px;overflow:hidden}
  </style><main>${cells}</main>`
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2600, height: 1740 } })

for (const mode of ['dark', 'light'] as const) {
  for (const hasChat of [true, false]) {
    await page.setContent(sheet(mode, hasChat))
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(out, `${hasChat ? 'sheet' : 'bare'}.${mode}.png`), fullPage: true })
  }
}

await browser.close()
console.log(`wrote 4 sheets to ${out}`)
