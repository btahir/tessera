// Terra: a 1970s print poster. One SVG for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so night is earthy ink on a
// brown charcoal page and day is the same ink on a cream paperback page.
//
// Two opposite corners, top left and bottom right, each hold a flat quarter sun
// ringed by thick bands of brick, plum, teal and moss. Each band starts off the
// edge of the frame and ends inside it with a rounded cap, the outer ones a
// little sooner, so the set sweeps like a record sleeve. Faint echo rings and a
// light paper speckle carry the print out toward the middle, which stays plain.
//
// While Claude works each band sways a few degrees around its corner, a little
// out of step with the next. Every motion is a rotation.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(1974)
const round = (n: number) => Math.round(n * 10) / 10

// A point at radius r and angle a (degrees), in a corner's own space.
const at = (r: number, a: number) => {
  const t = (a * Math.PI) / 180

  return `${round(r * Math.cos(t))} ${round(r * Math.sin(t))}`
}

// A circular arc from angle a to b.
const arc = (r: number, a: number, b: number) => `M${at(r, a)}A${r} ${r} 0 0 1 ${at(r, b)}`

// The bands of one corner: radius, width, the angle the rounded end sits at,
// and which ink. Angle 0 runs along one edge of the frame, 90 along the other.
const BANDS: [number, number, number, string][] = [
  [148, 48, 82, 'b1'],
  [210, 48, 74, 'b2'],
  [272, 48, 66, 'b3'],
  [334, 48, 58, 'b4'],
]

// One corner: the sun, the swaying bands, then faint echo rings further out.
const corner = (cls: string, transform: string, phase: number) =>
  `<g class="${cls}" transform="${transform}">` +
  `<path class="echo" d="${[430, 520, 620].map(r => arc(r, -5, 95)).join('')}"/>` +
  BANDS.map(
    ([r, w, end, ink], i) =>
      `<path class="band ${ink} w${w} s${i} ${phase ? 'late' : ''}" d="${arc(r, -14, end)}"/>`,
  ).join('') +
  `<circle class="sun" r="110"/>` +
  `</g>`

// Paper speckle: ink flecks and bare spots spread over the whole sheet.
const speckle = (count: number) => {
  let d = ''
  for (let i = 0; i < count; i += 1) {
    const x = round(random() * 1600)
    const y = round(random() * 1000)
    const r = round(0.8 + random() * 1.6)
    d += `M${x} ${y}m-${r} 0a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 -${r * 2} 0`
  }

  return d
}

const FLECKS = speckle(420)
const PITS = speckle(320)

const STYLE = `
svg{--page:#f3e8d1;--sun:#d4a03c;--b1:#bf5a40;--b2:#946080;--b3:#5b8d94;--b4:#87924c;--echo:#e8dbbe;--fleck:#d8c7a6;--pit:#f8f0de}
@media (prefers-color-scheme:dark){svg{--page:#2b2620;--sun:#94712f;--b1:#9b4b38;--b2:#77506a;--b3:#46737a;--b4:#6b773b;--echo:#342d25;--fleck:#3b332a;--pit:#251f1a}}
.page{fill:var(--page)}
.sun{fill:var(--sun)}
.band{fill:none;stroke-width:48;stroke-linecap:round;transform-box:view-box;transform-origin:0 0;animation:sway 16s ease-in-out infinite alternate}
.b1{stroke:var(--b1)}.b2{stroke:var(--b2)}.b3{stroke:var(--b3)}.b4{stroke:var(--b4)}
.s0{animation-delay:-2s}.s1{animation-delay:-3.4s}.s2{animation-delay:-4.8s}.s3{animation-delay:-6.2s}
.late.s0{animation-delay:-10s}.late.s1{animation-delay:-11.4s}.late.s2{animation-delay:-12.8s}.late.s3{animation-delay:-14.2s}
.echo{fill:none;stroke:var(--echo);stroke-width:16}
.fleck{fill:var(--fleck)}.pit{fill:var(--pit)}
@keyframes sway{0%{transform:rotate(-4deg)}100%{transform:rotate(4deg)}}
.still .band{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.band{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<rect class="page" width="1600" height="1000"/>` +
  corner('c-tl', 'scale(1.08)', 0) +
  corner('c-br', 'translate(1600 1000) rotate(180) scale(1.15)', 1) +
  `<path class="fleck" d="${FLECKS}"/>` +
  `<path class="pit" d="${PITS}"/>` +
  `</svg>`
