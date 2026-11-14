// The desert at midday. One SVG, drawn for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so noon is warm sand under a
// large pale sun and night is the same desert, cool, under a moon.
//
// The words sit in the middle, so the middle holds only open sky and the palest
// far dune. The sun keeps to the upper right, the dunes to the two lower corners.
// Each dune has a lit face and a shadow face split at a sharp crest; the shadow
// faces drift a little and heat lines waver above the crests while Claude works.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(12)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// Each dune: its body, the line that splits shadow from light below its crest,
// and which band of color it takes. Far dunes are pale, near ones deep.
type Dune = { id: string; band: string; body: string; split: string; drift: number }

const DUNES: Dune[] = [
  // The far ridge across the whole width, barely darker than the page.
  {
    id: 'ridge',
    band: 'r',
    body: 'M0,770 C260,738 520,782 800,796 C1060,806 1330,742 1600,724 L1600,1000 L0,1000 Z',
    split: 'M-200,0 L0,0 L0,1000 L-200,1000 Z',
    drift: 0,
  },
  // Left corner, three dunes stepping toward the viewer.
  {
    id: 'lf',
    band: 'f',
    body: 'M0,690 C70,650 130,612 210,596 C400,612 620,724 940,1000 L0,1000 Z',
    split: 'M-200,300 L210,300 L210,596 C250,652 336,700 372,772 C408,844 392,930 366,1000 L-200,1000 Z',
    drift: 1,
  },
  {
    id: 'lm',
    band: 'm',
    body: 'M0,812 C70,772 150,738 252,722 C430,736 610,846 780,1000 L0,1000 Z',
    split: 'M-200,400 L252,400 L252,722 C290,768 374,812 404,872 C432,930 428,968 420,1000 L-200,1000 Z',
    drift: 2,
  },
  {
    id: 'ln',
    band: 'n',
    body: 'M0,918 C44,892 90,872 146,864 C250,872 360,926 450,1000 L0,1000 Z',
    split: 'M-200,600 L146,600 L146,864 C172,896 226,928 246,1000 L-200,1000 Z',
    drift: 3,
  },
  // Right corner, the tallest dune rising toward the sun.
  {
    id: 'rf',
    band: 'f',
    body: 'M930,1000 C1040,820 1140,676 1250,598 C1360,566 1480,566 1600,586 L1600,1000 Z',
    split: 'M800,300 L1250,300 L1250,598 C1282,650 1356,696 1386,766 C1416,836 1400,928 1380,1000 L800,1000 Z',
    drift: 2,
  },
  {
    id: 'rm',
    band: 'm',
    body: 'M1090,1000 C1170,884 1250,792 1352,738 C1440,712 1530,710 1600,720 L1600,1000 Z',
    split: 'M900,400 L1352,400 L1352,738 C1382,778 1448,818 1468,878 C1488,936 1480,972 1472,1000 L900,1000 Z',
    drift: 1,
  },
  {
    id: 'rn',
    band: 'n',
    body: 'M1250,1000 C1314,932 1384,884 1468,860 C1524,848 1566,850 1600,856 L1600,1000 Z',
    split: 'M1100,600 L1468,600 L1468,860 C1492,892 1540,928 1552,1000 L1100,1000 Z',
    drift: 3,
  },
]

const clips = DUNES.map(d => `<clipPath id="meridies-${d.id}"><path d="${d.body}"/></clipPath>`).join('')

// Wind ripples on the lit faces of the near dunes: soft wide strokes, static.
const ripples = (x0: number, x1: number, y0: number, y1: number, count: number, tilt: number) =>
  Array.from({ length: count }, (_, i) => {
    const y = round(y0 + ((y1 - y0) * (i + 0.5)) / count + between(-8, 8))
    const x = round(between(x0, x0 + (x1 - x0) * 0.3))
    const w = round(between((x1 - x0) * 0.4, (x1 - x0) * 0.7))
    const bend = round(between(6, 14))

    return `<path class="ripple" d="M${x},${y} q${round(w / 2)},${round(tilt * w - bend)} ${w},${round(tilt * w * 2)}"/>`
  }).join('')

const RIPPLES: Record<string, string> = {
  lm: ripples(440, 640, 880, 970, 3, 0.1),
  ln: ripples(270, 400, 940, 995, 2, 0.12),
  rm: ripples(1490, 1600, 760, 940, 4, -0.02),
  rn: ripples(1560, 1600, 900, 990, 2, -0.02),
  rf: ripples(1400, 1600, 610, 700, 3, -0.01),
}

const dunes = DUNES.map(
  d =>
    `<g clip-path="url(#meridies-${d.id})"><path class="lit ${d.band}" d="${d.body}"/>` +
    `<path class="shade ${d.band}${d.drift ? ` drift k${d.drift}` : ''}" d="${d.split}"/>` +
    `${RIPPLES[d.id] ?? ''}</g>`,
).join('')

// Heat shimmer: thin wavy lines just above the crests, at the edges only.
const wave = (length: number) => {
  const step = 26
  let d = `M0,0 q${step / 2},-2.4 ${step},0`
  for (let x = step; x < length; x += step) d += ` t${step},0`

  return d
}

const BANDS = [
  { x0: 0, x1: 300, y0: 520, y1: 590 },
  { x0: 20, x1: 330, y0: 660, y1: 720 },
  { x0: 1230, x1: 1580, y0: 470, y1: 570 },
  { x0: 1320, x1: 1600, y0: 640, y1: 700 },
]

const SHIMMER = BANDS.flatMap(band =>
  Array.from({ length: 4 }, () => {
    const length = round(between(130, 260))
    const x = round(between(band.x0, band.x1 - length * 0.6))
    const y = round(between(band.y0, band.y1))
    const speed = Math.floor(between(0, 3))
    const delay = Math.floor(between(0, 6))

    return `<g transform="translate(${x} ${y})"><path class="shim v${speed} d${delay}" d="${wave(length)}"/></g>`
  }),
).join('')

// Stars for the night, kept to the upper corners.
const STARS = Array.from({ length: 24 }, (_, i) => {
  const left = i % 2 === 0
  const x = round(left ? between(10, 380) : between(1220, 1590))
  const y = round(between(14, left ? 520 : 440))
  const r = round(between(1.4, 3))
  const delay = Math.floor(between(0, 6))

  return `<circle class="star t${i % 3} d${delay}" cx="${x}" cy="${y}" r="${r}"/>`
}).join('')

// A thin crescent moon for the night, drawn as one path (two arcs) so it stays
// crisp at any size. The bright limb faces the lower left.
const crescent = (cx: number, cy: number, r: number, dx: number, dy: number, inner: number) => {
  const d = Math.hypot(dx, dy)
  const a = (r * r - inner * inner + d * d) / (2 * d)
  const h = Math.sqrt(r * r - a * a)
  const [ux, uy] = [dx / d, dy / d]
  const p1 = [cx + a * ux - h * uy, cy + a * uy + h * ux].map(round)
  const p2 = [cx + a * ux + h * uy, cy + a * uy - h * ux].map(round)

  return `M${p1[0]},${p1[1]} A${r},${r} 0 1 1 ${p2[0]},${p2[1]} A${inner},${inner} 0 1 0 ${p1[0]},${p1[1]} Z`
}

const STYLE = `
svg{--sky-top:#f4d7bd;--sky-mid:#f8e3d3;--sky-low:#fae9dc;--glow:#f1c299;--glow-a:.75;--sun:#fffaf3;--sun-a:1;--ring:#fff6ea;--ring-a:.3;--shine:#f6e2cf;--moon-a:0;--star:#eef2f8;--star-a:0;--haze:#fdf1e6;--haze-a:.7;--r:#f6dfcd;--r-sh:#f3d8c4;--f:#f2d2b9;--f-sh:#ebc2a4;--m:#e9bc99;--m-sh:#dea582;--n:#dc885b;--n-sh:#d07450;--ripple:#ffe9d6;--ripple-a:.3;--shim:#d98f63;--shim-a:.6}
@media (prefers-color-scheme:dark){svg{--sky-top:#10142a;--sky-mid:#1c1b24;--sky-low:#28201a;--glow:#2c3246;--glow-a:.7;--sun:#bcc6d4;--sun-a:0;--ring:#7d8aa3;--ring-a:.07;--shine:#283042;--moon-a:1;--star:#dfe6f2;--star-a:.8;--haze:#3a3a48;--haze-a:.35;--r:#2a2222;--r-sh:#251e1e;--f:#363a4b;--f-sh:#201d25;--m:#3f4457;--m-sh:#1a171e;--n:#454a5e;--n-sh:#131116;--ripple:#5f667e;--ripple-a:.4;--shim:#8fa0bf;--shim-a:.45}}
.top{stop-color:var(--sky-top)}.mid{stop-color:var(--sky-mid)}.low{stop-color:var(--sky-low)}
.gw{stop-color:var(--glow)}.hz{stop-color:var(--haze)}
.glow{opacity:var(--glow-a);transform-box:fill-box;transform-origin:center;animation:breathe 16s ease-in-out infinite alternate}
.sun{fill:var(--sun);opacity:var(--sun-a)}
.moon{fill:var(--sun);opacity:var(--moon-a)}.shine{fill:var(--shine);opacity:var(--moon-a)}

.ring{fill:none;stroke:var(--ring);stroke-width:22;opacity:var(--ring-a);transform-box:fill-box;transform-origin:center;animation:breathe 12s ease-in-out infinite alternate}
.ring.o{stroke-width:34;opacity:calc(var(--ring-a)*.6);animation-duration:17s;animation-delay:-6s}
.haze{opacity:var(--haze-a);animation:haze 14s ease-in-out infinite alternate}
.lit.r{fill:var(--r)}.shade.r{fill:var(--r-sh)}
.lit.f{fill:var(--f)}.shade.f{fill:var(--f-sh)}
.lit.m{fill:var(--m)}.shade.m{fill:var(--m-sh)}
.lit.n{fill:var(--n)}.shade.n{fill:var(--n-sh)}
.ripple{fill:none;stroke:var(--ripple);stroke-opacity:var(--ripple-a);stroke-width:3.5;stroke-linecap:round}
.drift{animation:drift 26s ease-in-out infinite alternate}
.k1{animation-duration:30s;animation-delay:-9s}.k2{animation-duration:24s;animation-delay:-15s}.k3{animation-duration:20s;animation-delay:-4s}
.sh{stop-color:var(--shim)}.vl{stop-color:var(--sky-low)}
.shim{fill:none;stroke:url(#meridies-shim);stroke-opacity:var(--shim-a);stroke-width:2.2;stroke-linecap:round;opacity:0;animation:waver 7s ease-in-out infinite}
.v1{animation-duration:8.5s}.v2{animation-duration:10s}
.d1{animation-delay:-1.2s}.d2{animation-delay:-2.5s}.d3{animation-delay:-3.7s}.d4{animation-delay:-4.9s}.d5{animation-delay:-6.1s}
.star{fill:var(--star);opacity:var(--star-a);animation:twinkle 6s ease-in-out infinite}
.t1{animation-duration:8s}.t2{animation-duration:11s}
@keyframes breathe{from{transform:scale(1)}to{transform:scale(1.06)}}
@keyframes haze{from{opacity:var(--haze-a)}to{opacity:calc(var(--haze-a)*.5)}}
@keyframes drift{from{transform:translateX(-14px)}to{transform:translateX(22px)}}
@keyframes waver{0%{opacity:0;transform:translateX(-18px)}50%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(18px)}}
@keyframes twinkle{0%,100%{opacity:var(--star-a)}50%{opacity:calc(var(--star-a)*.45)}}
.still .glow,.still .ring,.still .haze,.still .drift,.still .shim,.still .star{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.glow,.ring,.haze,.drift,.shim,.star{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs><linearGradient id="meridies-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset=".45" class="mid"/><stop offset=".8" class="low"/></linearGradient>` +
  `<radialGradient id="meridies-glow"><stop offset="0" class="gw" stop-opacity="1"/><stop offset=".45" class="gw" stop-opacity=".45"/><stop offset="1" class="gw" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="meridies-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hz" stop-opacity="0"/><stop offset=".5" class="hz" stop-opacity="1"/><stop offset="1" class="hz" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="meridies-shim"><stop offset="0" class="sh" stop-opacity="0"/><stop offset=".5" class="sh"/><stop offset="1" class="sh" stop-opacity="0"/></linearGradient>` +
  `<radialGradient id="meridies-veil" gradientUnits="userSpaceOnUse" cx="800" cy="860" r="560" gradientTransform="translate(800 860) scale(1 .78) translate(-800 -860)"><stop offset="0" class="vl" stop-opacity=".88"/><stop offset=".45" class="vl" stop-opacity=".78"/><stop offset=".75" class="vl" stop-opacity=".3"/><stop offset="1" class="vl" stop-opacity="0"/></radialGradient>` +
  `${clips}</defs>` +
  `<rect width="1600" height="1000" fill="url(#meridies-sky)"/>` +
  `<g>${STARS}</g>` +
  `<circle class="glow" cx="1330" cy="220" r="520" fill="url(#meridies-glow)"/>` +
  `<circle class="ring o" cx="1330" cy="220" r="200"/><circle class="ring" cx="1330" cy="220" r="150"/>` +
  `<circle class="sun" cx="1330" cy="220" r="112"/>` +
  `<circle class="shine" cx="1330" cy="220" r="50"/><path class="moon" d="${crescent(1330, 220, 50, 5, -5, 48)}"/>` +
  `<rect class="haze" y="520" width="1600" height="260" fill="url(#meridies-haze)"/>` +
  `${dunes}<rect width="1600" height="1000" fill="url(#meridies-veil)"/><g>${SHIMMER}</g>` +
  `</svg>`
