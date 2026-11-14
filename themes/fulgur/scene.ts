// Fulgur: lightning. One SVG for both modes: the colors are CSS variables that a
// prefers-color-scheme rule swaps, so night is neon on a near black violet page
// and day is the same neon deepened on a pale cool grey.
//
// Everything is flat strokes and flat fills with hard edges. Buses of thin
// traces run in from the side edges and turn at right angles into square pads
// and chips. A row of chevrons points right at the top right, a segmented level
// meter sits in the lower left, a fine perspective grid runs low in the lower
// right. The middle is the plain page.
//
// While Claude works, short pulses travel along the traces (each a head and two
// fading followers, moved by transform keyframes that turn at every corner), the
// meter columns climb and fall behind a sliding shutter, and the chevrons chase.

type Pt = [number, number]

const r1 = (n: number) => Math.round(n * 10) / 10

// A small seeded generator, so the scene is the same on every load.
let seed = 1093
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

// Offset a right-angle polyline sideways by o, mitering each corner.
const offset = (pts: Pt[], o: number): Pt[] => {
  const normal = (a: Pt, b: Pt): Pt => {
    const dx = Math.sign(b[0] - a[0])
    const dy = Math.sign(b[1] - a[1])
    return [-dy, dx]
  }
  return pts.map((p, i) => {
    const n1 = i > 0 ? normal(pts[i - 1]!, p) : normal(p, pts[i + 1]!)
    const n2 = i < pts.length - 1 ? normal(p, pts[i + 1]!) : n1
    const nx = n1[0] === n2[0] && n1[1] === n2[1] ? n1[0] : n1[0] + n2[0]
    const ny = n1[0] === n2[0] && n1[1] === n2[1] ? n1[1] : n1[1] + n2[1]
    return [r1(p[0] + nx * o), r1(p[1] + ny * o)] as Pt
  })
}

const pathOf = (pts: Pt[]) => 'M' + pts.map(p => `${p[0]} ${p[1]}`).join('L')

// Extend the last segment of a wire by d, so bus ends stagger.
const extend = (pts: Pt[], d: number): Pt[] => {
  const a = pts[pts.length - 2]!
  const b = pts[pts.length - 1]!
  const dx = Math.sign(b[0] - a[0])
  const dy = Math.sign(b[1] - a[1])
  return [...pts.slice(0, -1), [r1(b[0] + dx * d), r1(b[1] + dy * d)]]
}

const pad = (p: Pt, s: number, cls: string) => `<rect class="${cls}" x="${r1(p[0] - s / 2)}" y="${r1(p[1] - s / 2)}" width="${s}" height="${s}"/>`

// Pulses: a bright square that moves along a wire, turning at every corner.
const pulseRules: string[] = []
let pulseCount = 0
const pulse = (pts: Pt[], color: string, seconds: number, start: number) => {
  const lens = pts.slice(1).map((p, i) => Math.abs(p[0] - pts[i]![0]) + Math.abs(p[1] - pts[i]![1]))
  const total = lens.reduce((a, b) => a + b, 0)
  const active = 0.62
  let run = 0
  const frames = pts.map((p, i) => {
    if (i > 0) run += lens[i - 1]!
    return `${r1((run / total) * active * 100)}%{transform:translate(${p[0]}px,${p[1]}px)}`
  })
  const n = pulseCount++
  const name = `fulgur-p${n}`
  pulseRules.push(
    `@keyframes ${name}{${frames.join('')}0%{opacity:0}3%{opacity:1}${r1(active * 100 - 4)}%{opacity:1}${r1(active * 100)}%,100%{opacity:0;transform:translate(${pts[pts.length - 1]![0]}px,${pts[pts.length - 1]![1]}px)}}`,
  )
  // Head and two followers, each a little later and fainter.
  return [0, 0.07, 0.14]
    .map((lag, k) => {
      const cls = `pu${n}_${k}`
      pulseRules.push(`.${cls}{animation:${name} ${seconds}s linear infinite;animation-delay:-${r1((seconds * start - lag) * 100) / 100}s}`)
      const s = [8, 6, 4][k]!
      return `<rect class="pulse ${color} f${k} ${cls}" x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}"/>`
    })
    .join('')
}

// A bus: n parallel wires that follow a spine, ending in staggered pads.
const bus = (spine: Pt[], n: number, gap: number, color: string, pulses: { wire: number; color: string; s: number; at: number }[]) => {
  let lines = ''
  let pads = ''
  const wires: Pt[][] = []
  for (let k = 0; k < n; k += 1) {
    const w = extend(offset(spine, (k - (n - 1) / 2) * gap), k * gap * 1.4)
    wires.push(w)
    lines += pathOf(w)
    pads += pad(w[w.length - 1]!, 9, `pad ${color}`)
  }
  return `<path class="trace ${color}" d="${lines}"/>${pads}${pulses.map(p => pulse(wires[p.wire]!, p.color, p.s, p.at)).join('')}`
}

// A chip: a flat block with pin legs along two sides.
const chip = (x: number, y: number, w: number, h: number, color: string) => {
  let legs = ''
  for (let i = 10; i < h - 4; i += 14) legs += `M${x - 10} ${y + i}H${x}M${x + w} ${y + i}H${x + w + 10}`
  return `<rect class="chip" x="${x}" y="${y}" width="${w}" height="${h}"/><rect class="edge ${color}" x="${x}" y="${y}" width="${w}" height="${h}"/><path class="trace ${color}" d="${legs}"/><rect class="core ${color}" x="${x + w / 2 - 8}" y="${y + h / 2 - 8}" width="16" height="16"/>`
}

// The level meter: columns of segments, a shutter that slides over each column,
// and the unlit outlines drawn on top so dark segments still read.
const meterRules: string[] = []
const meter = (x0: number, yBase: number) => {
  const cols = 8
  const segs = 10
  const cw = 14
  const sh = 7
  const sp = 10
  const colGap = 20
  let lit = ''
  let outline = ''
  let shutters = ''
  for (let c = 0; c < cols; c += 1) {
    const x = x0 + c * colGap
    for (let s = 0; s < segs; s += 1) {
      const y = yBase - (s + 1) * sp
      const tone = s >= 8 ? 'mg' : s >= 5 ? 'yl' : 'gn'
      lit += `<rect class="seg ${tone}" x="${x}" y="${y}" width="${cw}" height="${sh}"/>`
      outline += `M${x} ${y}h${cw}v${sh}h${-cw}Z`
    }
    // Levels in segments, seeded; the shutter hides everything above the level.
    const levels = Array.from({ length: 6 }, () => 2 + Math.floor(rand() * 8))
    const steps = levels.map((l, i) => `${r1((i * 100) / levels.length)}%{transform:translateY(${-(l * sp)}px)}`).join('')
    const seconds = r1(5 + rand() * 3)
    const name = `fulgur-m${c}`
    meterRules.push(`@keyframes ${name}{${steps}100%{transform:translateY(${-(levels[0]! * sp)}px)}}`)
    meterRules.push(`.mc${c}{animation:${name} ${seconds}s ease-in-out infinite;animation-delay:-${r1(rand() * seconds)}s}`)
    // The shutter starts at the base and covers the column upward; moving it up reveals segments.
    shutters += `<rect class="shutter mc${c}" x="${x - 1}" y="${yBase - segs * sp - 2}" width="${cw + 2}" height="${segs * sp + 2}"/>`
  }
  const w = (cols - 1) * colGap + cw
  return (
    `<rect class="mpanel" x="${x0 - 14}" y="${yBase - segs * sp - 16}" width="${w + 28}" height="${segs * sp + 28}"/>` +
    `<clipPath id="fulgur-meter"><rect x="${x0 - 2}" y="${yBase - segs * sp - 2}" width="${w + 4}" height="${segs * sp + 4}"/></clipPath>` +
    `<g clip-path="url(#fulgur-meter)">${lit}${shutters}</g>` +
    `<path class="mline" d="${outline}"/>` +
    `<path class="edge vi" d="M${x0 - 14} ${yBase - segs * sp - 16}h${w + 28}v${segs * sp + 28}h${-(w + 28)}Z"/>`
  )
}

// A row of chevrons that chase from left to right.
const chevrons = (x0: number, y: number, count: number) => {
  let out = ''
  for (let i = 0; i < count; i += 1) {
    const x = x0 + i * 26
    out += `<path class="chev cv${i}" d="M${x} ${y - 14}L${x + 14} ${y}L${x} ${y + 14}H${x - 9}L${x + 5} ${y}L${x - 9} ${y - 14}Z"/>`
  }
  return out
}
const chevRules = Array.from({ length: 6 }, (_, i) => `.cv${i}{animation-delay:-${r1(3.2 - i * 0.32)}s}`).join('')

// A fine perspective grid low in the lower right, toward a vanishing point.
const grid = () => {
  const vx = 1420
  const hy = 800
  const x0 = 1215
  const x1 = 1600
  let d = ''
  for (let i = -14; i <= 14; i += 1) {
    const bx = vx + i * 60
    // Clip each ray to the grid's left edge by solving where it meets x0.
    const t0 = 0
    let sx = r1(vx + (bx - vx) * 0.08)
    let sy = r1(hy + (1000 - hy) * 0.08)
    let ex = bx
    let ey = 1000
    if (ex < x0) {
      const t = (x0 - vx) / (bx - vx)
      if (t <= t0 || t > 1) continue
      ex = x0
      ey = hy + (1000 - hy) * t
    }
    if (ex > x1) {
      const t = (x1 - vx) / (bx - vx)
      ex = x1
      ey = hy + (1000 - hy) * t
    }
    d += `M${r1(sx)} ${r1(sy)}L${r1(ex)} ${r1(ey)}`
  }
  for (let k = 1; k <= 9; k += 1) {
    const y = hy + (1000 - hy) * (k / 9) ** 2
    d += `M${x0} ${r1(y)}H${x1}`
  }
  return `<path class="floor" d="M${x0} ${hy}H${x1}V1000H${x0}Z"/><path class="grid" d="${d}"/><path class="horizon" d="M${x0} ${hy}H${x1}"/>`
}

// Corner brackets, a HUD frame at each corner.
const brackets = () => {
  const L = 70
  const m = 26
  return `<path class="bracket" d="M${m} ${m + L}V${m}H${m + L}M${1600 - m - L} ${m}H${1600 - m}V${m + L}M${1600 - m} ${1000 - m - L}V${1000 - m}H${1600 - m - L}M${m + L} ${1000 - m}H${m}V${1000 - m - L}"/>`
}

// Flat chamfered slabs behind the art: under the glass they carry the color.
const slab = (pts: Pt[], cls: string) => `<path class="slab ${cls}" d="${pathOf(pts)}Z"/>`
const SLABS =
  slab([[0, 150], [214, 150], [244, 180], [244, 470], [214, 500], [0, 500]], 's-cy') +
  slab([[0, 640], [130, 640], [160, 670], [160, 1000], [0, 1000]], 's-mg') +
  slab([[188, 728], [372, 728], [394, 750], [394, 892], [188, 892]], 's-vi') +
  slab([[1600, 196], [1432, 196], [1402, 226], [1402, 600], [1432, 630], [1600, 630]], 's-vi') +
  slab([[1262, 82], [1468, 82], [1490, 104], [1490, 154], [1262, 154]], 's-mg') +
  slab([[1600, 0], [1340, 0], [1340, 40], [1372, 72], [1600, 72]], 's-cy')

const ART =
  SLABS +
  brackets() +
  // Left side.
  bus([[118, 0], [118, 120], [330, 120]], 4, 12, 'cy', [{ wire: 1, color: 'cy', s: 4.6, at: 0.1 }]) +
  bus([[0, 210], [180, 210], [180, 430], [300, 430]], 5, 12, 'vi', [
    { wire: 0, color: 'mg', s: 5.8, at: 0.35 },
    { wire: 3, color: 'cy', s: 6.4, at: 0.8 },
  ]) +
  bus([[0, 560], [92, 560], [92, 900], [190, 900]], 3, 12, 'mg', [{ wire: 2, color: 'yl', s: 5.2, at: 0.55 }]) +
  chip(270, 440, 70, 112, 'cy') +
  meter(216, 862) +
  // Right side.
  chevrons(1300, 118, 6) +
  bus([[1600, 250], [1460, 250], [1460, 520], [1300, 520]], 4, 12, 'cy', [
    { wire: 1, color: 'gn', s: 5.4, at: 0.2 },
    { wire: 3, color: 'mg', s: 6.8, at: 0.65 },
  ]) +
  bus([[1520, 0], [1520, 170], [1380, 170]], 3, 12, 'mg', [{ wire: 0, color: 'cy', s: 4.2, at: 0.5 }]) +
  bus([[1600, 690], [1500, 690], [1500, 790]], 3, 12, 'vi', [{ wire: 2, color: 'yl', s: 4.8, at: 0.05 }]) +
  chip(1240, 470, 50, 100, 'mg') +
  grid()

const STYLE =
  `
svg{--bg:#f4f5fa;--bg2:#eceef6;--chip:#e6e8f2;--panel:#eceef6;--cy:#0a8ba4;--mg:#cc1360;--yl:#8e8200;--gn:#0f8f3e;--vi:#6a32d2;--line:#c9cce0;--grid:#8b7fd0;--trace-a:.85;--s-cy:#cdebf3;--s-mg:#f7d3e5;--s-vi:#ddd2f8;--floor:#e9e5f7;--pulse-a:1;--seg-a:.85}
@media (prefers-color-scheme:dark){svg{--bg:#0e0c1a;--bg2:#100e1f;--chip:#17142c;--panel:#130f26;--cy:#22e3f2;--mg:#ff2f7e;--yl:#f2e33a;--gn:#3dfa78;--vi:#a464ff;--line:#2c2850;--grid:#5d3fb0;--trace-a:.5;--s-cy:#082234;--s-mg:#2c0c33;--s-vi:#1f1249;--floor:#160f30;--pulse-a:1;--seg-a:.9}}
.bg{fill:var(--bg)}.bg2{fill:var(--bg2)}
.trace{fill:none;stroke-width:2;opacity:var(--trace-a)}
.cy{stroke:var(--cy);fill:var(--cy)}.mg{stroke:var(--mg);fill:var(--mg)}.yl{stroke:var(--yl);fill:var(--yl)}.gn{stroke:var(--gn);fill:var(--gn)}.vi{stroke:var(--vi);fill:var(--vi)}
.trace.cy,.trace.mg,.trace.vi,.edge{fill:none}
.pad{stroke:none;opacity:.8}
.chip{fill:var(--chip)}.edge{stroke-width:2;opacity:.8}.core{stroke:none;opacity:.7}
.bracket{fill:none;stroke:var(--vi);stroke-width:3;opacity:.7}
.mpanel{fill:var(--panel)}.seg{stroke:none;opacity:var(--seg-a)}.shutter{fill:var(--panel)}
.mline{fill:none;stroke:var(--line);stroke-width:1.2}
.chev{stroke:none;fill:var(--mg);opacity:.35;animation:fulgur-chase 3.2s linear infinite}
.floor{fill:var(--floor)}.slab{stroke-width:1.5;stroke-opacity:.45}.s-cy{stroke:var(--cy)}.s-mg{stroke:var(--mg)}.s-vi{stroke:var(--vi)}.s-cy{fill:var(--s-cy)}.s-mg{fill:var(--s-mg)}.s-vi{fill:var(--s-vi)}.grid{fill:none;stroke:var(--grid);stroke-width:1.2;opacity:.75}.horizon{fill:none;stroke:var(--cy);stroke-width:2}
.pulse{stroke:none;opacity:0}.f1{fill-opacity:.6}.f2{fill-opacity:.35}
@keyframes fulgur-chase{0%,100%{opacity:.35}15%{opacity:1}45%{opacity:.35}}
${chevRules}
${pulseRules.join('')}
${meterRules.join('')}
.still .pulse,.still .shutter,.still .chev{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.pulse,.shutter,.chev{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<rect class="bg" width="1600" height="1000"/>` +
  ART +
  `</svg>`
