// The plates as the site sees them. Everything here comes from src/data/themes.json and
// public/scenes/, which `bun scripts/build-site.ts` at the repo root writes. Never edit those by hand.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import data from '../data/themes.json'

export type Mode = 'light' | 'dark'

export type ModeData = {
  anchors: Record<string, string>
  bodyContrast: number
  mutedContrast: number
  pageLightness: number
}

export type Theme = {
  name: string
  numeral: string
  title: string
  meaning: string
  tagline: string
  story: string
  words: string[]
  alt: string
  prompt: string
  hasChime: boolean
  glass: { blur: number; opacity: number }
  roles: Record<string, string>
  modes: Partial<Record<Mode, ModeData>>
}

/** Every plate, in plate order (I first). */
export const THEMES = data as unknown as Theme[]

export const MODE_ORDER: Mode[] = ['light', 'dark']

export const modesOf = (theme: Theme): Mode[] => MODE_ORDER.filter(mode => theme.modes[mode] !== undefined)

/** A scene swaps its colors with exactly this rule. build-site.ts forces a mode by rewriting it. */
const DARK_RULE = '@media (prefers-color-scheme:dark)'
const FORCED_OFF = '@media not all'

const scenesDir = join(process.cwd(), 'public', 'scenes')
const read = (theme: Theme, mode: Mode) => readFileSync(join(scenesDir, `${theme.name}.${mode}.svg`), 'utf8')

/** Held on one frame: the runtime adds the same class while there is an answer to read. */
const hold = (svg: string) => svg.replace('<svg ', '<svg class="still" ')

/** The scene with one mode forced, held still. */
export const sceneFor = (theme: Theme, mode: Mode) => hold(read(theme, mode))

/**
 * The scene as the app draws it, following the system's light or dark setting, held still.
 * The light file had the dark rule switched off; switching it back gives the original.
 */
export const liveScene = (theme: Theme) => {
  const modes = modesOf(theme)

  if (modes.length === 2) {
    return hold(read(theme, 'light').replaceAll(FORCED_OFF, DARK_RULE))
  }

  return hold(read(theme, modes[0]!))
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen']

/** "sixteen", for counts that read better as words. */
export const countWord = (count: number) => NUMBER_WORDS[count] ?? String(count)

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** "Plates I to XVI", or "Plate I" when there is one. */
export const plateRange = () => {
  const first = THEMES[0]
  const last = THEMES.at(-1)

  if (first === undefined || last === undefined) {
    return 'No plates yet'
  }

  return first === last ? `Plate ${first.numeral}` : `Plates ${first.numeral} to ${last.numeral}`
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits))

/** The measured numbers the home page states, across every plate and mode. */
export const measured = () => {
  const all = THEMES.flatMap(theme => modesOf(theme).map(mode => ({ mode, ...theme.modes[mode]! })))
  const of = (mode: Mode) => all.filter(entry => entry.mode === mode).map(entry => entry.pageLightness)
  const light = of('light')
  const dark = of('dark')
  const body = all.map(entry => entry.bodyContrast)
  const muted = all.map(entry => entry.mutedContrast)

  return {
    readings: all.length,
    bodyMin: round(Math.min(...body)),
    bodyMax: round(Math.max(...body)),
    mutedMin: round(Math.min(...muted)),
    lightMin: light.length > 0 ? Math.round(Math.min(...light) * 100) : null,
    lightMax: light.length > 0 ? Math.round(Math.max(...light) * 100) : null,
    darkMin: dark.length > 0 ? Math.round(Math.min(...dark) * 100) : null,
    darkMax: dark.length > 0 ? Math.round(Math.max(...dark) * 100) : null,
    chimes: THEMES.filter(theme => theme.hasChime).length,
    bothModes: THEMES.filter(theme => modesOf(theme).length === 2).length,
  }
}

/** "93%" or "93% to 97%". */
export const span = (low: number | null, high: number | null, unit = '%') => {
  if (low === null || high === null) {
    return null
  }

  return low === high ? `${low}${unit}` : `${low}${unit} to ${high}${unit}`
}

/** The names the anchors go by on the page. */
export const ANCHOR_LABELS: Record<string, string> = {
  'surface-0': 'Page',
  'surface-1': 'Card',
  'surface-2': 'Panel',
  'surface-3': 'Menu',
  'text-primary': 'Text',
  'text-secondary': 'Secondary',
  'text-muted': 'Muted',
}

export const ROLE_LABELS: Record<string, string> = {
  accent: 'Accent',
  danger: 'Danger',
  success: 'Success',
  warning: 'Warning',
  pro: 'Pro',
}
