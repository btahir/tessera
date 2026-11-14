// The plates as the site sees them. Everything here comes from src/data/themes.json and
// public/scenes/, which `bun scripts/build-site.ts` at the repo root writes. Never edit those by hand.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import data from '../data/themes.json'

export type Mode = 'light' | 'dark'
export type Family = 'essential' | 'bold' | 'place'
export type Level = 'low' | 'standard' | 'high'

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
  hasBed: boolean
  family: Family
  kin: string[]
  vibe: string[] | string
  contrast: Level
  accents: 'muted' | 'vivid'
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

const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** "twenty-five", for counts that read better as words. */
export const countWord = (count: number): string => {
  if (count < 20) return ONES[count] ?? String(count)
  if (count < 100) return TENS[Math.floor(count / 10)]! + (count % 10 === 0 ? '' : `-${ONES[count % 10]}`)
  return String(count)
}

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
  const all = THEMES.flatMap(theme => modesOf(theme).map(mode => ({ level: theme.contrast, ...theme.modes[mode]! })))
  const byLevel = (level: Level) => {
    const body = all.filter(entry => entry.level === level).map(entry => entry.bodyContrast)
    return {
      plates: THEMES.filter(theme => theme.contrast === level).length,
      min: body.length > 0 ? round(Math.min(...body)) : null,
      max: body.length > 0 ? round(Math.max(...body)) : null,
    }
  }
  const muted = all.map(entry => entry.mutedContrast)

  return {
    readings: all.length,
    levels: { low: byLevel('low'), standard: byLevel('standard'), high: byLevel('high') },
    mutedMin: round(Math.min(...muted)),
    chimes: THEMES.filter(theme => theme.hasChime).length,
    beds: THEMES.filter(theme => theme.hasBed).length,
    vivid: THEMES.filter(theme => theme.accents === 'vivid').length,
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

/** The three wings, in the order they hang. */
export const WINGS: { family: Family; id: string; name: string; line: string }[] = [
  { family: 'essential', id: 'essentials', name: 'Essentials', line: 'Clean defaults with little or no scenery.' },
  { family: 'bold', id: 'bold', name: 'Bold', line: 'Graphic themes with attitude.' },
  { family: 'place', id: 'places', name: 'Places', line: 'Soft scenes behind the conversation.' },
]

export const wingOf = (theme: Theme) => WINGS.find(wing => wing.family === theme.family)

export const themesIn = (family: Family) => THEMES.filter(theme => theme.family === family)

/** "Plates I to IX" for a list of plates. */
export const rangeOf = (list: Theme[]) => {
  if (list.length === 0) return ''
  return list.length === 1 ? `Plate ${list[0]!.numeral}` : `Plates ${list[0]!.numeral} to ${list.at(-1)!.numeral}`
}

export const vibeOf = (theme: Theme): string[] =>
  (Array.isArray(theme.vibe) ? theme.vibe : theme.vibe.split(',')).map(word => word.trim()).filter(Boolean)

/** The contrast levels, as the design rules set them. */
export const LEVELS: Record<Level, { name: string; range: string; floor: number; ceiling: number | null }> = {
  low: { name: 'Low contrast', range: '7:1 to 10:1', floor: 7, ceiling: 10 },
  standard: { name: 'Standard contrast', range: '9:1 to 14:1', floor: 9, ceiling: 14 },
  high: { name: 'High contrast', range: '14:1 and up', floor: 14, ceiling: null },
}

/** "If you like Nord", "If you like Gruvbox or Monokai". */
export const kinLine = (theme: Theme) => {
  if (theme.kin.length === 0) return null
  const names = theme.kin.length === 1 ? theme.kin[0]! : `${theme.kin.slice(0, -1).join(', ')} or ${theme.kin.at(-1)}`
  return `If you like ${names}`
}

/** Every well known theme named as kin, with the plates its fans should try. */
export const comingFrom = () => {
  const map = new Map<string, Theme[]>()
  for (const theme of THEMES) {
    for (const kin of theme.kin) {
      const key = capitalize(kin)
      map.set(key, [...(map.get(key) ?? []), theme])
    }
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([kin, themes]) => ({ kin, themes }))
}
