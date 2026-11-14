// An engineer's blueprint. One SVG, drawn for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so night is a navy blueprint
// with pale lines and day is drafting paper inked in blue.
//
// The middle of the frame is where the words sit, so it holds only the sheet,
// its grid and a soft wash. The drawings keep to the corners: a gear train top
// left, a compass rose top right, a bearing in section bottom left and a title
// block with a protractor bottom right. While Claude works the lines draw
// themselves again and the large gear turns.

const round = (n: number) => Math.round(n * 10) / 10
const polar = (cx: number, cy: number, r: number, a: number) =>
  `${round(cx + r * Math.cos(a))} ${round(cy + r * Math.sin(a))}`
const TAU = Math.PI * 2

// A spur gear outline: N teeth between a root and a tip circle.
const gear = (cx: number, cy: number, tip: number, root: number, teeth: number, phase = 0) => {
  const p = TAU / teeth
  let d = ''

  for (let i = 0; i < teeth; i += 1) {
    const a = phase + i * p
    d += `${i === 0 ? 'M' : 'L'}${polar(cx, cy, root, a)}`
    d += `A${root} ${root} 0 0 1 ${polar(cx, cy, root, a + 0.4 * p)}`
    d += `L${polar(cx, cy, tip, a + 0.52 * p)}`
    d += `A${tip} ${tip} 0 0 1 ${polar(cx, cy, tip, a + 0.8 * p)}`
    d += `L${polar(cx, cy, root, a + 0.92 * p)}`
    d += `A${root} ${root} 0 0 1 ${polar(cx, cy, root, a + p)}`
  }

  return `${d}Z`
}

// Short radial ticks around a circle, as one path.
const ticks = (cx: number, cy: number, r: number, count: number, from = 0, to = TAU, long = 4) => {
  let d = ''
  const step = (to - from) / count
  const full = to - from >= TAU - 0.001

  for (let i = 0; i < (full ? count : count + 1); i += 1) {
    const a = from + i * step
    const length = i % long === 0 ? 16 : 8
    d += `M${polar(cx, cy, r, a)}L${polar(cx, cy, r + length, a)}`
  }

  return d
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}`

// A dimension line with arrowheads and short extension stubs.
const dimension = (x1: number, y1: number, x2: number, y2: number) => {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const head = (x: number, y: number, dir: number) =>
    `M${polar(x, y, 14, a + dir + 0.32)}L${x} ${y}L${polar(x, y, 14, a + dir - 0.32)}`
  const n = a + Math.PI / 2

  return (
    `M${x1} ${y1}L${x2} ${y2}` +
    head(x1, y1, 0) +
    head(x2, y2, Math.PI) +
    `M${polar(x1, y1, -14, n)}L${polar(x1, y1, 14, n)}M${polar(x2, y2, -14, n)}L${polar(x2, y2, 14, n)}`
  )
}

// Every drawn line takes a delay class, so the strokes are spread through the cycle.
let count = 0
const draw = (d: string, kind = 'ln') => {
  count += 1

  return `<path class="${kind} dr k${count % 8}" pathLength="1" d="${d}"/>`
}
const still = (d: string, kind = 'ln') => `<path class="${kind}" d="${d}"/>`

// Top left: a gear train. The large gear turns while Claude works.
const BIG = { x: 188, y: 225, tip: 204, root: 172, teeth: 18 }
// Pitch radii 188 and 94, so the teeth share one size and mesh.
const MESH = 1.3
const SMALL = { x: round(BIG.x + 282 * Math.cos(MESH)), y: round(BIG.y + 282 * Math.sin(MESH)), tip: 110, root: 78, teeth: 9 }
// Phases that put a gap of the large gear against a tooth of the small one.
const BIG_PHASE = MESH - 0.16 * (TAU / BIG.teeth)
const SMALL_PHASE = MESH + Math.PI - 0.66 * (TAU / SMALL.teeth)

const holes = (cx: number, cy: number, r: number, size: number, n: number) =>
  Array.from({ length: n }, (_, i) => circle(...(polar(cx, cy, r, (i / n) * TAU + 0.2).split(' ').map(Number) as [number, number]), size)).join('')

const bigGear =
  `<g class="spin big">` +
  `<path class="body" d="${gear(BIG.x, BIG.y, BIG.tip, BIG.root, BIG.teeth, BIG_PHASE)}${holes(BIG.x, BIG.y, 108, 34, 6)}${circle(BIG.x, BIG.y, 30)}"/>` +
  draw(gear(BIG.x, BIG.y, BIG.tip, BIG.root, BIG.teeth, BIG_PHASE), 'heavy') +
  draw(holes(BIG.x, BIG.y, 108, 34, 6)) +
  draw(circle(BIG.x, BIG.y, 152) + circle(BIG.x, BIG.y, 62)) +
  draw(circle(BIG.x, BIG.y, 30) + `M${BIG.x - 7} ${BIG.y - 30}L${BIG.x - 7} ${BIG.y - 40}L${BIG.x + 7} ${BIG.y - 40}L${BIG.x + 7} ${BIG.y - 30}`) +
  `</g>`

const smallGear =
  `<g class="spin small">` +
  `<path class="body" d="${gear(SMALL.x, SMALL.y, SMALL.tip, SMALL.root, SMALL.teeth, SMALL_PHASE)}${circle(SMALL.x, SMALL.y, 22)}"/>` +
  draw(gear(SMALL.x, SMALL.y, SMALL.tip, SMALL.root, SMALL.teeth, SMALL_PHASE), 'heavy') +
  draw(circle(SMALL.x, SMALL.y, 56) + circle(SMALL.x, SMALL.y, 22)) +
  `</g>`

const gearTrain =
  still(circle(BIG.x, BIG.y, 190) + circle(SMALL.x, SMALL.y, 90), 'center') +
  still(`M${BIG.x - 240} ${BIG.y}L${BIG.x + 208} ${BIG.y}M${BIG.x} ${BIG.y - 240}L${BIG.x} ${BIG.y + 240}`, 'center') +
  still(`M${BIG.x} ${BIG.y}L${round(SMALL.x + 120 * Math.cos(1.3))} ${round(SMALL.y + 120 * Math.sin(1.3))}`, 'center') +
  bigGear +
  smallGear

// Top right: a compass rose inside a graduated ring.
const ROSE = { x: 1405, y: 235 }
const star = (points: number, outer: number, inner: number, turn: number) => {
  let d = ''
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner
    d += `${i === 0 ? 'M' : 'L'}${polar(ROSE.x, ROSE.y, r, turn + (i * Math.PI) / points)}`
  }

  return `${d}Z`
}
// The lit half of each point, as on a printed rose.
const facets = (points: number, outer: number, inner: number, turn: number) => {
  let d = ''
  for (let i = 0; i < points; i += 1) {
    const a = turn + (i * TAU) / points
    d += `M${ROSE.x} ${ROSE.y}L${polar(ROSE.x, ROSE.y, outer, a)}L${polar(ROSE.x, ROSE.y, inner, a + Math.PI / points)}Z`
  }

  return d
}

const rose =
  `<path class="body" d="${circle(ROSE.x, ROSE.y, 196)}"/>` +
  `<path class="face" d="${facets(4, 168, 40, -Math.PI / 2)}${facets(4, 112, 30, -Math.PI / 4)}"/>` +
  draw(circle(ROSE.x, ROSE.y, 196) + circle(ROSE.x, ROSE.y, 176), 'heavy') +
  draw(ticks(ROSE.x, ROSE.y, 176, 72, 0, TAU, 6).replace(/L/g, 'L'), 'fine') +
  draw(star(4, 168, 40, -Math.PI / 2)) +
  draw(star(4, 112, 30, -Math.PI / 4)) +
  draw(circle(ROSE.x, ROSE.y, 70) + circle(ROSE.x, ROSE.y, 8)) +
  still(`M${ROSE.x - 198} ${ROSE.y}L${ROSE.x + 250} ${ROSE.y}M${ROSE.x} ${ROSE.y - 250}L${ROSE.x} ${ROSE.y + 250}`, 'center')

// Bottom left: a shaft and bearing in section, with its dimensions.
const BEAR = { x: 215, y: 815 }
const hatch = (() => {
  let d = ''
  for (let i = -8; i <= 8; i += 1) {
    const x = BEAR.x + i * 16
    d += `M${x - 60} ${BEAR.y + 60}L${x + 60} ${BEAR.y - 60}`
  }

  return d
})()

const bearing =
  `<clipPath id="machina-ring"><path clip-rule="evenodd" d="${circle(BEAR.x, BEAR.y, 132)}${circle(BEAR.x, BEAR.y, 96)}"/></clipPath>` +
  `<path class="body" d="${circle(BEAR.x, BEAR.y, 132)}"/>` +
  `<g clip-path="url(#machina-ring)">${draw(hatch, 'fine')}</g>` +
  draw(circle(BEAR.x, BEAR.y, 132) + circle(BEAR.x, BEAR.y, 96), 'heavy') +
  draw(
    Array.from({ length: 12 }, (_, i) => {
      const [x, y] = polar(BEAR.x, BEAR.y, 78, (i / 12) * TAU).split(' ').map(Number) as [number, number]
      return circle(x, y, 13)
    }).join(''),
  ) +
  draw(circle(BEAR.x, BEAR.y, 60) + circle(BEAR.x, BEAR.y, 34)) +
  still(`M${BEAR.x - 190} ${BEAR.y}L${BEAR.x + 168} ${BEAR.y}M${BEAR.x} ${BEAR.y - 190}L${BEAR.x} ${BEAR.y + 190}`, 'center') +
  draw(dimension(BEAR.x - 132, BEAR.y - 175, BEAR.x + 132, BEAR.y - 175) + `M${BEAR.x - 132} ${BEAR.y - 10}L${BEAR.x - 132} ${BEAR.y - 190}M${BEAR.x + 132} ${BEAR.y - 10}L${BEAR.x + 132} ${BEAR.y - 190}`, 'fine') +
  draw(dimension(BEAR.x + 160, BEAR.y - 96, BEAR.x + 160, BEAR.y + 96) + `M${BEAR.x + 20} ${BEAR.y - 96}L${BEAR.x + 172} ${BEAR.y - 96}M${BEAR.x + 20} ${BEAR.y + 96}L${BEAR.x + 172} ${BEAR.y + 96}`, 'fine') +
  draw(`M${BEAR.x - 93} ${BEAR.y + 93}L${BEAR.x - 140} ${BEAR.y + 140}L${BEAR.x - 190} ${BEAR.y + 140}`, 'fine')

// Bottom right: a protractor arc over a title block of empty cells.
const PRO = { x: 1415, y: 790 }
const titleBlock =
  `<path class="body" d="M${PRO.x - 165} ${PRO.y}A165 165 0 0 1 ${PRO.x + 165} ${PRO.y}Z"/>` +
  draw(`M${PRO.x - 165} ${PRO.y}A165 165 0 0 1 ${PRO.x + 165} ${PRO.y}Z`, 'heavy') +
  draw(ticks(PRO.x, PRO.y, 165, 36, Math.PI, TAU, 3).replace(/M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)/g, (_, a, b, c, e) => {
    // point the ticks inward
    const dx = Number(c) - Number(a)
    const dy = Number(e) - Number(b)
    return `M${a} ${b}L${round(Number(a) - dx)} ${round(Number(b) - dy)}`
  }), 'fine') +
  draw(`M${PRO.x - 110} ${PRO.y}A110 110 0 0 1 ${PRO.x + 110} ${PRO.y}`) +
  draw(`M${PRO.x} ${PRO.y}L${polar(PRO.x, PRO.y, 190, -Math.PI * 0.72)}M${PRO.x} ${PRO.y}L${polar(PRO.x, PRO.y, 190, -Math.PI * 0.38)}`, 'fine') +
  draw(`M${polar(PRO.x, PRO.y, 70, -Math.PI * 0.72)}A70 70 0 0 1 ${polar(PRO.x, PRO.y, 70, -Math.PI * 0.38)}`) +
  `<path class="body" d="M1240 830H1566V962H1240Z"/>` +
  draw('M1240 830H1566V962H1240Z', 'heavy') +
  draw('M1240 874H1566M1240 918H1566M1350 830V962M1470 874V962M1350 896H1470', 'fine')

// The sheet: a border with zone marks, and a dimension line across the head.
const zones = (() => {
  let d = ''
  for (let x = 200; x < 1600; x += 200) d += (x > 300 && x < 1300 ? '' : `M${x} 28V44`) + `M${x} 956V972`
  for (let y = 200; y < 1000; y += 200) d += `M28 ${y}H44M1556 ${y}H1572`

  return d
})()

const sheet =
  still('M28 28H1572V972H28Z', 'border') +
  still('M44 44H1556V956H44Z', 'border') +
  still(zones, 'border')

// One construction arc swung from the large gear, faint enough to pass behind the words.
const arcs =
  `<path class="arc" d="M${BIG.x + 660} ${BIG.y - 260}A700 700 0 0 1 ${BIG.x + 420} ${BIG.y + 560}"/>`

const STYLE = `
svg{--top:#e6eef9;--mid:#eaf1fa;--bottom:#e3ecf7;--wash:#c9dbf1;--wash-a:.55;--ink:#2a5fa6;--ink-a:.62;--fill:#5b8fd0;--fill-a:.2;--face-a:.16;--grid:#3b6fb5;--grid-a:.07;--grid-b:.13;--faint-a:.3;--center-a:.32;--arc-a:.2}
@media (prefers-color-scheme:dark){svg{--top:#132439;--mid:#14263c;--bottom:#112136;--wash:#2b5486;--wash-a:.45;--ink:#bad5f5;--ink-a:.5;--fill:#7fb0ea;--fill-a:.18;--face-a:.14;--grid:#9cc0ea;--grid-a:.05;--grid-b:.09;--faint-a:.17;--center-a:.25;--arc-a:.15}}
.t{stop-color:var(--top)}.m{stop-color:var(--mid)}.b{stop-color:var(--bottom)}
.w0{stop-color:var(--wash);stop-opacity:var(--wash-a)}.w1{stop-color:var(--wash);stop-opacity:0}
.minor{fill:none;stroke:var(--grid);stroke-opacity:var(--grid-a);stroke-width:1}
.major{fill:none;stroke:var(--grid);stroke-opacity:var(--grid-b);stroke-width:1.2}
.ln,.heavy,.fine,.faint,.center,.arc{fill:none;stroke:var(--ink);stroke-width:1.2;stroke-opacity:var(--arc-a);stroke-dasharray:36 9 5 9}.border{fill:none;stroke:var(--ink);stroke-linecap:round;stroke-linejoin:round}
.ln{stroke-width:2;stroke-opacity:var(--ink-a)}
.heavy{stroke-width:3;stroke-opacity:var(--ink-a)}
.fine{stroke-width:1.3;stroke-opacity:var(--ink-a)}
.faint{stroke-width:1.4;stroke-opacity:var(--faint-a)}
.center{stroke-width:1.2;stroke-opacity:var(--center-a);stroke-dasharray:28 7 4 7}
.arc{fill:none;stroke:var(--ink);stroke-width:1.2;stroke-opacity:var(--arc-a);stroke-dasharray:36 9 5 9}.border{stroke-width:1.6;stroke-opacity:var(--faint-a)}
.body{fill:var(--fill);fill-opacity:var(--fill-a);fill-rule:evenodd}
.face{fill:var(--fill);fill-opacity:var(--face-a)}
.dr{stroke-dasharray:1 1;stroke-dashoffset:0;animation:draw 26s ease-in-out infinite}
.k0{animation-delay:-6s}.k1{animation-delay:-8.5s}.k2{animation-delay:-11s}.k3{animation-delay:-13.5s}.k4{animation-delay:-16s}.k5{animation-delay:-18.5s}.k6{animation-delay:-21s}.k7{animation-delay:-23s}
.spin{animation:turn 90s linear infinite}
.big{transform-origin:${BIG.x}px ${BIG.y}px;animation-delay:-20s}
.small{transform-origin:${SMALL.x}px ${SMALL.y}px;animation-name:back;animation-duration:45s;animation-delay:-20s}
@keyframes draw{0%{stroke-dashoffset:1;opacity:1}22%{stroke-dashoffset:0}90%{stroke-dashoffset:0;opacity:1}97%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:1;opacity:0}}
@keyframes turn{to{transform:rotate(360deg)}}
@keyframes back{to{transform:rotate(-360deg)}}
.still .dr,.still .spin{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.dr,.spin{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  `<linearGradient id="machina-sheet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="t"/><stop offset=".5" class="m"/><stop offset="1" class="b"/></linearGradient>` +
  `<radialGradient id="machina-wash"><stop offset="0" class="w0"/><stop offset="1" class="w1"/></radialGradient>` +
  `<pattern id="machina-minor" width="25" height="25" patternUnits="userSpaceOnUse"><path class="minor" d="M25 0V25H0"/></pattern>` +
  `<pattern id="machina-major" width="125" height="125" patternUnits="userSpaceOnUse"><path class="major" d="M125 0V125H0"/></pattern>` +
  `</defs>` +
  `<rect width="1600" height="1000" fill="url(#machina-sheet)"/>` +
  `<ellipse cx="220" cy="230" rx="560" ry="460" fill="url(#machina-wash)"/>` +
  `<ellipse cx="1400" cy="240" rx="520" ry="440" fill="url(#machina-wash)"/>` +
  `<ellipse cx="200" cy="850" rx="480" ry="360" fill="url(#machina-wash)"/>` +
  `<ellipse cx="1420" cy="860" rx="480" ry="360" fill="url(#machina-wash)"/>` +
  `<rect width="1600" height="1000" fill="url(#machina-minor)"/>` +
  `<rect width="1600" height="1000" fill="url(#machina-major)"/>` +
  `<g>${arcs}</g><g>${sheet}</g><g>${gearTrain}</g><g>${rose}</g><g>${bearing}</g><g>${titleBlock}</g>` +
  `</svg>`
