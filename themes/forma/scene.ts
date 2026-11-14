// Forma: primary colors and pure geometry. One SVG for both modes: the colors are
// CSS variables that a prefers-color-scheme rule swaps, so day is strong red,
// blue and yellow on a warm off white page and night is the same shapes, deeper,
// on charcoal.
//
// Two opposite corners hold the composition. Top left: a yellow square, a blue
// circle and a red quarter ring. Bottom right: a blue quarter ring, a red circle,
// a yellow triangle and a small black square. Thin black lines tie each group
// together and a small grid of dots sits beside each one. The middle is the bare
// page. Every fill is flat; there are no gradients and no blur.
//
// While Claude works the shapes move like a hanging mobile: one at a time, each
// turns about a point or slides along a straight line, holds, and later returns.
// Every motion is a transform.

const round = (n: number) => Math.round(n * 10) / 10

// A point at radius r and angle a (degrees) around (cx, cy).
const at = (cx: number, cy: number, r: number, a: number) => {
  const t = (a * Math.PI) / 180

  return `${round(cx + r * Math.cos(t))} ${round(cy + r * Math.sin(t))}`
}

// A quarter of a ring between radii r1 and r2, from angle a to a + 90.
const ring = (cx: number, cy: number, r1: number, r2: number, a: number) =>
  `M${at(cx, cy, r2, a)}A${r2} ${r2} 0 0 1 ${at(cx, cy, r2, a + 90)}L${at(cx, cy, r1, a + 90)}A${r1} ${r1} 0 0 0 ${at(cx, cy, r1, a)}Z`

// A grid of dots, cols by rows, from (x, y) with a fixed step.
const dots = (x: number, y: number, cols: number, rows: number, step: number, r: number) => {
  let out = ''
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) out += `<circle cx="${x + i * step}" cy="${y + j * step}" r="${r}"/>`
  }

  return `<g class="dot">${out}</g>`
}

// The mobile. Each mover gets two windows of the shared cycle: in the first it
// moves to its second pose, in the one half a cycle later it comes back. Only
// one shape moves in any window.
const CYCLE = 84
type Mover = { shape: string; pose: string; origin?: [number, number] }
const MOVERS: Mover[] = [
  // Top left: the blue circle slides down and to the left.
  { shape: `<circle class="blue" cx="252" cy="212" r="138"/>`, pose: 'translate(-34px,58px)' },
  // Bottom right: the yellow triangle turns up about its right angle.
  { shape: `<path class="yellow" d="M1236 466H1424L1236 652Z"/>`, pose: 'rotate(-90deg)', origin: [1236, 466] },
  // Top left: the red quarter ring turns a quarter about its center.
  { shape: `<path class="red" d="${ring(64, 568, 66, 132, -90)}"/>`, pose: 'rotate(90deg)', origin: [64, 568] },
  // Bottom right: the small black square slides down its line.
  { shape: `<rect class="ink-fill" x="1476" y="404" width="46" height="46"/>`, pose: 'translate(0px,104px)' },
  // Top left: the yellow square tips over.
  { shape: `<rect class="yellow" x="38" y="300" width="150" height="150"/>`, pose: 'rotate(-30deg)', origin: [113, 375] },
  // Bottom right: the red circle rises.
  { shape: `<circle class="red" cx="1428" cy="768" r="128"/>`, pose: 'translate(0px,-64px)' },
  // Bottom right: the blue quarter ring swings about the corner.
  { shape: `<path class="blue" d="${ring(1630, 1020, 236, 300, 180)}"/>`, pose: 'rotate(22deg)', origin: [1630, 1020] },
]

const windows = MOVERS.length * 2
const pct = (k: number) => `${round((k * 100) / windows)}%`
const moverRules: string[] = []
const moving = MOVERS.map((m, i) => {
  const name = `forma-m${i}`
  const origin = m.origin ? `transform-origin:${m.origin[0]}px ${m.origin[1]}px;` : ''
  moverRules.push(
    `.m${i}{animation:${name} ${CYCLE}s ease-in-out infinite;animation-delay:-4s;${origin}}` +
      `@keyframes ${name}{0%,${pct(i)}{transform:none}${pct(i + 1)},${pct(i + MOVERS.length)}{transform:${m.pose}}${pct(i + MOVERS.length + 1)},100%{transform:none}}`,
  )

  return `<g class="mv m${i}">${m.shape}</g>`
})

// Drawn back to front within each corner: rings and squares, then circles.
const [blueCircle, triangle, redRing, blackSquare, yellowSquare, redCircle, blueRing] = moving

const TOP_LEFT =
  yellowSquare +
  redRing +
  blueCircle +
  `<path class="line" d="M0 474H388M342 0V724M0 742L380 362"/>` +
  `<path class="line thin" d="M24 300V560M200 96H388"/>` +
  dots(232, 566, 4, 4, 30, 5)

const BOTTOM_RIGHT =
  blueRing +
  triangle +
  redCircle +
  blackSquare +
  `<path class="line" d="M1262 286V1000M1214 610H1600M1499 300V560"/>` +
  `<path class="line thin" d="M1236 466L1600 830M1300 960H1500"/>` +
  dots(1478, 214, 4, 3, 30, 5)

// Small notes in the other two corners, so the page balances.
const ACCENTS =
  `<path class="line thin" d="M1330 92H1600M1440 0V150"/><circle class="red" cx="1520" cy="150" r="24"/>` +
  `<path class="line thin" d="M0 880H260M110 820V1000"/><rect class="blue" x="150" y="900" width="34" height="34"/>`

const STYLE = `
svg{--page:#f2eee4;--red:#d8432f;--blue:#2c5cb8;--yellow:#efbb1e;--ink:#1d1b17;--dot:#1d1b17}
@media (prefers-color-scheme:dark){svg{--page:#252420;--red:#8a3a2e;--blue:#2d4677;--yellow:#9d7b1d;--ink:#0f0e0c;--dot:#7d786c}}
.page{fill:var(--page)}
.red{fill:var(--red)}.blue{fill:var(--blue)}.yellow{fill:var(--yellow)}.ink-fill{fill:var(--ink)}
.line{fill:none;stroke:var(--ink);stroke-width:3.2;stroke-linecap:square}.line.thin{stroke-width:1.6}
.dot{fill:var(--dot)}
.mv{transform-box:view-box}
${moverRules.join('')}
.still .mv{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.mv{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<rect class="page" width="1600" height="1000"/>` +
  ACCENTS +
  TOP_LEFT +
  BOTTOM_RIGHT +
  `</svg>`
