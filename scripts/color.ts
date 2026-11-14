// Color math shared by the checks: WCAG contrast and OKLCH.

export type Rgb = [number, number, number]

const linear = (channel: number) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

/** `#rrggbb` to 0..1 channels. */
export const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
]

export const luminance = ([r, g, b]: Rgb) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

/** WCAG 2 contrast ratio between two colors, 1 to 21. */
export const contrast = (a: Rgb, b: Rgb) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]

  return (high + 0.05) / (low + 0.05)
}

/** OKLCH lightness (0..1), chroma and hue in degrees. */
export const oklch = ([r, g, b]: Rgb) => {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    chroma: Math.hypot(a, b2),
    hue: ((Math.atan2(b2, a) * 180) / Math.PI + 360) % 360,
  }
}

/** `over` at `opacity` on top of `under`, in sRGB as a browser blends. */
export const mix = (over: Rgb, under: Rgb, opacity: number): Rgb => [
  over[0] * opacity + under[0] * (1 - opacity),
  over[1] * opacity + under[1] * (1 - opacity),
  over[2] * opacity + under[2] * (1 - opacity),
]
