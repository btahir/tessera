// A clear night sky. One SVG, drawn for both modes: the colors are CSS variables
// that a prefers-color-scheme rule swaps, so night is a violet indigo sky full of
// stars and day is the pale hour before sunrise with a thin moon.
//
// The words sit in the middle of the frame, so the middle holds only the sky.
// Stars gather toward the corners and edges, and the hills keep to the bottom
// corners, low enough to stay clear of the message box.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(5)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number) => Math.min(1, Math.max(0, n))

// The center half of the frame, where the words sit.
const isCenter = (x: number, y: number) => x > 380 && x < 1220 && y < 870

// A ridge rises from nothing near the middle to its full height at the edge.
// `reach` is how far from the middle it starts, `height` how tall it is at the edge.
type Ridge = { reach: number; height: number; waves: [number, number, number][] }

const ridgeY = (ridge: Ridge, x: number) => {
  const side = clamp((Math.abs(x - 800) - ridge.reach) / (800 - ridge.reach))
  const lift = side ** 1.3 * ridge.height
  const wobble = ridge.waves.reduce((sum, [size, length, phase]) => sum + size * Math.sin(x / length + phase), 0)

  return 1000 - lift - wobble * side
}

const ridgePath = (ridge: Ridge) => {
  const points: string[] = []
  for (let x = -20; x <= 1620; x += 16) points.push(`${x} ${round(Math.min(1010, ridgeY(ridge, x)))}`)

  return `M-20 1010L${points.join('L')}L1620 1010Z`
}

const FAR: Ridge = { reach: 260, height: 330, waves: [[22, 70, 1], [12, 31, 2.4]] }
const MID: Ridge = { reach: 340, height: 250, waves: [[18, 55, 0.3], [9, 23, 4]] }
const NEAR: Ridge = { reach: 420, height: 170, waves: [[14, 48, 5], [7, 19, 1.7]] }

// Small pines on the near ridge, in the two bottom corners only.
const PINES = [40, 78, 104, 150, 196, 232, 1372, 1414, 1446, 1490, 1534, 1566]
  .map(x => {
    const base = ridgeY(NEAR, x) + 6
    const tall = round(between(26, 54))
    const wide = round(tall * 0.32)

    return `<path class="pine" d="M${x} ${round(base - tall)}L${round(x + wide)} ${round(base)}L${round(x - wide)} ${round(base)}Z"/>`
  })
  .join('')

// Stars: many at the corners and edges, a few faint ones toward the middle.
// Stars marked "dawn" stay in light mode; the rest fade with the night.
type Star = { x: number; y: number; r: number; tone: number; twinkle: boolean; dawn: boolean; faint: boolean }
const stars: Star[] = []

while (stars.length < 230) {
  const x = between(0, 1600)
  const y = between(0, 900)
  const side = Math.abs(x - 800) / 800
  const top = 1 - y / 900
  const weight = side ** 1.8 + 0.25 * top ** 4
  if (random() > weight) continue
  if (y > ridgeY(FAR, x) - 8) continue

  const faint = isCenter(x, y)
  stars.push({
    x: round(x),
    y: round(y),
    r: round(faint ? between(0.7, 1.1) : between(0.8, 2)),
    tone: Math.floor(between(0, 3)),
    twinkle: false,
    dawn: !faint && y < 420 && random() < 0.22,
    faint,
  })
}

// Pick about thirty of the outer stars to brighten and dim while Claude works.
let twinkling = 0
for (const star of stars) {
  if (twinkling < 30 && !star.faint && star.r > 1.1 && random() < 0.35) {
    star.twinkle = true
    twinkling += 1
  }
}

const starMark = (star: Star) => {
  const motion = star.twinkle ? ` tw t${Math.floor(between(0, 6))} d${Math.floor(between(0, 8))}` : ''
  const level = star.faint ? ' faint' : star.r < 1.2 ? ' dim' : ''

  return `<circle class="star c${star.tone}${level}${motion}" cx="${star.x}" cy="${star.y}" r="${star.r}"/>`
}

// Fine dust along the band of the galaxy in the top left corner. Night only.
const DUST = Array.from({ length: 90 }, () => {
  const t = between(-560, 560)
  const spread = (random() + random() + random() - 1.5) * 70
  const x = round(260 + 0.788 * t + 0.616 * spread)
  const y = round(260 - 0.616 * t + 0.788 * spread)

  return { x, y }
})
  .filter(({ x, y }) => x > 0 && y > 0 && x < 370 && y < ridgeY(FAR, x) - 20)
  .map(({ x, y }) => `<circle class="star c2" cx="${x}" cy="${y}" r="${round(between(0.5, 1))}"/>`)
  .join('')

const NIGHT_STARS = stars.filter(star => !star.dawn).map(starMark).join('')
const DAWN_STARS = stars.filter(star => star.dawn).map(starMark).join('')

// A few bright stars with a soft halo, placed by hand at the corners.
const BRIGHT = [
  { x: 132, y: 118, r: 34 },
  { x: 318, y: 58, r: 24 },
  { x: 62, y: 388, r: 26 },
  { x: 236, y: 286, r: 20 },
  { x: 1468, y: 92, r: 30 },
  { x: 1268, y: 214, r: 22 },
  { x: 1548, y: 336, r: 26 },
  { x: 1410, y: 470, r: 18 },
]
  .map(
    (star, i) =>
      `<g class="bright b${i % 4}"><circle cx="${star.x}" cy="${star.y}" r="${round(star.r * 2)}" fill="url(#nox-halo)"/>` +
      `<circle class="core" cx="${star.x}" cy="${star.y}" r="${round(star.r / 12 + 0.6)}"/></g>`,
  )
  .join('')

// A meteor: a head and a tail that fades behind it. It waits at its start point,
// crosses a short stretch of sky and fades, then waits again.
const meteor = (x: number, y: number, side: 'l' | 'r', run: string) => {
  const dx = side === 'l' ? 1 : -1

  return (
    `<g transform="translate(${x} ${y})"><g class="meteor ${run}">` +
    `<line class="trail" x1="0" y1="0" x2="${120 * dx}" y2="-60" stroke="url(#nox-trail-${side})"/>` +
    `<circle class="head" r="1.8"/></g></g>`
  )
}

const STYLE = `
svg{--top:#cbc1e7;--mid:#e8e3f7;--low:#f2e8f0;--corner:#b9ade0;--corner-a:.8;--band:#b7abe0;--band-a:0;--glow-l:#f7c8c0;--glow-r:#f6d4bd;--glow-a:1;--hill-far:#d8cfea;--hill-mid:#c4b9de;--hill-near:#ab9fcb;--star:#ffffff;--warm:#fff4e2;--cool:#f4f6ff;--night:0;--halo-a:.5;--moon:#fffaf0;--moon-a:1;--meteor-a:.8;--faint-a:.3;--dust-a:0}
@media (prefers-color-scheme:dark){svg{--top:#161529;--mid:#1f1e34;--low:#2b2447;--corner:#110f22;--corner-a:.85;--band:#8576c6;--band-a:.3;--glow-l:#6b4794;--glow-r:#3f5292;--glow-a:.8;--hill-far:#2a2445;--hill-mid:#1b1832;--hill-near:#0f0d1c;--star:#ebe7ff;--warm:#ffe6c8;--cool:#d2ddff;--night:1;--halo-a:.75;--moon:#fffaf0;--moon-a:0;--meteor-a:1;--faint-a:.15;--dust-a:.55}}
.s-top{stop-color:var(--top)}.s-mid{stop-color:var(--mid)}.s-low{stop-color:var(--low)}
.s-corner{stop-color:var(--corner)}.s-band{stop-color:var(--band)}.s-glow-l{stop-color:var(--glow-l)}.s-glow-r{stop-color:var(--glow-r)}
.s-star{stop-color:var(--star)}.s-moon{stop-color:var(--moon)}
.corners{opacity:var(--corner-a)}.band{opacity:var(--band-a)}.glow{opacity:var(--glow-a)}
.hill-far{fill:var(--hill-far)}.hill-mid{fill:var(--hill-mid)}.hill-near,.pine{fill:var(--hill-near)}
.night{opacity:var(--night)}
.star{fill:var(--star)}.c1{fill:var(--warm)}.c2{fill:var(--cool)}
.dim{opacity:.6}.dust{opacity:var(--dust-a)}.faint{opacity:var(--faint-a)}
.tw{animation:twinkle 6s ease-in-out infinite}
.t0{animation-duration:4.5s}.t1{animation-duration:5.5s}.t2{animation-duration:6.5s}.t3{animation-duration:7.5s}.t4{animation-duration:8.5s}.t5{animation-duration:10s}
.d0{animation-delay:-.7s}.d1{animation-delay:-1.6s}.d2{animation-delay:-2.4s}.d3{animation-delay:-3.3s}.d4{animation-delay:-4.1s}.d5{animation-delay:-5.2s}.d6{animation-delay:-6.4s}.d7{animation-delay:-7.9s}
.bright{opacity:var(--halo-a);animation:glimmer 9s ease-in-out infinite}
.b1{animation-duration:11s;animation-delay:-4s}.b2{animation-duration:13s;animation-delay:-7s}.b3{animation-duration:8s;animation-delay:-2s}
.core{fill:var(--star)}
.moon{opacity:var(--moon-a)}.moon-disc{fill:var(--moon)}.ghost{opacity:.14}
.meteor{opacity:0;animation:fall-l 19s linear infinite}
.m-r{animation-name:fall-r;animation-duration:27s;animation-delay:-15s}.m-l{animation-delay:-6s}
.meteors{opacity:var(--meteor-a)}
.trail{stroke-width:2;stroke-linecap:round}.head{fill:var(--star)}
.s-trail{stop-color:var(--star)}
@keyframes twinkle{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes glimmer{0%,100%{opacity:var(--halo-a)}50%{opacity:calc(var(--halo-a)*.55)}}
@keyframes fall-l{0%{transform:translate(0,0);opacity:0}2%{opacity:1}11%{opacity:.8}14%{transform:translate(-220px,110px);opacity:0}100%{transform:translate(-220px,110px);opacity:0}}
@keyframes fall-r{0%{transform:translate(0,0);opacity:0}2%{opacity:1}8%{opacity:.8}10%{transform:translate(220px,110px);opacity:0}100%{transform:translate(220px,110px);opacity:0}}
.still .tw,.still .bright,.still .meteor{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.tw,.bright,.meteor{animation:none}}
`.replace(/\n/g, '')

const radial = (id: string, stop: string, inner: number) =>
  `<radialGradient id="nox-${id}"><stop offset="0" class="${stop}" stop-opacity="${inner}"/><stop offset=".5" class="${stop}" stop-opacity="${round(inner * 0.4)}"/><stop offset="1" class="${stop}" stop-opacity="0"/></radialGradient>`

const trail = (side: 'l' | 'r') =>
  `<linearGradient id="nox-trail-${side}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${side === 'l' ? 120 : -120}" y2="-60"><stop offset="0" class="s-trail" stop-opacity=".95"/><stop offset="1" class="s-trail" stop-opacity="0"/></linearGradient>`

const DEFS =
  `<defs>` +
  `<linearGradient id="nox-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s-top"/><stop offset=".45" class="s-mid"/><stop offset="1" class="s-low"/></linearGradient>` +
  radial('corner', 's-corner', 1) +
  radial('band', 's-band', 1) +
  radial('glow-l', 's-glow-l', 1) +
  radial('glow-r', 's-glow-r', 1) +
  `<radialGradient id="nox-halo"><stop offset="0" class="s-star" stop-opacity=".7"/><stop offset=".12" class="s-star" stop-opacity=".32"/><stop offset=".4" class="s-star" stop-opacity=".09"/><stop offset="1" class="s-star" stop-opacity="0"/></radialGradient>` +
  radial('moonlight', 's-moon', 0.75) +
  trail('l') +
  trail('r') +
  `<mask id="nox-crescent"><rect width="1600" height="1000" fill="#fff"/><circle cx="1352" cy="176" r="40" fill="#000"/></mask>` +
  `</defs>`

const SKY =
  `<rect width="1600" height="1000" fill="url(#nox-sky)"/>` +
  `<g class="corners"><ellipse cx="0" cy="0" rx="620" ry="460" fill="url(#nox-corner)"/><ellipse cx="1600" cy="0" rx="620" ry="460" fill="url(#nox-corner)"/></g>` +
  `<g class="band"><ellipse cx="260" cy="260" rx="560" ry="110" transform="rotate(-38 260 260)" fill="url(#nox-band)"/>` +
  `<ellipse cx="200" cy="300" rx="420" ry="60" transform="rotate(-38 200 300)" fill="url(#nox-band)"/></g>` +
  `<g class="glow"><ellipse cx="80" cy="900" rx="560" ry="300" fill="url(#nox-glow-l)"/><ellipse cx="1540" cy="900" rx="560" ry="300" fill="url(#nox-glow-r)"/></g>`

const MOON =
  `<g class="moon"><circle cx="1336" cy="186" r="210" fill="url(#nox-moonlight)"/>` +
  `<circle class="moon-disc ghost" cx="1336" cy="186" r="38"/><circle class="moon-disc" cx="1336" cy="186" r="38" mask="url(#nox-crescent)"/></g>`

// A low valley floor joins the two corners, well under the message box.
const FLOOR = (() => {
  const points: string[] = []
  for (let x = -20; x <= 1620; x += 20) points.push(`${x} ${round(978 + 7 * Math.sin(x / 110 + 1) + 4 * Math.sin(x / 37))}`)

  return `M-20 1010L${points.join('L')}L1620 1010Z`
})()

const HILLS =
  `<path class="hill-far" d="${ridgePath(FAR)}"/>` +
  `<path class="hill-mid" d="${ridgePath(MID)}"/>` +
  `<path class="hill-mid" d="${FLOOR}"/>` +
  `<path class="hill-near" d="${ridgePath(NEAR)}"/>` +
  PINES

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  SKY +
  MOON +
  `<g class="night"><g class="dust">${DUST}</g>${NIGHT_STARS}</g><g>${DAWN_STARS}</g><g>${BRIGHT}</g>` +
  `<g class="meteors">${meteor(262, 78, 'l', 'm-l')}${meteor(1322, 70, 'r', 'm-r')}</g>` +
  HILLS +
  `</svg>`
