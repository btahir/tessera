// Cut paper confetti on a flat page. One SVG for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so by night the pieces are
// candy bright on warm olive dark and by day they are deeper inks on warm white.
//
// Small hard-edged shapes (dots, short bars, quarter rings, triangles and
// squiggles) gather in the four corners and thin out toward the middle, which
// stays a plain page. Each piece sits on its own flat paper shadow. While Claude
// works every piece bobs and turns a little, each on its own slow rhythm.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(23)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

const COLORS = ['pk', 'li', 'ta', 'cy', 'vi']
const KINDS = ['dot', 'bar', 'ring', 'tri', 'squig']

// One shape centered on 0,0 at size s, drawn with the given class.
const shape = (kind: string, s: number, cls: string) => {
  switch (kind) {
    case 'dot':
      return `<circle class="${cls}" r="${round(9 * s)}"/>`
    case 'bar':
      return `<rect class="${cls}" x="${round(-20 * s)}" y="${round(-5.5 * s)}" width="${round(40 * s)}" height="${round(11 * s)}" rx="${round(2 * s)}"/>`
    case 'ring': {
      const o = 22 * s
      const i = 12 * s
      return `<path class="${cls}" d="M${round(-o / 2)} ${round(o / 2)}V${round(-o / 2)}A${round(o)} ${round(o)} 0 0 1 ${round(o / 2)} ${round(o / 2)}H${round(o / 2 - (o - i))}A${round(i)} ${round(i)} 0 0 0 ${round(-o / 2)} ${round(-o / 2 + (o - i))}Z"/>`
    }
    case 'tri':
      return `<path class="${cls}" d="M0 ${round(-14 * s)}L${round(13 * s)} ${round(9 * s)}H${round(-13 * s)}Z"/>`
    default: {
      const w = 11 * s
      const h = 8 * s
      return `<path class="${cls} sq" d="M${round(-2 * w)} 0q${round(w / 2)} ${round(-h)} ${round(w)} 0t${round(w)} 0t${round(w)} 0t${round(w)} 0"/>`
    }
  }
}

// Scatter pieces from each corner. Distance from the corner is weighted toward
// the corner, pieces shrink as they reach inward, and nothing lands in the
// middle band where the conversation sits.
type Piece = { x: number; y: number; s: number; kind: string; color: string; turn: number; moves: boolean }
const pieces: Piece[] = []
const CORNERS: [number, number, number, number][] = [
  [0, 0, 1, 1],
  [1600, 0, -1, 1],
  [0, 1000, 1, -1],
  [1600, 1000, -1, -1],
]

for (const [cx, cy, sx, sy] of CORNERS) {
  const here: (Piece & { d: number })[] = []
  let tries = 0
  while (here.length < 17 && tries < 6000) {
    tries += 1
    const d = 24 + 580 * random() ** 1.9
    const a = between(0, Math.PI / 2)
    const x = cx + sx * d * Math.cos(a)
    const y = cy + sy * d * Math.sin(a)
    if (x > 360 && x < 1240) continue
    if (y < 18 || y > 982 || x < 18 || x > 1582) continue
    // The middle of each side stays sparse, so the pieces read as four clusters.
    if (Math.min(y, 1000 - y) > 290 && random() < 0.85) continue
    const s = 1.6 - 0.85 * Math.min(1, d / 580)
    if ([...pieces, ...here].some(p => Math.hypot(p.x - x, p.y - y) < 42 * Math.max(p.s, s))) continue
    here.push({
      x: round(x),
      y: round(y),
      s,
      d,
      kind: KINDS[(here.length + pieces.length * 3) % KINDS.length]!,
      color: COLORS[Math.floor(random() * COLORS.length)]!,
      turn: Math.round(between(-90, 90)),
      moves: false,
    })
  }
  // The ten nearest the corner move; the rest stay put.
  here.sort((a, b) => a.d - b.d).forEach((p, i) => pieces.push({ ...p, moves: i < 10 }))
}

// Tiny still flecks, farther in, so the scatter thins to nothing.
const FLECKS = Array.from({ length: 30 }, () => {
  const left = random() < 0.5
  const x = left ? between(140, 370) : between(1230, 1460)
  const y = between(40, 960)
  const nearRow = Math.min(y, 1000 - y) < 260
  if (!nearRow && random() < 0.6) return ''
  const c = COLORS[Math.floor(random() * COLORS.length)]!

  return `<circle class="${c} fleck" cx="${round(x)}" cy="${round(y)}" r="${round(between(2.5, 4.5))}"/>`
}).join('')

// Each moving piece goes on one of three paths, at one of five speeds, from one of
// eight starting points, so no two keep step.
const PIECES = pieces
  .map((p, i) => {
    const path = `f${i % 3}`
    const speed = `t${(i * 7) % 5}`
    const start = `d${(i * 5) % 8}`

    return (
      `<g transform="translate(${p.x} ${p.y}) rotate(${p.turn})">` +
      `<g class="${p.moves ? `piece ${path} ${speed} ${start}` : 'held'}">` +
      `<g transform="translate(3 4)">${shape(p.kind, p.s, 'shade')}</g>` +
      shape(p.kind, p.s, p.color) +
      `</g></g>`
    )
  })
  .join('')

const SPEEDS = [9, 11, 13, 16, 19]
const STYLE = `
svg{--page:#f3f0e7;--shade:#e2ddce;--pk:#d6317f;--li:#5b9416;--ta:#e06a00;--cy:#0f8fb8;--vi:#8458d0;--piece-a:.9;--fleck-a:.7}
@media (prefers-color-scheme:dark){svg{--page:#24231a;--shade:#17160f;--pk:#f85da5;--li:#98dc38;--ta:#ff971e;--cy:#40d1f7;--vi:#b48df4;--piece-a:.92;--fleck-a:.6}}
.page{fill:var(--page)}
.shade{fill:var(--shade)}.shade.sq{fill:none;stroke:var(--shade)}
.pk{fill:var(--pk)}.li{fill:var(--li)}.ta{fill:var(--ta)}.cy{fill:var(--cy)}.vi{fill:var(--vi)}
.sq{fill:none;stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.sq.pk{stroke:var(--pk)}.sq.li{stroke:var(--li)}.sq.ta{stroke:var(--ta)}.sq.cy{stroke:var(--cy)}.sq.vi{stroke:var(--vi)}
.piece{opacity:var(--piece-a);transform-box:fill-box;transform-origin:center;animation:f0 12s ease-in-out infinite}
.fleck{opacity:var(--fleck-a)}.held{opacity:var(--piece-a)}
.f1{animation-name:f1}.f2{animation-name:f2;animation-timing-function:linear}
${SPEEDS.map((s, i) => `.t${i}{animation-duration:${s}s}.f2.t${i}{animation-duration:${s * 2.5}s}`).join('')}
${Array.from({ length: 8 }, (_, i) => `.d${i}{animation-delay:-${round(i * 2.37)}s}`).join('')}
@keyframes f0{0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(0,-9px) rotate(16deg)}}
@keyframes f1{0%,100%{transform:translate(0,0) rotate(0deg)}33%{transform:translate(5px,-7px) rotate(-12deg)}66%{transform:translate(-4px,5px) rotate(9deg)}}
@keyframes f2{0%{transform:translate(0,0) rotate(0deg)}25%{transform:translate(0,-6px) rotate(90deg)}50%{transform:translate(0,0) rotate(180deg)}75%{transform:translate(0,6px) rotate(270deg)}100%{transform:translate(0,0) rotate(360deg)}}
.still .piece{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.piece{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<rect class="page" width="1600" height="1000"/>` +
  `<g>${FLECKS}</g>` +
  `<g>${PIECES}</g>` +
  `</svg>`
