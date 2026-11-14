// A hearth at night. One SVG, drawn for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so night is warm charcoal
// lit from below and day is ash and cream with a faint ember tint.
//
// The fire sits in the two bottom corners: a glowing bed, a charred log, a
// heap of coals, with their light climbing the walls. Sparks and
// smoke rise along the outer edges. The middle of the frame holds only the
// room's soft gradient.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(17)
const between = (low: number, high: number) => low + random() * (high - low)
const pick = (n: number) => Math.floor(between(0, n))
const round = (n: number) => Math.round(n)

type Point = readonly [number, number]

// Mirror a left-corner x into the right corner.
const side = (x: number, right: boolean) => (right ? 1600 - x : x)

// A closed smooth outline through the points, drawn with midpoint curves.
const smooth = (points: Point[]) => {
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const start = mid(points[points.length - 1]!, points[0]!)
  let d = `M${round(start[0])} ${round(start[1])}`
  points.forEach((p, i) => {
    const m = mid(p, points[(i + 1) % points.length]!)
    d += `Q${round(p[0])} ${round(p[1])} ${round(m[0])} ${round(m[1])}`
  })

  return `${d}Z`
}

// A rounded, lumpy outline around an ellipse: one coal.
const blob = (cx: number, cy: number, rx: number, ry: number) =>
  smooth(
    Array.from({ length: 7 }, (_, i) => {
      const angle = (i / 7) * Math.PI * 2 + between(-0.25, 0.25)
      const r = between(0.78, 1.18)

      return [cx + Math.cos(angle) * rx * r, cy + Math.sin(angle) * ry * r] as const
    }),
  )

// The height of the heap of coals: highest against the wall, sloping into the room.
const heap = (x: number) => 995 - 210 * Math.pow(Math.max(0, 1 - (x + 40) / 580), 1.3)

// The glowing bed under the coals, the same shape as the heap.
const bed = (right: boolean) => {
  const points: Point[] = [[side(-60, right), 1060]]
  for (let x = -60; x <= 540; x += 30) points.push([side(x, right), heap(x) + 6 + between(-6, 6)])
  points.push([side(560, right), 1060])

  return `<path class="bed" d="${smooth(points)}" fill="url(#ignis-bed)"/>`
}

// The coals, packed in rows from the back of the heap to the front, with the
// log laid on before the front rows. The gaps
// between them show the bed glowing through. A few of them breathe.
const coals = (right: boolean, wood: string) => {
  const list: { x: number; y: number; rx: number; ry: number }[] = []
  for (let row = 780; row <= 1040; row += 22) {
    let x = -50 + between(0, 30)
    while (x < 560) {
      const rx = (random() < 0.15 ? between(38, 52) : between(18, 34)) * (1.2 - Math.max(0, x) / 900)
      if (heap(x) < row - 8) list.push({ x: x + between(-6, 6), y: row + between(-7, 7), rx, ry: rx * between(0.58, 0.78) })
      x += rx * between(1.5, 1.9)
    }
  }
  let pulses = 0
  let placed = false

  return list
    .map(({ x, y, rx, ry }, i) => {
      const d = blob(side(x, right), y, rx, ry)
      const pulse = i % 9 === 4 && pulses < 4 ? ` pulse q${pulses++ % 4}` : ''
      const before = !placed && y > 965 ? ((placed = true), wood) : ''

      const seam =
        rx > 26
          ? `<path class="seam" d="M${round(side(x - rx * 0.6, right))} ${round(y + ry * 0.2)}Q${round(side(x + rx * between(-0.2, 0.2), right))} ${round(y + ry * 0.95)} ${round(side(x + rx * 0.55, right))} ${round(y + ry * 0.25)}"/>`
          : ''

      const heat = pulse || i % 3 === 0 ? `<path class="heat h${pick(3)}${pulse}" d="${d}"/>` : ''

      return `${before}<path class="coal" d="${d}"/>${seam}${heat}`
    })
    .join('')
}

// A charred log lying into the fire, with ember cracks along its underside.
const log = (right: boolean, length: number, thick: number, angle: number, ox: number, oy: number) => {
  const top: Point[] = []
  const bottom: Point[] = []
  for (let x = 0; x <= length; x += length / 8) {
    top.push([x, -thick / 2 + between(-3, 3)])
    bottom.unshift([x, thick / 2 + between(-3, 3)])
  }
  const outline: Point[] = [[-thick * 0.35, 0], ...top, [length + thick * 0.4, 0], ...bottom]
  const cracks = Array.from({ length: 6 }, () => {
    const x = round(between(length * 0.15, length * 0.9))

    return `<ellipse class="crack c${pick(2)}" cx="${x}" cy="${round(thick * between(0.12, 0.3))}" rx="${round(between(3, 6))}" ry="${round(thick * between(0.18, 0.32))}" transform="rotate(${round(between(-25, 25))} ${x} 0)"/>`
  }).join('')
  const flip = right ? ` scale(-1 1)` : ''

  return `<g transform="translate(${side(ox, right)} ${oy})${flip} rotate(${angle})"><path class="wood" d="${smooth(outline)}" fill="url(#ignis-wood)"/>${cracks}</g>`
}

// Sparks: a hot core inside a soft halo, rising along the outer edges.
const SPARKS = Array.from({ length: 26 }, (_, i) => {
  const right = i % 2 === 1
  const x = round(side(between(10, 320), right))
  const y = round(between(800, 930))
  const r = round(between(1.8, 3.6))

  return `<g class="spark k${pick(3)} v${pick(4)} d${pick(8)}"><circle cx="${x}" cy="${y}" r="${round(r * 7)}" fill="url(#ignis-halo)"/><circle class="core" cx="${x}" cy="${y}" r="${r}"/></g>`
}).join('')

// A few large sparks out of focus, near the viewer, drifting slowly higher up.
const NEAR = [
  { x: 50, y: 560, r: 70 },
  { x: 250, y: 720, r: 42 },
  { x: 130, y: 360, r: 36 },
  { x: 1555, y: 520, r: 74 },
  { x: 1360, y: 730, r: 44 },
  { x: 1480, y: 320, r: 34 },
]
  .map(({ x, y, r }, i) => `<circle class="near n${i % 3} d${pick(8)}" cx="${x}" cy="${y}" r="${r}" fill="url(#ignis-halo)"/>`)
  .join('')

// Smoke and heat rising up the walls: big soft shapes that drift and fade.
const SMOKE = Array.from({ length: 6 }, (_, i) => {
  const right = i % 2 === 1
  const x = round(side(between(60, 240), right))
  const y = round(between(600, 740))

  return `<ellipse class="smoke m${i % 3} d${pick(8)}" cx="${x}" cy="${y}" rx="${round(between(100, 150))}" ry="${round(between(210, 270))}" fill="url(#ignis-smoke)"/>`
}).join('')

const STYLE = `
svg{--top:#e8dfd5;--mid:#efe6dc;--bottom:#f2e5d7;--shade:#d6c8ba;--shade-a:.5;--wash:#f0b487;--wash-a:.4;--e1:#f2a477;--e2:#f6bc8a;--e3:#fcdcb2;--glow-a:.7;--bed1:#f5c49a;--bed2:#ef9d6c;--coal-top:#d9cdc0;--coal-low:#bba897;--coal-base:#eba277;--coal-a:.9;--heat:#f09a62;--heat-a:.35;--wood:#b09684;--wood-lit:#e89c6e;--crack:#ef8a50;--crack-a:.55;--spark:#dd7436;--halo:#f09a5e;--spark-a:.75;--near-a:.35;--smoke:#cdbfb1;--smoke-a:.22}
@media (prefers-color-scheme:dark){svg{--top:#1f1814;--mid:#28201b;--bottom:#2c221c;--shade:#140f0c;--shade-a:.55;--wash:#93401a;--wash-a:.42;--e1:#842e12;--e2:#cf5f1f;--e3:#f59a4a;--glow-a:.6;--bed1:#f08a3a;--bed2:#9e3b18;--coal-top:#43352d;--coal-low:#17100d;--coal-base:#5e2410;--coal-a:1;--heat:#ff7a2c;--heat-a:.5;--wood:#1c1411;--wood-lit:#8f3a17;--crack:#ff8a36;--crack-a:.85;--spark:#ffc47e;--halo:#ff8a3a;--spark-a:.95;--near-a:.5;--smoke:#5a4a40;--smoke-a:.2}}
.top{stop-color:var(--top)}.mid{stop-color:var(--mid)}.bottom{stop-color:var(--bottom)}
.sh{stop-color:var(--shade)}.wa{stop-color:var(--wash)}
.g1{stop-color:var(--e1)}.g2{stop-color:var(--e2)}.g3{stop-color:var(--e3)}
.b1{stop-color:var(--bed1)}.b2{stop-color:var(--bed2)}
.ct{stop-color:var(--coal-top)}.cl{stop-color:var(--coal-low)}.cb{stop-color:var(--coal-base)}
.ht{stop-color:var(--heat)}.sp{stop-color:var(--halo)}.sm{stop-color:var(--smoke)}
.wd{stop-color:var(--wood)}.wl{stop-color:var(--wood-lit)}
.shade{opacity:var(--shade-a)}
.wash{opacity:var(--wash-a);transform-box:fill-box;transform-origin:50% 100%;animation:breathe 13s ease-in-out infinite}
.glow{opacity:var(--glow-a);transform-box:fill-box;transform-origin:50% 100%;animation:breathe 9s ease-in-out infinite}
.glow.b{animation-duration:11s;animation-delay:-4s}.wash.b{animation-duration:15s;animation-delay:-6s}
.coal{fill:url(#ignis-coal);fill-opacity:var(--coal-a)}
.heat{fill:url(#ignis-heat);opacity:var(--heat-a)}.h1{opacity:calc(var(--heat-a)*.6)}.h2{opacity:calc(var(--heat-a)*.3)}
.pulse{animation:ember 8s ease-in-out infinite}
.q1{animation-duration:10s;animation-delay:-3s}.q2{animation-duration:12s;animation-delay:-7s}.q3{animation-duration:9s;animation-delay:-5s}
.seam{fill:none;stroke:var(--crack);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;opacity:calc(var(--crack-a)*.8)}
.crack{fill:var(--crack);opacity:var(--crack-a)}.c1{opacity:calc(var(--crack-a)*.55)}
.core{fill:var(--spark)}
.spark{opacity:0;animation:rise-a 9s linear infinite}
.k1{animation-name:rise-b}.k2{animation-name:rise-c}
.v1{animation-duration:11s}.v2{animation-duration:13s}.v3{animation-duration:7.5s}
.near{opacity:var(--near-a);animation:drift 22s ease-in-out infinite}
.n1{animation-duration:28s}.n2{animation-duration:34s}
.smoke{opacity:0;animation:smoke 24s ease-in-out infinite}
.m1{animation-duration:30s}.m2{animation-duration:36s}
.d1{animation-delay:-1.1s}.d2{animation-delay:-2.3s}.d3{animation-delay:-3.6s}.d4{animation-delay:-4.8s}.d5{animation-delay:-6.1s}.d6{animation-delay:-7.4s}.d7{animation-delay:-8.6s}
.near.d1,.smoke.d1{animation-delay:-4s}.near.d2,.smoke.d2{animation-delay:-8s}.near.d3,.smoke.d3{animation-delay:-12s}.near.d4,.smoke.d4{animation-delay:-16s}.near.d5,.smoke.d5{animation-delay:-20s}.near.d6,.smoke.d6{animation-delay:-25s}.near.d7,.smoke.d7{animation-delay:-30s}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes ember{0%,100%{opacity:var(--heat-a)}50%{opacity:calc(var(--heat-a)*.3)}}
@keyframes rise-a{0%{transform:translate(0,0);opacity:0}8%{opacity:var(--spark-a)}45%{transform:translate(22px,-280px)}70%{opacity:calc(var(--spark-a)*.6)}100%{transform:translate(-8px,-620px);opacity:0}}
@keyframes rise-b{0%{transform:translate(0,0);opacity:0}10%{opacity:var(--spark-a)}50%{transform:translate(-26px,-300px)}75%{opacity:calc(var(--spark-a)*.5)}100%{transform:translate(14px,-560px);opacity:0}}
@keyframes rise-c{0%{transform:translate(0,0);opacity:0}6%{opacity:var(--spark-a)}35%{transform:translate(12px,-230px)}65%{transform:translate(-18px,-450px);opacity:calc(var(--spark-a)*.7)}100%{transform:translate(4px,-700px);opacity:0}}
@keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-60px)}}
@keyframes smoke{0%{transform:translate(0,120px);opacity:0}30%{opacity:var(--smoke-a)}100%{transform:translate(20px,-360px);opacity:0}}
.still .wash,.still .glow,.still .pulse,.still .spark,.still .near,.still .smoke{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.wash,.glow,.pulse,.spark,.near,.smoke{animation:none}.spark{opacity:var(--spark-a)}.smoke{opacity:var(--smoke-a)}}
`.replace(/\n/g, '')

const DEFS =
  `<linearGradient id="ignis-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset=".55" class="mid"/><stop offset="1" class="bottom"/></linearGradient>` +
  `<radialGradient id="ignis-shade"><stop offset="0" class="sh" stop-opacity="1"/><stop offset="1" class="sh" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="ignis-wash"><stop offset="0" class="wa" stop-opacity="1"/><stop offset=".45" class="wa" stop-opacity=".45"/><stop offset="1" class="wa" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="ignis-glow"><stop offset="0" class="g3" stop-opacity="1"/><stop offset=".22" class="g2" stop-opacity=".8"/><stop offset=".55" class="g1" stop-opacity=".45"/><stop offset="1" class="g1" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="ignis-bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="b2"/><stop offset=".6" class="b1"/></linearGradient>` +
  `<linearGradient id="ignis-coal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ct"/><stop offset=".45" class="cl"/><stop offset="1" class="cb"/></linearGradient>` +
  `<radialGradient id="ignis-heat" cx=".5" cy=".75" r=".6"><stop offset="0" class="ht" stop-opacity="1"/><stop offset=".6" class="ht" stop-opacity=".35"/><stop offset="1" class="ht" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="ignis-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="wd"/><stop offset=".6" class="wd"/><stop offset="1" class="wl"/></linearGradient>` +
  `<radialGradient id="ignis-halo"><stop offset="0" class="sp" stop-opacity=".75"/><stop offset=".3" class="sp" stop-opacity=".22"/><stop offset="1" class="sp" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="ignis-smoke"><stop offset="0" class="sm" stop-opacity="1"/><stop offset=".6" class="sm" stop-opacity=".4"/><stop offset="1" class="sm" stop-opacity="0"/></radialGradient>`

const corner = (right: boolean) =>
  bed(right) +
  coals(right, log(right, 440, 58, 15, -60, 842))

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>${DEFS}</defs>` +
  `<rect width="1600" height="1000" fill="url(#ignis-room)"/>` +
  // The top corners fall into shadow, away from the fire.
  `<ellipse class="shade" cx="0" cy="0" rx="640" ry="540" fill="url(#ignis-shade)"/>` +
  `<ellipse class="shade" cx="1600" cy="0" rx="640" ry="540" fill="url(#ignis-shade)"/>` +
  // Firelight on the walls, smoke rising through it, then the glow of each fire.
  `<ellipse class="wash" cx="0" cy="1000" rx="780" ry="860" fill="url(#ignis-wash)"/>` +
  `<ellipse class="wash b" cx="1600" cy="1000" rx="780" ry="860" fill="url(#ignis-wash)"/>` +
  `<g>${SMOKE}</g>` +
  `<ellipse class="glow" cx="100" cy="1000" rx="470" ry="420" fill="url(#ignis-glow)"/>` +
  `<ellipse class="glow b" cx="1500" cy="1000" rx="470" ry="420" fill="url(#ignis-glow)"/>` +
  `<g>${corner(false)}</g><g>${corner(true)}</g>` +
  `<g>${NEAR}</g><g>${SPARKS}</g>` +
  `</svg>`
