// Loads every theme in themes/ as plain data. The other scripts start here.

import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export const root = join(import.meta.dir, '..')
export const themesDir = join(root, 'themes')

/** A scene swaps its colors with exactly this rule, so a mode can be forced. */
export const DARK_RULE = '@media (prefers-color-scheme:dark)'

export type Mode = 'light' | 'dark'
export type Anchors = Record<string, string>

export type Palette = {
  label: string
  roles: Record<string, string>
  light?: { gray: { anchors: Anchors } }
  dark?: { gray: { anchors: Anchors } }
  only?: Mode
  contrast?: 'more'
  codeTheme?: { light?: string; dark?: string }
}

/** The three wings of the gallery. */
export type Family = 'essential' | 'bold' | 'place'

/** theme.json, the part of a theme a person writes by hand. */
export type Meta = {
  name: string
  numeral: string
  title: string
  meaning: string
  /** essential: a clean default. bold: graphic, with attitude. place: a soft scene. */
  family: Family
  /** Well known themes whose fans should feel at home here. May be empty. */
  kin: string[]
  /** Three or four words for the mood, such as "wet, quiet, late". */
  vibe: string
  tagline: string
  story: string
  modes: Mode[]
  /** How hard the text stands off the page. Sets the ranges the check holds it to. */
  contrast: 'low' | 'standard' | 'high'
  /** muted keeps accents calm. vivid lets them be loud. */
  accents: 'muted' | 'vivid'
  words: string[]
  /** What follows the spinner word, such as " ~". Leave out for the app's own ellipsis. */
  suffix?: string
  alt: string
  /** The sound after a long turn, described for the sound model. */
  chime: string
  /** The loop that plays while Claude works, for people who turn music on. */
  bed: { kind: 'ambience' | 'music'; prompt: string }
  prompt: string
}

export type LoadedTheme = Meta & {
  dir: string
  palette: Palette
  glass: { blur: number; opacity: number }
  scene: string
  chimeFile: string | null
  bedFile: string | null
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX']

/** Every theme, or the one named, in plate order. */
export const loadThemes = async (only?: string): Promise<LoadedTheme[]> => {
  const names = (await readdir(themesDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && (only === undefined || entry.name === only))
    .map(entry => entry.name)

  const themes = await Promise.all(
    names.map(async name => {
      const dir = join(themesDir, name)
      const meta: Meta = await Bun.file(join(dir, 'theme.json')).json()
      const { PALETTE, GLASS } = await import(join(dir, 'palette.ts'))
      const { SCENE } = await import(join(dir, 'scene.ts'))
      const hasChime = await Bun.file(join(dir, 'chime.mp3')).exists()
      const hasBed = await Bun.file(join(dir, 'bed.mp3')).exists()

      return {
        ...meta,
        dir,
        palette: PALETTE,
        glass: GLASS,
        scene: SCENE,
        chimeFile: hasChime ? join(dir, 'chime.mp3') : null,
        bedFile: hasBed ? join(dir, 'bed.mp3') : null,
      }
    }),
  )

  return themes.sort((a, b) => NUMERALS.indexOf(a.numeral) - NUMERALS.indexOf(b.numeral))
}

/** The scene with one mode forced, for places that cannot follow the system. */
export const forceMode = (scene: string, mode: Mode) =>
  scene.replaceAll(DARK_RULE, mode === 'dark' ? '@media all' : '@media not all')
