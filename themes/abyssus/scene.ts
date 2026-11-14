// The deep sea. One SVG, drawn for both modes: the colors are CSS variables that
// a prefers-color-scheme rule swaps, so day is shallow sunlit water and night is
// deep ocean blue with jellyfish glowing in it.
//
// The middle of the frame is where the words sit, so it holds only the water's
// own gradient, faint light from above and a few faint specks. The jellyfish
// keep to the edges: a large one high on the left, a larger one low on the
// right, smaller ones beside them, all leaning in toward the light.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(11)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// The frame is 1600 wide. The words sit in about the middle half of it.
const isCenter = (x: number) => x > 380 && x < 1220

type Jelly = { x: number; y: number; r: number; tilt: number; hue: 'a' | 'b'; far?: boolean; drift: number }

// A trailing line from the rim: a slow wave whose swing grows toward the end,
// with a small ripple on top when `ripple` is set (the frilled arms).
const trail = (x0: number, y0: number, length: number, swing: number, phase: number, ripple = 0) => {
  const steps = ripple > 0 ? 16 : 5
  let d = `M${round(x0)} ${round(y0)}`
  let px = x0
  let py = y0

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    const y = y0 + length * t
    const x = x0 + Math.sin(phase + t * 3.6) * swing * t + Math.sin(phase * 2 + t * 17) * ripple * (1 - t * 0.4)
    const mid = py + (y - py) * 0.5
    d += `C${round(px)} ${round(mid)} ${round(x)} ${round(mid)} ${round(x)} ${round(y)}`
    px = x
    py = y
  }

  return d
}

// The bell: a soft dome whose margin hangs in small scallops.
const bellPath = (r: number) => {
  const lip = (x: number) => -0.16 * r * (1 - (x / r) ** 2)
  let d = `M${-r} 0C${round(-r * 1.02)} ${round(-r * 0.78)} ${round(-r * 0.62)} ${round(-r * 1.14)} 0 ${round(-r * 1.14)}C${round(r * 0.62)} ${round(-r * 1.14)} ${round(r * 1.02)} ${round(-r * 0.78)} ${r} 0`
  const n = 9

  for (let k = 0; k < n; k += 1) {
    const x1 = r - (2 * r * (k + 1)) / n
    const xm = r - (2 * r * (k + 0.5)) / n
    d += `Q${round(xm)} ${round(lip(xm) + r * 0.11)} ${round(x1)} ${round(lip(x1))}`
  }

  return `${d}Z`
}

const jelly = (j: Jelly, index: number) => {
  const { r } = j
  const lip = (x: number) => -0.16 * r * (1 - (x / r) ** 2)

  // Long thin tentacles from the margin, and frilled arms from the middle.
  const count = j.far ? 4 : 8
  const threads = Array.from({ length: count }, (_, i) => {
    const x0 = r * (-0.78 + (1.56 * i) / (count - 1))

    return `<path class="thread" d="${trail(x0, lip(x0) + r * 0.05, r * between(3.2, 4.8), r * between(0.18, 0.32), between(0, 6))}"/>`
  }).join('')
  const arms = j.far
    ? ''
    : [-0.2, 0.04, 0.24]
        .map(
          start =>
            `<path class="arm" d="${trail(start * r, lip(0), r * between(1.7, 2.4), r * 0.14, between(0, 6), r * 0.04)}"/>`,
        )
        .join('')

  // Faint radial canals across the dome.
  const canals = [-0.62, -0.3, 0, 0.3, 0.62]
    .map(
      at =>
        `M${round(at * 0.2 * r)} ${round(-1.08 * r)}Q${round(at * 0.85 * r)} ${round(-0.85 * r)} ${round(at * r)} ${round(lip(at * r) - 0.02 * r)}`,
    )
    .join('')
  const rim = `M${round(-0.9 * r)} ${round(-0.46 * r)}C${round(-0.72 * r)} ${round(-1.02 * r)} ${round(0.72 * r)} ${round(-1.02 * r)} ${round(0.9 * r)} ${round(-0.46 * r)}`
  const delay = `p${index % 4}`

  return (
    `<g class="${j.far ? 'far ' : ''}t${j.hue}" transform="translate(${j.x} ${j.y}) rotate(${j.tilt})">` +
    `<g class="drift f${j.drift}">` +
    `<ellipse class="halo ${delay}" cy="${round(-0.4 * r)}" rx="${round(r * 2.5)}" ry="${round(r * 2.2)}" fill="url(#abyssus-halo-${j.hue})"/>` +
    `<g class="sway w${index % 3}">${threads}${arms}</g>` +
    `<g class="beat ${delay}">` +
    `<path class="bell" d="${bellPath(r)}" fill="url(#abyssus-bell-${j.hue})"/>` +
    `<ellipse class="core" cy="${round(-0.5 * r)}" rx="${round(0.5 * r)}" ry="${round(0.34 * r)}" fill="url(#abyssus-core-${j.hue})"/>` +
    `<path class="canal" d="${canals}"/><path class="rim" d="${rim}"/>` +
    `</g></g></g>`
  )
}

const JELLIES = (
  [
    // Far and small, for depth.
    { x: 330, y: 610, r: 19, tilt: 10, hue: 'b', far: true, drift: 2 },
    { x: 1282, y: 300, r: 23, tilt: -12, hue: 'a', far: true, drift: 3 },
    { x: 1545, y: 790, r: 17, tilt: -6, hue: 'a', far: true, drift: 1 },
    { x: 60, y: 120, r: 15, tilt: 14, hue: 'b', far: true, drift: 3 },
    // Near: the two that carry the frame, and their companions.
    { x: 205, y: 300, r: 90, tilt: 9, hue: 'a', drift: 0 },
    { x: 92, y: 760, r: 46, tilt: 14, hue: 'b', drift: 1 },
    { x: 1400, y: 585, r: 106, tilt: -8, hue: 'b', drift: 2 },
    { x: 1482, y: 175, r: 54, tilt: -12, hue: 'a', drift: 3 },
  ] as Jelly[]
)
  .map(jelly)
  .join('')

// Specks of drifting matter. All sit at the same height and are spread along
// one long rise by their delays, so each crosses the whole frame.
const SPECKS = Array.from({ length: 24 }, (_, i) => {
  const x = round(i % 3 === 2 ? between(440, 1160) : i % 2 === 0 ? between(10, 380) : between(1220, 1590))
  const r = round(between(1.2, 3.2))
  const faint = isCenter(x) ? ' faint' : ''

  return `<circle class="speck k${i}${faint}" cx="${x}" cy="500" r="${r}"/>`
}).join('')

// A few larger out of focus motes close to the glass, at the edges only.
const MOTES = [
  { x: 70, r: 15 },
  { x: 150, r: 11 },
  { x: 1330, r: 12 },
  { x: 1560, r: 16 },
]
  .map((mote, i) => `<circle class="speck mote m${i}" cx="${mote.x}" cy="500" r="${mote.r}"/>`)
  .join('')

const TIMING =
  Array.from({ length: 24 }, (_, i) => {
    const duration = round(between(40, 72))

    return `.k${i}{animation-duration:${duration}s;animation-delay:-${round(between(0, duration))}s}`
  }).join('') +
  Array.from({ length: 4 }, (_, i) => {
    const duration = round(between(70, 96))

    return `.m${i}{animation-duration:${duration}s;animation-delay:-${round(((i * 0.37 + 0.11) % 1) * duration)}s}`
  }).join('')

// Sun rays from above the top edge, fanned out from one point far overhead.
const RAYS = [
  { x: 150, w: 60 },
  { x: 380, w: 110 },
  { x: 610, w: 50 },
  { x: 820, w: 130 },
  { x: 1060, w: 70 },
  { x: 1290, w: 120 },
  { x: 1500, w: 55 },
]
  .map((ray, i) => {
    const lean = (ray.x - 800) * 0.42

    // Three nested wedges, so the ray is brightest in its middle and soft at its sides.
    const wedge = (k: number) =>
      `<path d="M${round(ray.x - (ray.w * k) / 2)} -10L${round(ray.x + (ray.w * k) / 2)} -10L${round(ray.x + ray.w * 1.7 * k + lean)} 780L${round(ray.x - ray.w * 1.7 * k + lean)} 780Z"/>`

    return `<g class="ray y${i % 3}" fill="url(#abyssus-ray)">${wedge(1.25)}${wedge(0.8)}${wedge(0.4)}</g>`
  })
  .join('')

// Light playing on the underside of the surface, a few soft wavering bands along the top.
const SURFACE = [
  { y: 22, width: 7, alpha: 0.7, waves: 9 },
  { y: 52, width: 4.5, alpha: 0.5, waves: 12 },
  { y: 86, width: 3, alpha: 0.32, waves: 15 },
]
  .map((band, i) => {
    const step = 1700 / (band.waves * 2)
    let d = `M-50 ${band.y}`

    for (let k = 0; k < band.waves * 2; k += 1) {
      d += `Q${round(-50 + step * (k + 0.5))} ${round(band.y + (k % 2 === 0 ? -1 : 1) * between(5, 12))} ${round(-50 + step * (k + 1))} ${band.y}`
    }

    return `<path class="surface v${i}" stroke-width="${band.width}" stroke-opacity="${band.alpha}" d="${d}"/>`
  })
  .join('')

const STYLE = `
svg{--top:#f0fbfe;--mid:#e0f2fa;--deep:#cbe5f1;--glow:#ffffff;--glow-alpha:.75;--ray:#ffffff;--ray-alpha:.45;--haze-a:#9fd6e6;--haze-b:#c9bde9;--haze-alpha:.35;--a:#62bcd4;--b:#a896d9;--halo-alpha:.3;--bell-alpha:.5;--core-alpha:.9;--core:#ffffff;--rim:#ffffff;--rim-alpha:.6;--canal-alpha:.45;--thread-alpha:.3;--far-alpha:.5;--speck:#ffffff;--speck-alpha:.9;--faint-alpha:.65;--mote:#ffffff;--shade:#a9d2e3;--shade-alpha:.35;--surface-alpha:.5}
@media (prefers-color-scheme:dark){svg{--top:#08293a;--mid:#052636;--deep:#021b29;--glow:#2f7ea3;--glow-alpha:.11;--ray:#7cc4e4;--ray-alpha:.03;--haze-a:#1d7f97;--haze-b:#5a4b9a;--haze-alpha:.32;--a:#4fd6e6;--b:#b49af0;--halo-alpha:.26;--bell-alpha:.3;--core-alpha:.55;--core:#e9fbff;--rim:#d8f8ff;--rim-alpha:.36;--canal-alpha:.22;--thread-alpha:.3;--far-alpha:.45;--speck:#9fdcec;--speck-alpha:.5;--faint-alpha:.13;--mote:#7fd3e6;--shade:#00121e;--shade-alpha:.6;--surface-alpha:0}}
.wt{stop-color:var(--top)}.wm{stop-color:var(--mid)}.wd{stop-color:var(--deep)}
.gl{stop-color:var(--glow)}.ry{stop-color:var(--ray)}.sh{stop-color:var(--shade)}.mo{stop-color:var(--mote)}
.ha{stop-color:var(--haze-a)}.hb{stop-color:var(--haze-b)}
.ca{stop-color:var(--a)}.cb{stop-color:var(--b)}.cc{stop-color:var(--core)}
.glow{opacity:var(--glow-alpha)}.shade{opacity:var(--shade-alpha)}.haze{opacity:var(--haze-alpha)}
.ray{opacity:var(--ray-alpha);animation:shimmer 14s ease-in-out infinite}
.y1{animation-duration:19s;animation-delay:-6s}.y2{animation-duration:23s;animation-delay:-13s}
.far{opacity:var(--far-alpha)}
.halo{opacity:var(--halo-alpha);animation:glow 9s ease-in-out infinite}
.bell{opacity:var(--bell-alpha)}.core{opacity:var(--core-alpha)}
.rim,.canal{fill:none;stroke:var(--rim);stroke-linecap:round}
.rim{stroke-opacity:var(--rim-alpha);stroke-width:2.2}
.canal{stroke-opacity:var(--canal-alpha);stroke-width:1.2}
.thread,.arm{fill:none;stroke-linecap:round}
.thread{stroke-opacity:var(--thread-alpha);stroke-width:1.7}
.arm{stroke-opacity:calc(var(--thread-alpha)*1.1);stroke-width:7}
.ta .thread,.ta .arm{stroke:url(#abyssus-trail-a)}.tb .thread,.tb .arm{stroke:url(#abyssus-trail-b)}
.beat{transform-box:fill-box;transform-origin:50% 100%;animation:beat 9s ease-in-out infinite}
.p1{animation-delay:-2.2s}.p2{animation-delay:-4.6s}.p3{animation-delay:-6.9s}
.sway{transform-box:fill-box;transform-origin:50% 0;animation:sway 12s ease-in-out infinite}
.w1{animation-duration:15s;animation-delay:-5s}.w2{animation-duration:17s;animation-delay:-11s}
.drift{animation:drift 30s ease-in-out infinite}
.f1{animation-duration:36s;animation-delay:-9s}.f2{animation-duration:41s;animation-delay:-22s}.f3{animation-duration:33s;animation-delay:-16s}
.speck{fill:var(--speck);opacity:var(--speck-alpha);animation:rise 50s linear infinite}
.speck.faint{opacity:var(--faint-alpha)}.mote{fill:url(#abyssus-mote);opacity:.55}
${TIMING}
@keyframes rise{0%{transform:translate(0,580px)}50%{transform:translate(16px,0)}100%{transform:translate(0,-580px)}}
@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-60px)}}
@keyframes beat{0%,100%{transform:scale(1,1)}35%{transform:scale(1.06,.9)}65%{transform:scale(.97,1.04)}}
@keyframes sway{0%,100%{transform:skewX(3deg)}50%{transform:skewX(-3deg)}}
@keyframes glow{0%,100%{opacity:var(--halo-alpha)}35%{opacity:calc(var(--halo-alpha)*.7)}}
@keyframes shimmer{0%,100%{opacity:var(--ray-alpha)}50%{opacity:calc(var(--ray-alpha)*.55)}}
.surface{fill:none;stroke:var(--ray);stroke-linecap:round;opacity:var(--surface-alpha);animation:lap 18s ease-in-out infinite}.v1{animation-duration:23s;animation-delay:-8s}.v2{animation-duration:29s;animation-delay:-17s}
@keyframes lap{0%,100%{transform:translateX(-24px)}50%{transform:translateX(24px)}}
.still .surface,.still .ray,.still .halo,.still .beat,.still .sway,.still .drift,.still .speck{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.surface,.ray,.halo,.beat,.sway,.drift,.speck{animation:none}}
`.replace(/\n/g, '')

const radial = (id: string, stops: [number, string, number][], extra = '') =>
  `<radialGradient id="abyssus-${id}"${extra}>${stops.map(([at, cls, alpha]) => `<stop offset="${at}" class="${cls}" stop-opacity="${alpha}"/>`).join('')}</radialGradient>`

const hues = (['a', 'b'] as const)
  .map(
    h =>
      radial(`halo-${h}`, [[0, `c${h}`, 0.7], [0.3, `c${h}`, 0.38], [0.65, `c${h}`, 0.1], [1, `c${h}`, 0]]) +
      radial(`bell-${h}`, [[0, `c${h}`, 0.15], [0.6, `c${h}`, 0.4], [0.88, `c${h}`, 0.85], [1, `c${h}`, 0.6]], ' cx=".5" cy=".95" r=".85"') +
      radial(`core-${h}`, [[0, 'cc', 0.8], [0.5, `c${h}`, 0.45], [1, `c${h}`, 0]]) +
      `<linearGradient id="abyssus-trail-${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="c${h}" stop-opacity="1"/><stop offset=".55" class="c${h}" stop-opacity=".6"/><stop offset="1" class="c${h}" stop-opacity="0"/></linearGradient>`,
  )
  .join('')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  `<linearGradient id="abyssus-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wt"/><stop offset=".45" class="wm"/><stop offset="1" class="wd"/></linearGradient>` +
  `<linearGradient id="abyssus-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ry" stop-opacity=".9"/><stop offset=".45" class="ry" stop-opacity=".3"/><stop offset="1" class="ry" stop-opacity="0"/></linearGradient>` +
  radial('top', [[0, 'gl', 1], [0.6, 'gl', 0.35], [1, 'gl', 0]]) +
  radial('corner', [[0, 'sh', 1], [0.6, 'sh', 0.4], [1, 'sh', 0]]) +
  radial('haze-a', [[0, 'ha', 1], [0.5, 'ha', 0.45], [1, 'ha', 0]]) +
  radial('haze-b', [[0, 'hb', 1], [0.5, 'hb', 0.45], [1, 'hb', 0]]) +
  radial('mote', [[0, 'mo', 0.7], [0.6, 'mo', 0.3], [1, 'mo', 0]]) +
  hues +
  `</defs>` +
  `<rect width="1600" height="1000" fill="url(#abyssus-water)"/>` +
  `<ellipse class="glow" cx="800" cy="-80" rx="950" ry="380" fill="url(#abyssus-top)"/>` +
  `<g>${SURFACE}</g><g>${RAYS}</g>` +
  `<g class="shade"><ellipse cx="0" cy="1000" rx="560" ry="380" fill="url(#abyssus-corner)"/><ellipse cx="1600" cy="1000" rx="600" ry="360" fill="url(#abyssus-corner)"/></g>` +
  `<g class="haze"><ellipse cx="120" cy="330" rx="330" ry="420" fill="url(#abyssus-haze-a)"/><ellipse cx="1480" cy="620" rx="360" ry="440" fill="url(#abyssus-haze-b)"/></g>` +
  `<g>${SPECKS}</g>` +
  `<g>${JELLIES}</g>` +
  `<g>${MOTES}</g>` +
  `</svg>`
