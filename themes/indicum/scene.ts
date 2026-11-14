// A far city at 2am, drawn as flat geometry. One SVG for both modes: the colors
// are CSS variables that a prefers-color-scheme rule swaps, so night is navy
// towers with a grid of small lit windows and day is the same blocks in pale
// blue grey.
//
// Back to front: a plain sky that lifts a little toward the horizon, a far row
// of low blocks, then two clusters of towers in the bottom corners, tallest at
// the edges. Each near tower has a lit side and a shaded side, and its windows
// sit on a strict grid. Two antenna masts carry red lights. The middle holds
// only sky.
//
// While Claude works a few windows switch on and off, each on its own slow
// clock, and the antenna lights pulse. Everything that moves changes opacity.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(272)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n)

// How far x is from the middle, 0 in the center and 1 at the edge.
const edge = (x: number) => Math.min(1, Math.abs(x - 800) / 800)

type Tower = { left: number; right: number; top: number }

// A row of towers on a base line, tallest toward the corners, none in the
// middle span between `gap` edges.
const row = (base: number, low: number, high: number, width: [number, number], gap: number, step: number) => {
  const towers: Tower[] = []
  for (let x = -30; x < 1630; ) {
    const w = between(width[0], width[1])
    const mid = x + w / 2
    const reach = edge(mid)
    if (reach > gap) {
      const t = ((reach - gap) / (1 - gap)) ** 1.3
      const top = base - (low + (high - low) * t) * between(0.72, 1.1)
      towers.push({ left: round(x), right: round(x + w), top: round(top / step) * step })
    }
    x += w + between(step, step * 3)
  }

  return towers
}

// The far row runs across the whole width, low in the middle.
const FAR = row(1000, 90, 430, [50, 110], 0, 4)
// A middle row reaches a little way in from each side.
const MID = row(1000, 110, 480, [60, 120], 0.28, 8)
// The near clusters stay in the corners.
const NEAR = row(1000, 140, 560, [70, 130], 0.45, 16)

const block = ({ left, right, top }: Tower, base = 1000) => `M${left} ${base}V${top}H${right}V${base}z`

// Near towers: a body, a lit strip down one side, and sometimes a setback
// crown or a small box on the roof.
let bodies = ''
let sides = ''
let crowns = ''
let sockets = ''
let warm = ''
let cool = ''
let blue = ''
const spare: [number, number][] = []

// The middle row: plain blocks with a faint grid and a few dim lights.
let midBodies = ''
let midSockets = ''
let midLit = ''
for (const t of MID) {
  midBodies += block(t)
  const cols = Math.floor((t.right - t.left - 14) / 12)
  for (let y = t.top + 16; y < 990; y += 14) {
    for (let c = 0; c < cols; c += 1) {
      const x = t.left + 8 + c * 12
      if (x > 392 && x < 1208 && y < 860) continue
      const cell = `M${x} ${y}h5v5h-5z`
      if (random() < 0.07) midLit += cell
      else midSockets += cell
    }
  }
}

for (const t of NEAR) {
  const w = t.right - t.left
  bodies += block(t)
  const sideOnLeft = (t.left + t.right) / 2 > 800
  const strip = round(w * 0.16)
  sides += sideOnLeft ? `M${t.left} 1000V${t.top}h${strip}V1000z` : `M${t.right - strip} 1000V${t.top}h${strip}V1000z`
  const kind = random()
  if (kind < 0.35 && w > 80) {
    const inset = round(w * 0.22)
    crowns += `M${t.left + inset} ${t.top}v-32h${w - inset * 2}v32z`
  } else if (kind < 0.55) {
    const bw = round(w * 0.3)
    const bx = round(t.left + between(0.15, 0.55) * w)
    crowns += `M${bx} ${t.top}v-14h${bw}v14z`
  }

  // The window grid: 6 unit squares on a 14 by 16 pitch, inset from the edges.
  const cols = Math.floor((w - strip - 16) / 14)
  const x0 = sideOnLeft ? t.left + strip + 9 : t.left + 9
  for (let y = t.top + 18; y < 990; y += 16) {
    for (let c = 0; c < cols; c += 1) {
      const x = x0 + c * 14
      // The center half above the message box stays quiet.
      if (x > 392 && x < 1208 && y < 860) continue
      const roll = random()
      const cell = `M${x} ${y}h6v6h-6z`
      if (roll < 0.11) warm += cell
      else if (roll < 0.16) cool += cell
      else if (roll < 0.185) blue += cell
      else {
        sockets += cell
        if (roll > 0.985 && y > 560) spare.push([x, y])
      }
    }
  }
}

// Windows that switch on and off while Claude works, picked from dark ones
// across both clusters, each on its own clock.
const left = spare.filter(([x]) => x < 800)
const right = spare.filter(([x]) => x >= 800)
const chosen = [...left.filter((_, i) => i % Math.max(1, Math.floor(left.length / 12)) === 0).slice(0, 12), ...right.filter((_, i) => i % Math.max(1, Math.floor(right.length / 12)) === 0).slice(0, 12)]
const SWITCHES = chosen
  .map(([x, y], i) => `<rect class="sw ${i % 2 ? 'warm' : 'cool'} w${i % 6}" x="${x}" y="${y}" width="6" height="6"/>`)
  .join('')

// Antenna masts on the tallest tower of each cluster.
const tallest = (side: Tower[]) => side.reduce((a, b) => (b.top < a.top ? b : a))
const leftTall = tallest(NEAR.filter(t => t.right > 120 && t.right < 600))
const rightTall = tallest(NEAR.filter(t => t.left > 1000 && t.left < 1480))

const mast = (t: Tower, height: number, cls: string) => {
  const x = round((t.left + t.right) / 2)
  const top = t.top - height
  return (
    `<path class="mast" d="M${x - 1.5} ${t.top}V${top}h3V${t.top}zM${x - 9} ${t.top - round(height * 0.35)}h18v2h-18zM${x - 6} ${t.top - round(height * 0.65)}h12v2h-12z"/>` +
    `<g class="beacon ${cls}"><circle class="halo" cx="${x}" cy="${top}" r="44" fill="url(#indicum-halo)"/><circle class="lamp" cx="${x}" cy="${top}" r="4"/></g>`
  )
}

const MASTS = mast(leftTall, 150, 'b0') + mast(rightTall, 120, 'b1')

// A third, smaller light on a lower roof, out of step with the masts.
const lowRoof = NEAR.filter(t => t.left > 1150 && t.left < 1300)[0] ?? rightTall
const SMALL = `<g class="beacon b2"><circle cx="${round((lowRoof.left + lowRoof.right) / 2)}" cy="${lowRoof.top - 6}" r="26" class="halo" fill="url(#indicum-halo)"/><circle class="lamp" cx="${round((lowRoof.left + lowRoof.right) / 2)}" cy="${lowRoof.top - 6}" r="3"/></g>`

const STYLE = `
svg{--sky0:#dce4ef;--sky1:#e8edf5;--sky2:#eef2f7;--haze:#f7f9fc;--far:#dbe2ec;--mid:#cdd6e3;--near:#b3c0d3;--side:#d6dee9;--crown:#bccad9;--socket:#a9b7cb;--socket-a:.6;--warm:#f3dcc4;--cool:#f4f8fd;--blue:#c9dcf7;--lit-a:.9;--mlit-a:.5;--mast:#9eabbf;--lamp:#e0607a;--halo:#e8889c;--halo-a:.35}
@media (prefers-color-scheme:dark){svg{--sky0:#121629;--sky1:#171c33;--sky2:#1e2440;--haze:#2a2f58;--far:#1d2242;--mid:#151a34;--near:#0b0e20;--side:#1f2650;--mlit-a:.45;--crown:#0d1124;--socket:#1f2645;--socket-a:.9;--warm:#ffb46b;--cool:#8fe0f2;--blue:#5f8dff;--lit-a:.9;--mast:#2a3156;--lamp:#ff4d63;--halo:#ff3d57;--halo-a:.55}}
.s0{stop-color:var(--sky0)}.s1{stop-color:var(--sky1)}.s2{stop-color:var(--sky2)}.gh{stop-color:var(--haze)}.gl{stop-color:var(--halo)}
.far{fill:var(--far)}.mid{fill:var(--mid)}.msocket{fill:var(--socket);opacity:calc(var(--socket-a)*.6)}.mlit{fill:var(--warm);opacity:var(--mlit-a)}.near{fill:var(--near)}.side{fill:var(--side)}.crown{fill:var(--near)}
.socket{fill:var(--socket);opacity:var(--socket-a)}
.warm{fill:var(--warm)}.cool{fill:var(--cool)}.blue{fill:var(--blue)}.lit{opacity:var(--lit-a)}
.mast{fill:var(--mast)}.lamp{fill:var(--lamp)}.halo{opacity:var(--halo-a)}
.sw{opacity:0;animation:sw 19s ease-in-out infinite}
.w0{animation-delay:-3s}.w1{animation-duration:23s;animation-delay:-11s}.w2{animation-duration:29s;animation-delay:-6s}
.w3{animation-duration:17s;animation-delay:-14s}.w4{animation-duration:26s;animation-delay:-19s}.w5{animation-duration:21s;animation-delay:-8s}
.beacon{animation:beat 4.4s ease-in-out infinite}.b1{animation-duration:5.2s;animation-delay:-2s}.b2{animation-duration:6.8s;animation-delay:-4s}
@keyframes sw{0%,42%{opacity:0}50%,86%{opacity:var(--lit-a)}94%,100%{opacity:0}}
@keyframes beat{0%,100%{opacity:.25}45%,55%{opacity:1}}
.still .sw,.still .beacon{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.sw,.beacon{animation:none}}
`.replace(/\n/g, '')

const DEFS =
  `<defs>` +
  `<linearGradient id="indicum-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0"/><stop offset=".55" class="s1"/><stop offset="1" class="s2"/></linearGradient>` +
  `<radialGradient id="indicum-glow"><stop offset="0" class="gh" stop-opacity=".7"/><stop offset="1" class="gh" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="indicum-halo"><stop offset="0" class="gl" stop-opacity=".8"/><stop offset=".35" class="gl" stop-opacity=".25"/><stop offset="1" class="gl" stop-opacity="0"/></radialGradient>` +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#indicum-sky)"/>` +
  `<ellipse cx="160" cy="960" rx="620" ry="420" fill="url(#indicum-glow)"/><ellipse cx="1440" cy="960" rx="620" ry="420" fill="url(#indicum-glow)"/>` +
  `<path class="far" d="${FAR.map(t => block(t)).join('')}"/>` +
  `<path class="mid" d="${midBodies}"/>` +
  `<path class="msocket" d="${midSockets}"/>` +
  `<path class="mlit" d="${midLit}"/>` +
  `<path class="crown" d="${crowns}"/>` +
  MASTS.replace(/<g class="beacon[\s\S]*?<\/g>/g, '') +
  `<path class="near" d="${bodies}"/>` +
  `<path class="side" d="${sides}"/>` +
  `<path class="socket" d="${sockets}"/>` +
  `<g class="lit"><path class="warm" d="${warm}"/><path class="cool" d="${cool}"/><path class="blue" d="${blue}"/></g>` +
  `<g>${SWITCHES}</g>` +
  `<g>${(MASTS.match(/<g class="beacon[\s\S]*?<\/g>/g) ?? []).join('')}${SMALL}</g>` +
  `</svg>`
