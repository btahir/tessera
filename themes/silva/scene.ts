// A pine forest in mist. One SVG, drawn for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so day is sage morning fog
// and night is green-black woods with a few fireflies.
//
// The trees stand in rows. The farthest row runs low along the whole horizon,
// close to the fog color. Each nearer row keeps further to the left and right
// edges and is darker, so the middle of the frame holds only fog and the
// words sit on quiet ground. Mist lies between the rows and drifts sideways.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(23)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n)

// One pine: ragged tiers of drooping branches up a straight trunk, to a thin
// tip. Each tier ends in two or three tufts, and no two sides match.
const pine = (cx: number, base: number, height: number, width: number) => {
  const tiers = Math.max(4, Math.round(height / between(36, 48) / (height < 260 ? 1.5 : 1)))
  const step = (height * 0.92) / tiers
  const trunk = Math.max(2, width * 0.045)
  const left: string[] = [`${round(cx - trunk)},${round(base + 70)}`]
  const right: string[] = []

  const side = (sign: number, y: number, spread: number) => {
    const droop = step * between(0.3, 0.6)
    const tufts = spread > 40 ? 3 : spread > 14 ? 2 : 1
    const out: string[] = []
    for (let t = 0; t < tufts; t += 1) {
      const reach = spread * (1 - t * between(0.14, 0.24))
      const ty = y + droop * (1 - t * 0.45)
      out.push(`${round(cx + sign * reach)},${round(ty)}`)
      out.push(`${round(cx + sign * reach * between(0.72, 0.86))},${round(ty - step * between(0.18, 0.3))}`)
    }
    out.push(`${round(cx + sign * spread * between(0.16, 0.3))},${round(y - step * 0.62)}`)

    return out
  }

  for (let i = 0; i < tiers; i += 1) {
    const y = base - i * step
    const taper = (1 - i / tiers) ** 0.85
    left.push(...side(-1, y, (width / 2) * taper * between(0.78, 1.12)))
    right.unshift(...side(1, y, (width / 2) * taper * between(0.78, 1.12)).reverse())
  }

  return `${left.join(' ')} ${round(cx + between(-2, 2))},${round(base - height)} ${right.join(' ')} ${round(cx + trunk)},${round(base + 70)}`
}

// Points to a short path of relative steps, which keeps the file small.
const path = (points: string) => {
  const list = points.split(' ').map(pair => pair.split(',').map(Number) as [number, number])
  let [x, y] = list[0]!
  const steps = list.slice(1).map(([px, py]) => {
    const step = `${px - x} ${py - y}`
    x = px
    y = py

    return step
  })

  return `<path d="M${list[0]![0]} ${list[0]![1]}l${steps.join(' ').replace(/ -/g, '-')}z"/>`
}

// A row of trees. `spans` are the x ranges the row covers.
const row = (spans: [number, number][], gap: [number, number], base: [number, number], height: [number, number], width: [number, number]) =>
  spans
    .flatMap(([from, to]) => {
      const points: string[] = []
      for (let x = from; x < to; x += between(gap[0], gap[1])) {
        points.push(pine(x, between(base[0], base[1]), between(height[0], height[1]), between(width[0], width[1])))
      }

      return points
    })
    .map(path)
    .join('')

// Farthest to nearest. The far row crosses the middle, low and faint.
const DISTANT = row([[-40, 1640]], [30, 50], [640, 670], [50, 120], [30, 52])
const FAR = row([[-40, 1640]], [34, 58], [690, 730], [90, 200], [46, 80])
const BACK = row([[-30, 540], [1060, 1640]], [48, 80], [760, 800], [230, 400], [80, 130])
const MIDDLE = row([[-50, 300], [1300, 1650]], [70, 110], [850, 890], [460, 640], [140, 200])
const NEAR = [
  pine(40, 990, 1150, 300),
  pine(205, 1000, 960, 250),
  pine(1430, 1000, 1000, 260),
  pine(1585, 990, 1180, 310),
]
  .map(path)
  .join('')

// Fireflies keep to the nearest trees, well clear of the words.
const FLIES = [
  [118, 560], [262, 690], [74, 760], [318, 470], [190, 845], [36, 420], [292, 900],
  [1290, 520], [1468, 640], [1342, 780], [1544, 470], [1260, 880], [1508, 860],
]
  .map(([x, y], i) => {
    const r = round(between(22, 32))

    return `<g class="wander w${i % 4}"><g class="fly f${i % 6}"><circle class="aura" cx="${x}" cy="${y}" r="${r * 4}" fill="url(#silva-fly)"/><circle class="bloom" cx="${x}" cy="${y}" r="${r}" fill="url(#silva-fly)"/><circle class="core" cx="${x}" cy="${y}" r="3.5"/></g></g>`
  })
  .join('')

// Mist: wide soft ellipses that drift slowly sideways between the rows.
const mist = (cls: string, y: number, ry: number, n: number) => {
  const shapes = Array.from({ length: n }, (_, i) => {
    const x = round(-300 + (i + between(0.1, 0.9)) * (2200 / n))

    return `<ellipse cx="${x}" cy="${round(y + between(-ry * 0.2, ry * 0.2))}" rx="${round(between(380, 560))}" ry="${round(ry * between(0.8, 1.15))}" fill="url(#silva-mist)"/>`
  }).join('')

  return `<g class="drift ${cls}">${shapes}</g>`
}

// Pale shafts of light falling from the upper right, through the trees.
const RAYS = [
  [1180, 1290, 640, 520],
  [1300, 1380, 900, 800],
  [1420, 1480, 1110, 1040],
]
  .map(([a, b, c, d]) => `<polygon class="ray" points="${a},-20 ${b},-20 ${c},1000 ${d},1000"/>`)
  .join('')

const STYLE = `
svg{--sky-top:#e2eee8;--sky-mid:#edf6f1;--sky-low:#eef7f3;--aura:.2;--glow:#fbf8e4;--glow-alpha:.9;--ray-alpha:.32;--mist:#f2f9f5;--mist-alpha:.85;--t0:#d3e1da;--t1:#bfd0c7;--t2:#a7bab0;--t3:#92a79c;--fly:#fff4c4;--fly-alpha:.5}
@media (prefers-color-scheme:dark){svg{--sky-top:#0d1a15;--sky-mid:#1f322a;--sky-low:#22362e;--aura:.17;--glow:#45675a;--glow-alpha:.6;--ray-alpha:.05;--mist:#2b3f37;--mist-alpha:.7;--t0:#11201a;--t1:#0c1a14;--t2:#07140f;--t3:#030d08;--fly:#e6f08a;--fly-alpha:1}}
.sky0{stop-color:var(--sky-top)}.sky1{stop-color:var(--sky-low)}.sky2{stop-color:var(--sky-mid)}.aura{opacity:var(--aura)}.bloom{opacity:.3}.core{fill:var(--fly)}
.glow{stop-color:var(--glow)}.mistc{stop-color:var(--mist)}.flyc{stop-color:var(--fly)}
.c0{stop-color:var(--t0)}.c1{stop-color:var(--t1)}.c2{stop-color:var(--t2)}.c3{stop-color:var(--t3)}
.halo{opacity:var(--glow-alpha)}
.ray{fill:url(#silva-ray);opacity:var(--ray-alpha)}
.far{fill:url(#silva-far)}.distant{opacity:.45}.back{fill:url(#silva-back)}.middle{fill:url(#silva-middle)}.near{fill:url(#silva-near)}
.drift{opacity:var(--mist-alpha);animation:drift 48s ease-in-out infinite alternate}
.high{opacity:calc(var(--mist-alpha)*.45)}.m1{animation-duration:62s;animation-delay:-20s}.m2{animation-duration:54s;animation-delay:-41s}.m3{animation-duration:70s;animation-delay:-9s}.m4{animation-duration:44s;animation-delay:-30s}
.fly{opacity:calc(var(--fly-alpha)*.6);animation:glow 6s ease-in-out infinite}
.f1{animation-duration:7.5s;animation-delay:-2s}.f2{animation-duration:9s;animation-delay:-5s}.f3{animation-duration:6.5s;animation-delay:-3.5s}.f4{animation-duration:8s;animation-delay:-6.5s}.f5{animation-duration:10s;animation-delay:-1s}
.wander{animation:wander 18s ease-in-out infinite alternate}
.w1{animation-duration:23s;animation-delay:-8s}.w2{animation-duration:27s;animation-delay:-15s}.w3{animation-duration:20s;animation-delay:-4s}
@keyframes drift{from{transform:translateX(-70px)}to{transform:translateX(70px)}}
@keyframes glow{0%,100%{opacity:calc(var(--fly-alpha)*.08)}45%{opacity:var(--fly-alpha)}60%{opacity:calc(var(--fly-alpha)*.8)}}
@keyframes wander{from{transform:translate(-10px,6px)}to{transform:translate(12px,-14px)}}
.still .drift,.still .fly,.still .wander{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.drift,.fly,.wander{animation:none}}
`.replace(/\n/g, '')

// A row's fill: the tree color up top, fading into fog at its feet.
const fade = (name: string, cls: string, top: number, from: number, to: number) =>
  `<linearGradient id="silva-${name}" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="1000">` +
  `<stop offset="0" class="${cls}"/><stop offset="${from}" class="${cls}"/><stop offset="${to}" class="mistc"/></linearGradient>`

const DEFS =
  `<defs>` +
  `<linearGradient id="silva-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sky0"/><stop offset=".62" class="sky2"/><stop offset="1" class="sky1"/></linearGradient>` +
  `<radialGradient id="silva-halo"><stop offset="0" class="glow"/><stop offset=".45" class="glow" stop-opacity=".45"/><stop offset="1" class="glow" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="silva-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="glow"/><stop offset=".7" class="glow" stop-opacity=".3"/><stop offset="1" class="glow" stop-opacity="0"/></linearGradient>` +
  `<radialGradient id="silva-mist"><stop offset="0" class="mistc"/><stop offset=".55" class="mistc" stop-opacity=".55"/><stop offset="1" class="mistc" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="silva-fly"><stop offset="0" class="flyc"/><stop offset=".3" class="flyc" stop-opacity=".6"/><stop offset=".62" class="flyc" stop-opacity=".18"/><stop offset="1" class="flyc" stop-opacity="0"/></radialGradient>` +
  fade('far', 'c0', 500, 0.3, 0.6) +
  fade('back', 'c1', 360, 0.5, 0.8) +
  fade('middle', 'c2', 200, 0.6, 0.97) +
  fade('near', 'c3', 0, 0.72, 1) +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#silva-sky)"/>` +
  `<circle class="halo" cx="1330" cy="150" r="420" fill="url(#silva-halo)"/>` +
  `<g>${RAYS}</g>` +
  mist('m3 high', 330, 150, 4) +
  `<g class="far distant">${DISTANT}</g>` +
  `<g class="far">${FAR}</g>` +
  mist('m0', 760, 90, 5) +
  `<g class="back">${BACK}</g>` +
  mist('m1', 840, 100, 5) +
  `<g class="middle">${MIDDLE}</g>` +
  mist('m2', 930, 110, 5) +
  `<g class="near">${NEAR}</g>` +
  `<g>${FLIES}</g>` +
  mist('m4', 1010, 90, 4) +
  `</svg>`
