// A greenhouse. One SVG, drawn for both modes: the colors are CSS variables that a
// prefers-color-scheme rule swaps, so day is soft light through glass and night is
// the same room under the moon, the leaves gone to deep green shapes.
//
// The words sit in the middle of the frame, so it holds only light, the faint
// glazing bars and the palest far leaves. Every plant grows in from a corner or a
// side, in three depths: far (pale and soft), middle, and near (the strongest).

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(13)
const between = (low: number, high: number) => low + random() * (high - low)
const r0 = (n: number) => Math.round(n)
const r1 = (n: number) => Math.round(n * 10) / 10
const pt = (x: number, y: number) => `${r0(x)} ${r0(y)}`

type Point = [number, number]
const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// A smooth path through points, as quadratic curves between midpoints.
// A point given twice in a row becomes a sharp corner.
const smooth = (points: Point[], closed = true) => {
  const n = points.length
  if (!closed) {
    let d = `M${pt(...points[0]!)}`
    for (let i = 1; i < n - 1; i += 1) d += `Q${pt(...points[i]!)} ${pt(...mid(points[i]!, points[i + 1]!))}`
    return `${d}L${pt(...points[n - 1]!)}`
  }
  let d = `M${pt(...mid(points[n - 1]!, points[0]!))}`
  for (let i = 0; i < n; i += 1) d += `Q${pt(...points[i]!)} ${pt(...mid(points[i]!, points[(i + 1) % n]!))}`
  return `${d}Z`
}

type LeafOptions = {
  length: number
  width: number
  // How far the midrib bends to one side over its length.
  bend?: number
  // Width profile: a lower rise puts the widest point nearer the base, a lower
  // fullness rounds the shoulders.
  rise?: number
  full?: number
  // How much the blade narrows toward the tip.
  taper?: number
  // Lobes behind the stalk, for heart and arrow shaped leaves, as a share of length.
  heart?: number
  // Splits that run in from the edge toward the midrib.
  splits?: number
  // Pairs of side veins; small leaves get none.
  ribs?: number
  depth?: number
  // How far a split leans back toward the base, as a share of length.
  lean?: number
}

/** A leaf with its stalk end at 0,0 pointing along +x: a blade path and a vein path. */
const leaf = (o: LeafOptions) => {
  const { length, width, bend = 0, rise = 0.75, full = 0.65, taper = 0.2, heart = 0, splits = 0, ribs = Math.max(4, splits + 1), depth = 0.6, lean = 0.04 } = o
  const steps = length < 120 ? 9 : 18
  const start = -heart * length
  const span = length - start
  // The midrib, from the back of the lobes (t = 0) to the tip (t = 1).
  const rib = (t: number): Point => [start + t * span, bend * length * t * t]
  const normal = (t: number): Point => {
    const a = Math.atan2(2 * bend * length * t, span)
    return [-Math.sin(a), Math.cos(a)]
  }
  const half = (t: number) =>
    (width / 2) * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, Math.max(0, t)), rise)), full) * (1 - taper * t)
  const edge = (t: number, sign: number, scale = 1): Point => {
    const [x, y] = rib(t)
    const [nx, ny] = normal(t)
    return [x + nx * half(t) * sign * scale, y + ny * half(t) * sign * scale]
  }
  const cuts = Array.from({ length: splits }, (_, i) => 0.22 + ((i + 0.5) / splits) * 0.66 + between(-0.025, 0.025))
  const gap = 0.022

  const side = (sign: number) => {
    const out: Point[] = []
    for (let s = 1; s < steps; s += 1) {
      const t = s / steps
      out.push(edge(t, sign))
      for (const c of cuts) {
        if (t <= c && c < t + 1 / steps) {
          const a = edge(c, sign)
          const b = edge(c - lean, sign, 1 - depth)
          const f = edge(c - lean + gap * 0.5, sign, 1 - depth)
          const e = edge(c + gap, sign)
          out.push(a, a, b, f, e, e)
        }
      }
    }
    return out
  }

  const tip = rib(1)
  const base: Point = heart > 0 ? [0, 0] : rib(0)
  const outline = [base, base, ...side(-1), tip, tip, ...side(1).reverse()]
  const blade = smooth(outline)

  // The midrib and pairs of side veins, one stroke path.
  let veins = smooth(
    Array.from({ length: 7 }, (_, i) => rib((heart > 0 ? heart * 0.9 : 0.03) + (i / 6) * 0.9)),
    false,
  )
  for (let i = 0; i < ribs; i += 1) {
    const t = 0.2 + (i / ribs) * 0.66
    for (const sign of [-1, 1]) {
      const [x, y] = rib(t)
      const end = edge(t + 0.1, sign, 0.8)
      const bendTo = edge(t + 0.045, sign, 0.45)
      veins += `M${pt(x, y)}Q${pt(...bendTo)} ${pt(...end)}`
    }
  }

  return { blade, veins }
}

type Tone = 'far' | 'mid' | 'near' | 'lime'

/** One leaf on a stalk that runs from the plant's anchor, 0,0, to x,y. */
const stalked = (tone: Tone, x: number, y: number, angle: number, o: LeafOptions, droop = 0) => {
  const { blade, veins } = leaf(o)
  const m = mid([0, 0], [x, y])
  const stem = x === 0 && y === 0 ? '' : `<path class="stalk ${tone}-s" d="M0 0Q${pt(m[0] + droop, m[1] - Math.abs(droop) * 0.3)} ${pt(x, y)}"/>`
  return `${stem}<g transform="translate(${r0(x)} ${r0(y)}) rotate(${r1(angle)})"><path class="blade ${tone}" d="${blade}"/><path class="vein ${tone}-v" d="${veins}"/></g>`
}

/** A fern frond along +x: a curved stalk with paired leaflets that shrink toward the tip. */
const frond = (tone: Tone, length: number, curl: number, leaflet: number, pairs: number) => {
  const at = (t: number): Point => [t * length, curl * length * t * t]
  let d = ''
  for (let i = 0; i < pairs; i += 1) {
    const t = 0.06 + (i / pairs) * 0.9
    const [x, y] = at(t)
    const dir = Math.atan2(2 * curl * t, 1)
    const size = leaflet * Math.pow(Math.sin(Math.PI * (0.2 + t * 0.8)), 0.6)
    const w = size * 0.3
    for (const sign of [-1, 1]) {
      const a = dir + sign * (1.15 - t * 0.35)
      const tip: Point = [x + Math.cos(a) * size, y + Math.sin(a) * size]
      const n: Point = [-Math.sin(a) * w, Math.cos(a) * w]
      const m: Point = [x + Math.cos(a) * size * 0.4, y + Math.sin(a) * size * 0.4]
      d += `M${pt(x, y)}Q${pt(m[0] + n[0], m[1] + n[1])} ${pt(...tip)}Q${pt(m[0] - n[0], m[1] - n[1])} ${pt(x, y)}`
    }
  }
  d += `M${pt(...at(0.96))}Q${pt(...at(0.99))} ${pt(...at(1.02))}`
  const spine = smooth(
    Array.from({ length: 7 }, (_, i) => at(i / 6)),
    false,
  )
  return `<path class="blade ${tone}" d="${d}"/><path class="stalk ${tone}-s thin" d="${spine}"/>`
}

/** A trailing vine hanging from 0,0, with heart leaves turned side to side. */
const vine = (tone: Tone, drop: number, swing: number, leaves: number, size: number) => {
  const at = (t: number): Point => [Math.sin(t * Math.PI * 1.3) * swing, t * drop]
  const stem = smooth(
    Array.from({ length: 10 }, (_, i) => at(i / 9)),
    false,
  )
  let out = `<path class="stalk ${tone}-s thin" d="${stem}"/>`
  for (let i = 0; i < leaves; i += 1) {
    const t = 0.05 + (i / leaves) * 0.93
    const [x, y] = at(t)
    const sign = i % 2 === 0 ? 1 : -1
    const s = size * (0.8 + 0.3 * Math.sin(i * 1.7)) * (1 - t * 0.35)
    const a = 90 - sign * between(40, 65)
    const px = Math.cos((a * Math.PI) / 180) * s * 0.25
    const py = Math.sin((a * Math.PI) / 180) * s * 0.25
    out += `<path class="stalk ${tone}-s thin" d="M${pt(x, y)}L${pt(x + px, y + py)}"/>`
    out += stalked(tone, 0, 0, a, { length: s, width: s * 1.05, rise: 0.62, full: 0.55, taper: 0.3, heart: 0.16, ribs: 0 }).replace('translate(0 0)', `translate(${r0(x + px)} ${r0(y + py)})`)
  }
  return out
}

const turn = (angle: number, body: string) => `<g transform="rotate(${angle})">${body}</g>`

// Every plant sways around its own anchor. `k` picks one of six rhythms.
type Plant = { x: number; y: number; k: number; body: string }

const monstera = (splits: number) => ({ heart: 0.14, rise: 0.62, full: 0.5, taper: 0.25, splits, depth: 0.8, lean: 0.07 })
const banana = { rise: 1, full: 0.42, taper: 0.3, depth: 0.97, lean: -0.012 }
const arrow = { rise: 0.62, full: 0.75, taper: 0.3, heart: 0.2 }

const plants: Plant[] = [
  // Far: pale shapes that reach furthest in, like plants seen through a second pane.
  { x: -40, y: -40, k: 0, body: turn(22, frond('far', 620, 0.2, 130, 15)) },
  { x: -40, y: -40, k: 1, body: turn(52, frond('far', 520, -0.16, 115, 13)) },
  { x: 1640, y: -40, k: 2, body: turn(154, frond('far', 640, -0.2, 130, 15)) },
  { x: 1640, y: -40, k: 3, body: turn(126, frond('far', 540, 0.16, 115, 13)) },
  { x: 1470, y: 1080, k: 4, body: stalked('far', 0, 0, -97, { length: 620, width: 380, bend: -0.05, ...arrow }) },

  // Middle.
  { x: 1660, y: 40, k: 3, body: stalked('mid', -120, 180, 128, { length: 290, width: 290, bend: -0.04, ...monstera(5) }, -30) },
  { x: 1630, y: 1060, k: 0, body: stalked('mid', -60, -210, -136, { length: 340, width: 240, bend: 0.06, ...arrow }, 20) },
  { x: 190, y: 1070, k: 2, body: turn(-84, frond('mid', 560, 0.12, 100, 15)) },
  { x: 1285, y: -20, k: 5, body: vine('mid', 320, 10, 6, 50) },
  { x: -60, y: 560, k: 4, body: stalked('mid', 0, 0, 8, { length: 320, width: 300, bend: 0.08, ...monstera(5) }) },

  // Near: the plants closest to the glass.
  { x: -70, y: -70, k: 2, body: stalked('near', 100, 110, 47, { length: 420, width: 430, bend: 0.06, ...monstera(7) }, 20) },
  { x: -50, y: -50, k: 4, body: turn(88, frond('lime', 600, -0.12, 100, 16)) },
  { x: 1440, y: -20, k: 0, body: vine('lime', 760, 22, 12, 74) },
  { x: 1550, y: -20, k: 3, body: vine('lime', 520, -14, 8, 66) },
  { x: 60, y: 900, k: 1, body: stalked('near', 10, -70, -56, { length: 440, width: 180, bend: -0.05, splits: 4, ...banana }) },
  { x: 60, y: 900, k: 3, body: stalked('near', 50, -30, -32, { length: 320, width: 170, bend: 0.08, splits: 3, ...banana }) },
  { x: 1570, y: 920, k: 5, body: stalked('near', -40, -170, -114, { length: 330, width: 270, bend: -0.04, ...arrow }, -20) },
  { x: 1570, y: 920, k: 2, body: stalked('near', 10, -90, -74, { length: 260, width: 220, bend: 0.06, ...arrow }, 20) },
]

const layer = (from: number, to: number) =>
  plants
    .slice(from, to)
    .map(p => `<g transform="translate(${p.x} ${p.y})"><g class="sway k${p.k}">${p.body}</g></g>`)
    .join('')

// Two clay pots in the bottom corners, the only warm color in the room.
const pot = (x: number, width: number, top: number) => {
  const lip = 34
  const foot = width * 0.78
  const side = (width - foot) / 2
  return (
    `<path class="pot" d="M${x - width / 2} ${top + lip}L${x - width / 2 + side} 1040H${x + width / 2 - side}L${x + width / 2} ${top + lip}Z"/>` +
    `<path class="rim" d="M${x - width / 2 - 14} ${top}h${width + 28}v${lip}h${-width - 28}Z"/>` +
    `<path class="shade" d="M${x - width / 2 - 14} ${top + lip}h${width + 28}v10h${-width - 28}Z"/>`
  )
}
const POTS = pot(60, 330, 860) + pot(1570, 300, 880)

// Glazing bars: the frame of the glasshouse, very faint, under a curved roof.
const BARS =
  [400, 800, 1200].map(x => `<path class="bar" d="M${x} ${x === 800 ? 70 : 105}V1000"/>`).join('') +
  `<path class="bar" d="M0 690H1600"/><path class="bar roof" d="M-40 230Q800 -90 1640 230"/>`

// Shafts of light through the roof: the sun from the left by day, the moon from the right by night.
// Each shaft is three nested bands, so its edges fall off softly.
const shaft = (kind: string, x: number, top: number, spread: number, slant: number, k: number) =>
  `<g class="beam ${kind} b${k}">` +
  [1, 0.66, 0.33]
    .map(f => {
      const a = x + (top * (1 - f)) / 2
      const w = top * f
      const s = spread * f
      return `<path d="M${r0(a)} -20h${r0(w)}L${r0(a + w + slant + s / 2)} 1000h${-r0(w + s)}Z"/>`
    })
    .join('') +
  `</g>`
const BEAMS =
  shaft('sunbeam', 330, 120, 160, 520, 0) + shaft('sunbeam', 560, 70, 120, 520, 1) + shaft('sunbeam', 140, 60, 110, 520, 2) +
  shaft('moonbeam', 1300, 120, 160, -600, 0) + shaft('moonbeam', 1450, 70, 110, -600, 1) + shaft('moonbeam', 1215, 50, 90, -600, 2)

const STYLE = `
svg{--top:#f6f7ea;--bottom:#e5eedb;--sun:#fdfbe8;--sun-a:.95;--moon-a:0;--beam:#fffef4;--sunbeam:1;--moonbeam:0;--bar:#d3dec8;--far:#d6e1ca;--far2:#cddabf;--mid:#b7cca4;--mid2:#a6bf91;--near:#8dad76;--near2:#7b9f66;--lime:#a3bf80;--lime2:#8cad69;--vein:#eef4e4;--vein-a:.4;--stalk:#88a473;--clay:#dcbfa6;--clay2:#cfab8f;--rim:#e3c8b1}
@media (prefers-color-scheme:dark){svg{--top:#1d2924;--bottom:#1b2217;--sun-a:0;--sunbeam:0;--moonbeam:.26;--beam:#4a5f57;--moon:#506a5f;--moon-a:.85;--bar:#28331f;--far:#222c20;--far2:#202a1d;--mid:#192218;--mid2:#283a23;--near:#121a11;--near2:#365530;--lime:#151f13;--lime2:#3e6131;--vein:#4a6640;--vein-a:.32;--stalk:#172014;--clay:#2f2620;--clay2:#261f1a;--rim:#372d25}}
.top{stop-color:var(--top)}.bottom{stop-color:var(--bottom)}.sun0{stop-color:var(--sun)}.beam0{stop-color:var(--beam)}.moon0{stop-color:var(--moon)}
.far0{stop-color:var(--far)}.far1{stop-color:var(--far2)}.mid0{stop-color:var(--mid)}.mid1{stop-color:var(--mid2)}.near0{stop-color:var(--near)}.near1{stop-color:var(--near2)}.lime0{stop-color:var(--lime)}.lime1{stop-color:var(--lime2)}
.blade.far{fill:url(#hortus-far)}.blade.mid{fill:url(#hortus-mid)}.blade.near{fill:url(#hortus-near)}.blade.lime{fill:url(#hortus-lime)}
.vein{fill:none;stroke:var(--vein);stroke-opacity:var(--vein-a);stroke-width:2;stroke-linecap:round}.far-v{stroke-opacity:0}.mid-v{stroke-opacity:calc(var(--vein-a)*.6)}
.stalk{fill:none;stroke:var(--stalk);stroke-width:6;stroke-linecap:round}.stalk.thin{stroke-width:3}.far-s{stroke:var(--far2)}.mid-s{stroke:var(--mid2)}
.pot{fill:url(#hortus-clay)}.rim{fill:var(--rim)}.shade{fill:var(--clay2);opacity:.6}.clay0{stop-color:var(--clay)}.clay1{stop-color:var(--clay2)}
.bar{fill:none;stroke:var(--bar);stroke-opacity:.5;stroke-width:5}.roof{stroke-width:8}
.beam{fill:url(#hortus-beam);fill-opacity:.4;animation:shine 17s ease-in-out infinite}.sunbeam{--o:var(--sunbeam);opacity:var(--o)}.moonbeam{--o:var(--moonbeam);opacity:var(--o)}.b1{animation-duration:23s;animation-delay:-8s}.b2{animation-duration:19s;animation-delay:-13s}
@keyframes shine{0%,100%{opacity:var(--o)}50%{opacity:calc(var(--o)*.4)}}
.sun{fill:url(#hortus-sun);opacity:var(--sun-a)}.moon{fill:url(#hortus-moon);opacity:var(--moon-a)}
.sway{animation:sway 11s ease-in-out infinite}
.k1{animation-name:swayb;animation-duration:14s;animation-delay:-5s}.k2{animation-duration:9s;animation-delay:-3s}.k3{animation-name:swayb;animation-duration:16s;animation-delay:-9s}.k4{animation-duration:13s;animation-delay:-7s}.k5{animation-name:swayb;animation-duration:10s;animation-delay:-2s}
@keyframes sway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.6deg)}}
@keyframes swayb{0%,100%{transform:rotate(1.2deg)}40%{transform:rotate(-1.5deg)}70%{transform:rotate(.4deg)}}
.still .sway,.still .beam{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.sway,.beam{animation:none}}
`.replace(/\n/g, '')

const grad = (name: string) =>
  `<linearGradient id="hortus-${name}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="${name}0"/><stop offset="1" class="${name}1"/></linearGradient>`

const glow = (name: string, cx: number, cy: number, r: number) =>
  `<radialGradient id="hortus-${name}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" class="${name}0"/><stop offset=".4" class="${name}0" stop-opacity=".45"/><stop offset="1" class="${name}0" stop-opacity="0"/></radialGradient>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs><linearGradient id="hortus-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset="1" class="bottom"/></linearGradient>` +
  `${glow('sun', 800, -100, 900)}${glow('moon', 1610, -20, 660)}` +
  `<linearGradient id="hortus-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="beam0"/><stop offset=".75" class="beam0" stop-opacity=".25"/><stop offset="1" class="beam0" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="hortus-clay" x1="0" y1="0" x2="1" y2="0"><stop offset=".2" class="clay0"/><stop offset="1" class="clay1"/></linearGradient>` +
  `${grad('far')}${grad('mid')}${grad('near')}${grad('lime')}</defs>` +
  `<rect width="1600" height="1000" fill="url(#hortus-sky)"/>` +
  `<rect class="sun" width="1600" height="1000"/><rect class="moon" width="1600" height="1000"/>` +
  `<g>${BEAMS}</g><g>${BARS}</g>` +
  `<g>${layer(0, 5)}</g><g>${layer(5, 10)}</g><g>${layer(10, plants.length)}</g>${POTS}` +
  `</svg>`
