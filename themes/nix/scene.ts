// Quiet snowfall. One SVG, drawn for both modes: the colors are CSS variables
// that a prefers-color-scheme rule swaps, so day is a pale overcast winter and
// night is the same place under one warm lamp.
//
// The middle of the frame is where the words sit, so it holds only the sky and
// faint flakes. The branch, the lamp, the pines and the drifts keep to the edges.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(14)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// The frame is 1600 wide. The words sit in about the middle half of it. Flakes
// drift sideways as they fall, so the faint band is a little wider than that.
const isCenter = (x: number) => x > 320 && x < 1300

// The bare branch, drawn by hand as tapered limbs reaching in from the top right.
// Each limb is a list of points, a width at its base and a width at its tip.
type Point = [number, number]
type Limb = { points: Point[]; base: number; tip: number; snow: number }

// A smooth curve through points, as cubic Bezier segments.
const through = (points: Point[]) => {
  let d = ''
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`
  }
  return d
}

// The unit normal at each point that faces up the frame.
const upward = (points: Point[]) =>
  points.map((_, i) => {
    const a = points[Math.max(0, i - 1)]!
    const b = points[Math.min(points.length - 1, i + 1)]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    let n: Point = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length]
    if (n[1] > 0) n = [-n[0], -n[1]]
    return n
  })

const widths = (limb: Limb) => limb.points.map((_, i) => limb.base + ((limb.tip - limb.base) * i) / (limb.points.length - 1))

const shift = (points: Point[], normals: Point[], by: number[]) =>
  points.map((p, i) => [p[0] + normals[i]![0] * by[i]!, p[1] + normals[i]![1] * by[i]!] as Point)

const woodPath = (limb: Limb, cls: string) => {
  const n = upward(limb.points)
  const w = widths(limb)
  const top = shift(limb.points, n, w.map(v => v / 2))
  const bottom = shift(limb.points, n, w.map(v => -v / 2)).reverse()
  return `<path class="${cls}" d="M${round(top[0]![0])} ${round(top[0]![1])}${through(top)}L${round(bottom[0]![0])} ${round(bottom[0]![1])}${through(bottom)}Z"/>`
}

// Snow lying along the top of a limb: thickest over the middle, thin at the ends.
const snowPath = (limb: Limb, cls: string) => {
  if (limb.snow === 0) return ''
  const n = upward(limb.points)
  const w = widths(limb)
  const last = limb.points.length - 1
  const seat = shift(limb.points, n, w.map(v => v * 0.3))
  const crest = shift(
    limb.points,
    n,
    w.map((v, i) => v * 0.3 + limb.snow * (v / limb.base) * Math.sin((Math.PI * (i + 0.6)) / (last + 1.2)) ** 0.7),
  ).reverse()
  return `<path class="${cls}" d="M${round(seat[0]![0])} ${round(seat[0]![1])}${through(seat)}L${round(crest[0]![0])} ${round(crest[0]![1])}${through(crest)}Z"/>`
}

// Thin twigs off a limb, mostly reaching upward. Edges only, so they never
// cross into the reading column.
const twigs = (limb: Limb, count: number, cls: string) => {
  let out = ''
  const w = widths(limb)
  for (let k = 0; k < count; k += 1) {
    const i = 1 + Math.floor(between(0, limb.points.length - 2))
    const [x, y] = limb.points[i]!
    const [nx, ny] = limb.points[i + 1]!
    const along = Math.atan2(ny - y, nx - x)
    const spread = between(0.5, 1.05)
    const up = Math.sin(along + spread) < Math.sin(along - spread) ? along + spread : along - spread
    const angle = random() < 0.75 ? up : 2 * along - up
    const length = between(26, 62) * Math.min(1, w[i]! / 8 + 0.4)
    const bend = between(-0.25, 0.25)
    const mid: Point = [x + Math.cos(angle) * length * 0.5, y + Math.sin(angle) * length * 0.5]
    const end: Point = [mid[0] + Math.cos(angle + bend) * length * 0.5, mid[1] + Math.sin(angle + bend) * length * 0.5]
    if (end[0] < 1250 || mid[0] < 1250) continue
    out += woodPath({ points: [[x, y], mid, end], base: Math.min(3.4, w[i]! * 0.5), tip: 0.6, snow: 0 }, cls)
  }
  return out
}

const NEAR: Limb[] = [
  { points: [[1660, 34], [1580, 66], [1500, 104], [1430, 134], [1360, 154], [1300, 170], [1252, 190]], base: 22, tip: 2.4, snow: 9 },
  { points: [[1488, 108], [1466, 74], [1452, 40], [1450, 8]], base: 7, tip: 1.6, snow: 0 },
  { points: [[1420, 137], [1394, 180], [1372, 220], [1346, 252]], base: 6, tip: 1.2, snow: 2.5 },
  { points: [[1350, 157], [1324, 128], [1306, 98], [1296, 70]], base: 4.6, tip: 1, snow: 0 },
  { points: [[1574, 68], [1562, 40], [1566, 12]], base: 5, tip: 1.2, snow: 0 },
  { points: [[1660, 214], [1590, 232], [1530, 262], [1482, 298], [1452, 332]], base: 13, tip: 2, snow: 6 },
  { points: [[1532, 262], [1512, 228], [1504, 196]], base: 4, tip: 1, snow: 0 },
]

const FAR_LIMBS: Limb[] = [
  { points: [[1660, 392], [1570, 400], [1480, 424], [1410, 450], [1352, 474]], base: 10, tip: 1.6, snow: 4.5 },
  { points: [[1500, 418], [1484, 386], [1480, 356]], base: 3.4, tip: 0.9, snow: 0 },
]

const BRANCH =
  `<g>${FAR_LIMBS.map(l => woodPath(l, 'bough far')).join('')}${twigs(FAR_LIMBS[0]!, 4, 'bough far')}${FAR_LIMBS.map(l => snowPath(l, 'cap far')).join('')}</g>` +
  `<g>${NEAR.map(l => woodPath(l, 'bough')).join('')}${NEAR.map(l => twigs(l, l.base > 10 ? 6 : 2, 'bough')).join('')}${NEAR.map(l => snowPath(l, 'cap')).join('')}</g>`

// Soft pines standing in the mist on the two outer edges.
const pine = (x: number, base: number, height: number, cls: string) => {
  const tiers = 5
  let d = ''
  for (let t = 0; t < tiers; t += 1) {
    const top = base - height + (height * t) / (tiers + 0.4)
    const bottom = top + height * 0.34
    const half = height * 0.17 * (0.45 + (t / tiers) * 0.95)
    d += `M${round(x)} ${round(top)}Q${round(x + half * 0.5)} ${round(bottom - height * 0.12)} ${round(x + half)} ${round(bottom)}Q${round(x)} ${round(bottom - height * 0.06)} ${round(x - half)} ${round(bottom)}Q${round(x - half * 0.5)} ${round(bottom - height * 0.12)} ${round(x)} ${round(top)}Z`
  }
  return `<path class="${cls}" d="${d}"/>`
}

const pines = (list: number[][], cls: string) => list.map(([x, base, h]) => pine(x!, base!, h!, cls)).join('')

// A far line of woods along the horizon: one jagged silhouette of small pines,
// taller in clumps, half lost in the mist.
const WOODS = (() => {
  const base = 798
  let d = `M240 ${base}`
  let x = 240
  while (x < 1380) {
    const clump = Math.max(0, Math.sin(x / 90) + Math.sin(x / 37) * 0.6)
    const h = between(16, 34) + clump * 20
    const half = between(6, 10)
    d += `L${round(x + half)} ${round(base - h * 0.3)}L${round(x + half * 1.6)} ${round(base - h)}L${round(x + half * 2.2)} ${round(base - h * 0.3)}`
    x += half * 2.2
  }
  return `<path class="tree woods" d="${d}L${round(x)} ${base}Z"/>`
})()

const TREES =
  WOODS +
  pines([[20, 760, 330], [120, 770, 250], [215, 780, 200], [300, 790, 150], [1310, 780, 140], [1400, 765, 210], [1505, 750, 280], [1590, 745, 320]], 'tree far') +
  pines([[70, 800, 260], [175, 815, 180], [1450, 800, 220], [1555, 790, 250]], 'tree near')

// Falling flakes. Each is one path holding two dots, one cycle apart, so as it
// falls there is always a copy in the frame. Fainter through the middle.
const FALL = 1100

const FLAKES = Array.from({ length: 48 }, (_, i) => {
  const x = round(between(-40, 1660))
  const y = round(between(0, FALL))
  const size = round(i % 3 === 0 ? between(6.5, 9) : between(3.5, 6))
  const speed = Math.floor(between(0, 4))
  const sway = Math.floor(between(0, 3))
  const delay = Math.floor(between(0, 10))
  const faint = isCenter(x) ? ' faint' : ''

  return `<path class="flake f${speed} w${sway} d${delay}${faint}" d="M${x} ${y}h0M${x} ${round(y - FALL)}h0" stroke-width="${size}"/>`
}).join('')

// A few large near flakes, out of focus, at the outer edges only.
const BOKEH = Array.from({ length: 8 }, (_, i) => {
  const x = round(i % 2 === 0 ? between(30, 300) : between(1320, 1580))
  const y = round(between(0, FALL))
  const delay = Math.floor(between(0, 10))
  const d = `M${x} ${y}h0M${x} ${round(y - FALL)}h0`

  return `<g class="bokeh w${i % 3} d${delay}"><path class="b1" d="${d}" stroke-width="34"/><path class="b2" d="${d}" stroke-width="24"/><path class="b3" d="${d}" stroke-width="13"/></g>`
}).join('')

// Dry stalks standing out of the right hand drift.
const STALKS = Array.from({ length: 8 }, (_, i) => {
  const x = round(1290 + i * 30 + between(-10, 10))
  const base = round(905 - i * 16)
  const h = round(between(60, 120))
  const lean = round(between(-20, 8))
  return `<path class="stalk" d="M${x} ${base}Q${round(x + lean * 0.2)} ${round(base - h * 0.6)} ${round(x + lean)} ${round(base - h)}"/>`
}).join('')

const STYLE = `
svg{--top:#d3dce4;--mid:#e1e8ed;--low:#eaf0f3;--haze:#fbfcfd;--haze-alpha:.9;--ridge:#dde5eb;--woods:#d5dee5;--far-tree:#d2dce3;--near-tree:#c4cfd8;--lit:#f8fafc;--half:#eef2f6;--shade:#cfdbe4;--ground:#ebf1f4;--wood:#6e6863;--far-wood:#bcc4ca;--cap:#fbfcfd;--far-cap:#eef2f5;--stalk:#97928c;--flake:#ffffff;--flake-alpha:1;--faint-alpha:.65;--bokeh-alpha:.6;--warm:#f6e7cf;--warm-alpha:0;--lamp-alpha:0}
@media (prefers-color-scheme:dark){svg{--top:#12181d;--mid:#171e24;--low:#1c242b;--haze:#c98f52;--haze-alpha:.3;--ridge:#1e262d;--woods:#1f282f;--far-tree:#1c252c;--near-tree:#151c22;--lit:#4c6074;--half:#3a4b5b;--shade:#2a3845;--ground:#20292f;--wood:#0b0f13;--far-wood:#1a2229;--cap:#93a2ae;--far-cap:#33414d;--stalk:#10161b;--flake:#dde6ee;--flake-alpha:.75;--faint-alpha:.11;--bokeh-alpha:.24;--warm:#e9a862;--warm-alpha:.12;--lamp-alpha:.5}}
.top{stop-color:var(--top)}.mid{stop-color:var(--mid)}.low{stop-color:var(--low)}
.hz{stop-color:var(--haze)}.wm{stop-color:var(--warm)}
.lit{stop-color:var(--lit)}.half{stop-color:var(--half)}.shade{stop-color:var(--shade)}
.haze{opacity:var(--haze-alpha)}.warm{opacity:var(--warm-alpha)}.lamp{opacity:var(--lamp-alpha)}
.ridge{fill:var(--ridge)}
.tree.woods{fill:var(--woods)}.tree.far{fill:var(--far-tree)}.tree.near{fill:var(--near-tree)}
.ground{fill:var(--ground)}
.bough{fill:var(--wood)}.bough.far{fill:var(--far-wood)}
.cap{fill:var(--cap)}.cap.far{fill:var(--far-cap)}
.stalk{stroke:var(--stalk);stroke-width:2.4;fill:none;stroke-linecap:round}
.flake{stroke:var(--flake);stroke-opacity:var(--flake-alpha);stroke-linecap:round;fill:none;animation:fall 24s linear infinite,sway 7s ease-in-out infinite alternate}
.flake.faint{stroke-opacity:var(--faint-alpha)}
.f1{animation-duration:29s,9s}.f2{animation-duration:35s,11s}.f3{animation-duration:42s,8s}
.bokeh{opacity:var(--bokeh-alpha);animation:fall 48s linear infinite,sway 13s ease-in-out infinite alternate}
.b1,.b2,.b3{stroke:var(--flake);stroke-linecap:round;fill:none}.b1{stroke-opacity:.12}.b2{stroke-opacity:.2}.b3{stroke-opacity:.35}
.w1{animation-name:fall,sway-wide}.w2{animation-name:fall,sway-slow;animation-direction:normal,alternate-reverse}
.d1{animation-delay:-2.3s,-1s}.d2{animation-delay:-4.9s,-3s}.d3{animation-delay:-7.4s,-5s}.d4{animation-delay:-10.1s,-2s}.d5{animation-delay:-12.8s,-6s}.d6{animation-delay:-15.5s,-4s}.d7{animation-delay:-18.2s,-7s}.d8{animation-delay:-21.6s,-1.5s}.d9{animation-delay:-25s,-3.5s}
@keyframes fall{from{translate:0 0}to{translate:-50px ${FALL}px}}
@keyframes sway{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
@keyframes sway-wide{from{transform:translateX(-24px)}to{transform:translateX(20px)}}
@keyframes sway-slow{from{transform:translateX(-16px)}to{transform:translateX(16px)}}
.still .flake,.still .bokeh{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.flake,.bokeh{animation:none}}
`.replace(/\n/g, '')

// A drift shape: lit along its crest, settling into a cool shade at its foot.
const DRIFT = (d: string) => `<path fill="url(#nix-drift)" d="${d}"/>`

const DEFS =
  `<defs>` +
  `<linearGradient id="nix-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset=".6" class="mid"/><stop offset="1" class="low"/></linearGradient>` +
  `<radialGradient id="nix-haze" cx="1500" cy="100" r="480" gradientUnits="userSpaceOnUse"><stop offset="0" class="hz"/><stop offset=".3" class="hz" stop-opacity=".55"/><stop offset=".6" class="hz" stop-opacity=".18"/><stop offset=".82" class="hz" stop-opacity=".05"/><stop offset="1" class="hz" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="nix-lamp" cx="1505" cy="135" r="90" gradientUnits="userSpaceOnUse"><stop offset="0" class="wm"/><stop offset=".25" class="wm" stop-opacity=".7"/><stop offset="1" class="wm" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="nix-warm" cx="1480" cy="760" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" class="wm"/><stop offset="1" class="wm" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="nix-drift" x1=".8" y1="0" x2=".2" y2="1"><stop offset="0" class="lit"/><stop offset=".35" class="half"/><stop offset="1" class="shade"/></linearGradient>` +
  `<linearGradient id="nix-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="low" stop-opacity="0"/><stop offset="1" class="low" stop-opacity=".9"/></linearGradient>` +
  `</defs>`

const LAND =
  // A far low ridge across the whole frame, barely darker than the sky.
  `<path class="ridge" d="M0 760C180 735 330 760 520 772C720 784 900 770 1080 758C1260 746 1420 736 1600 748V1000H0Z"/>` +
  `<g>${TREES}</g>` +
  `<rect y="600" width="1600" height="260" fill="url(#nix-mist)"/>` +
  // The snow field, with the faintest swell across the foot.
  `<path class="ground" d="M0 850C260 838 520 872 800 876C1080 880 1340 846 1600 836V1000H0Z"/>` +
  // Left corner: three drifts set side by side, back to front, as wind leaves them.
  DRIFT('M0 700C60 688 130 690 190 712C270 742 340 800 400 870C440 916 470 960 490 1000H0Z') +
  DRIFT('M150 1000C180 920 240 850 320 838C390 828 440 870 480 920C500 948 515 975 525 1000Z') +
  DRIFT('M0 890C50 872 110 878 160 905C200 928 228 962 245 1000H0Z') +
  // Right corner, larger, under the branch.
  DRIFT('M1600 650C1540 645 1460 662 1390 700C1310 745 1240 820 1180 900C1150 940 1125 975 1110 1000H1600Z') +
  `<g>${STALKS}</g>` +
  DRIFT('M1090 1000C1120 930 1180 870 1265 858C1340 848 1400 880 1440 930C1460 955 1472 980 1478 1000Z') +
  DRIFT('M1600 830C1540 822 1470 838 1420 875C1385 900 1365 950 1355 1000H1600Z')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#nix-sky)"/>` +
  `<rect class="haze" width="1600" height="1000" fill="url(#nix-haze)"/>` +
  LAND +
  `<rect class="warm" width="1600" height="1000" fill="url(#nix-warm)"/>` +
  `<rect class="lamp" x="1380" width="220" height="240" fill="url(#nix-lamp)"/>` +
  BRANCH +
  `<g>${FLAKES}${BOKEH}</g>` +
  `</svg>`
