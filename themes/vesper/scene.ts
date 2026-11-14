// The last light of evening over a wide plain. One SVG, drawn for both modes:
// the colors are CSS variables that a prefers-color-scheme rule swaps, so day
// is an early peach and rose dusk and night is a plum sky with an afterglow.
//
// The composition leans on the two lower corners. On the left a low ridge sits
// in a magenta afterglow. On the right a banded sun is half set behind the
// horizon in an amber glow. A grid of thin lines runs across the plain toward
// the horizon, fading out before the middle, where the words sit.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(19)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// The frame is 1600 by 1000. The horizon and the point the plain runs to.
const HORIZON = 690
const VANISH = 800
const DEPTH = 1000 - HORIZON

// The plain: lines that run from the horizon toward the viewer. Static.
const RAYS = Array.from({ length: 31 }, (_, i) => {
  const k = i - 15
  const at = (y: number) => round(VANISH + (k * 150 * (y - HORIZON)) / DEPTH)

  return `<line class="ray" x1="${at(HORIZON + 6)}" y1="${HORIZON + 6}" x2="${at(1260)}" y2="1260"/>`
}).join('')

// The plain: lines across it that glide toward the viewer. Each one travels the
// same path, so starting them a tenth of the cycle apart spaces them in depth.
const ROW_COUNT = 10
const ROW_CYCLE = 30
const ROWS = Array.from(
  { length: ROW_COUNT },
  (_, i) =>
    `<g class="row w${i}"><line class="haze" x1="-60" y1="${HORIZON}" x2="1660" y2="${HORIZON}"/><line class="edge" x1="-60" y1="${HORIZON}" x2="1660" y2="${HORIZON}"/></g>`,
).join('')

// Distance falls evenly with time, so the line drops as one over distance:
// slow near the horizon, quicker as it nears. It thickens as it comes closer.
const GLIDE = Array.from({ length: 21 }, (_, i) => {
  const t = i / 20
  const distance = 11 - 10 * t
  const drop = round(DEPTH / distance)
  const scale = round(0.4 + 1.3 / distance)
  const fade = t < 0.12 ? round(t / 0.12) : 1

  return `${Math.round(t * 100)}%{transform:translateY(${drop}px) scaleY(${scale});opacity:${fade}}`
}).join('')

const ROW_DELAYS = Array.from(
  { length: ROW_COUNT },
  (_, i) => `.w${i}{animation-delay:-${round((i * ROW_CYCLE) / ROW_COUNT)}s}`,
).join('')

// The sun, half set, low on the right. Bands of cloud drift down across it.
const SUN = { x: 1400, r: 165 }
const BAND_COUNT = 5
const BAND_CYCLE = 20
const BANDS = Array.from(
  { length: BAND_COUNT },
  (_, i) => `<rect class="band n${i}" x="${SUN.x - SUN.r - 4}" y="${HORIZON - 6}" width="${SUN.r * 2 + 8}" height="12"/>`,
).join('')
const BAND_DELAYS = Array.from(
  { length: BAND_COUNT },
  (_, i) => `.n${i}{animation-delay:-${round((i * BAND_CYCLE) / BAND_COUNT)}s}`,
).join('')

// A ridge line as a filled path, from x0 to x1, peaking near the given point.
const ridge = (x0: number, x1: number, peakX: number, height: number, roughness: number) => {
  const points: string[] = []
  for (let x = x0; x <= x1; x += 20) {
    const side = x < peakX ? (x - x0) / (peakX - x0) : (x1 - x) / (x1 - peakX)
    const shape = Math.sin((Math.max(0, Math.min(1, side)) * Math.PI) / 2)
    const wobble = (Math.sin(x / 47 + roughness) + Math.sin(x / 19 + roughness * 2) * 0.5) * 7 * shape
    points.push(`${x},${round(HORIZON + 2 - height * shape - wobble)}`)
  }

  return `M${x0},${HORIZON + 4}L${points.join('L')}L${x1},${HORIZON + 4}Z`
}

// Long thin clouds lit from below, out at the sides of the sky.
const CLOUDS = [
  { x: 170, y: 560, rx: 300, ry: 16, d: 0 },
  { x: 90, y: 612, rx: 230, ry: 11, d: 1 },
  { x: 250, y: 640, rx: 170, ry: 8, d: 2 },
  { x: 1430, y: 440, rx: 280, ry: 14, d: 3 },
  { x: 1520, y: 488, rx: 210, ry: 10, d: 1 },
  { x: 1340, y: 512, rx: 150, ry: 8, d: 2 },
]
  .map(
    cloud =>
      `<ellipse class="cloud c${cloud.d}" cx="${cloud.x}" cy="${cloud.y}" rx="${cloud.rx}" ry="${cloud.ry}" fill="url(#vesper-cloud)"/>`,
  )
  .join('')

// The first stars, high in the two upper corners. Night only.
const STARS = Array.from({ length: 34 }, (_, i) => {
  const left = i % 2 === 0
  const x = round(left ? between(20, 390) : between(1210, 1580))
  const y = round(between(24, 400))
  const r = round(between(0.9, 2.1))
  const twinkle = i % 5 === 0 ? ` t t${i % 3}` : ''

  return `<circle class="star${twinkle}" cx="${x}" cy="${y}" r="${r}"/>`
}).join('')

const STYLE = `
svg{--sky0:#efe0ec;--sky1:#f5e4eb;--sky2:#f9d9cf;--ground0:#f3d6d8;--ground1:#eed9e3;--glow-m:#e27aa6;--glow-a:#f2a26e;--glow-alpha:.85;--sun0:#f9c784;--sun1:#ec8c86;--sun-alpha:.9;--band:#f8dcd6;--band-alpha:.9;--line:#a65a7e;--line-alpha:.7;--hill1:#e9c0cf;--hill2:#dba8bd;--cloud:#f6b39f;--cloud-alpha:.8;--star:#ffffff;--star-alpha:0;--haze-alpha:.3;--rim:#f2a0bd;--rim-alpha:.8}
@media (prefers-color-scheme:dark){svg{--sky0:#1e1420;--sky1:#2a1c28;--sky2:#3c2136;--ground0:#2b1826;--ground1:#1c111b;--glow-m:#b23f78;--glow-a:#c27a47;--glow-alpha:.7;--sun0:#d08c58;--sun1:#a6476a;--sun-alpha:.85;--band:#3b1f33;--band-alpha:.6;--line:#cf5f99;--line-alpha:.6;--hill1:#36202f;--hill2:#231420;--cloud:#a14c76;--cloud-alpha:.55;--star:#f5e0ec;--star-alpha:.7;--haze-alpha:.32;--rim:#c8558a;--rim-alpha:.7}}
.k0{stop-color:var(--sky0)}.k1{stop-color:var(--sky1)}.k2{stop-color:var(--sky2)}
.g0{stop-color:var(--ground0)}.g1{stop-color:var(--ground1)}
.gm{stop-color:var(--glow-m)}.ga{stop-color:var(--glow-a)}
.s0{stop-color:var(--sun0)}.s1{stop-color:var(--sun1)}
.ln{stop-color:var(--line)}.cl{stop-color:var(--cloud)}
.glow{opacity:var(--glow-alpha)}
.halo{opacity:var(--glow-alpha);animation:breathe 14s ease-in-out infinite;animation-delay:-5s}
.sun{opacity:var(--sun-alpha)}
.hill1{fill:var(--hill1)}.rm{stop-color:var(--rim)}.rim{fill:none;stroke:url(#vesper-rim);stroke-width:2;stroke-opacity:var(--rim-alpha)}.hill2{fill:var(--hill2)}
.ray{stroke:url(#vesper-fade);stroke-width:2.4}
.grid{opacity:var(--line-alpha)}.edge{stroke:url(#vesper-fade);stroke-width:2.4}.haze{stroke:url(#vesper-fade);stroke-width:18;stroke-opacity:var(--haze-alpha)}
.row{transform-box:view-box;transform-origin:0 ${HORIZON}px;animation:glide ${ROW_CYCLE}s linear infinite}
${ROW_DELAYS}
.band{fill:var(--band);fill-opacity:var(--band-alpha);transform-box:view-box;transform-origin:0 ${HORIZON}px;animation:sink ${BAND_CYCLE}s linear infinite}
${BAND_DELAYS}
.cloud{opacity:var(--cloud-alpha);animation:drift 46s ease-in-out infinite alternate}
.c1{animation-duration:58s;animation-delay:-20s}.c2{animation-duration:70s;animation-delay:-41s}.c3{animation-duration:52s;animation-delay:-13s}
.star{fill:var(--star);opacity:var(--star-alpha)}
.t{animation:twinkle 7s ease-in-out infinite}.t1{animation-duration:9s;animation-delay:-3s}.t2{animation-duration:11s;animation-delay:-6s}
@keyframes glide{${GLIDE}}
@keyframes sink{0%{transform:translateY(-160px) scaleY(.12);opacity:0}12%{opacity:1}100%{transform:translateY(0) scaleY(1.1);opacity:1}}
@keyframes drift{from{transform:translateX(-30px)}to{transform:translateX(30px)}}
@keyframes breathe{0%,100%{opacity:var(--glow-alpha)}50%{opacity:calc(var(--glow-alpha)*.8)}}
@keyframes twinkle{0%,100%{opacity:var(--star-alpha)}50%{opacity:calc(var(--star-alpha)*.35)}}
.still .row,.still .band,.still .cloud,.still .halo,.still .t{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.row,.band,.cloud,.halo,.t{animation:none}}
`.replace(/\n/g, '')

const radial = (id: string, stop: string, cx = 0.5, cy = 0.5) =>
  `<radialGradient id="vesper-${id}" cx="${cx}" cy="${cy}" r=".5"><stop offset="0" class="${stop}" stop-opacity=".9"/><stop offset=".3" class="${stop}" stop-opacity=".5"/><stop offset=".62" class="${stop}" stop-opacity=".14"/><stop offset="1" class="${stop}" stop-opacity="0"/></radialGradient>`

const DEFS =
  `<defs>` +
  `<linearGradient id="vesper-sky" x1="0" y1="0" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse"><stop offset="0" class="k0"/><stop offset=".62" class="k1"/><stop offset="1" class="k2"/></linearGradient>` +
  `<linearGradient id="vesper-ground" x1="0" y1="${HORIZON}" x2="0" y2="1000" gradientUnits="userSpaceOnUse"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></linearGradient>` +
  `<linearGradient id="vesper-mist" x1="0" y1="${HORIZON}" x2="0" y2="${HORIZON + 140}" gradientUnits="userSpaceOnUse"><stop offset="0" class="g0" stop-opacity="1"/><stop offset=".5" class="g0" stop-opacity=".45"/><stop offset="1" class="g0" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="vesper-fade" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" class="ln" stop-opacity="1"/><stop offset=".12" class="ln" stop-opacity=".85"/><stop offset=".3" class="ln" stop-opacity="0"/><stop offset=".7" class="ln" stop-opacity="0"/><stop offset=".88" class="ln" stop-opacity=".85"/><stop offset="1" class="ln" stop-opacity="1"/></linearGradient>` +
  `<linearGradient id="vesper-rim" x1="0" y1="0" x2="420" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" class="rm" stop-opacity="1"/><stop offset=".55" class="rm" stop-opacity=".7"/><stop offset="1" class="rm" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="vesper-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0"/><stop offset="1" class="s1"/></linearGradient>` +
  `<radialGradient id="vesper-cloud"><stop offset="0" class="cl" stop-opacity=".9"/><stop offset=".6" class="cl" stop-opacity=".4"/><stop offset="1" class="cl" stop-opacity="0"/></radialGradient>` +
  radial('glow-m', 'gm') +
  radial('glow-a', 'ga') +
  radial('halo', 'ga') +
  `<clipPath id="vesper-sun-clip"><path d="M${SUN.x - SUN.r},${HORIZON}A${SUN.r},${SUN.r} 0 0 1 ${SUN.x + SUN.r},${HORIZON}Z"/></clipPath>` +
  `<clipPath id="vesper-plain"><rect x="0" y="${HORIZON}" width="1600" height="${DEPTH}"/></clipPath>` +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  // Sky, then the afterglow low in each corner.
  `<rect width="1600" height="${HORIZON + 2}" fill="url(#vesper-sky)"/>` +
  `<g>${STARS}</g>` +
  `<ellipse class="glow" cx="-140" cy="${HORIZON}" rx="740" ry="430" fill="url(#vesper-glow-m)"/>` +
  `<ellipse class="glow" cx="1720" cy="${HORIZON}" rx="680" ry="430" fill="url(#vesper-glow-a)"/>` +
  `<ellipse class="halo" cx="${SUN.x + 40}" cy="${HORIZON - 10}" rx="300" ry="260" fill="url(#vesper-halo)"/>` +
  `<g>${CLOUDS}</g>` +
  // The sun, half set, with its bands.
  `<g clip-path="url(#vesper-sun-clip)"><rect class="sun" x="${SUN.x - SUN.r}" y="${HORIZON - SUN.r}" width="${SUN.r * 2}" height="${SUN.r}" fill="url(#vesper-sun)"/>${BANDS}</g>` +
  // Far ridges.
  `<path class="hill1" d="${ridge(-20, 560, 120, 92, 1.3)}"/>` +
  `<path class="rim" d="${ridge(-20, 560, 120, 92, 1.3)}"/>` +
  `<path class="hill2" d="${ridge(-20, 330, 40, 58, 4.1)}"/>` +
  `<path class="hill1" d="${ridge(1470, 1620, 1600, 40, 2.7)}"/>` +
  // The plain and its grid, with a mist where it meets the sky.
  `<rect y="${HORIZON}" width="1600" height="${DEPTH}" fill="url(#vesper-ground)"/>` +
  `<ellipse class="glow" cx="-80" cy="${HORIZON + 60}" rx="720" ry="300" fill="url(#vesper-glow-m)"/>` +
  `<ellipse class="glow" cx="${SUN.x + 100}" cy="${HORIZON + 60}" rx="460" ry="260" fill="url(#vesper-glow-a)"/>` +
  `<g class="grid" clip-path="url(#vesper-plain)">${RAYS}${ROWS}</g>` +
  `<rect y="${HORIZON}" width="1600" height="140" fill="url(#vesper-mist)"/>` +
  `</svg>`
