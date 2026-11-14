// Writes what the gallery site shows, from themes/.
//
//   bun scripts/build-site.ts
//
//   site/src/data/themes.json          every theme's words, colors and measured contrast
//   site/public/scenes/<name>.<mode>.svg   each scene with one mode forced
//   site/public/chimes/<name>.mp3      each chime

import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { contrast, oklch, rgb } from './color'
import { forceMode, loadThemes, root } from './themes'

const siteDir = join(root, 'site')
const themes = await loadThemes()

await mkdir(join(siteDir, 'src/data'), { recursive: true })
await mkdir(join(siteDir, 'public/scenes'), { recursive: true })
await mkdir(join(siteDir, 'public/chimes'), { recursive: true })

const data = []

for (const theme of themes) {
  const modes: Record<string, unknown> = {}

  for (const mode of theme.modes) {
    const anchors = theme.palette[mode]!.gray.anchors
    const page = rgb(anchors['surface-0']!)

    await Bun.write(join(siteDir, 'public/scenes', `${theme.name}.${mode}.svg`), forceMode(theme.scene, mode))

    modes[mode] = {
      anchors,
      // Measured, so the site can state them as facts.
      bodyContrast: Number(contrast(rgb(anchors['text-primary']!), page).toFixed(1)),
      mutedContrast: Number(contrast(rgb(anchors['text-muted'] ?? anchors['text-primary']!), page).toFixed(1)),
      pageLightness: Number(oklch(page).lightness.toFixed(2)),
    }
  }

  if (theme.chimeFile !== null) {
    await cp(theme.chimeFile, join(siteDir, 'public/chimes', `${theme.name}.mp3`))
  }

  data.push({
    name: theme.name,
    numeral: theme.numeral,
    title: theme.title,
    meaning: theme.meaning,
    tagline: theme.tagline,
    story: theme.story,
    words: theme.words,
    alt: theme.alt,
    prompt: theme.prompt,
    hasChime: theme.chimeFile !== null,
    glass: theme.glass,
    roles: theme.palette.roles,
    modes,
  })
}

await Bun.write(join(siteDir, 'src/data/themes.json'), `${JSON.stringify(data, null, 2)}\n`)
console.log(`${data.length} themes written for the site`)
