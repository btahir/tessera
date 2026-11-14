// Ink on newsprint. One SVG for both modes: the colors are CSS variables that a
// prefers-color-scheme rule swaps, so day is black ink on white paper and night
// is pale ink on a near black sheet.
//
// Everything is flat. Tone comes only from the size of halftone dots, laid on a
// grid turned 45 degrees like a printer's screen. Two fields of dots sit in
// opposite corners, top left and bottom right, largest at the corner and
// shrinking to nothing toward the middle. A heavy rule and a thin rule run
// along the top like a masthead with its nameplate left empty, and a
// registration cross sits in the bottom left corner. The middle is bare paper.
//
// Each dot is a zero length line with a round cap, so its size is the stroke
// width. A field is cut into rings by distance from its corner, one size per
// ring, and each ring is one path drawn by three <use> copies: small, middle
// and large. While Claude works the middle and large copies switch on and off
// in turn, so the dots step up in size and back down in a slow wave that runs
// out from each corner. Only opacity moves, on 32 groups.

const round = (n: number) => Math.round(n * 10) / 10

// The dot screen: neighbors PITCH apart along a grid turned 45 degrees.
const PITCH = 26
const DIAG = PITCH / Math.SQRT2
// The widest dot, before swelling, as a diameter.
const WIDEST = PITCH * 0.64
const RINGS = 16
// Three sizes a dot steps through.
const SIZES = { lo: 0.8, mid: 1, hi: 1.18 }

// The middle of the frame, where no dot may fall, in viewBox units.
const quiet = (x: number, y: number, r: number) => x + r > 392 && x - r < 1208 && y - r < 862

// A field of dots around a corner (cx, cy). Distance is measured on an
// ellipse rx by ry, so the field reaches further along the side than across.
const field = (name: string, cx: number, cy: number, rx: number, ry: number, top: number) => {
  const rings = Array.from({ length: RINGS }, () => '')
  const widths = Array.from({ length: RINGS }, (_, k) => WIDEST * (1 - (k + 0.5) / RINGS) ** 0.8)

  for (let i = -70; i <= 70; i += 1) {
    for (let j = -70; j <= 70; j += 1) {
      const x = (i - j) * DIAG
      const y = (i + j) * DIAG
      if (x < -20 || x > 1620 || y < top || y > 1020) continue
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
      if (d >= 1) continue
      const k = Math.floor(d * RINGS)
      if (widths[k]! < 2.2 || quiet(x, y, (widths[k]! / 2) * SIZES.hi + 2)) continue
      rings[k] += `M${round(x)} ${round(y)}h0`
    }
  }

  const used = rings.map((path, k) => ({ path, k })).filter(({ path }) => path !== '')
  const defs = used.map(({ path, k }) => `<path id="atramentum-${name}${k}" d="${path}"/>`).join('')
  const vars = used.map(({ k }) => `.${name}${k}{--w:${round(widths[k]!)}}`).join('')

  // One copy of the whole field at one size. The middle and large copies are
  // split into wave groups of two rings each, so each group can step on its own.
  const copy = (size: keyof typeof SIZES) => {
    if (size === 'lo') return `<g class="lo">${used.map(({ k }) => `<use href="#atramentum-${name}${k}" class="${name}${k}"/>`).join('')}</g>`
    let out = ''
    for (let g = 0; g < RINGS / 2; g += 1) {
      const inside = used.filter(({ k }) => Math.floor(k / 2) === g)
      if (inside.length === 0) continue
      out += `<g class="${size} ${name}g${g}">${inside.map(({ k }) => `<use href="#atramentum-${name}${k}" class="${name}${k}"/>`).join('')}</g>`
    }
    return out
  }

  return { defs, vars, art: copy('lo') + copy('mid') + copy('hi') }
}

const TOP_LEFT = field('a', 0, 96, 400, 640, 94)
const BOTTOM_RIGHT = field('b', 1600, 1000, 400, 660, -20)

// The masthead: a heavy rule over a thin one, broken in the middle where the
// nameplate would be printed and left blank.
const MASTHEAD =
  `<path class="rule" d="M48 42h334v16H48zM1218 42h334v16h-334zM48 68h334v2.5H48zM1218 68h334v2.5h-334z"/>`

// A registration cross: two rings with a crosshair through them and two
// filled quarters, as printers use to line up the plates.
const CROSS = (x: number, y: number) =>
  `<g class="mark">` +
  `<circle class="line" cx="${x}" cy="${y}" r="26"/>` +
  `<circle class="line" cx="${x}" cy="${y}" r="13"/>` +
  `<path class="line" d="M${x - 48} ${y}H${x + 48}M${x} ${y - 48}V${y + 48}"/>` +
  `<path class="fill" d="M${x} ${y}V${y - 13}A13 13 0 0 1 ${x + 13} ${y}zM${x} ${y}V${y + 13}A13 13 0 0 1 ${x - 13} ${y}z"/>` +
  `</g>`

// The wave. Each group lags the one inside it, so the swelling runs outward,
// and the two corners run half a cycle apart.
const PERIOD = 14
const GROUPS = RINGS / 2
const waves = Array.from({ length: GROUPS }, (_, g) => {
  const lag = (g * PERIOD) / GROUPS / 1.6
  return (
    `.ag${g}{animation-delay:-${round(PERIOD - lag)}s}` +
    `.bg${g}{animation-delay:-${round((PERIOD - lag + PERIOD / 2) % PERIOD)}s}`
  )
}).join('')

const STYLE =
  `svg{--paper:#f8f8f6;--ink:#1e1e1d;--rule:#1a1a19}` +
  `@media (prefers-color-scheme:dark){svg{--paper:#111211;--ink:#8e8d88;--rule:#9b9a94}}` +
  `.paper{fill:var(--paper)}` +
  `use{fill:none;stroke:var(--ink);stroke-linecap:round}` +
  `.lo use{stroke-width:calc(var(--w)*${SIZES.lo})}.mid use{stroke-width:calc(var(--w)*${SIZES.mid})}.hi use{stroke-width:calc(var(--w)*${SIZES.hi})}` +
  TOP_LEFT.vars +
  BOTTOM_RIGHT.vars +
  `.rule,.fill{fill:var(--rule)}.line{fill:none;stroke:var(--rule);stroke-width:2.5}` +
  `.mid{opacity:1;animation:mid ${PERIOD}s linear infinite}.hi{opacity:0;animation:hi ${PERIOD}s linear infinite}` +
  `@keyframes mid{0%,24.9%{opacity:0}25%,79.9%{opacity:1}80%,100%{opacity:0}}` +
  `@keyframes hi{0%,44.9%{opacity:0}45%,64.9%{opacity:1}65%,100%{opacity:0}}` +
  waves +
  `.still .mid,.still .hi{animation-play-state:paused}` +
  `@media (prefers-reduced-motion:reduce){.mid,.hi{animation:none}}`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>${TOP_LEFT.defs}${BOTTOM_RIGHT.defs}</defs>` +
  `<rect class="paper" width="1600" height="1000"/>` +
  TOP_LEFT.art +
  BOTTOM_RIGHT.art +
  MASTHEAD +
  CROSS(96, 904) +
  `</svg>`
