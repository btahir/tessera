// A blossoming branch in spring. One SVG, drawn for both modes: the colors are
// CSS variables that a prefers-color-scheme rule swaps, so day is blush paper
// with a branch of pale flowers, and night is a plum sky with the same flowers
// pale against it and a low moon behind.
//
// The branch reaches in from the top right corner and stays out of the middle,
// where the words sit. Out of focus blossom glows at the far edges give depth.
// While Claude works a few loose petals drift down the two sides, turning.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(16)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)]!

type Point = [number, number]
type Curve = [Point, Point, Point, Point]

// A point and its direction on a cubic curve.
const at = ([a, b, c, d]: Curve, t: number) => {
  const u = 1 - t
  const point: Point = [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ]
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0])
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1])
  const length = Math.hypot(dx, dy) || 1

  return { point, normal: [-dy / length, dx / length] as Point }
}

// A limb as a filled shape that narrows from w0 to w1, with a small knot or two.
const limb = (curve: Curve, w0: number, w1: number, shift = 0) => {
  const left: string[] = []
  const right: string[] = []
  const steps = 22

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const { point, normal } = at(curve, t)
    const knot = 1 + 0.12 * Math.sin(t * 17 + w0)
    const half = ((w0 + (w1 - w0) * Math.pow(t, 0.8)) / 2) * knot
    const offset = shift * half
    left.push(`${round(point[0] + normal[0] * (half + offset))} ${round(point[1] + normal[1] * (half + offset))}`)
    right.unshift(`${round(point[0] - normal[0] * (half - offset))} ${round(point[1] - normal[1] * (half - offset))}`)
  }

  return `M${left.join('L')}L${right.join('L')}Z`
}

// The main branch, from the top right corner toward the middle, then a lower
// limb down the right edge and a few twigs. Every point stays right of x 1215.
const LIMBS: { curve: Curve; w: [number, number] }[] = [
  { curve: [[1680, -10], [1530, 40], [1450, 150], [1258, 236]], w: [44, 5] },
  { curve: [[1540, 48], [1480, 20], [1400, 6], [1300, 26]], w: [15, 3] },
  { curve: [[1440, 150], [1452, 210], [1420, 270], [1444, 340]], w: [12, 3] },
  { curve: [[1680, 250], [1600, 300], [1520, 360], [1388, 478]], w: [30, 4] },
  { curve: [[1560, 330], [1520, 400], [1530, 480], [1488, 600]], w: [10, 2.5] },
  { curve: [[1330, 200], [1300, 170], [1290, 130], [1306, 96]], w: [7, 2] },
  { curve: [[1470, 400], [1440, 380], [1400, 390], [1350, 380]], w: [7, 2] },
  { curve: [[1620, 20], [1612, 90], [1640, 150], [1680, 200]], w: [22, 8] },
]

const BRANCH = LIMBS.map(({ curve, w }) => `<path class="bark" d="${limb(curve, w[0], w[1])}"/>`).join('')
const BARK_LIGHT = LIMBS.map(
  ({ curve, w }) => `<path class="bark-lit" d="${limb(curve, w[0] * 0.34, w[1] * 0.3, 1.5)}"/>`,
).join('')

// Blossom clusters along the limbs: which limb, where on it, and how many.
const CLUSTERS: [number, number, number][] = [
  [0, 1, 6], [0, 0.84, 4], [0, 0.63, 3],
  [1, 1, 5], [1, 0.55, 2],
  [2, 1, 4],
  [3, 1, 5], [3, 0.76, 3], [3, 0.46, 2],
  [4, 1, 4], [4, 0.55, 2],
  [5, 1, 4],
  [6, 1, 3],
  [7, 0.6, 2],
]

const flowers: { x: number; y: number; html: string; z: number }[] = []
const halos: string[] = []

for (const [index, t, count] of CLUSTERS) {
  const { point, normal } = at(LIMBS[index]!.curve, t)
  const hx = Math.max(point[0], 1300)
  halos.push(`<circle class="halo" cx="${round(hx)}" cy="${round(point[1])}" r="${round(between(80, 110))}" fill="url(#flos-halo)"/>`)

  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? 1 : -1
    const reach = between(10, 40)
    let x = point[0] + normal[0] * reach * side + between(-18, 18)
    const y = point[1] + normal[1] * reach * side + between(-14, 18)
    const kind = random()
    const scale = kind < 0.74 ? between(0.85, 1.5) : between(0.75, 1.05)
    // Keep every flower clear of the middle of the frame.
    x = Math.max(x, 1216 + 30 * scale)
    const tilt = round(between(0, 360))
    const squash = round(between(0.6, 1))
    const tone = pick(['fa', 'fa', 'fb', 'fb', 'fc'])

    if (kind < 0.74) {
      flowers.push({
        x,
        y,
        z: random(),
        html: `<use href="#flos-bloom" class="${tone}" transform="translate(${round(x)} ${round(y)}) rotate(${tilt}) scale(${round(scale)} ${round(scale * squash)})"/>`,
      })
    } else {
      // A bud on a short stem, hanging off the limb.
      const angle = round(between(-50, 50) + (side > 0 ? 160 : 200))
      flowers.push({
        x,
        y,
        z: random(),
        html: `<use href="#flos-bud" class="${tone}" transform="translate(${round(x)} ${round(y)}) rotate(${angle}) scale(${round(scale)})"/>`,
      })
    }
  }

  // A young leaf or two beside each cluster.
  if (random() < 0.6) {
    const angle = round(between(0, 360))
    flowers.push({
      x: point[0],
      y: point[1],
      z: -1,
      html: `<use href="#flos-leaf" class="leaf" transform="translate(${round(Math.max(point[0], 1260))} ${round(point[1])}) rotate(${angle}) scale(${round(between(0.8, 1.2))})"/>`,
    })
  }
}

const BLOSSOMS = flowers
  .sort((a, b) => a.z - b.z)
  .map(flower => flower.html)
  .join('')
const HALOS = halos.join('')

// Two big blossoms close to the eye, soft and out of focus, cut by the frame.
const NEAR = [
  [1592, 330, 3.2, 20, 'fb'], [1372, -26, 2.6, 70, 'fa'],
]
  .map(([x, y, s, a, tone]) => `<use href="#flos-bloom" class="${tone}" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`)
  .join('')

// A far branch, out of focus, in the top left corner: soft and pale.
const FAR = [
  { curve: [[-40, 140], [60, 120], [170, 80], [320, 46]] as Curve, w: [24, 6] as [number, number] },
  { curve: [[120, 112], [160, 160], [220, 190], [310, 200]] as Curve, w: [12, 3] as [number, number] },
  { curve: [[40, 128], [60, 200], [50, 270], [80, 340]] as Curve, w: [10, 3] as [number, number] },
]
const FAR_BRANCH = FAR.map(({ curve, w }) => `<path class="far-bark" d="${limb(curve, w[0], w[1])}"/>`).join('')
const FAR_BLOOM = Array.from({ length: 22 }, (_, i) => {
  const { point } = at(FAR[i % 3]!.curve, between(0.25, 1))

  return `<circle cx="${round(Math.min(point[0] + between(-26, 26), 340))}" cy="${round(point[1] + between(-24, 24))}" r="${round(between(16, 34))}" fill="url(#flos-far)"/>`
}).join('')

// Out of focus blossom glows at the outer edges.
const GLOWS = [
  [70, 300, 120], [210, 210, 80], [40, 520, 90], [1560, 560, 110], [1450, 620, 70], [1590, 760, 80],
  [140, 760, 70], [330, 60, 60],
]
  .map(([x, y, r], i) => `<circle class="bokeh k${i % 3}" cx="${x}" cy="${y}" r="${r}" fill="url(#flos-soft)"/>`)
  .join('')

// One petal, pointing up, centered on its own origin.
const PETAL = 'M0 15C-6 11-9 1-7-7C-6-13-3-15-1-14L0-11L2-14C5-15 8-11 7-6C7 2 5 11 0 15Z'

// Petals that drift down the two sides. Left lane under the sidebar, right lane
// below the branch. Each one is a placed group, a falling group and a turning petal.
const DRIFT = Array.from({ length: 16 }, (_, i) => {
  const right = i % 2 === 1
  const near = i % 3 !== 0
  const x = round(right ? between(1250, 1560) : between(30, 330))
  const scale = round(near ? between(0.75, 1.05) : between(0.45, 0.65))
  const fall = Math.floor(between(0, 4))
  const turn = Math.floor(between(0, 4))
  const flip = i % 4 < 2 ? 'a' : 'b'
  const delay = round(-between(0, 34))
  const tone = near ? 'near' : 'far'

  return `<g transform="translate(${x} 0)"><g class="fall ${flip} v${fall} n${i}"><g class="turn t${turn}"><path class="petal ${tone}" d="${PETAL}" transform="scale(${scale})"/></g></g></g>`
})

// Delays are written per petal, so the held frame spreads them down the sides.
const DELAYS = Array.from({ length: 16 }, (_, i) => `.n${i}{animation-delay:${round(-2.1 * i - between(0, 2))}s}`).join('')

// Petals already fallen, resting near the two bottom corners.
const FALLEN = Array.from({ length: 16 }, (_, i) => {
  const right = i % 2 === 1
  const x = round(right ? between(1240, 1590) : between(10, 360))
  const y = round(between(870, 990))
  const scale = round(between(0.8, 1.2))

  return `<path class="petal rest" d="${PETAL}" transform="translate(${x} ${y}) rotate(${round(between(0, 360))}) scale(${scale} ${round(scale * between(0.5, 0.8))})"/>`
}).join('')

const STYLE = `
svg{--top:#fbf1f1;--mid:#f9ecef;--bottom:#f7e7eb;--sun:#fff4ea;--sun-alpha:.9;--haze:#f2d3db;--haze-alpha:.55;
--bark:#8a6c6c;--bark-lit:#b59a97;--far-bark:#e6d0d4;--far-bloom:#f3d6dd;--bokeh:#f0c4cf;--bokeh-alpha:.5;
--pa:#fbe8eb;--pa-in:#f0c6d0;--pb:#f8dae1;--pb-in:#e9b2c0;--pc:#fdf2f3;--pc-in:#f3d5dc;--eye:#b07884;--dot:#b0905f;
--sepal:#a1665f;--leaf:#a9b693;--petal:#f0c8d2;--petal-far:#f3d3db;--rest:#f1cfd7;--moon-alpha:0;--halo:#ebb5c3;--halo-alpha:.68;--near-alpha:.55}
@media (prefers-color-scheme:dark){svg{--top:#2a1822;--mid:#2f1c25;--bottom:#341f2a;--sun:#7a5f70;--sun-alpha:.38;--haze:#4a2b3b;--haze-alpha:.5;
--bark:#1c0e15;--bark-lit:#3a2531;--far-bark:#382430;--far-bloom:#4a3340;--bokeh:#6a4a5c;--bokeh-alpha:.38;
--pa:#937884;--pa-in:#765866;--pb:#836775;--pb-in:#674857;--pc:#9f8892;--pc-in:#7f6974;--eye:#4c2a3a;--dot:#b9a08b;
--sepal:#3c2230;--leaf:#4b5444;--petal:#9b7c8a;--petal-far:#6b5060;--rest:#5e4453;--moon-alpha:1;--halo:#6a4759;--halo-alpha:.4;--near-alpha:.4}}
.top{stop-color:var(--top)}.mid{stop-color:var(--mid)}.bottom{stop-color:var(--bottom)}
.sun{stop-color:var(--sun)}.haze{stop-color:var(--haze)}.bk{stop-color:var(--bokeh)}
.sun-glow{opacity:var(--sun-alpha)}.haze-glow{opacity:var(--haze-alpha)}
.moon{fill:url(#flos-moon);opacity:var(--moon-alpha)}.mn{stop-color:#654c5c}.mh{stop-color:#4c3645}
.bokeh{opacity:var(--bokeh-alpha)}.k1{opacity:calc(var(--bokeh-alpha)*.7)}.k2{opacity:calc(var(--bokeh-alpha)*.5)}
.distant{opacity:.75}.far-bark{fill:var(--far-bark)}.fr{stop-color:var(--far-bloom)}.hl{stop-color:var(--halo)}.halo{opacity:var(--halo-alpha)}.close{opacity:var(--near-alpha)}
.bark{fill:var(--bark)}.bark-lit{fill:var(--bark-lit);opacity:.7}
.pf{fill:var(--pf)}.pi{fill:var(--pi)}.eye{fill:var(--eye)}.dot{fill:var(--dot)}.sepal{fill:var(--sepal)}
.fa{--pf:var(--pa);--pi:var(--pa-in)}.fb{--pf:var(--pb);--pi:var(--pb-in)}.fc{--pf:var(--pc);--pi:var(--pc-in)}
.leaf{fill:var(--leaf)}
.petal{fill:var(--petal)}.petal.far{fill:var(--petal-far)}.petal.rest{fill:var(--rest)}
.sway{transform-origin:1640px 20px;animation:sway 14s ease-in-out infinite alternate}
.fall{animation:fall-a 26s linear infinite}.fall.b{animation-name:fall-b}
.v1{animation-duration:30s}.v2{animation-duration:34s}.v3{animation-duration:38s}
.turn{animation:turn 11s ease-in-out infinite}
.t1{animation-duration:14s;animation-direction:reverse}.t2{animation-duration:17s}.t3{animation-duration:9s;animation-direction:reverse}
${DELAYS}
@keyframes sway{from{transform:rotate(-.5deg)}to{transform:rotate(.7deg)}}
@keyframes fall-a{0%{transform:translate(0,-60px)}20%{transform:translate(26px,170px)}40%{transform:translate(-4px,400px)}60%{transform:translate(30px,630px)}80%{transform:translate(2px,860px)}100%{transform:translate(24px,1090px)}}
@keyframes fall-b{0%{transform:translate(0,-60px)}20%{transform:translate(-24px,170px)}40%{transform:translate(6px,400px)}60%{transform:translate(-28px,630px)}80%{transform:translate(0,860px)}100%{transform:translate(-22px,1090px)}}
@keyframes turn{0%{transform:rotate(0) scale(1,1)}50%{transform:rotate(170deg) scale(.35,1)}100%{transform:rotate(360deg) scale(1,1)}}
.still .sway,.still .fall,.still .turn{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.sway,.fall,.turn{animation:none}}
`.replace(/\n/g, '')

const DEFS =
  `<linearGradient id="flos-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset=".5" class="mid"/><stop offset="1" class="bottom"/></linearGradient>` +
  `<radialGradient id="flos-moon"><stop offset="0" class="mn"/><stop offset=".72" class="mn"/><stop offset=".86" class="mh" stop-opacity=".7"/><stop offset="1" class="mh" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="flos-sun"><stop offset="0" class="sun" stop-opacity="1"/><stop offset=".5" class="sun" stop-opacity=".45"/><stop offset="1" class="sun" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="flos-haze"><stop offset="0" class="haze" stop-opacity="1"/><stop offset=".6" class="haze" stop-opacity=".4"/><stop offset="1" class="haze" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="flos-halo"><stop offset="0" class="hl" stop-opacity="1"/><stop offset=".5" class="hl" stop-opacity=".5"/><stop offset="1" class="hl" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="flos-far"><stop offset="0" class="fr" stop-opacity="1"/><stop offset=".55" class="fr" stop-opacity=".8"/><stop offset="1" class="fr" stop-opacity="0"/></radialGradient>` +
  `<filter id="flos-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>` +
  `<radialGradient id="flos-soft"><stop offset="0" class="bk" stop-opacity="1"/><stop offset=".6" class="bk" stop-opacity=".5"/><stop offset="1" class="bk" stop-opacity="0"/></radialGradient>` +
  // One open flower: five notched petals, a darker heart and a ring of stamens.
  `<g id="flos-bloom">` +
  [0, 72, 144, 216, 288]
    .map(
      a =>
        `<g transform="rotate(${a})"><path class="pf" d="M0 0C-8-3-14-15-12-24C-10-31-3-32 0-27C3-32 10-31 12-24C14-15 8-3 0 0Z"/><path class="pi" d="M0 0C-5-3-7-10-6-15C-3-13 3-13 6-15C7-10 5-3 0 0Z"/></g>`,
    )
    .join('') +
  `<circle class="eye" r="4.5"/>` +
  [20, 92, 164, 236, 308].map(a => `<circle class="dot" r="1.8" transform="rotate(${a}) translate(0 -9)"/>`).join('') +
  `</g>` +
  // A bud: a closed teardrop of petal over a small cup of sepals, on a stem.
  `<g id="flos-bud"><path class="sepal" d="M-1 0L1 0L1 22L-1 22Z"/><path class="pf" d="M0 22C-8 26-10 38-6 46C-3 51 3 51 6 46C10 38 8 26 0 22Z"/><path class="pi" d="M0 22C-4 24-6 30-5 34C-2 31 2 31 5 34C6 30 4 24 0 22Z"/><path class="sepal" d="M0 20C-6 22-8 28-6 31L0 26L6 31C8 28 6 22 0 20Z"/></g>` +
  `<path id="flos-leaf" d="M0 0C10-8 28-10 40-4C28 4 12 6 0 0Z"/>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>${DEFS}</defs>` +
  `<rect width="1600" height="1000" fill="url(#flos-sky)"/>` +
  `<ellipse class="haze-glow" cx="1640" cy="120" rx="520" ry="460" fill="url(#flos-haze)"/>` +
  `<circle class="sun-glow" cx="1430" cy="150" r="420" fill="url(#flos-sun)"/>` +
  `<circle class="moon" cx="1452" cy="668" r="120"/>` +
  `<ellipse class="haze-glow" cx="80" cy="980" rx="460" ry="220" fill="url(#flos-haze)"/>` +
  `<ellipse class="haze-glow" cx="1560" cy="1000" rx="420" ry="200" fill="url(#flos-haze)"/>` +
  `<g>${GLOWS}</g>` +
  `<g class="distant">${FAR_BRANCH}${FAR_BLOOM}</g>` +
  `<g>${DRIFT.filter((_, i) => i % 3 === 0).join('')}</g>` +
  `<g class="sway"><g>${HALOS}</g><g>${BRANCH}${BARK_LIGHT}</g><g>${BLOSSOMS}</g></g>` +
  `<g class="close" filter="url(#flos-blur)">${NEAR}</g>` +
  `<g>${FALLEN}</g>` +
  `<g>${DRIFT.filter((_, i) => i % 3 !== 0).join('')}</g>` +
  `</svg>`
