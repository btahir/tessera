// Sol: a sundial drawn as fine line geometry. One SVG for both modes: the colors
// are CSS variables that a prefers-color-scheme rule swaps, so day is teal and
// bronze lines on cream and night is the same drawing on deep teal.
//
// The dial's center sits in the top right corner. Rings, hour lines and a tick
// scale fan out from it into the frame, and a long thin shadow lies across them.
// A small answering set of rings sits in the bottom left corner. Lines only.
// Everything that crosses the middle of the frame is drawn faint.
//
// While Claude works the shadow turns about the corner very slowly, crossing the
// hour marks, and a dashed ring in the small dial drifts. Both are transforms.

const round = (n: number) => Math.round(n * 10) / 10

// A point at radius r and angle a (degrees, clockwise from +x, y down).
const at = (r: number, a: number) => {
  const t = (a * Math.PI) / 180

  return `${round(r * Math.cos(t))} ${round(r * Math.sin(t))}`
}

const arc = (r: number, a: number, b: number) => `M${at(r, a)}A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${at(r, b)}`

// Radial strokes from r1 to r2, every `step` degrees from a to b, inclusive.
const radials = (r1: number, r2: number, a: number, b: number, step: number, skip = 0) => {
  let d = ''
  for (let i = 0, angle = a; angle <= b + 0.001; i += 1, angle = a + i * step) {
    if (skip > 0 && i % skip === 0) continue
    d += `M${at(r1, angle)}L${at(r2, angle)}`
  }

  return d
}

// The large dial, center at the corner. Angles 90 (straight down) to 180 (left).
const A = 90
const B = 180
const HOUR = 7.5

const dial =
  // Far rings and long hour lines reach toward the middle, so they are faint.
  `<path class="faint" d="${arc(560, A, B)}${arc(700, A, B)}${radials(430, 690, A + HOUR, B - HOUR, HOUR * 2)}"/>` +
  `<path class="faint dash" d="${arc(630, A, B)}"/>` +
  // Near rings: the dial face.
  `<path class="line" d="${arc(120, A, B)}${arc(270, A, B)}${arc(300, A, B)}${arc(392, A, B)}"/>` +
  `<path class="thin" d="${arc(132, A, B)}${arc(286, A, B)}${arc(380, A, B)}"/>` +
  // Hour lines from the inner ring to the scale, and a fine tick scale between the twin rings.
  `<path class="thin" d="${radials(132, 270, A + HOUR, B - HOUR, HOUR)}"/>` +
  `<path class="line" d="${radials(270, 312, A, B, HOUR)}"/>` +
  `<path class="thin" d="${radials(286, 300, A, B, HOUR / 5, 5)}"/>` +
  // Quarter marks on the outer ring.
  `<path class="line" d="${radials(340, 392, A, B, 22.5)}"/>` +
  `<path class="thin" d="${radials(380, 392, A, B, HOUR / 2, 2)}"/>` +
  // The gnomon's foot.
  `<path class="line" d="${arc(26, A, B)}${arc(54, A, B)}"/>`

// The shadow: a long thin line set along angle 0, turned into place by CSS.
// Its stroke fades along its length, so it is faint where it crosses the middle.
const shadow =
  `<g class="shadow">` +
  `<path class="cast" d="M30 0H700"/>` +
  `<path class="edge" d="M60 4L380 11"/>` +
  `<path class="tip" d="M286 -7V7M370 -9V9"/>` +
  `</g>`

// The small dial in the bottom left, center at the corner, opening up and right.
const C = 270
const D = 360
const small =
  `<path class="line" d="${arc(80, C, D)}${arc(170, C, D)}${arc(188, C, D)}${arc(250, C, D)}"/>` +
  `<path class="thin" d="${radials(188, 206, C, D, 6)}${radials(92, 170, C + 15, D - 15, 15)}${arc(92, C, D)}"/>` +
  `<path class="faint" d="${arc(330, C, D)}${radials(250, 330, C + 22.5, D - 22.5, 22.5)}"/>` +
  `<circle class="drift dash" r="219"/>`

const STYLE = `
svg{--page:#f3ebd5;--warm:#f8f2df;--line:#88a3a3;--thin:#a9bab4;--faint:#ddd7c2;--cast:#9d7a3c;--edge:#c9b58b;--sun:#fbe3a6}
@media (prefers-color-scheme:dark){svg{--page:#0c333c;--warm:#123a42;--line:#4f7a7b;--thin:#36605f;--faint:#1b4249;--cast:#c4a25a;--edge:#5c6a52;--sun:#3e6458}}
.pg{stop-color:var(--page)}.wm{stop-color:var(--warm)}.cs{stop-color:var(--cast)}.sn{stop-color:var(--sun)}
.line,.thin,.faint,.cast,.edge,.tip,.drift{fill:none;stroke-linecap:round}
.line{stroke:var(--line);stroke-width:1.8}
.thin{stroke:var(--thin);stroke-width:1.2}
.faint{stroke:var(--faint);stroke-width:1.4}
.low{opacity:.6}.dash{stroke-dasharray:2 12}
.drift{stroke:var(--thin);stroke-width:1.4;stroke-dasharray:3 9}
.cast{stroke:url(#sol-cast);stroke-width:2.8}
.edge{stroke:var(--edge);stroke-width:1.1;opacity:.7}
.tip{stroke:var(--cast);stroke-width:1.6}
.shadow{transform-box:view-box;transform-origin:0 0;animation:sweep 140s ease-in-out infinite alternate;animation-delay:-52s}
.drift{transform-box:view-box;transform-origin:0 0;animation:drift 200s linear infinite;animation-delay:-40s}
@keyframes sweep{0%{transform:rotate(100deg)}100%{transform:rotate(170deg)}}
@keyframes drift{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.still .shadow,.still .drift{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.shadow,.drift{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  `<radialGradient id="sol-light" cx="1600" cy="0" r="1100" gradientUnits="userSpaceOnUse"><stop offset="0" class="wm"/><stop offset="1" class="pg"/></radialGradient>` +
  `<linearGradient id="sol-cast" x1="30" y1="0" x2="700" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" class="cs"/><stop offset=".5" class="cs" stop-opacity=".9"/><stop offset=".56" class="cs" stop-opacity=".2"/><stop offset="1" class="cs" stop-opacity="0"/></linearGradient>` +
  `<radialGradient id="sol-sun"><stop offset="0" class="sn" stop-opacity=".75"/><stop offset=".45" class="sn" stop-opacity=".3"/><stop offset="1" class="sn" stop-opacity="0"/></radialGradient></defs>` +
  `<rect width="1600" height="1000" fill="url(#sol-light)"/><circle cx="1600" cy="0" r="560" fill="url(#sol-sun)"/><circle cx="0" cy="1000" r="340" fill="url(#sol-sun)" class="low"/>` +
  `<g transform="translate(1600 0)">${dial}${shadow}</g>` +
  `<g transform="translate(0 1000)">${small}</g>` +
  `</svg>`
