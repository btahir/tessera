// Draws the share images and the PNG icons from the real scenes and the mark.
//
//   bun scripts/assets.ts        (from site/, after `bun ../scripts/build-site.ts`)
//
//   public/og/home.png             1200x630, every plate in a grid
//   public/og/<name>.png           1200x630, one plate with its wall label
//   public/favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
//
// The pictures are committed, so the site's own build needs no browser.

import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium, type Page } from 'playwright'

import data from '../src/data/themes.json'
import { markSvg } from '../src/lib/mark'

type Theme = {
  name: string
  numeral: string
  title: string
  meaning: string
  tagline: string
  glass: { blur: number; opacity: number }
  roles: Record<string, string>
  modes: Record<string, { anchors: Record<string, string> }>
}

const site = join(import.meta.dir, '..')
const themes = data as unknown as Theme[]
const out = join(site, 'public')
const font = (path: string) => pathToFileURL(join(site, 'node_modules', path)).href

const FONTS = `
  @font-face{font-family:Serif;src:url(${font('@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2')}) format('woff2');font-weight:200 800}
  @font-face{font-family:Serif;font-style:italic;src:url(${font('@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2')}) format('woff2');font-weight:200 800}
  @font-face{font-family:Sans;src:url(${font('@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2')}) format('woff2');font-weight:400 700}
`

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen']
const countWord = (count: number) => NUMBER_WORDS[count] ?? String(count)
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const modesOf = (theme: Theme) => ['light', 'dark'].filter(mode => theme.modes[mode] !== undefined)

/** A scene, one mode forced, held still, in its own shadow root so scenes never collide. */
const scene = async (theme: Theme, mode: string) => {
  const svg = (await Bun.file(join(out, 'scenes', `${theme.name}.${mode}.svg`)).text()).replace('<svg ', '<svg class="still" ')

  return `<div class="scene"><template shadowrootmode="open"><style>:host{display:block}svg{display:block;width:100%;height:100%}</style>${svg}</template></div>`
}

const page = (body: string, css: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
  ${FONTS}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden}
  body{font-family:Sans,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .scene{position:absolute;inset:0}
  ${css}
</style></head><body>${body}</body></html>`

const temp = await mkdtemp(join(tmpdir(), 'tessera-assets-'))

const shoot = async (browser: Page, html: string, path: string, size = { width: 1200, height: 630 }, transparent = false) => {
  const file = join(temp, 'page.html')
  await Bun.write(file, html)
  await browser.setViewportSize(size)
  await browser.goto(pathToFileURL(file).href)
  await browser.evaluate(() => document.fonts.ready)
  await browser.waitForTimeout(150)
  await browser.screenshot({ path, omitBackground: transparent })
}

/** The home image: the mark and the name, beside every plate in a grid, light and dark in turn. */
const homeImage = async () => {
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(themes.length))))
  const tiles = await Promise.all(
    themes.map(async (theme, index) => {
      const modes = modesOf(theme)
      const row = Math.floor(index / columns)
      const mode = modes.includes((index + row) % 2 === 0 ? 'light' : 'dark') ? ((index + row) % 2 === 0 ? 'light' : 'dark') : modes[0]!

      return `<div class="tile"><div class="art">${await scene(theme, mode)}</div></div>`
    }),
  )
  const css = `
    body{background:#f1eee8;color:#2c2823}
    .left{position:absolute;left:72px;top:0;bottom:0;width:390px;display:flex;flex-direction:column;justify-content:center;gap:22px}
    .brand{display:flex;align-items:center;gap:18px}
    .brand svg{width:58px;height:58px}
    h1{font:400 96px/1 Serif,Georgia,serif;letter-spacing:-.02em;margin:0}
    p{margin:0;font-size:27px;line-height:1.35;color:#4b453d}
    .site{font-size:19px;letter-spacing:.12em;text-transform:uppercase;color:#655e55;margin-top:6px}
    .grid{position:absolute;right:56px;top:50%;transform:translateY(-50%);display:grid;grid-template-columns:repeat(${columns},150px);gap:14px}
    .tile{background:#f7f5f0;padding:6px;border:1px solid rgba(44,40,35,.12);box-shadow:0 10px 24px -16px rgba(60,45,30,.45)}
    .art{position:relative;width:138px;height:86px;overflow:hidden}
  `
  const body = `
    <div class="left">
      <div class="brand">${markSvg()}</div>
      <h1>Tessera</h1>
      <p>${capitalize(countWord(themes.length))} themes for the Claude Code desktop app, made to read in.</p>
      <p class="site">tessera.shiptiffin.app</p>
    </div>
    <div class="grid">${tiles.join('')}</div>`

  return page(body, css)
}

/** A plate's image: the scene full bleed, with a frosted wall label in the plate's own colors. */
const plateImage = async (theme: Theme) => {
  const modes = modesOf(theme)
  const mode = modes.includes('dark') ? 'dark' : modes[0]!
  const anchors = theme.modes[mode]!.anchors
  const css = `
    body{background:${anchors['surface-0']};color:${anchors['text-primary']}}
    .label{position:absolute;left:56px;bottom:56px;width:500px;padding:34px 38px 32px;border-radius:6px;
      background:color-mix(in srgb,${anchors['surface-1'] ?? anchors['surface-0']} 80%,transparent);
      backdrop-filter:blur(${theme.glass.blur}px);box-shadow:0 20px 50px -30px rgba(0,0,0,.5)}
    .no{font-size:17px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${anchors['text-muted'] ?? anchors['text-primary']}}
    h1{font:400 84px/1 Serif,Georgia,serif;letter-spacing:-.02em;margin:12px 0 4px}
    .meaning{font:italic 400 30px/1.2 Serif,Georgia,serif;color:${anchors['text-secondary'] ?? anchors['text-primary']}}
    .tag{margin-top:18px;font-size:22px;line-height:1.4;color:${anchors['text-secondary'] ?? anchors['text-primary']}}
    .foot{display:flex;align-items:center;gap:12px;margin-top:22px;padding-top:18px;border-top:1px solid color-mix(in srgb,${anchors['text-muted'] ?? anchors['text-primary']} 30%,transparent);font-size:18px;color:${anchors['text-muted'] ?? anchors['text-primary']}}
    .foot svg{width:26px;height:26px}
  `
  const body = `
    ${await scene(theme, mode)}
    <div class="label">
      <div class="no">Plate ${theme.numeral}</div>
      <h1>${theme.title}</h1>
      <div class="meaning">“${theme.meaning}”</div>
      <div class="tag">${theme.tagline}</div>
      <div class="foot">${markSvg()}<span>Tessera · Themes for Claude Code</span></div>
    </div>`

  return page(body, css)
}

/** The mark alone, square, for icons. `bleed` fills the square for home screens that round it themselves. */
const iconPage = (size: number, bleed: boolean) => {
  const svg = bleed ? markSvg().replace('rx="11"', 'rx="0"') : markSvg()

  return `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`
}

await mkdir(join(out, 'og'), { recursive: true })
const browser = await chromium.launch()
const tab = await browser.newPage({ deviceScaleFactor: 1 })

await shoot(tab, await homeImage(), join(out, 'og', 'home.png'))

for (const theme of themes) {
  await shoot(tab, await plateImage(theme), join(out, 'og', `${theme.name}.png`))
}

const icons: [string, number, boolean][] = [
  ['favicon-32.png', 32, false],
  ['apple-touch-icon.png', 180, true],
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
]

for (const [file, size, bleed] of icons) {
  await shoot(tab, iconPage(size, bleed), join(out, file), { width: size, height: size }, !bleed)
}

await browser.close()
await rm(temp, { recursive: true, force: true })
console.log(`wrote ${themes.length + 1} share images and ${icons.length} icons`)
