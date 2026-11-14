// Holds every theme to the numbered rules in DESIGN.md.
//
//   bun scripts/check.ts            every theme
//   bun scripts/check.ts pluvia     one theme
//
// Colors are checked from palette.ts. Each scene is drawn in a headless browser,
// in each mode and at six moments of its animation, and its pixels are measured
// under the theme's glass.

import { join } from 'node:path'
import { chromium } from 'playwright'

import { contrast, luminance, mix, oklch, rgb, type Rgb } from './color'
import { DARK_RULE, forceMode, loadThemes, root } from './themes'

const { makeColors } = await import(join(root, 'runtime/make-colors.js'))
const themes = await loadThemes(process.argv[2])

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 800, height: 500 } })
let failures = 0

// The moments of the animation that are measured, in milliseconds. A glow can
// peak late, so one frame is not enough.
const MOMENTS = [0, 1500, 4000, 9000, 17000, 31000]
const decoder = await browser.newPage()

// Draws the scene at one moment, 800x500 and a blurred 50x31, and returns both as pixels.
const pixels = async (svg: string, moment: number) => {
  await page.setContent(
    `<style>html,body{margin:0;height:100%;overflow:hidden}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
  )
  await page.evaluate(time => {
    for (const animation of document.getAnimations()) {
      animation.pause()
      animation.currentTime = time
    }
  }, moment)

  const shot = (await page.screenshot({ type: 'png' })).toString('base64')

  // Measured inside the browser: sending every pixel back would take minutes.
  return decoder.evaluate(async source => {
    const image = new Image()
    image.src = `data:image/png;base64,${source}`
    await image.decode()

    const read = (width: number, height: number) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')!
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, width, height)

      return context.getImageData(0, 0, width, height).data
    }

    const linear = (channel: number) => {
      const c = channel / 255

      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }

    // The darkest and lightest point in the center half of the frame, above the message box.
    const sharp = read(800, 500)
    let darkest = 1
    let lightest = 0

    for (let y = 0; y < 425; y += 1) {
      for (let x = 200; x < 600; x += 1) {
        const i = (y * 800 + x) * 4
        const luminance = 0.2126 * linear(sharp[i]!) + 0.7152 * linear(sharp[i + 1]!) + 0.0722 * linear(sharp[i + 2]!)
        darkest = Math.min(darkest, luminance)
        lightest = Math.max(lightest, luminance)
      }
    }

    return { blurred: Array.from(read(50, 31)), darkest, lightest }
  }, shot)
}

const at = (data: number[], index: number): Rgb => [
  data[index * 4]! / 255,
  data[index * 4 + 1]! / 255,
  data[index * 4 + 2]! / 255,
]

for (const theme of themes) {
  const { name, palette: PALETTE, glass: GLASS, scene: SCENE } = theme
  const meta = theme
  const notes: string[] = []

  const fail = (rule: number, why: string) => {
    failures += 1
    console.error(`  FAIL rule ${rule}: ${why}`)
  }

  console.log(`${name}`)

  for (const line of (makeColors(PALETTE).problems as string[]).filter(line =>
    line.startsWith("Desktop won't paint"),
  )) {
    fail(0, line)
  }

  // Rule 20 and 22: the words a person reads.
  for (const key of ['numeral', 'title', 'meaning', 'tagline', 'story', 'alt', 'chime', 'prompt'] as const) {
    if (typeof meta[key] !== 'string' || meta[key].length === 0) fail(22, `theme.json needs "${key}"`)
  }
  if (!Array.isArray(meta.words) || meta.words.length < 4) fail(20, 'theme.json needs at least four spinner words')
  if (name !== meta.name) fail(22, `theme.json says "${meta.name}", the folder says "${name}"`)

  // Rule 7: roles stay 30 degrees of hue apart.
  const roles = Object.entries(PALETTE.roles).map(([role, hex]) => ({ role, ...oklch(rgb(hex)) }))
  for (const [i, a] of roles.entries()) {
    for (const b of roles.slice(i + 1)) {
      const gap = Math.min(Math.abs(a.hue - b.hue), 360 - Math.abs(a.hue - b.hue))
      if (gap < 30) fail(7, `${a.role} and ${b.role} are ${gap.toFixed(0)} degrees of hue apart, need 30`)
    }
  }

  // Rule 17 and 15: one SVG, no scripts, both modes, reduced motion.
  if (SCENE.length > 131072) fail(17, `scene is ${SCENE.length} characters, over 131072`)
  if (/<script|\son[a-z]+=|href="http|url\(http/i.test(SCENE)) fail(17, 'scene has a script, an event handler or an outside file')
  if (!SCENE.includes('preserveAspectRatio="xMidYMid slice"')) fail(17, 'scene root needs preserveAspectRatio="xMidYMid slice"')
  if (meta.modes.length === 2 && !SCENE.includes(DARK_RULE)) fail(17, `scene serves both modes without a "${DARK_RULE}" rule`)
  if (!SCENE.includes('@media (prefers-reduced-motion:reduce)')) fail(15, 'scene has no "@media (prefers-reduced-motion:reduce)" rule')
  for (const [, id] of SCENE.matchAll(/\sid="([^"]+)"/g)) {
    if (!id!.startsWith(`${name}-`)) fail(17, `scene id "${id}" must start with "${name}-", so two scenes can share a page`)
  }
  if (/\sstyle="/.test(SCENE)) fail(17, 'scene uses a style attribute: put every style in the <style> block, by class')
  if (!SCENE.includes('.still')) fail(10, 'scene has no ".still" rule that pauses its animations')

  for (const mode of meta.modes) {
    const anchors = PALETTE[mode]?.gray.anchors

    if (anchors === undefined) {
      fail(9, `theme.json lists ${mode} but palette.ts has no ${mode} colors`)
      continue
    }

    const color = (key: string) => rgb(anchors[key] ?? anchors['surface-0']!)
    const page0 = color('surface-0')
    const primary = rgb(anchors['text-primary']!)
    const muted = rgb(anchors['text-muted'] ?? anchors['text-primary']!)
    const { lightness, chroma } = oklch(page0)

    // Rule 1 and 2: the page is tinted, never black or white.
    const [low, high] = mode === 'dark' ? [0.2, 0.3] : [0.93, 0.98]
    if (lightness < low || lightness > high) fail(1, `${mode} surface-0 lightness is ${lightness.toFixed(3)}, want ${low} to ${high}`)
    if (chroma < 0.005 || chroma > 0.05) fail(2, `${mode} surface-0 chroma is ${chroma.toFixed(3)}, want 0.005 to 0.05`)

    // Rule 3 and 4: text contrast on every surface.
    const body = contrast(primary, page0)
    if (body < 9 || body > 14) fail(3, `${mode} text-primary on surface-0 is ${body.toFixed(1)}:1, want 9 to 14`)
    for (const surface of ['surface-1', 'surface-2', 'surface-3']) {
      const ratio = contrast(primary, color(surface))
      if (ratio < 7) fail(3, `${mode} text-primary on ${surface} is ${ratio.toFixed(1)}:1, need 7`)
    }
    for (const surface of ['surface-0', 'surface-2']) {
      const ratio = contrast(muted, color(surface))
      if (ratio < 4.5) fail(4, `${mode} text-muted on ${surface} is ${ratio.toFixed(1)}:1, need 4.5`)
    }

    // Rule 8: muted accents on dark.
    if (mode === 'dark') {
      for (const role of roles) {
        if (role.chroma > 0.17) fail(8, `${role.role} chroma is ${role.chroma.toFixed(3)}, keep it at or under 0.17 for dark mode`)
      }
    }

    // Rules 12 and 13: the scene's own pixels, in this mode.
    const forced = forceMode(SCENE, mode)
    const panel = color('surface-1')
    let worstPrimary = 21
    let worstMuted = 21
    let loudest = 1

    for (const moment of MOMENTS) {
      const { blurred, darkest, lightest } = await pixels(forced, moment)

      for (let i = 0; i < blurred.length / 4; i += 1) {
        const glass = mix(panel, at(blurred, i), GLASS.opacity)
        worstPrimary = Math.min(worstPrimary, contrast(primary, glass))
        worstMuted = Math.min(worstMuted, contrast(muted, glass))
      }

      const pageLuminance = luminance(page0)
      loudest = Math.max(loudest, (lightest + 0.05) / (pageLuminance + 0.05), (pageLuminance + 0.05) / (darkest + 0.05))
    }

    if (worstPrimary < 7) fail(12, `${mode} text-primary drops to ${worstPrimary.toFixed(1)}:1 over the scene under glass, need 7`)
    if (worstMuted < 4.5) fail(12, `${mode} text-muted drops to ${worstMuted.toFixed(1)}:1 over the scene under glass, need 4.5`)
    if (loudest > 1.6) fail(13, `${mode} scene reaches ${loudest.toFixed(2)}:1 against the page in the center, keep it at or under 1.6`)

    notes.push(
      `${mode}: page L ${lightness.toFixed(2)}, body ${body.toFixed(1)}:1, muted ${contrast(muted, page0).toFixed(1)}:1, under glass ${worstPrimary.toFixed(1)}:1 and ${worstMuted.toFixed(1)}:1, center ${loudest.toFixed(2)}:1`,
    )
  }

  for (const note of notes) console.log(`  ${note}`)
}

await browser.close()

console.log(failures === 0 ? `\n${themes.length} themes pass` : `\n${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
