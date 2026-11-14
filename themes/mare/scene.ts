// A quiet shore seen from above. One SVG, drawn for both modes: the colors are
// CSS variables that a prefers-color-scheme rule swaps, so day is pale sand and
// clear water, and night is the same shore under the moon.
//
// The sand fills the top and the middle, where the words sit. The sea comes in
// from the bottom right: it wraps along the foot, fills the two bottom corners
// and runs up the right edge to the top. It deepens toward the frame, and the
// foam lines wash in and fall back while Claude works.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(15)
const between = (low: number, high: number) => low + random() * (high - low)
const r1 = (n: number) => Math.round(n * 10) / 10

type Point = [number, number]

// The waterline, from off the top edge on the right, down the right side,
// along the foot and out through the left edge low down.
const SHORE: Point[] = [
  [1590, -140], [1520, -20], [1440, 120], [1375, 270], [1325, 430], [1290, 590],
  [1250, 725], [1165, 835], [1015, 902], [830, 932], [650, 934], [490, 914],
  [350, 872], [225, 806], [120, 735], [25, 672], [-90, 615], [-220, 565],
]

// Catmull-Rom through the waterline, sampled densely.
const dense = (points: Point[], steps: number): Point[] => {
  const out: Point[] = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(points[points.length - 1]!)

  return out
}

const LINE = dense(SHORE, 6)

// Arc length along the line, so ripples keep an even pace.
const ARC = LINE.reduce<number[]>((acc, p, i) => {
  const prev = LINE[i - 1]
  acc.push(i === 0 || prev === undefined ? 0 : acc[i - 1]! + Math.hypot(p[0] - prev[0], p[1] - prev[1]))

  return acc
}, [])

// The normal at each sample, pointing out to sea (away from the sand).
const NORMALS: Point[] = LINE.map((p, i) => {
  const a = LINE[Math.max(0, i - 1)]!
  const b = LINE[Math.min(LINE.length - 1, i + 1)]!
  const tx = b[0] - a[0]
  const ty = b[1] - a[1]
  const len = Math.hypot(tx, ty) || 1
  let nx = ty / len
  let ny = -tx / len
  if (nx * (p[0] - 800) + ny * (p[1] - 300) < 0) {
    nx = -nx
    ny = -ny
  }

  return [nx, ny]
})

// The waterline pushed out to sea by d. Two slow waves and one quick one bend
// it, so no two lines run parallel.
const offset = (d: number, wobble: number, phase: number, from = 0, to = LINE.length - 1, grow = 0): Point[] => {
  const out: Point[] = []
  for (let i = from; i <= to; i += 1) {
    const s = ARC[i]!
    const w =
      wobble * (Math.sin(s / 230 + phase) * 0.55 + Math.sin(s / 97 + phase * 2.3) * 0.3 + Math.sin(s / 48 + phase * 5.1) * 0.15)
    const [x, y] = LINE[i]!
    const [nx, ny] = NORMALS[i]!
    // Deeper water opens out toward the right edge, where the sea comes from.
    const k = d + w + grow * Math.max(0, 1 - s / 1400)
    out.push([x + nx * k, y + ny * k])
  }

  return out
}

// A smooth path through the points (a quadratic B-spline on their midpoints).
const smooth = (pts: Point[]) => {
  const at = (p: Point) => `${Math.round(p[0])} ${Math.round(p[1])}`
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = `M${at(pts[0]!)}L${at(mid(pts[0]!, pts[1]!))}`
  for (let i = 1; i < pts.length - 1; i += 1) d += `Q${at(pts[i]!)} ${at(mid(pts[i]!, pts[i + 1]!))}`

  return `${d}L${at(pts[pts.length - 1]!)}`
}

// Everything on the sea side of a line, closed around the outside of the frame.
const region = (pts: Point[]) => `${smooth(pts)}L-400 1400L2000 1400L2000 -300Z`

// The water, shallow to deep. Each band covers the one before it.
const BANDS = [
  { d: 38, wobble: 12, grow: 10, cls: 'w1' },
  { d: 98, wobble: 20, grow: 30, cls: 'w2' },
  { d: 176, wobble: 26, grow: 60, cls: 'w3' },
  { d: 270, wobble: 30, grow: 90, cls: 'w4' },
]
  .map((band, i) => `<path class="${band.cls}" d="${region(offset(band.d, band.wobble, i * 1.9 + 0.3, 0, LINE.length - 1, band.grow))}"/>`)
  .join('')

// Foam. Each line is a soft wide stroke under a narrower bright one, in broken
// pieces. The waterline foam is long and lacy, the break line further out is
// the widest and brightest, and the swells beyond it are thin and faint.
// The center of the frame takes only faint pieces, so the words sit on calm.
type Level = { d: number; wobble: number; grow: number; core: [number, number]; halo: number; run: [number, number]; gap: [number, number]; tone: string }

const LEVELS: Level[] = [
  { d: -6, wobble: 8, grow: 0, core: [6, 10], halo: 3, run: [14, 40], gap: [1, 3], tone: 'edge' },
  { d: 42, wobble: 12, grow: 10, core: [3.5, 6], halo: 2.6, run: [6, 16], gap: [3, 9], tone: 'thin' },
  { d: 104, wobble: 20, grow: 30, core: [11, 17], halo: 2.6, run: [8, 24], gap: [1, 5], tone: 'break' },
  { d: 184, wobble: 26, grow: 60, core: [4, 6.5], halo: 2.6, run: [10, 30], gap: [4, 12], tone: 'thin' },
  { d: 278, wobble: 30, grow: 90, core: [3.5, 5.5], halo: 2.6, run: [12, 34], gap: [5, 14], tone: 'swell' },
]

// Where the foot of the frame splits the line into a right half and a left half.
const MIDDLE = LINE.findIndex(p => p[1] > 900 && p[0] < 760)

const inCenter = (pts: Point[]) => pts.some(([x, y]) => x > 360 && x < 1240 && y < 885)
const inFoot = (pts: Point[]) => pts.some(([x]) => x > 380 && x < 1220)
const calm = (pts: Point[]) => (inCenter(pts) ? ' faint' : inFoot(pts) ? ' soft' : '')

// A foam streak is a filled ribbon along the points: it swells in the middle,
// tapers to nothing at both ends and frays a little along its length, the way
// white water looks from above.
const ribbon = (all: Point[], width: number) => {
  // Long pieces keep every other point; the curve is smooth enough without them.
  const pts = all.length > 9 ? all.filter((_, j) => j % 2 === 0 || j === all.length - 1) : all
  const n = pts.length
  const seed = between(0, 6)
  const top: Point[] = []
  const bottom: Point[] = []
  pts.forEach((p, j) => {
    const a = pts[Math.max(0, j - 1)]!
    const b = pts[Math.min(n - 1, j + 1)]!
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = (b[1] - a[1]) / len
    const ny = -(b[0] - a[0]) / len
    const t = n === 1 ? 0.5 : j / (n - 1)
    const half = (width / 2) * Math.sin(Math.PI * t) ** 0.6 * (1 + 0.35 * Math.sin(j * 1.9 + seed))
    top.push([p[0] + nx * half, p[1] + ny * half])
    bottom.push([p[0] - nx * half, p[1] - ny * half])
  })
  const at = (q: Point) => `${Math.round(q[0])} ${Math.round(q[1])}`
  const mid = (u: Point, v: Point): Point => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2]
  const ring = [...top, ...bottom.reverse()]
  let d = `M${at(mid(ring[ring.length - 1]!, ring[0]!))}`
  ring.forEach((q, j) => {
    d += `Q${at(q)} ${at(mid(q, ring[(j + 1) % ring.length]!))}`
  })

  return `${d}Z`
}

const foamGroup = (index: number, side: 'r' | 'l') => {
  const level = LEVELS[index]!
  const [first, last] = side === 'r' ? [0, MIDDLE] : [MIDDLE - 3, LINE.length - 1]
  const pieces: string[] = []
  let i = first + Math.floor(between(0, 6))
  while (i < last - 4) {
    const end = Math.min(last, i + Math.floor(between(...level.run)))
    const pts = offset(level.d + between(-6, 6), level.wobble, index * 1.9 + 0.3, i, end, level.grow)
    const core = between(...level.core)
    const quiet = calm(pts)
    // Behind a breaking crest the white water spreads toward the shore.
    if (level.tone === 'break') {
      const spill = offset(level.d - 20, level.wobble, index * 1.9 + 0.3, i, end, level.grow)
      pieces.push(`<path class="spill${quiet}" d="${ribbon(spill, between(34, 52))}"/>`)
    }
    pieces.push(`<path class="halo ${level.tone}${quiet}" d="${ribbon(pts, core * level.halo)}"/>`)
    pieces.push(`<path class="foam ${level.tone}${quiet}" d="${ribbon(pts, core)}"/>`)
    // The break line throws a second, broken crest just behind itself.
    if (level.tone === 'break' && random() < 0.6) {
      const back = offset(level.d + 18 + between(0, 8), level.wobble, index * 1.9 + 1.1, i + 2, Math.max(i + 4, end - 3), level.grow)
      pieces.push(`<path class="foam thin${calm(back)}" d="${ribbon(back, core * 0.5)}"/>`)
    }
    i = end + Math.floor(between(...level.gap))
  }

  return `<g class="surge f${index} ${side}">${pieces.join('')}</g>`
}

const FOAM = [4, 3, 2, 1, 0].map(level => `${foamGroup(level, 'r')}${foamGroup(level, 'l')}`).join('')

// Lace left on the wet sand by the last high wash: small frayed scraps of
// foam in a broken line. It stays put.
const LACE = (() => {
  const scraps: string[] = []
  let i = Math.floor(between(0, 4))
  while (i < LINE.length - 3) {
    const end = Math.min(LINE.length - 1, i + Math.floor(between(2, 6)))
    const pts = offset(-36 + between(-5, 5), 9, 4.2, i, end)
    scraps.push(`<path class="lace${calm(pts)}" d="${ribbon(pts, between(2.5, 5))}"/>`)
    i = end + Math.floor(between(1, 4))
  }

  return scraps.join('')
})()

// Soft patches under the water: pale sand bars in the shallows, darker beds in
// the deep corners. They give the water depth.
const PATCHES =
  `<ellipse class="bar" fill="url(#mare-bar)" cx="1455" cy="690" rx="90" ry="260" transform="rotate(-22 1455 690)"/>` +
  `<ellipse class="bar" fill="url(#mare-bar)" cx="250" cy="935" rx="230" ry="60" transform="rotate(14 250 935)"/>` +
  `<ellipse class="bed" fill="url(#mare-bed)" cx="1600" cy="930" rx="300" ry="170" transform="rotate(-30 1600 930)"/>` +
  `<ellipse class="bed" fill="url(#mare-bed)" cx="1580" cy="230" rx="90" ry="240" transform="rotate(-24 1580 230)"/>` +
  `<ellipse class="bed" fill="url(#mare-bed)" cx="30" cy="1000" rx="260" ry="100" transform="rotate(12 30 1000)"/>`

// Soft dune shadows in the dry sand, top left, where the shore is furthest away.
const DUNES =
  `<ellipse class="dune" fill="url(#mare-dune)" cx="120" cy="120" rx="420" ry="120" transform="rotate(-14 120 120)"/>` +
  `<ellipse class="dune" fill="url(#mare-dune)" cx="60" cy="330" rx="330" ry="90" transform="rotate(-10 60 330)"/>` +
  `<ellipse class="dune" fill="url(#mare-dune)" cx="980" cy="-40" rx="420" ry="90" transform="rotate(4 980 -40)"/>`

// Light on the water near the right edge: sun glints by day, a path of
// moonlight by night. Each glint is a short soft dash that fades in and out.
const GLINTS = Array.from({ length: 16 }, (_, i) => {
  const y = r1(between(120, 880))
  const spread = 0.55 + Math.abs(y - 470) / 600
  const x = r1(1592 - between(0, 120) * spread)
  const rx = r1(between(3, 8))
  const ry = r1(between(1.4, 2.4))
  const speed = Math.floor(between(0, 4))

  return `<ellipse class="glint g${speed} k${i % 8}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`
}).join('')

// The path of light itself: short soft streaks across the water, widest near
// the middle of the glow. They breathe slowly, out of step with each other.
const SHIMMER = Array.from({ length: 9 }, (_, i) => {
  const y = 200 + i * 70 + between(-20, 20)
  const reach = 150 - Math.abs(y - 470) / 3.2
  const x0 = 1600 - reach + between(0, 30)
  const pts: Point[] = [[x0, y], [x0 + reach * 0.35, y - 4], [x0 + reach * 0.7, y + 3], [1640, y - 2]]

  return `<path class="shimmer k${i % 8}" d="${ribbon(pts, between(5, 9))}"/>`
}).join('')

const STYLE = `
svg{--dune:#e4d6bc;--dune-alpha:.5;--sand-a:#f7f2e6;--sand-b:#e7f1ef;--wet:#ebdfca;--wet-alpha:.62;--swash:#cdf0ec;--swash-alpha:.9;--w1:#ade6e5;--w2:#8bd6e0;--w3:#71c2d9;--w4:#61aed0;--deep:#4a96c0;--deep-alpha:.5;--bar:#d6f3ee;--bar-alpha:.7;--bed:#3f86b0;--bed-alpha:.45;--foam:#ffffff;--foam-alpha:.95;--halo-alpha:.3;--thin-alpha:.7;--swell-alpha:.5;--faint-alpha:.75;--soft-alpha:.8;--spill-alpha:.2;--lace-alpha:.7;--wetline:#e3d4ba;--glow:#ffffff;--glow-alpha:.3;--glint:#ffffff;--glint-alpha:.85;--shimmer-alpha:.3;--sheen-alpha:0}
@media (prefers-color-scheme:dark){svg{--dune:#0a1b21;--dune-alpha:.6;--sand-a:#172b31;--sand-b:#10242b;--wet:#0e2128;--wet-alpha:.95;--swash:#0e2a34;--swash-alpha:.85;--w1:#0d2633;--w2:#0b2231;--w3:#0a1e2e;--w4:#091a2a;--deep:#061424;--deep-alpha:.65;--bar:#163646;--bar-alpha:.6;--bed:#04101d;--bed-alpha:.7;--foam:#b8d0da;--foam-alpha:.6;--halo-alpha:.09;--thin-alpha:.38;--swell-alpha:.26;--faint-alpha:.12;--soft-alpha:.26;--spill-alpha:.07;--lace-alpha:.22;--wetline:#0b1d23;--glow:#9cbdd0;--glow-alpha:.36;--glint:#eef4f6;--glint-alpha:.9;--shimmer-alpha:.22;--sheen-alpha:.5}}
.sa{stop-color:var(--sand-a)}.sb{stop-color:var(--sand-b)}.dp{stop-color:var(--deep)}.gl{stop-color:var(--glow)}
.deep{opacity:var(--deep-alpha)}.glow{opacity:var(--glow-alpha)}
.wet{fill:var(--wet);fill-opacity:var(--wet-alpha)}
.swash{fill:var(--swash);fill-opacity:var(--swash-alpha)}
.w1{fill:var(--w1)}.w2{fill:var(--w2)}.w3{fill:var(--w3)}.w4{fill:var(--w4)}
.sheen{opacity:var(--sheen-alpha)}.sh{stop-color:var(--glow)}.dune{opacity:var(--dune-alpha)}.du{stop-color:var(--dune)}.bar{opacity:var(--bar-alpha)}.bed{opacity:var(--bed-alpha)}.br{stop-color:var(--bar)}.bd{stop-color:var(--bed)}
.foam,.halo,.spill{fill:var(--foam)}.lace{fill:var(--foam);fill-opacity:var(--lace-alpha)}.lace.faint{fill-opacity:calc(var(--lace-alpha)*.5)}.wetline{fill:var(--wetline)}
.foam{fill-opacity:var(--foam-alpha)}.halo{fill-opacity:var(--halo-alpha)}.spill{fill-opacity:var(--spill-alpha)}
.foam.thin{fill-opacity:var(--thin-alpha)}.foam.swell{fill-opacity:var(--swell-alpha)}
.halo.thin,.halo.swell{fill-opacity:calc(var(--halo-alpha)*.5)}
.foam.faint{fill-opacity:var(--faint-alpha)}.halo.faint{fill-opacity:calc(var(--halo-alpha)*.3)}.spill.faint{fill-opacity:calc(var(--spill-alpha)*.25)}
.foam.soft{fill-opacity:var(--soft-alpha)}.halo.soft{fill-opacity:calc(var(--halo-alpha)*.5)}.spill.soft{fill-opacity:calc(var(--spill-alpha)*.5)}

.surge,.wash{transform-box:view-box;transform-origin:820px 300px;animation:near 12s ease-in-out infinite}
.f2{animation-name:mid}.f3,.f4{animation-name:far}
.wash{animation-name:wash}
.f4{animation-delay:-1s}.f3{animation-delay:-2.6s}.f2{animation-delay:-4.4s}.f1{animation-delay:-6.2s}.f0{animation-delay:-7.6s}.wash{animation-delay:-7.8s}
.f4.l{animation-delay:-2.2s}.f3.l{animation-delay:-3.8s}.f2.l{animation-delay:-5.6s}.f1.l{animation-delay:-7.4s}.f0.l{animation-delay:-8.8s}
.shimmer{fill:var(--glint);opacity:var(--shimmer-alpha);animation:breathe 10s ease-in-out infinite}
.glint{fill:var(--glint);opacity:0;animation:glint 6s ease-in-out infinite}
.g1{animation-duration:7.5s}.g2{animation-duration:9s}.g3{animation-duration:11s}
.k1{animation-delay:-1s}.k2{animation-delay:-2s}.k3{animation-delay:-3s}.k4{animation-delay:-4s}.k5{animation-delay:-5s}.k6{animation-delay:-6s}.k7{animation-delay:-7s}
@keyframes far{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(.958);opacity:1}}
@keyframes mid{0%,100%{transform:scale(1);opacity:.6}45%{transform:scale(.972);opacity:1}75%{transform:scale(.985);opacity:.75}}
@keyframes near{0%,100%{transform:scale(1);opacity:.65}40%{transform:scale(.982);opacity:1}70%{transform:scale(.99);opacity:.8}}
@keyframes wash{0%,100%{transform:scale(1)}40%{transform:scale(.986)}}
@keyframes breathe{0%,100%{opacity:var(--shimmer-alpha)}50%{opacity:calc(var(--shimmer-alpha)*.35)}}
@keyframes glint{0%,100%{opacity:0}50%{opacity:var(--glint-alpha)}}
.still .surge,.still .wash,.still .glint,.still .shimmer{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.surge,.wash,.glint,.shimmer{animation:none}}
`.replace(/\n/g, '')

const DEFS =
  `<defs>` +
  `<radialGradient id="mare-sand" cx="760" cy="300" r="1000" gradientUnits="userSpaceOnUse"><stop offset="0" class="sa"/><stop offset="1" class="sb"/></radialGradient>` +
  `<radialGradient id="mare-deep-r" cx="1680" cy="1060" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" class="dp" stop-opacity="1"/><stop offset="1" class="dp" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mare-deep-l" cx="-80" cy="1080" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" class="dp" stop-opacity="1"/><stop offset="1" class="dp" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mare-glow" cx="0" cy="0" r="1" gradientTransform="translate(1560 470) rotate(-8) scale(170 470)" gradientUnits="userSpaceOnUse"><stop offset="0" class="gl" stop-opacity="1"/><stop offset=".5" class="gl" stop-opacity=".45"/><stop offset="1" class="gl" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mare-sheen" cx="1250" cy="380" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" class="sh" stop-opacity=".18"/><stop offset="1" class="sh" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mare-dune"><stop offset="0" class="du" stop-opacity="1"/><stop offset="1" class="du" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mare-bar"><stop offset="0" class="br" stop-opacity="1"/><stop offset="1" class="br" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mare-bed"><stop offset="0" class="bd" stop-opacity="1"/><stop offset="1" class="bd" stop-opacity="0"/></radialGradient>` +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#mare-sand)"/>` +
    `<g>${DUNES}</g>` +
  `<rect class="sheen" width="1600" height="1000" fill="url(#mare-sheen)"/>` +
  `<path class="wet" d="${region(offset(-52, 14, 2.2))}"/>` +
  `<g>${LACE}</g>` +
  `<g class="wash"><path class="wetline" d="${region(offset(-24, 10, 0.9))}"/><path class="swash" d="${region(offset(-14, 10, 0.9))}"/></g>` +
  BANDS +
  `<g>${PATCHES}</g>` +
  `<g class="deep"><rect x="900" y="300" width="800" height="800" fill="url(#mare-deep-r)"/><rect x="-100" y="600" width="600" height="500" fill="url(#mare-deep-l)"/></g>` +
  `<rect class="glow" x="1300" y="0" width="300" height="1000" fill="url(#mare-glow)"/>` +
  FOAM +
  `<g>${SHIMMER}</g><g>${GLINTS}</g>` +
  `</svg>`
