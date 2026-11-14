// A monk's writing desk. One SVG, drawn for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so day is cream vellum with
// a painted border and night is the same page by candlelight.
//
// The border keeps to the corners and the outer margins: painted bars, corner
// rosettes, broad curling leaves and thin vines that wind inward and end in
// gold. The two heavy corners sit on one diagonal, lower left and upper right,
// and the candle stands just past the lower left. The middle of the frame,
// where the words sit, holds only the soft color of the page.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(11)
const between = (low: number, high: number) => low + random() * (high - low)
const r1 = (n: number) => Math.round(n * 10) / 10

type Point = [number, number]

// Ornament may live left of LEFT or right of RIGHT. The middle stays clear.
const LEFT = 352
const RIGHT = 1248
// Each vine keeps to its own box: between a side bar and the middle, or in the
// strip outside a side bar. The boxes are set from where the vine starts.
type Box = [number, number, number, number]
const boxFor = ([x]: Point): Box =>
  x < 86 ? [14, 72, 20, 980] : x > 1514 ? [1528, 1586, 20, 980] : x < 800 ? [104, LEFT, 104, 896] : [RIGHT, 1496, 104, 896]
const inBox = (box: Box) => ([x, y]: Point) => x > box[0] && x < box[1] && y > box[2] && y < box[3]

// The candle stands just past the lower left corner. Ornament near it is lit.
const CANDLE: Point = [30, 1020]
const lit = ([x, y]: Point) => {
  const d = Math.hypot(x - CANDLE[0], y - CANDLE[1])

  return d < 380 ? ' lit2' : d < 620 ? ' lit1' : ''
}

// A vine of a given length that winds through a given number of turns. Its
// heading grows with the square of the distance walked, the curve of a
// clothoid, so the line leaves its root almost straight and closes into a
// tight scroll at the end.
const curl = (start: Point, heading: number, sign: number, length: number, turns: number, steps = 34): Point[] => {
  const points: Point[] = [start]
  const step = length / steps
  let [x, y] = start

  for (let i = 1; i <= steps; i += 1) {
    const t = (i - 0.5) / steps
    const h = heading + sign * turns * Math.PI * 2 * Math.pow(t, 2.1)
    x += Math.cos(h) * step
    y += Math.sin(h) * step
    points.push([x, y])
  }

  return points
}

// A path through the points, written as short relative steps.
const line = (points: Point[]) => {
  const whole = points.map(([x, y]) => [Math.round(x), Math.round(y)])
  const steps = whole.slice(1).map(([x, y], i) => `${x! - whole[i]![0]!} ${y! - whole[i]![1]!}`)

  return `M${whole[0]![0]} ${whole[0]![1]}l${steps.join(' ')}`.replace(/ -/g, '-')
}

const headingAt = (points: Point[], i: number) => {
  const a = points[Math.max(0, i - 1)]!
  const b = points[Math.min(points.length - 1, i + 1)]!

  return Math.atan2(b[1] - a[1], b[0] - a[0])
}

// A broad leaf that follows a stem on one side, swelling and narrowing, with
// a scalloped outer edge: the curling leaf of a painted border.
const ribbon = (points: Point[], from: number, to: number, side: number, width: number, lobes: number) => {
  const n = points.length - 1
  const a = Math.round(from * n)
  const b = Math.round(to * n)
  const inner: Point[] = []
  const outer: Point[] = []

  for (let i = a; i <= b; i += 1) {
    const t = (i - a) / (b - a)
    const swell = Math.pow(Math.sin(Math.PI * t), 0.75) * (1 - 0.35 * t)
    const scallop = 1 - 0.28 * Math.pow(Math.abs(Math.sin(t * Math.PI * lobes)), 3)
    const h = headingAt(points, i) + (side * Math.PI) / 2
    const w = width * swell * scallop
    const [x, y] = points[i]!
    inner.push([x + Math.cos(h) * 1.5, y + Math.sin(h) * 1.5])
    outer.push([x + Math.cos(h) * w, y + Math.sin(h) * w])
  }

  return `${line([...inner, ...outer.reverse()])}Z`
}

// An ivy leaf from the shared shape, turned to an angle and sized.
const leaf = (at: Point, angle: number, size: number, color: string, glow: string) =>
  `<use href="#scriptorium-leaf" class="leaf ${color}${glow}" transform="translate(${Math.round(at[0])} ${Math.round(at[1])}) rotate(${Math.round((angle * 180) / Math.PI)}) scale(${Math.round((size / 35) * 100) / 100})"/>`

// A gold disc with a dark rim, the way gold leaf is laid on a raised ground.
const bezant = (at: Point, r: number, glow: string) =>
  `<circle class="bez${glow}" cx="${Math.round(at[0])}" cy="${Math.round(at[1])}" r="${r1(r)}"/>`

// Three small dots, a spray that often sits beside the gold.
const spray = (at: Point, angle: number, size: number, glow: string) =>
  [-0.75, 0, 0.75]
    .map(
      turn =>
        `<circle class="dot${glow}" cx="${Math.round(at[0] + Math.cos(angle + turn) * size)}" cy="${Math.round(at[1] + Math.sin(angle + turn) * size)}" r="${r1(Math.max(1.6, size * 0.2))}"/>`,
    )
    .join('')

// Try a vine until it keeps to the margin: first turn it a little, then shorten it.
const vineIn = (start: Point, heading: number, sign: number, length: number, turns: number, box: Box) => {
  const fits = inBox(box)
  for (let k = 0; k < 10; k += 1) {
    for (const nudge of [0, 0.15, -0.15, 0.3, -0.3, 0.45, -0.45]) {
      const points = curl(start, heading + nudge, sign, length * Math.pow(0.93, k), turns)
      if (points.slice(3).every(fits)) return points
    }
  }

  return curl(start, heading, sign, length * 0.4, turns)
}

const COLORS = ['r', 'b', 'g']

type Vine = {
  at: Point
  heading: number
  sign: number
  length: number
  turns: number
  size: number
  main?: boolean
  leafy?: string
  sway?: number
  box?: Box
  branches?: { at: number; length: number; turns: number; size: number }[]
}

// Draws one vine and its branches. Coordinates are local to the root, so the
// whole vine can sway about it; lighting is judged in page coordinates.
const drawVine = (spec: Vine, first: number): string => {
  const box = spec.box ?? boxFor(spec.at)
  const points = vineIn(spec.at, spec.heading, spec.sign, spec.length, spec.turns, box)
  const [ox, oy] = spec.at
  const local = points.map(([x, y]) => [x - ox, y - oy] as Point)
  const glowAt = (i: number) => lit(points[Math.min(points.length - 1, i)]!)
  const n = local.length
  const back: string[] = []
  const front: string[] = []

  // A broad curling leaf rides the outside of the stem, with a second color
  // turned over along its inner edge.
  if (spec.leafy) {
    const glow = glowAt(Math.round(n * 0.5))
    back.push(`<path class="acan ${spec.leafy}${glow}" d="${ribbon(local, 0.22, 0.97, -spec.sign, spec.size * 1.25, 4)}"/>`)
    const turn = spec.leafy === 'b' ? 'r' : 'b'
    back.push(`<path class="acan ${turn}${glow}" d="${ribbon(local, 0.3, 0.86, -spec.sign, spec.size * 0.5, 2)}"/>`)
    back.push(`<path class="vein${glow}" d="${line(local.slice(Math.round(n * 0.3), Math.round(n * 0.9)).map(([x, y], i, all) => {
      const h = headingAt(all, i) - (spec.sign * Math.PI) / 2
      const w = spec.size * 0.78 * Math.sin((Math.PI * i) / (all.length - 1))

      return [x + Math.cos(h) * w, y + Math.sin(h) * w] as Point
    }))}"/>`)
  }

  // The stem, drawn twice or three times, shorter and wider each time, so it tapers.
  const glow0 = glowAt(0)
  if (spec.main) {
    front.push(`<path class="stem w3${glow0}" d="${line(local)}"/>`)
    front.push(`<path class="stem w5${glow0}" d="${line(local.slice(0, Math.round(n * 0.72)))}"/>`)
    front.push(`<path class="stem w8${glow0}" d="${line(local.slice(0, Math.round(n * 0.4)))}"/>`)
    front.push(`<path class="shine" d="${line(local.slice(1, Math.round(n * 0.4)))}"/>`)
  } else {
    front.push(`<path class="stem w2${glow0}" d="${line(local)}"/>`)
    front.push(`<path class="stem w3${glow0}" d="${line(local.slice(0, Math.round(n * 0.5)))}"/>`)
  }

  // Ivy leaves on alternate sides, smaller toward the spiral.
  const spots = spec.leafy ? [0.3, 0.62, 0.8] : [0.22, 0.4, 0.57, 0.72]
  spots.forEach((at, i) => {
    const index = Math.round(at * (n - 1))
    const side = spec.leafy ? spec.sign : i % 2 === 0 ? 1 : -1
    const angle = headingAt(local, index) + side * between(0.75, 1.15)
    front.push(leaf(local[index]!, angle, spec.size * 1.35 * (1 - at * 0.4), COLORS[(i + first) % 3]!, glowAt(index)))
  })

  // Gold at the heart of the spiral, and a spray of dots beside it.
  // A main vine ends in a flower: six petals around a gold heart.
  if (spec.main) {
    const petal = spec.leafy === 'b' ? 'r' : 'b'
    for (let k = 0; k < 6; k += 1) front.push(leaf(local[n - 1]!, (k * Math.PI) / 3 + 0.3, spec.size * 0.95, k % 2 ? petal : 'g', glowAt(n - 1)))
  }
  front.push(bezant(local[n - 1]!, Math.max(4.5, spec.size * (spec.main ? 0.34 : 0.26)), glowAt(n - 1)))
  const mid = Math.round(n * 0.45)
  front.push(spray(local[mid]!, headingAt(local, mid) + (spec.sign * Math.PI) / 2, spec.size * 0.45, glowAt(mid)))

  // Branches leave the stem and wind the other way.
  const branches = (spec.branches ?? []).map((b, i) => {
    const index = Math.round(b.at * (n - 1))
    return drawVine(
      {
        at: points[index]!,
        heading: headingAt(points, index) + spec.sign * 0.9,
        sign: -spec.sign,
        length: b.length,
        turns: b.turns,
        size: b.size,
        box,
      },
      first + i + 1,
    ).replace(/^<g transform="translate\(([-\d.]+) ([-\d.]+)\)">/, (_, x, y) => `<g transform="translate(${r1(+x - ox)} ${r1(+y - oy)})">`)
  })

  const sway = spec.sway ? ` class="sway s${spec.sway}"` : ''

  return `<g transform="translate(${r1(ox)} ${r1(oy)})"><g${sway}>${back.join('')}${branches.join('')}${front.join('')}</g></g>`
}

// The frame: rosettes at the corners, painted bars running between them.
const C = { l: 86, r: 1514, t: 86, b: 914 }
const CORNERS: Point[] = [
  [C.l, C.t],
  [C.r, C.t],
  [C.l, C.b],
  [C.r, C.b],
]

// Bars run the full left and right margins, and along the top and bottom only
// as far as the corners reach, so the middle of each edge stays open.
const BARS = [
  { x1: C.l, y1: C.t + 34, x2: C.l, y2: C.b - 34 },
  { x1: C.r, y1: C.t + 34, x2: C.r, y2: C.b - 34 },
  { x1: C.l + 34, y1: C.t, x2: 330, y2: C.t },
  { x1: 1270, y1: C.t, x2: C.r - 34, y2: C.t },
  { x1: C.l + 34, y1: C.b, x2: 330, y2: C.b },
  { x1: 1270, y1: C.b, x2: C.r - 34, y2: C.b },
]

const bars = BARS.map(({ x1, y1, x2, y2 }) => {
  const glow = lit([(x1 + x2) / 2, (y1 + y2) / 2])
  const x = Math.min(x1, x2) - 9
  const y = Math.min(y1, y2) - 9
  const w = Math.abs(x2 - x1) + 18
  const h = Math.abs(y2 - y1) + 18
  const count = Math.floor((x1 === x2 ? h : w) / 62)
  // Red lozenges along the bar, as a painter breaks a long band of color.
  const pips = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    const px = r1(x1 + (x2 - x1) * t)
    const py = r1(y1 + (y2 - y1) * t)

    return `<rect class="pip${lit([px, py])}" x="${r1(px - 5.5)}" y="${r1(py - 5.5)}" width="11" height="11" transform="rotate(45 ${px} ${py})"/>`
  }).join('')

  return `<rect class="bar${glow}" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/><path class="rule${glow}" d="M${x1} ${y1}L${x2} ${y2}"/>${pips}`
}).join('')

// Where a bar stops short, it ends in a small gold knop.
const knops = [
  [330, C.t],
  [1270, C.t],
  [330, C.b],
  [1270, C.b],
]
  .map(([x, y]) => `<circle class="ring${lit([x!, y!])}" cx="${x! + (x! < 800 ? 12 : -12)}" cy="${y}" r="12"/>`)
  .join('')

// A rosette at each corner: eight lobes in blue, a gold ring and a red heart.
const rosettes = CORNERS.map(([x, y]) => {
  const glow = lit([x, y])
  const lobes = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4

    return `<circle class="lobe${glow}" cx="${r1(x + Math.cos(a) * 25)}" cy="${r1(y + Math.sin(a) * 25)}" r="14"/>`
  }).join('')

  return `<circle class="halo${glow}" cx="${x}" cy="${y}" r="52"/>${lobes}<circle class="ring${glow}" cx="${x}" cy="${y}" r="24"/><circle class="heart${glow}" cx="${x}" cy="${y}" r="10"/><circle class="bez${glow}" cx="${x}" cy="${y}" r="4"/>`
}).join('')

const VINES: Vine[] = []
const Q = Math.PI / 4

// The heavy corners, lower left where the candle stands and upper right, and
// the light corners. All four wind the same way, so the page turns like a wheel.
VINES.push({
  at: [C.l + 24, C.b - 30], heading: -Math.PI / 2 + 0.32, sign: 1, length: 620, turns: 1.1, size: 38, main: true, leafy: 'b', sway: 1,
  branches: [
    { at: 0.3, length: 190, turns: 1.15, size: 24 },
    { at: 0.55, length: 130, turns: 1.2, size: 20 },
  ],
})
VINES.push({
  at: [C.r - 24, C.t + 30], heading: Math.PI / 2 + 0.32, sign: 1, length: 620, turns: 1.1, size: 38, main: true, leafy: 'r', sway: 2,
  branches: [
    { at: 0.3, length: 190, turns: 1.15, size: 24 },
    { at: 0.55, length: 130, turns: 1.2, size: 20 },
  ],
})
VINES.push({ at: [C.l + 30, C.t + 24], heading: 0.32, sign: 1, length: 360, turns: 1.2, size: 28, main: true, leafy: 'r', sway: 3, branches: [{ at: 0.36, length: 130, turns: 1.15, size: 20 }] })
VINES.push({ at: [C.r - 30, C.b - 24], heading: Math.PI + 0.32, sign: 1, length: 360, turns: 1.2, size: 28, main: true, leafy: 'b', sway: 4, branches: [{ at: 0.36, length: 130, turns: 1.15, size: 20 }] })

// Vines off the side bars, winding up and down in turn, between the corners.
for (const side of ['l', 'r'] as const) {
  const x = side === 'l' ? C.l + 9 : C.r - 9
  const rows = side === 'l' ? [330, 460, 590] : [410, 540, 670]
  rows.forEach((y, i) => {
    const up = i % 2 === 0
    const inward = side === 'l' ? 0 : Math.PI
    const tilt = up ? -0.45 : 0.45
    const heading = inward + (side === 'l' ? tilt : -tilt)
    const sign = (side === 'l') === up ? 1 : -1
    VINES.push({
      at: [x, y + between(-12, 12)], heading, sign, length: between(190, 230), turns: 1.05, size: between(22, 26),
      leafy: i === 1 ? (side === 'l' ? 'r' : 'b') : undefined, sway: 5 + (i % 2),
    })
  })
}

// Small curls on the outer side of the side bars, where the margin runs out.
for (let y = 190; y <= 830; y += 128) {
  VINES.push({ at: [C.l - 9, y + 64], heading: Math.PI + 0.55, sign: 1, length: 64, turns: 1, size: 14 })
  VINES.push({ at: [C.r + 9, y], heading: -0.55, sign: -1, length: 64, turns: 1, size: 14 })
}

const vines = VINES.map((spec, i) => drawVine(spec, i)).join('')

// A soft shadow under the ornament, so the paint sits on the page.
const SHADOW = `<g class="shade" transform="translate(3 4)">${BARS.map(({ x1, y1, x2, y2 }) => `<rect x="${Math.min(x1, x2) - 9}" y="${Math.min(y1, y2) - 9}" width="${Math.abs(x2 - x1) + 18}" height="${Math.abs(y2 - y1) + 18}" rx="9"/>`).join('')}${CORNERS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="40"/>`).join('')}</g>`

// Dust in the air near the edges, lit by day from the window and by night from the candle.
const MOTES = Array.from({ length: 22 }, (_, i) => {
  const left = i % 3 !== 2
  const x = left ? between(130, 360) : between(1250, 1540)
  const y = left ? between(520, 960) : between(140, 880)
  const r = between(1.8, 3.8)
  const path = Math.floor(between(0, 3))
  const speed = Math.floor(between(0, 4))
  const delay = Math.floor(between(0, 8))

  return `<circle class="mote m${path} v${speed} d${delay}" cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}"/>`
}).join('')

const STYLE = `
svg{--top:#f6eadb;--bottom:#f3e5d0;--edge:#e2cba6;--edge-a:.8;--wash-b:#e5c89c;--wash-r:#e2ad98;--wash-g:#e9cc8e;--wash-a:.8;--glow:#fff7e6;--glow-a:.8;--core:#fffbf2;--core-a:.6;
--blue:#41618f;--red:#ad4d3c;--gold1:#dfbb6a;--gold2:#a47b2b;--ink:#4b3523;--line:#3a2a1b;--line-w:1;--leaf-a:1;--acan-a:.68;--shine:#f6ead2;--shine-a:.8;--bar:#41618f;--rule:#d9b35f;--halo:#e9d6b4;--halo-a:.9;--vein:#f6ead2;--vein-a:.55;
--lit1:#41618f;--lit2:#41618f;--inklit:#4b3523;--shade:#7a5a34;--shade-a:.13;--mote:#a57d3e;--mote-a:.55;--ground:#efd6a0;--ground-a:.6;--far-a:.6}
@media (prefers-color-scheme:dark){svg{--top:#2b2219;--bottom:#2a2118;--edge:#17110b;--edge-a:.85;--wash-b:#38342e;--wash-r:#46301f;--wash-g:#463620;--wash-a:.45;--glow:#c98738;--glow-a:.6;--core:#f2b866;--core-a:.4;
--blue:#5a4a30;--red:#654730;--gold1:#8c6d39;--gold2:#59432a;--ink:#6c5532;--line:#8a6e3d;--line-w:1.3;--leaf-a:.12;--acan-a:.16;--shine:#a3834a;--shine-a:.3;--bar:#3a2e20;--rule:#7a6036;--halo:#33281d;--halo-a:.9;--vein:#8a6e3d;--vein-a:.6;
--lit1:#94733f;--lit2:#b98f4c;--inklit:#a8854a;--shade:#000000;--shade-a:.2;--mote:#f2c47c;--mote-a:.8;--ground:#5c4426;--ground-a:.55;--far-a:.3}}
.top{stop-color:var(--top)}.bottom{stop-color:var(--bottom)}
.e0{stop-color:var(--edge);stop-opacity:0}.e1{stop-color:var(--edge);stop-opacity:var(--edge-a)}
.wb{stop-color:var(--wash-b)}.wr{stop-color:var(--wash-r)}.wg{stop-color:var(--wash-g)}.w0{stop-opacity:0}
.gl{stop-color:var(--glow)}.co{stop-color:var(--core)}
.g1{stop-color:var(--gold1)}.g2{stop-color:var(--gold2)}
.wash{opacity:var(--wash-a)}.gr{stop-color:var(--ground)}.ground{opacity:var(--ground-a)}.ground.far{opacity:var(--far-a)}
.glow{opacity:var(--glow-a);transform-box:fill-box;transform-origin:center;animation:breathe 11s ease-in-out infinite}
.core{opacity:var(--core-a);transform-box:fill-box;transform-origin:center;animation:breathe2 8s ease-in-out infinite;animation-delay:-3s}
.shade{opacity:var(--shade-a)}.shade *{fill:var(--shade);stroke:none}
.halo{fill:var(--halo);opacity:var(--halo-a)}
.stem{fill:none;stroke:var(--ink);stroke-linecap:round;stroke-linejoin:round}
.w2{stroke-width:2.4}.w3{stroke-width:3.6}.w5{stroke-width:6}.w8{stroke-width:9.5;stroke:var(--blue)}
.stem.lit1,.stem.lit2{stroke:var(--inklit)}.w8.lit1{stroke:var(--lit1)}.w8.lit2{stroke:var(--lit2)}
.shine{fill:none;stroke:var(--shine);stroke-opacity:var(--shine-a);stroke-width:1.8;stroke-linecap:round}
.acan{stroke:var(--line);stroke-width:var(--line-w);stroke-linejoin:round;fill-opacity:var(--acan-a)}
.acan.r{fill:var(--red)}.acan.b{fill:var(--blue)}.acan.lit1{stroke:var(--lit1)}.acan.lit2{stroke:var(--lit2)}
.vein{fill:none;stroke:var(--vein);stroke-opacity:var(--vein-a);stroke-width:1.4;stroke-linecap:round}.vein.lit2{stroke:var(--lit2)}
.leaf{stroke:var(--line);stroke-width:var(--line-w);vector-effect:non-scaling-stroke;fill-opacity:var(--leaf-a)}
.leaf.r{fill:var(--red)}.leaf.b{fill:var(--blue)}.leaf.g{fill:url(#scriptorium-gold)}
.leaf.lit1{stroke:var(--lit1)}.leaf.lit2{stroke:var(--lit2)}
.bez{fill:url(#scriptorium-gold);stroke:var(--line);stroke-width:var(--line-w)}.bez.lit1,.bez.lit2{stroke:var(--lit2)}
.dot{fill:var(--ink)}.dot.lit1,.dot.lit2{fill:var(--inklit)}
.bar{fill:var(--bar);stroke:var(--line);stroke-width:var(--line-w)}
.rule{stroke:var(--rule);stroke-width:2.6;fill:none}
.pip{fill:var(--red);stroke:var(--rule);stroke-width:1.4}
.lobe{fill:var(--blue);stroke:var(--line);stroke-width:var(--line-w)}
.ring{fill:url(#scriptorium-gold);stroke:var(--line);stroke-width:var(--line-w)}
.heart{fill:var(--red);stroke:var(--line);stroke-width:var(--line-w)}
.lobe.lit1,.lobe.lit2,.ring.lit1,.ring.lit2,.heart.lit1,.heart.lit2,.bar.lit1,.bar.lit2,.pip.lit2{stroke:var(--lit2)}
.sway{animation:sway 15s ease-in-out infinite}
.s1{animation-duration:19s;animation-delay:-5s}.s2{animation-duration:21s;animation-delay:-12s}.s3{animation-duration:16s;animation-delay:-7s}.s4{animation-duration:17s;animation-delay:-10s}.s5{animation-duration:13s;animation-delay:-3s}.s6{animation-duration:14s;animation-delay:-9s}
.mote{fill:var(--mote);opacity:0;animation:drift0 18s linear infinite}
.m1{animation-name:drift1}.m2{animation-name:drift2}
.v1{animation-duration:22s}.v2{animation-duration:26s}.v3{animation-duration:31s}
.d1{animation-delay:-3s}.d2{animation-delay:-6s}.d3{animation-delay:-9s}.d4{animation-delay:-12s}.d5{animation-delay:-15s}.d6{animation-delay:-19s}.d7{animation-delay:-24s}
@keyframes breathe{0%,100%{opacity:var(--glow-a);transform:scale(1)}50%{opacity:calc(var(--glow-a)*.7);transform:scale(.95)}}
@keyframes breathe2{0%,100%{opacity:var(--core-a);transform:scale(1)}50%{opacity:calc(var(--core-a)*.55);transform:scale(.92)}}
@keyframes sway{0%,100%{transform:rotate(0)}50%{transform:rotate(1.4deg)}}
@keyframes drift0{0%{transform:translate(0,0);opacity:0}25%,70%{opacity:var(--mote-a)}100%{transform:translate(34px,-150px);opacity:0}}
@keyframes drift1{0%{transform:translate(0,0);opacity:0}30%,65%{opacity:var(--mote-a)}100%{transform:translate(-40px,-120px);opacity:0}}
@keyframes drift2{0%{transform:translate(0,0);opacity:0}20%,75%{opacity:var(--mote-a)}100%{transform:translate(18px,-190px);opacity:0}}
.still .glow,.still .core,.still .sway,.still .mote{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.glow,.core,.sway,.mote{animation:none}}
`.replace(/\n/g, '')

const radial = (id: string, a: string) =>
  `<radialGradient id="scriptorium-${id}"><stop offset="0" class="${a}"/><stop offset="1" class="${a} w0"/></radialGradient>`

const DEFS =
  `<defs>` +
  `<linearGradient id="scriptorium-page" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset="1" class="bottom"/></linearGradient>` +
  `<radialGradient id="scriptorium-edge" cx=".5" cy=".46" r=".72"><stop offset=".55" class="e0"/><stop offset="1" class="e1"/></radialGradient>` +
  radial('wb', 'wb') +
  radial('wr', 'wr') +
  radial('wg', 'wg') +
  radial('gr', 'gr') +
  `<radialGradient id="scriptorium-glow"><stop offset="0" class="gl"/><stop offset=".4" class="gl" stop-opacity=".4"/><stop offset="1" class="gl" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="scriptorium-core"><stop offset="0" class="co"/><stop offset=".5" class="co" stop-opacity=".3"/><stop offset="1" class="co" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="scriptorium-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="g1"/><stop offset="1" class="g2"/></linearGradient>` +
  `<path id="scriptorium-leaf" d="M0 0C4-7 10-11 16-9C18-13 25-13 27-8C31-6 33-2 35 0C33 2 31 6 27 8C25 13 18 13 16 9C10 11 4 7 0 0Z"/>` +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#scriptorium-page)"/>` +
  `<ellipse class="wash" cx="1600" cy="0" rx="620" ry="520" fill="url(#scriptorium-wb)"/>` +
  `<ellipse class="wash" cx="0" cy="0" rx="460" ry="400" fill="url(#scriptorium-wg)"/>` +
  `<ellipse class="wash" cx="1600" cy="1000" rx="520" ry="440" fill="url(#scriptorium-wr)"/>` +
  `<rect width="1600" height="1000" fill="url(#scriptorium-edge)"/>` +
  `<ellipse class="ground" cx="230" cy="690" rx="250" ry="300" fill="url(#scriptorium-gr)"/>` +
  `<ellipse class="ground far" cx="1370" cy="310" rx="250" ry="300" fill="url(#scriptorium-gr)"/>` +
  `<circle class="glow" cx="${CANDLE[0]}" cy="${CANDLE[1]}" r="700" fill="url(#scriptorium-glow)"/>` +
  `<circle class="core" cx="${CANDLE[0]}" cy="${CANDLE[1]}" r="320" fill="url(#scriptorium-core)"/>` +
  SHADOW +
  `<g>${bars}${knops}</g><g>${vines}</g><g>${rosettes}</g><g>${MOTES}</g>` +
  `</svg>`
