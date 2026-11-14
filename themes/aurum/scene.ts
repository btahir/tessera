// Black and gold, after the decorative art of the 1920s. One SVG for both modes:
// the colors are CSS variables that a prefers-color-scheme rule swaps, so night is
// gold on a warm near black and day is brass on ivory.
//
// Each corner holds one ornament, drawn once in its own quarter and mirrored
// into place. The top corners hang pleated fans with scalloped rims. The bottom
// corners hold a half sun rising behind a stepped tower. A thin double rule
// joins them around the frame. The middle is a soft warm gradient only.
//
// While Claude works, glints of light travel along the gold arcs by turning
// about each ornament's center, so every motion is a transform or an opacity.

const round = (n: number) => Math.round(n * 10) / 10

// A point at radius r and angle a (degrees), in an ornament's own space.
const at = (r: number, a: number) => {
  const t = (a * Math.PI) / 180

  return `${round(r * Math.cos(t))} ${round(r * Math.sin(t))}`
}

// A circular arc from angle a to b.
const arc = (r: number, a: number, b: number) =>
  `M${at(r, a)}A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${at(r, b)}`

// A slice of a ring between radii r1 and r2, from angle a to b.
const slice = (r1: number, r2: number, a: number, b: number) =>
  r1 === 0
    ? `M0 0L${at(r2, a)}A${r2} ${r2} 0 0 1 ${at(r2, b)}Z`
    : `M${at(r2, a)}A${r2} ${r2} 0 0 1 ${at(r2, b)}L${at(r1, b)}A${r1} ${r1} 0 0 0 ${at(r1, a)}Z`

// Sunburst rays over a sweep of degrees: alternate wedges in two groups that
// breathe out of step.
const rays = (count: number, r1: number, r2: number, sweep: number, cls: string) => {
  const step = sweep / count
  const a: string[] = []
  const b: string[] = []
  for (let i = 0; i < count; i += 1) (i % 2 === 0 ? a : b).push(slice(r1, r2, i * step, (i + 0.55) * step))

  return `<path class="ray ${cls} ba" d="${a.join('')}"/><path class="ray ${cls} bb" d="${b.join('')}"/>`
}

// Spokes: straight lines between two radii.
const spokes = (count: number, r1: number, r2: number, sweep: number) =>
  Array.from({ length: count - 1 }, (_, i) => {
    const a = ((i + 1) * sweep) / count
    return `M${at(r1, a)}L${at(r2, a)}`
  }).join('')

// A staircase that follows a quarter circle of radius r, in steps of size s.
const stairs = (r: number, s: number) => {
  let d = `M${r} 0`
  let y = 0
  while (y < r) {
    y = Math.min(r, y + s)
    d += `V${y}H${Math.round(Math.sqrt(Math.max(0, r * r - y * y)))}`
  }

  return d
}

// Glints: a short bright arc set at angle 0, turned along its ring by CSS.
// Each one gets its own pace and starting point, so the still frame is scattered.
const glintRules: string[] = []
const glint = (r: number, span: number, sweep: 'q' | 'h', seconds: number, offset: number) => {
  const n = glintRules.length
  glintRules.push(`.k${n}{animation:${sweep}sweep ${seconds}s linear infinite;animation-delay:-${round(seconds * offset)}s}`)

  return `<g class="glint k${n}"><path class="halo" d="${arc(r, 0, span)}"/><path class="spark" d="${arc(r, span * 0.25, span * 0.75)}"/><circle class="flare" cx="${at(r, span / 2).split(' ')[0]}" cy="${at(r, span / 2).split(' ')[1]}" r="30" fill="url(#aurum-flare)"/></g>`
}

// The fan that hangs in a top corner. Its center is the corner itself.
const fan = (offset: number) => {
  const n = 10
  let rim = `M0 0L${at(340, 0)}`
  for (let i = 0; i < n; i += 1) {
    const half = round(340 * Math.sin((45 / n) * (Math.PI / 180)))
    rim += `A${half} ${half} 0 0 0 ${at(340, ((i + 1) * 90) / n)}`
  }
  const rimLine = rim.slice(rim.indexOf('L') + 1)

  return (
    `<circle class="glow" r="640" fill="url(#aurum-glow)"/>` +
    rays(20, 150, 480, 90, 'far') +
    `<path class="plate" d="${stairs(392, 34)}V0Z"/>` +
    `<path class="rim" d="${rim}Z"/>` +
    `<path class="band" d="${slice(0, 250, 0, 90)}"/>` +
    rays(15, 124, 250, 90, 'near') +
    `<path class="core" d="${slice(0, 124, 0, 90)}" fill="url(#aurum-core)"/>` +
    `<path class="line thin" d="${spokes(15, 124, 250, 90)}${spokes(n, 250, 324, 90)}${spokes(6, 30, 76, 90)}"/>` +
    `<path class="line" d="M${rimLine}"/>` +
    `<path class="line bold" d="${arc(124, 0, 90)}${arc(250, 0, 90)}"/>` +
    `<path class="line thin" d="${arc(76, 0, 90)}${arc(30, 0, 90)}${arc(358, 0, 90)}"/>` +
    `<path class="line dim" d="${stairs(374, 34)}${stairs(392, 34)}"/>` +
    // Down the side edge: twin rules that meet at a cut stone, halfway down.
    `<path class="line dim" d="M50 420V516M66 420V516M50 574V670M66 574V670M42 545H34M74 545H82"/>` +
    `<path class="jewel" d="M58 509L80 545L58 581L36 545Z"/>` +
    `<path class="line" d="M58 509L80 545L58 581L36 545Z"/>` +
    `<path class="gem" d="M58 527L69 545L58 563L47 545Z"/>` +
    glint(250, 16, 'q', 12, 0.2 + offset) +
    glint(358, 10, 'q', 17, 0.65 + offset) +
    glint(124, 24, 'q', 9, 0.45 + offset)
  )
}

// A half sun rising behind a stepped tower, at a bottom corner. Drawn with y
// pointing up into the frame; the corner group flips it into place.
const sun = (offset: number) => {
  const tiers = [
    { w: 220, y: 0, h: 40 },
    { w: 156, y: 40, h: 38 },
    { w: 96, y: 78, h: 36 },
  ]
  const tower = tiers.map(t => `M${-t.w} ${t.y}H${t.w}V${t.y + t.h}H${-t.w}Z`).join('')
  const [a, b, c] = tiers as [(typeof tiers)[0], (typeof tiers)[0], (typeof tiers)[0]]
  const outline =
    `M${-a.w} 0V${b.y}H${-b.w}V${c.y}H${-c.w}V${c.y + c.h}` +
    `H${c.w}V${c.y}H${b.w}V${b.y}H${a.w}V0`
  const ledges = tiers.map(t => `M${-t.w + 10} ${t.y + t.h - 9}H${t.w - 10}`).join('')
  const doors = Array.from({ length: 7 }, (_, i) => `M${-54 + i * 18} 84V106`).join('')
  const flutes = Array.from({ length: 11 }, (_, i) => `M${-125 + i * 25} 46V68`).join('')

  return (
    `<circle class="glow" r="660" fill="url(#aurum-glow)"/>` +
    rays(30, 170, 480, 180, 'far') +
    `<path class="band" d="${slice(0, 284, 0, 180)}"/>` +
    rays(18, 164, 284, 180, 'near') +
    `<path class="core" d="${slice(0, 164, 0, 180)}" fill="url(#aurum-core)"/>` +
    `<path class="line thin" d="${spokes(18, 164, 284, 180)}${arc(116, 0, 180)}${arc(298, 0, 180)}"/>` +
    `<path class="line bold" d="${arc(164, 0, 180)}${arc(284, 0, 180)}"/>` +
    `<path class="line dim" d="${arc(312, 0, 180)}"/>` +
    glint(284, 12, 'h', 15, 0.3 + offset) +
    glint(298, 9, 'h', 21, 0.75 + offset) +
    glint(164, 18, 'h', 11, 0.55 + offset) +
    `<path class="step" d="${tower}"/>` +
    `<path class="line" d="${outline}"/>` +
    `<path class="line thin" d="${ledges}${doors}${flutes}"/>`
  )
}

const corner = (cls: string, transform: string, art: string) => `<g class="${cls}" transform="${transform}">${art}</g>`

// Built first, so every glint rule exists before the style block is written.
const ART =
  corner('c-tl', 'translate(0 0)', fan(0)) +
  corner('c-tr', 'translate(1600 0) scale(-1 1)', fan(0.33)) +
  corner('c-bl', 'translate(120 1000) scale(1 -1)', sun(0)) +
  corner('c-br', 'translate(1480 1000) scale(-1 -1)', sun(0.4))

const STYLE =
  `
svg{--top:#f5eede;--bottom:#efe6d5;--mid:#f8f3e8;--glow:#e2c27a;--glow-a:.5;--ray:#a88534;--ray-a:.1;--near-a:.18;--plate:#f1e8d6;--band:#ebdfc4;--rim:#efe6d2;--step:#f1e9d8;--line:#9a7430;--dim:#cdb787;--core1:#d4b05c;--core2:#ead9ad;--glint:#e8ad2a;--spark:#fff8e2;--frame:#dccca6}
@media (prefers-color-scheme:dark){svg{--top:#1c1812;--bottom:#221e15;--mid:#27221a;--glow:#b8892e;--glow-a:.3;--ray:#c3963b;--ray-a:.075;--near-a:.13;--plate:#251f17;--band:#2b2519;--rim:#262016;--step:#1f1b14;--line:#cda54b;--dim:#5e4d2c;--core1:#7a5719;--core2:#33291a;--glint:#e9c068;--spark:#fff3cf;--frame:#3a3121}}
.top{stop-color:var(--top)}.bottom{stop-color:var(--bottom)}.mid{stop-color:var(--mid)}
.gl{stop-color:var(--glow)}.c1{stop-color:var(--core1)}.c2{stop-color:var(--core2)}
.glow{opacity:var(--glow-a)}
.ray{fill:var(--ray);opacity:var(--ray-a);animation:breathe 14s ease-in-out infinite}
.ray.near{opacity:var(--near-a);animation-name:breathe-near}.ray.bb{animation-delay:-7s}
.plate{fill:var(--plate)}.jewel{fill:var(--core1)}.gem{fill:var(--glint);animation:gleam 10s ease-in-out infinite;animation-delay:-3s}.c-tr .gem{animation-delay:-8s}
.flare{opacity:.3}.fl{stop-color:var(--glint)}
.band{fill:var(--band)}.rim{fill:var(--rim)}.step{fill:var(--step)}
.line{fill:none;stroke:var(--line);stroke-width:2.6}
.line.bold{stroke-width:5}.line.thin{stroke-width:1.6}.line.dim{stroke:var(--dim);stroke-width:2}
.frame{fill:none;stroke:var(--frame);stroke-width:1.5}
.glint{transform-box:view-box;transform-origin:0 0}
.halo{fill:none;stroke:var(--glint);stroke-width:11;stroke-linecap:round;opacity:.45}
.spark{fill:none;stroke:var(--spark);stroke-width:3.4;stroke-linecap:round}
${glintRules.join('')}
@keyframes qsweep{0%{transform:rotate(-30deg);opacity:0}12%{opacity:1}85%{opacity:1}100%{transform:rotate(100deg);opacity:0}}
@keyframes hsweep{0%{transform:rotate(-25deg);opacity:0}10%{opacity:1}88%{opacity:1}100%{transform:rotate(195deg);opacity:0}}
@keyframes gleam{0%,100%{opacity:.35}50%{opacity:.9}}
@keyframes breathe{0%,100%{opacity:var(--ray-a)}50%{opacity:calc(var(--ray-a)*.45)}}
@keyframes breathe-near{0%,100%{opacity:var(--near-a)}50%{opacity:calc(var(--near-a)*.5)}}
.still .ray,.still .glint,.still .gem{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.ray,.glint,.gem{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  `<linearGradient id="aurum-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset="1" class="bottom"/></linearGradient>` +
  `<radialGradient id="aurum-lamp" cx=".5" cy=".4" r=".55"><stop offset="0" class="mid"/><stop offset="1" class="mid" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="aurum-glow"><stop offset="0" class="gl" stop-opacity=".9"/><stop offset=".4" class="gl" stop-opacity=".35"/><stop offset="1" class="gl" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="aurum-core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(170)"><stop offset="0" class="c1"/><stop offset="1" class="c2"/></radialGradient>` +
  `<radialGradient id="aurum-flare"><stop offset="0" class="fl" stop-opacity=".8"/><stop offset="1" class="fl" stop-opacity="0"/></radialGradient>` +
  `</defs>` +
  `<rect width="1600" height="1000" fill="url(#aurum-sky)"/>` +
  `<rect width="1600" height="1000" fill="url(#aurum-lamp)"/>` +
  `<path class="frame" d="M22 22H1578V978H22ZM34 34H1566V966H34Z"/>` +
  ART +
  `</svg>`
