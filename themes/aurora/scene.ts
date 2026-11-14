// Northern lights over snow. One SVG, drawn for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so night is a deep polar sky
// with green and violet curtains, and day is a pale dawn with pastel veils.
//
// The words sit in the middle of the frame, so the curtains hang from the two
// upper corners and only a faint ribbon crosses the top. The snow ridges and
// their spruce trees keep to the bottom corners, clear of the message box.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(11)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// How strongly a thing at x may show: 1 at the edges, falling to `floor` in the middle.
const edgeWeight = (x: number, floor: number) => {
  const d = Math.abs(x - 800)
  const t = Math.min(1, Math.max(0, (d - 380) / 340))
  const smooth = t * t * (3 - 2 * t)

  return floor + (1 - floor) * smooth
}

type Point = [number, number]
const bezier = ([a, b, c]: [Point, Point, Point], t: number): Point => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
]

// A curtain of light: soft vertical rays whose bright foot follows a curve.
// Every other ray shimmers, and the shimmer's delay steps along the curve so a
// slow wave of light runs through the curtain.
type Curtain = {
  curve: [Point, Point, Point]
  rays: number
  height: [number, number]
  width: [number, number]
  strength: number
  floor: number
  gradient: string
}

const curtain = ({ curve, rays, height, width, strength, floor, gradient }: Curtain) =>
  Array.from({ length: rays }, (_, i) => {
    const t = Math.min(1, Math.max(0, (i + between(-0.3, 0.3)) / (rays - 1)))
    const [x, base] = bezier(curve, t)
    // A slow wave along the foot, so the curtain hangs in folds.
    const foot = base + 28 * Math.sin(t * Math.PI * 3.2 + 0.6)
    const h = between(height[0], height[1])
    const w = between(width[0], width[1])
    const alpha = Math.min(1, strength * edgeWeight(x, floor) * between(0.75, 1.1))
    const shimmer = i % 3 === 0 ? ` ray w${(i / 3) % 12}` : ''

    return `<rect class="r${shimmer}" x="${round(x - w / 2)}" y="${round(foot - h * 0.9)}" width="${round(w)}" height="${round(h)}" fill="url(#aurora-${gradient})" fill-opacity="${alpha.toFixed(2)}"/>`
  }).join('')

// The main curtain sweeps up from the left corner, its twin from the right,
// and a faint, higher violet ribbon arcs across the top behind them.
const FAR = curtain({
  curve: [
    [60, 300],
    [800, 10],
    [1540, 280],
  ],
  rays: 26,
  height: [200, 300],
  width: [110, 160],
  strength: 0.55,
  floor: 0.1,
  gradient: 'far',
})

const LEFT = curtain({
  curve: [
    [-80, 500],
    [240, 400],
    [760, 170],
  ],
  rays: 28,
  height: [300, 470],
  width: [110, 160],
  strength: 0.8,
  floor: 0.08,
  gradient: 'near',
})

const RIGHT = curtain({
  curve: [
    [1690, 450],
    [1380, 350],
    [900, 150],
  ],
  rays: 26,
  height: [280, 440],
  width: [110, 160],
  strength: 0.75,
  floor: 0.08,
  gradient: 'near',
})

// Stars, thick at the edges and sparse in the middle. A few twinkle slowly.
const STARS = Array.from({ length: 80 }, (_, i) => {
  const x = round(between(0, 1600))
  const y = round(between(0, 640))
  const r = round(between(0.9, 2))
  const alpha = (edgeWeight(x, 0.15) * between(0.5, 1)).toFixed(2)
  const twinkle = i % 9 === 0 ? ` tw t${i % 4}` : ''

  return `<circle class="star${twinkle}" cx="${x}" cy="${y}" r="${r}" fill-opacity="${alpha}"/>`
}).join('')

// A spruce: a narrow stack of drooping tiers on a short trunk.
const spruce = (x: number, base: number, h: number) => {
  const w = h * 0.36
  const tiers = 5
  let d = `M${round(x)},${round(base - h)}`

  for (let k = 1; k <= tiers; k += 1) {
    const y = base - h + (h * 0.92 * k) / tiers
    const half = (w / 2) * (0.35 + (0.65 * k) / tiers)
    d += `L${round(x + half)},${round(y)}L${round(x + half * 0.45)},${round(y - h * 0.05)}`
  }
  d += `L${round(x + w * 0.06)},${round(base)}L${round(x - w * 0.06)},${round(base)}`
  for (let k = tiers; k >= 1; k -= 1) {
    const y = base - h + (h * 0.92 * k) / tiers
    const half = (w / 2) * (0.35 + (0.65 * k) / tiers)
    d += `L${round(x - half * 0.45)},${round(y - h * 0.05)}L${round(x - half)},${round(y)}`
  }

  return `${d}Z`
}

// The land in each bottom corner, back to front: a far range of snowy peaks,
// a ridge with a stand of spruce, and a near drift of snow.
const range = (points: Point[], shadeIndex: number[]) => {
  const outline = points.map(([x, y]) => `${x},${y}`).join('L')
  const last = points[points.length - 1]!
  const first = points[0]!
  const body = `<path class="far-land" d="M${outline}L${last[0]},1010L${first[0]},1010Z"/>`
  // The shaded face of each peak, from its top down to the next valley.
  const faces = shadeIndex
    .map(i => {
      const [px, py] = points[i]!
      const [vx, vy] = points[i + 1]!
      const low: Point = [round(px + (vx - px) * 0.3), Math.max(py, vy) + 110]

      return `M${px},${py}L${vx},${vy}L${low[0]},${low[1]}Z`
    })
    .join('')

  return `${body}<path class="shade" d="${faces}"/>`
}

const RANGE_LEFT = range(
  [
    [-40, 720],
    [45, 640],
    [110, 690],
    [190, 600],
    [265, 675],
    [325, 655],
    [390, 750],
    [455, 870],
    [540, 1010],
  ],
  [1, 3, 5],
)

const RANGE_RIGHT = range(
  [
    [1640, 690],
    [1565, 625],
    [1500, 670],
    [1425, 585],
    [1345, 665],
    [1285, 705],
    [1220, 800],
    [1150, 880],
    [1070, 1010],
  ],
  [2, 3, 5],
)

const RIDGE_LEFT: [Point, Point, Point] = [
  [-40, 815],
  [240, 750],
  [520, 1010],
]
const RIDGE_RIGHT: [Point, Point, Point] = [
  [1640, 790],
  [1340, 745],
  [1090, 1010],
]

// A stand of spruce along a ridge, taller near the corner and thinning inward.
const grove = (ridge: [Point, Point, Point], count: number, reach: number, sizes: [number, number]) =>
  Array.from({ length: count }, (_, i) => {
    const t = (reach * (i + between(-0.35, 0.35))) / count
    const [x, y] = bezier(ridge, Math.max(0.005, t))
    const fade = 1 - (0.55 * i) / count

    return spruce(x, y + 8, between(sizes[0], sizes[1]) * fade)
  }).join('')

const TREES =
  grove(RIDGE_LEFT, 15, 0.52, [70, 125]) + grove(RIDGE_RIGHT, 13, 0.48, [65, 120])

const ridge = ([a, b, c]: [Point, Point, Point]) =>
  `M${a[0]},${a[1]}Q${b[0]},${b[1]} ${c[0]},${c[1]}L${a[0]},1010Z`

const STYLE = `
svg{--sky0:#d2dfeb;--sky1:#dfedef;--sky2:#ecf0ea;--dawn:#f9cfb2;--dawn-alpha:1;--g1:#78d4ad;--g2:#ab93de;--g3:#c3a8e6;--near-alpha:.85;--far-alpha:.6;--veil-a:#bba5ea;--veil-b:#9fdcc4;--veil-alpha:.7;--star:#ffffff;--star-alpha:0;--far0:#c9d8e4;--far1:#dfe9ec;--shade:#9fb5c6;--shade-alpha:.4;--snow0:#f2f8f9;--snow1:#d6e4e8;--snow2:#fafcfc;--snow3:#e4eef0;--tree:#7c99a2;--tree-alpha:.85}
@media (prefers-color-scheme:dark){svg{--sky0:#081a21;--sky1:#0c2427;--sky2:#0c2225;--dawn:#2a7466;--dawn-alpha:.18;--g1:#5fe0a4;--g2:#8a70e2;--g3:#9a6bd4;--near-alpha:.7;--far-alpha:.8;--veil-a:#5d47b4;--veil-b:#2b9a72;--veil-alpha:.3;--star:#e6f4f2;--star-alpha:.85;--far0:#25454f;--far1:#11292d;--shade:#06161c;--shade-alpha:.55;--snow0:#3b5f67;--snow1:#1b3a3d;--snow2:#4a6e75;--snow3:#27464a;--tree:#06141a;--tree-alpha:.92}}
.s0{stop-color:var(--sky0)}.s1{stop-color:var(--sky1)}.s2{stop-color:var(--sky2)}
.g1{stop-color:var(--g1)}.g2{stop-color:var(--g2)}.g3{stop-color:var(--g3)}
.va{stop-color:var(--veil-a)}.vb{stop-color:var(--veil-b)}.dw{stop-color:var(--dawn)}
.f0{stop-color:var(--far0)}.f1{stop-color:var(--far1)}
.n0{stop-color:var(--snow0)}.n1{stop-color:var(--snow1)}.n2{stop-color:var(--snow2)}.n3{stop-color:var(--snow3)}
.far-land{fill:url(#aurora-range)}.shade{fill:var(--shade);opacity:var(--shade-alpha)}
.near{opacity:var(--near-alpha)}.far{opacity:var(--far-alpha)}
.dawn{opacity:var(--dawn-alpha)}
.veil{opacity:var(--veil-alpha);animation:breathe 17s ease-in-out infinite}
.v1{animation-duration:23s;animation-delay:-9s}.v2{animation-duration:19s;animation-delay:-14s}
.star{fill:var(--star);opacity:var(--star-alpha)}
.tw{animation:twinkle 7s ease-in-out infinite}
.t1{animation-duration:9s;animation-delay:-3s}.t2{animation-duration:11s;animation-delay:-6s}.t3{animation-duration:8s;animation-delay:-5s}
.tree{fill:var(--tree);opacity:var(--tree-alpha)}
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 31s ease-in-out infinite}
.sway.b{animation-duration:37s;animation-delay:-17s}.sway.c{animation-duration:43s;animation-delay:-25s}
.ray{animation:glint 9s ease-in-out infinite}
.w0{animation-delay:0s}.w1{animation-delay:-.75s}.w2{animation-delay:-1.5s}.w3{animation-delay:-2.25s}.w4{animation-delay:-3s}.w5{animation-delay:-3.75s}.w6{animation-delay:-4.5s}.w7{animation-delay:-5.25s}.w8{animation-delay:-6s}.w9{animation-delay:-6.75s}.w10{animation-delay:-7.5s}.w11{animation-delay:-8.25s}
@keyframes sway{0%,100%{transform:translateX(0) scaleY(1)}50%{transform:translateX(34px) scaleY(1.07)}}
@keyframes glint{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes breathe{0%,100%{opacity:var(--veil-alpha)}50%{opacity:calc(var(--veil-alpha)*.55)}}
@keyframes twinkle{0%,100%{opacity:var(--star-alpha)}50%{opacity:calc(var(--star-alpha)*.3)}}
.still .veil,.still .tw,.still .sway,.still .ray{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.veil,.tw,.sway,.ray{animation:none}}
`.replace(/\n/g, '')

// A ray: brightest at a point near its foot, a short fade below and a long one above.
const rayGradient = (name: string, low: string, high: string) =>
  `<radialGradient id="aurora-${name}" cx=".5" cy=".55" r=".45" fx=".5" fy=".9">` +
  `<stop offset="0" class="${low}" stop-opacity=".85"/><stop offset=".22" class="${low}" stop-opacity=".5"/>` +
  `<stop offset=".55" class="${high}" stop-opacity=".22"/><stop offset="1" class="${high}" stop-opacity="0"/></radialGradient>`

const softGlow = (name: string, color: string) =>
  `<radialGradient id="aurora-${name}"><stop offset="0" class="${color}" stop-opacity=".9"/><stop offset=".5" class="${color}" stop-opacity=".35"/><stop offset="1" class="${color}" stop-opacity="0"/></radialGradient>`

const vertical = (name: string, top: string, bottom: string) =>
  `<linearGradient id="aurora-${name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="${top}"/><stop offset="1" class="${bottom}"/></linearGradient>`

const DEFS =
  `<defs>` +
  `<linearGradient id="aurora-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0"/><stop offset=".55" class="s1"/><stop offset="1" class="s2"/></linearGradient>` +
  rayGradient('near', 'g1', 'g2') +
  rayGradient('far', 'g2', 'g3') +
  softGlow('veil-a', 'va') +
  softGlow('veil-b', 'vb') +
  softGlow('dawn', 'dw') +
  vertical('range', 'f0', 'f1') +
  vertical('back', 'n0', 'n1') +
  vertical('front', 'n2', 'n3') +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#aurora-sky)"/>` +
  // Low light on the horizon behind the land: dawn by day, a green glow by night.
  `<g class="dawn"><ellipse cx="140" cy="760" rx="560" ry="260" fill="url(#aurora-dawn)"/><ellipse cx="1480" cy="740" rx="580" ry="270" fill="url(#aurora-dawn)"/></g>` +
  `<g>${STARS}</g>` +
  // Broad veils of color in the upper corners, under the curtains.
  `<ellipse class="veil" cx="130" cy="70" rx="560" ry="300" fill="url(#aurora-veil-a)"/>` +
  `<ellipse class="veil v1" cx="1480" cy="60" rx="540" ry="280" fill="url(#aurora-veil-a)"/>` +
  `<ellipse class="veil v2" cx="120" cy="420" rx="380" ry="180" fill="url(#aurora-veil-b)" fill-opacity=".55"/>` +
  `<ellipse class="veil v1" cx="1500" cy="380" rx="380" ry="170" fill="url(#aurora-veil-b)" fill-opacity=".55"/>` +
  `<g class="far"><g class="sway c">${FAR}</g></g>` +
  `<g class="near"><g class="sway">${LEFT}</g><g class="sway b">${RIGHT}</g></g>` +
  RANGE_LEFT +
  RANGE_RIGHT +
  `<path d="${ridge(RIDGE_LEFT)}" fill="url(#aurora-back)"/>` +
  `<path d="${ridge(RIDGE_RIGHT)}" fill="url(#aurora-back)"/>` +
  `<path class="tree" d="${TREES}"/>` +
  `<path d="M-40,930Q190,885 430,1010L-40,1010Z" fill="url(#aurora-front)"/>` +
  `<path d="M1640,910Q1400,880 1170,1010L1640,1010Z" fill="url(#aurora-front)"/>` +
  `</svg>`
