// Rain on a window. One SVG, drawn for both modes: the colors are CSS variables
// that a prefers-color-scheme rule swaps, so day is a grey drizzle seen through
// a pale painted frame and night is a wet city through dark glass.
//
// Back to front: the sky, a far skyline and a near one, both out of focus and
// tallest in the corners; street lights as soft discs with their reflections on
// the wet road; thin rain; then the window itself, a frame with two mullions so
// the middle pane is wide and clear, drops beaded on the side panes and mist
// gathered along the sill. The middle holds only sky, low roofs and faint rain.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(11)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)]!

// How far x is from the middle, 0 in the center and 1 at the edge.
const edge = (x: number) => Math.min(1, Math.abs(x - 800) / 800)

// A row of buildings. Each is a block, some with a setback or a mast, taller
// toward the corners. Lit windows are gathered in a second path.
const skyline = (base: number, low: number, high: number, width: [number, number], lit: number) => {
  let blocks = ''
  let windows = ''
  for (let x = -40; x < 1640; ) {
    const w = between(width[0], width[1])
    const reach = edge(x + w / 2) ** 1.6
    const top = round(base - (low + (high - low) * reach) * between(0.7, 1.15))
    const left = round(x)
    const right = round(x + w)
    const kind = random()
    if (kind < 0.25 && reach > 0.4) {
      const step = round(between(0.2, 0.35) * w)
      blocks += `M${left} ${base}V${round(top + 30)}H${round(left + step)}V${top}H${round(right - step)}V${round(top + 30)}H${right}V${base}z`
    } else if (kind < 0.35 && reach > 0.6) {
      const mid = round(left + w / 2)
      blocks += `M${left} ${base}V${top}H${round(mid - 2)}V${round(top - 50)}h4V${top}H${right}V${base}z`
    } else {
      blocks += `M${left} ${base}V${top}H${right}V${base}z`
    }
    if (lit > 0 && reach > 0.45) {
      for (let wy = top + 18; wy < base - 20; wy += 22) {
        for (let wx = left + 8; wx < right - 12; wx += 16) {
          if (random() < lit) windows += `M${round(wx)} ${round(wy)}h7v10h-7z`
        }
      }
    }
    x += w + between(-4, 10)
  }

  return { blocks, windows }
}

const FAR = skyline(900, 40, 330, [50, 110], 0)
const NEAR = skyline(960, 10, 470, [80, 150], 0.22)

// Street lights out of focus: a few wide glows, then discs in three sizes,
// all held to the lower corners and the towers at the sides.
type Light = [number, number, number, string, number]
const LIGHTS: Light[] = [
  // x, y, radius, color, pulse group
  [150, 760, 220, 'a', 0], [1460, 720, 240, 'b', 1], [60, 420, 160, 'b', 2], [1560, 380, 170, 'a', 3],
  [110, 700, 70, 'a', 1], [240, 820, 52, 'a', 2], [36, 860, 46, 'c', 0], [300, 900, 34, 'c', 3],
  [190, 590, 38, 'b', 0], [90, 520, 26, 'a', 2], [350, 780, 24, 'a', 1], [150, 900, 30, 'a', 3],
  [1490, 660, 76, 'a', 2], [1370, 800, 54, 'b', 0], [1570, 860, 48, 'c', 1], [1290, 880, 34, 'a', 2],
  [1430, 560, 36, 'a', 3], [1530, 500, 28, 'b', 0], [1260, 760, 22, 'a', 3], [1400, 910, 30, 'c', 1],
  [60, 300, 20, 'a', 0], [1540, 270, 22, 'a', 2], [260, 700, 18, 'b', 3], [1330, 680, 18, 'b', 1],
]

// Far lights strung along the low roofs, dim enough to sit behind the words.
const DISTANT = Array.from({ length: 26 }, () => {
  const x = round(between(340, 1260))
  const y = round(between(770, 850) + (1 - edge(x) * 2) * 30)
  const c = pick(['a', 'a', 'a', 'b', 'c'])

  return `<circle cx="${x}" cy="${y}" r="${round(between(5, 13))}" fill="url(#pluvia-disc-${c})"/>`
}).join('')

const GLOWS = LIGHTS.filter(([, , r]) => r > 100)
  .map(([x, y, r, c, p]) => `<circle class="pulse p${p}" cx="${x}" cy="${y}" r="${r}" fill="url(#pluvia-glow-${c})"/>`)
  .join('')

const DISCS = LIGHTS.filter(([, , r]) => r <= 100)
  .map(([x, y, r, c, p]) => `<circle class="pulse p${p}${r > 50 ? ' big' : ''}" cx="${x}" cy="${y}" r="${r}" fill="url(#pluvia-disc-${c})"/>`)
  .join('')

// Reflections of the lowest lights, drawn long on the wet road.
const REFLECTIONS = LIGHTS.filter(([, y, r]) => y > 740 && r <= 100)
  .map(([x, , r, c]) => `<ellipse cx="${x}" cy="928" rx="${round(r * 0.35)}" ry="${round(r * 0.9 + 20)}" fill="url(#pluvia-glow-${c})"/>`)
  .join('')

// Falling rain in three depths. Each depth is one tile of lines drawn twice,
// one tile above the other, and the pair slides down one tile and repeats.
const rainTile = (id: string, count: number, length: [number, number]) => {
  const lines = Array.from({ length: count }, () => {
    const x = round(between(-140, 1740))
    const y = round(between(0, 1000))
    const l = between(length[0], length[1])
    const faint = x > 330 && x < 1300 ? ' faint' : ''

    return `<line class="rl ${id}${faint}" x1="${x}" y1="${y}" x2="${round(x - l * 0.1)}" y2="${round(y + l)}"/>`
  }).join('')

  return `<g id="pluvia-${id}">${lines}</g>`
}

const rain = (id: string, cls: string) =>
  `<g class="${cls}"><g class="fall ${id}"><use href="#pluvia-${id}"/><use href="#pluvia-${id}" transform="translate(100 -1000)"/></g></g>`

// Drops beaded on the glass. Thick near the frame and the sill, sparse toward
// the middle pane, never inside it.
const BEADS = (() => {
  let out = ''
  let placed = 0
  while (placed < 170) {
    const side = random() < 0.5 ? -1 : 1
    const inset = between(46, 380) ** 1 * (random() < 0.6 ? between(0.15, 1) : 1)
    const x = side < 0 ? 46 + inset : 1554 - inset
    if (x > 360 && x < 1240) continue
    const lowBias = random() < 0.45
    const y = lowBias ? between(700, 935) : between(40, 935)
    if (Math.abs(x - 311) < 20 || Math.abs(x - 1289) < 20) continue
    const r = round(random() < 0.8 ? between(1.6, 4) : between(4.5, 8.5))
    out += `<ellipse cx="${round(x)}" cy="${round(y)}" rx="${r}" ry="${round(r * between(1, 1.25))}" fill="url(#pluvia-bead)"/>`
    if (r > 4.4) out += `<circle class="shine" cx="${round(x - r * 0.3)}" cy="${round(y - r * 0.35)}" r="${round(r * 0.28)}"/>`
    placed += 1
  }

  return out
})()

// Drops that gather and run down the glass, each leaving a thin wet trail.
const RUNNERS = [
  [96, 120, 0], [214, 260, 1], [372, 80, 2], [150, 420, 3], [262, 40, 4],
  [1236, 140, 5], [1360, 300, 0], [1478, 90, 2], [1418, 420, 4], [1522, 220, 1],
]
  .map(([x, y, d], i) => {
    const r = round(between(4.5, 6.5))

    return `<g class="run d${d} v${i % 3}"><path class="trail" d="M${x} ${y - 140}q${round(between(-6, 6))} 70 0 ${140 - r}"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${round(r * 1.3)}" fill="url(#pluvia-bead)"/><circle class="shine" cx="${round(x - r * 0.3)}" cy="${round(y - r * 0.4)}" r="${round(r * 0.3)}"/></g>`
  })
  .join('')

// The window: outer frame, top rail, sill and two mullions with a transom on
// each side pane. Light catches the inner edges.
const FRAME =
  `<path class="wood" d="M0 0H1600V1000H0zM44 34V942H1556V34z" fill-rule="evenodd"/>` +
  `<rect class="wood" x="300" y="34" width="22" height="908"/><rect class="wood" x="1278" y="34" width="22" height="908"/>` +
  `<rect class="wood" x="44" y="318" width="256" height="16"/><rect class="wood" x="1300" y="318" width="256" height="16"/>` +
  `<path class="edge" d="M44 34V942M322 34V942M1300 34V942M44 334H300M1300 334H1556M44 34H1556"/>` +
  `<path class="shade" d="M300 34V942M1278 34V942M1556 34V942M44 318H300M1300 318H1556"/>` +
  `<rect class="sill" x="0" y="942" width="1600" height="14"/>` +
  `<g class="sheen"><ellipse cx="150" cy="944" rx="200" ry="5" fill="url(#pluvia-glow-a)"/><ellipse cx="1450" cy="944" rx="220" ry="5" fill="url(#pluvia-glow-a)"/><ellipse cx="1380" cy="944" rx="80" ry="4" fill="url(#pluvia-glow-b)"/></g>`

const STYLE = `
svg{--sky0:#cfd7de;--sky1:#dde3e8;--sky2:#e6eaee;--far:#d3dae0;--near:#bcc6d0;--win:#a7b3bf;--win-alpha:.5;--road:#cfd7de;--glow-alpha:.5;--disc-alpha:.34;--a:#f0cf9a;--b:#a9c6e2;--c:#e9aaa2;--rain:#5c6f83;--rain-alpha:.28;--faint-alpha:.08;--wood:#f3f5f7;--edge:#ffffff;--shade:#b9c3cc;--sill:#fafbfc;--mist:#f4f6f8;--mist-alpha:.75;--bead:#7d8ea0;--bead-alpha:.38;--rim:#ffffff;--shine:#ffffff;--shine-alpha:.95;--cloud:#c9d2da;--haze:#eef1f3;--sheen:.25;--distant:.14}
@media (prefers-color-scheme:dark){svg{--sky0:#0f161e;--sky1:#161f29;--sky2:#202b38;--far:#121a23;--near:#0b1118;--win:#f0b968;--win-alpha:.4;--road:#141c25;--glow-alpha:.42;--disc-alpha:.52;--a:#ffb35c;--b:#6aa4e0;--c:#f0707a;--rain:#a9c4e0;--rain-alpha:.24;--faint-alpha:.08;--wood:#0c121a;--edge:#34465a;--shade:#05080c;--sill:#141c26;--mist:#3a4a5c;--mist-alpha:.4;--bead:#03070b;--bead-alpha:.5;--rim:#d6e6f6;--shine:#e8f1fb;--shine-alpha:.7;--cloud:#1f2a36;--haze:#463f45;--sheen:.6;--distant:.11}}
.s0{stop-color:var(--sky0)}.s1{stop-color:var(--sky1)}.s2{stop-color:var(--sky2)}
.ga{stop-color:var(--a)}.gb{stop-color:var(--b)}.gc{stop-color:var(--c)}.gm{stop-color:var(--mist)}.gk{stop-color:var(--cloud)}
.gbd{stop-color:var(--bead)}.grim{stop-color:var(--rim)}
.far{fill:var(--far)}.near{fill:var(--near)}.win{fill:var(--win);opacity:var(--win-alpha)}.road{fill:var(--road)}
.big{opacity:.62}.gh{stop-color:var(--haze)}.glows{opacity:var(--glow-alpha)}.discs{opacity:var(--disc-alpha)}.refl{opacity:calc(var(--disc-alpha)*.6)}
.pulse{animation:pulse 11s ease-in-out infinite}
.p1{animation-duration:14s;animation-delay:-4s}.p2{animation-duration:17s;animation-delay:-9s}.p3{animation-duration:12s;animation-delay:-6s}
.rl{stroke:var(--rain);stroke-opacity:var(--rain-alpha);stroke-linecap:round}
.rl.faint{stroke-opacity:var(--faint-alpha)}
.rl.r0{stroke-width:1}.rl.r1{stroke-width:1.4}.rl.r2{stroke-width:1.9}
.fall{animation:fall 1.6s linear infinite}
.r0{animation-duration:3.2s;animation-delay:-1.1s}.r1{animation-duration:2.2s;animation-delay:-.7s}.r2{animation-duration:1.5s;animation-delay:-.4s}
.wood{fill:var(--wood)}.sill{fill:var(--sill)}
.edge{stroke:var(--edge);stroke-width:2;fill:none;opacity:.55}.shade{stroke:var(--shade);stroke-width:2;fill:none;opacity:.6}
.distant{opacity:var(--distant)}.sheen{opacity:var(--sheen)}.mist{opacity:var(--mist-alpha)}
.shine{fill:var(--shine);opacity:var(--shine-alpha)}
.trail{stroke:var(--rim);stroke-opacity:.16;stroke-width:2.2;fill:none;stroke-linecap:round}
.run{animation:run 18s ease-in infinite}
.v1{animation-duration:24s}.v2{animation-duration:31s}
.d1{animation-delay:-4s}.d2{animation-delay:-9s}.d3{animation-delay:-13s}.d4{animation-delay:-17s}.d5{animation-delay:-22s}
.cloud{animation:drift 70s ease-in-out infinite alternate}.k1{animation-duration:90s;animation-delay:-35s}
.car{opacity:0;animation:car 16s linear infinite}.car2{animation-duration:21s;animation-delay:-8s}
@keyframes fall{from{transform:translate(0,0)}to{transform:translate(-100px,1000px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.72}}
@keyframes run{0%,55%{transform:translateY(0);opacity:1}62%{transform:translateY(24px);opacity:1}90%{transform:translateY(380px);opacity:1}100%{transform:translateY(420px);opacity:0}}
@keyframes drift{from{transform:translateX(-60px)}to{transform:translateX(60px)}}
@keyframes car{0%{transform:translateX(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(var(--go,300px));opacity:0}}
.car2{--go:-300px}
.still .pulse,.still .fall,.still .run,.still .cloud,.still .car{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.pulse,.fall,.run,.cloud,.car{animation:none}}
`.replace(/\n/g, '')

const glow = (c: string) =>
  `<radialGradient id="pluvia-glow-${c}"><stop offset="0" class="g${c}" stop-opacity=".9"/><stop offset=".45" class="g${c}" stop-opacity=".3"/><stop offset="1" class="g${c}" stop-opacity="0"/></radialGradient>`

// A bokeh disc: an even body with a slightly brighter rim and a soft edge.
const disc = (c: string) =>
  `<radialGradient id="pluvia-disc-${c}"><stop offset="0" class="g${c}" stop-opacity=".5"/><stop offset=".6" class="g${c}" stop-opacity=".58"/><stop offset=".82" class="g${c}" stop-opacity=".72"/><stop offset=".92" class="g${c}" stop-opacity=".35"/><stop offset="1" class="g${c}" stop-opacity="0"/></radialGradient>`

const DEFS =
  `<defs>` +
  `<linearGradient id="pluvia-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0"/><stop offset=".55" class="s1"/><stop offset="1" class="s2"/></linearGradient>` +
  `<linearGradient id="pluvia-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="gm" stop-opacity="0"/><stop offset="1" class="gm"/></linearGradient>` +
  `<radialGradient id="pluvia-haze"><stop offset="0" class="gh" stop-opacity=".8"/><stop offset="1" class="gh" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="pluvia-cloud"><stop offset="0" class="gk"/><stop offset=".6" class="gk" stop-opacity=".5"/><stop offset="1" class="gk" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="pluvia-bead" cx=".5" cy=".55" r=".55" fx=".45" fy=".35"><stop offset="0" class="gbd" stop-opacity=".05"/><stop offset=".6" class="gbd" stop-opacity=".35"/><stop offset=".85" class="grim" stop-opacity=".55"/><stop offset="1" class="grim" stop-opacity="0"/></radialGradient>` +
  glow('a') + glow('b') + glow('c') + disc('a') + disc('b') + disc('c') +
  `<filter id="pluvia-far" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>` +
  `<filter id="pluvia-near" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>` +
  rainTile('r0', 70, [24, 50]) +
  rainTile('r1', 46, [40, 80]) +
  rainTile('r2', 24, [70, 130]) +
  `</defs>`

const car = (cls: string, x: number, c: string) =>
  `<g class="car ${cls}"><circle cx="${x}" cy="918" r="16" fill="url(#pluvia-disc-${c})"/><circle cx="${x + 46}" cy="918" r="16" fill="url(#pluvia-disc-${c})"/></g>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#pluvia-sky)"/>` +
  `<g class="cloud"><ellipse cx="160" cy="140" rx="420" ry="150" fill="url(#pluvia-cloud)"/><ellipse cx="1480" cy="200" rx="380" ry="140" fill="url(#pluvia-cloud)"/></g>` +
  `<g class="cloud k1"><ellipse cx="1320" cy="80" rx="360" ry="110" fill="url(#pluvia-cloud)"/><ellipse cx="300" cy="300" rx="300" ry="100" fill="url(#pluvia-cloud)"/></g>` +
  `<ellipse cx="160" cy="880" rx="560" ry="300" fill="url(#pluvia-haze)"/><ellipse cx="1460" cy="860" rx="580" ry="320" fill="url(#pluvia-haze)"/>` +
  `<g class="glows">${GLOWS}</g>` +
  `<g filter="url(#pluvia-far)"><path class="far" d="${FAR.blocks}"/></g>` +
  `<g filter="url(#pluvia-near)"><path class="near" d="${NEAR.blocks}"/><path class="win" d="${NEAR.windows}"/></g>` +
  `<rect class="road" x="0" y="900" width="1600" height="100"/>` +
  `<g class="refl">${REFLECTIONS}</g>` +
  `<g class="distant">${DISTANT}</g>` +
  `<g class="discs">${DISCS}${car('car1', 1250, 'a')}${car('car2', 300, 'c')}</g>` +
  rain('r0', 'far-rain') +
  rain('r1', 'mid-rain') +
  rain('r2', 'near-rain') +
  `<rect class="mist" x="44" y="760" width="1512" height="182" fill="url(#pluvia-mist)"/>` +
  `<g>${BEADS}</g>` +
  `<g>${RUNNERS}</g>` +
  FRAME +
  `</svg>`
