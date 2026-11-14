// A cafe table seen from above. One SVG, drawn for both modes: the colors are
// CSS variables that a prefers-color-scheme rule swaps, so day is a milky latte
// table with a rose tint and night is a warm mauve charcoal one.
//
// Everything is flat rounded shapes with a soft offset shadow, like cut paper.
// Lower left: a lavender cup on a peach saucer, a swirl of milk in the coffee.
// Upper right: a folded sage napkin with a spoon on it, and the edge of a small
// plate holding a butter biscuit. Lower right: two sugar cubes and a faint ring
// where a cup once stood. Crumbs here and there. The middle is bare table.
//
// While Claude works the milk swirl turns slowly and thin curls of steam rise
// from the cup and fade.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(8)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// Where the cup sits, and its rings from the saucer in.
const CX = 214
const CY = 812
const SAUCER = 168
const CUP = 128
const WALL = 110
const COFFEE = 94

// A spiral of milk, from the middle out, as one smooth stroked path.
const spiral = (turns: number, from: number, to: number, start: number) => {
  const steps = Math.round(turns * 24)
  let d = ''
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const angle = start + t * turns * Math.PI * 2
    const r = from + (to - from) * t
    const x = round(Math.cos(angle) * r)
    const y = round(Math.sin(angle) * r * 0.94)
    d += `${i === 0 ? 'M' : 'L'}${x} ${y}`
  }

  return d
}

// Little foam bubbles caught in the milk.
const FOAM = Array.from({ length: 9 }, () => {
  const a = between(0, Math.PI * 2)
  const r = between(20, 78)

  return `<circle class="foam" cx="${round(Math.cos(a) * r)}" cy="${round(Math.sin(a) * r)}" r="${round(between(1.6, 3.4))}"/>`
}).join('')

const SWIRL =
  `<g class="swirl">` +
  `<circle r="${COFFEE}" fill="transparent"/>` +
  `<path class="milk wide" d="${spiral(1.9, 8, 72, 0)}"/>` +
  `<path class="milk thin" d="${spiral(1.1, 40, 80, Math.PI * 0.8)}"/>` +
  `<circle class="milk-dot" r="13"/>` +
  FOAM +
  `</g>`

// The cup and saucer, with a flat shadow drawn once for the whole set.
const handle = `<rect x="${CUP - 10}" y="-20" width="78" height="40" rx="20" transform="rotate(-38)"/>`
const CUPSET =
  `<g transform="translate(${CX} ${CY})">` +
  `<g class="shadow" transform="translate(14 18)"><circle r="${SAUCER}"/>${handle}</g>` +
  `<circle class="saucer" r="${SAUCER}"/>` +
  `<circle class="saucer-ring" r="${SAUCER - 26}"/>` +
  `<g class="shadow soft" transform="translate(9 12)"><circle r="${CUP}"/>${handle}</g>` +
  `<g class="glaze">${handle}</g>` +
  `<rect class="handle-hole" x="${CUP + 14}" y="-7" width="42" height="14" rx="7" transform="rotate(-38)"/>` +
  `<circle class="glaze" r="${CUP}"/>` +
  `<circle class="rim" r="${CUP - 5}"/>` +
  `<circle class="wall" r="${WALL}"/>` +
  `<circle class="coffee" r="${COFFEE}"/>` +
  SWIRL +
  `<path class="gleam" d="M${-COFFEE + 18} -30A${COFFEE - 14} ${COFFEE - 14} 0 0 1 -30 ${-COFFEE + 18}"/>` +
  `</g>`

// Steam: thin curls that rise from the coffee and fade, each on its own clock.
const curl = (x: number, lean: number) =>
  `M${x} ${CY - 30}c${-18 * lean} -34 ${22 * lean} -62 ${4 * lean} -100s${-26 * lean} -66 ${2 * lean} -104s${16 * lean} -50 ${-6 * lean} -84`
const STEAM =
  `<g class="steam s0"><path d="${curl(CX - 22, 1)}"/></g>` +
  `<g class="steam s1"><path d="${curl(CX + 14, -1)}"/></g>` +
  `<g class="steam s2"><path d="${curl(CX - 4, 0.8)}"/></g>`

// The napkin, folded once corner to corner, with a stitched hem and a spoon.
const NAPKIN =
  `<g transform="rotate(-11 1430 170)">` +
  `<rect class="shadow" x="1262" y="-22" width="340" height="340" rx="30" transform="translate(12 16)"/>` +
  `<rect class="napkin" x="1262" y="-22" width="340" height="340" rx="30"/>` +
  `<path class="napkin-top" d="M1292 318C1276 318 1262 304 1262 288V8C1262 -8 1276 -22 1292 -22L1580 286C1592 300 1586 318 1568 318z"/>` +
  `<path class="hem" d="M1282 252V10M1302 298H1530"/>` +
  `<path class="fold" d="M1300 -12L1584 292"/>` +
  `</g>` +
  // The spoon resting across it.
  `<g transform="rotate(-48 1360 230)">` +
  `<g class="shadow" transform="translate(10 12)"><rect x="1236" y="221" width="210" height="18" rx="9"/><ellipse cx="1214" cy="230" rx="40" ry="28"/></g>` +
  `<rect class="spoon" x="1236" y="221" width="210" height="18" rx="9"/>` +
  `<ellipse class="spoon" cx="1214" cy="230" rx="40" ry="28"/>` +
  `<ellipse class="spoon-in" cx="1210" cy="230" rx="29" ry="19"/>` +
  `<rect class="spoon-shine" x="1290" y="225" width="120" height="5" rx="2.5"/>` +
  `</g>`

// The edge of a small plate past the napkin, with a round butter biscuit on it.
const holes = [
  [0, 0], [-22, -14], [20, -16], [-18, 18], [22, 16], [0, -30], [0, 30],
]
  .map(([x, y]) => `<circle class="dock" cx="${1514 + x!}" cy="${450 + y!}" r="3.2"/>`)
  .join('')
const PLATE =
  `<circle class="shadow" cx="1600" cy="430" r="150" transform="translate(12 16)"/>` +
  `<circle class="plate" cx="1600" cy="430" r="150"/>` +
  `<circle class="plate-ring" cx="1600" cy="430" r="112"/>` +
  `<circle class="shadow soft" cx="1514" cy="450" r="58" transform="translate(6 8)"/>` +
  `<circle class="biscuit" cx="1514" cy="450" r="58"/>` +
  `<circle class="biscuit-edge" cx="1514" cy="450" r="48"/>` +
  holes

// Two sugar cubes, a soft square each, and a faint ring where a cup once stood.
const cube = (x: number, y: number, a: number) =>
  `<g transform="rotate(${a} ${x} ${y})">` +
  `<rect class="shadow soft" x="${x - 24}" y="${y - 24}" width="48" height="48" rx="11" transform="translate(6 8)"/>` +
  `<rect class="sugar" x="${x - 24}" y="${y - 24}" width="48" height="48" rx="11"/>` +
  `<rect class="sugar-top" x="${x - 17}" y="${y - 18}" width="34" height="32" rx="8"/>` +
  `</g>`
const CORNER =
  `<circle class="stain" cx="1330" cy="880" r="86"/>` +
  `<circle class="stain thin" cx="1330" cy="880" r="78"/>` +
  cube(1470, 846, 14) +
  cube(1530, 900, -9)

// Crumbs: a few small rounded bits near the cup, the plate and the sugar.
const crumbs = (count: number, x: [number, number], y: [number, number]) =>
  Array.from({ length: count }, () => {
    const r = between(2.4, 6.5)
    const cx = round(between(x[0], x[1]))
    const cy = round(between(y[0], y[1]))

    return `<ellipse class="crumb" cx="${cx}" cy="${cy}" rx="${round(r)}" ry="${round(r * between(0.6, 0.95))}" transform="rotate(${round(between(0, 180))} ${cx} ${cy})"/>`
  }).join('')
const CRUMBS =
  `<g class="crumbs">` +
  crumbs(6, [1250, 1440], [360, 520]) +
  crumbs(5, [430, 560], [880, 970]) +
  crumbs(4, [60, 200], [560, 620]) +
  crumbs(3, [70, 260], [70, 200]) +
  crumbs(3, [1380, 1560], [720, 790]) +
  `</g>`

const STYLE = `
svg{--table:#f6e5de;--edge:#efd8d0;--shadow:#b99590;--shadow-alpha:.26;--saucer:#f4cbb2;--saucer-ring:#e9b89c;--glaze:#c4b2e8;--rim:#ddd2f4;--wall:#d4c8ef;--coffee:#c9a287;--milk:#fbf0e4;--foam:#fffaf3;--gleam:#fffcfa;--napkin:#bad3b5;--napkin-top:#d0e4cb;--hem:#9dbc98;--spoon:#cdc5d6;--spoon-in:#b9b0c4;--spoon-shine:#f3eff6;--plate:#f7eee9;--plate-ring:#ead9d1;--biscuit:#ebcf88;--biscuit-edge:#dcb965;--dock:#c49f50;--sugar:#fffbf8;--sugar-top:#fdf3ef;--stain:#d9b4a6;--stain-alpha:.32;--crumb:#d8b46c;--steam:#fffaf8;--steam-alpha:.7}
@media (prefers-color-scheme:dark){svg{--table:#29212f;--edge:#231c29;--shadow:#0e0a12;--shadow-alpha:.42;--saucer:#5f4b4c;--saucer-ring:#523f40;--glaze:#5d5081;--rim:#716496;--wall:#514574;--coffee:#30221e;--milk:#8f7e74;--foam:#a8988c;--gleam:#c9bdd6;--napkin:#3f4f45;--napkin-top:#48594c;--hem:#34433a;--spoon:#6a6377;--spoon-in:#5b5568;--spoon-shine:#8f88a0;--plate:#443a4a;--plate-ring:#3b3241;--biscuit:#6a5339;--biscuit-edge:#5c4831;--dock:#47362a;--sugar:#625a69;--sugar-top:#6c6473;--stain:#40334a;--stain-alpha:.8;--crumb:#6e5c40;--steam:#e2d6ea;--steam-alpha:.3}}
.e0{stop-color:var(--table)}.e1{stop-color:var(--edge)}
.shadow{fill:var(--shadow);opacity:var(--shadow-alpha)}.shadow.soft{opacity:calc(var(--shadow-alpha)*.8)}
.saucer{fill:var(--saucer)}.saucer-ring{fill:none;stroke:var(--saucer-ring);stroke-width:5}
.glaze{fill:var(--glaze)}.rim{fill:none;stroke:var(--rim);stroke-width:9}.wall{fill:var(--wall)}.coffee{fill:var(--coffee)}
.handle-hole{fill:var(--saucer)}
.milk{fill:none;stroke:var(--milk);stroke-linecap:round;stroke-linejoin:round}.wide{stroke-width:17}.thin{stroke-width:6;opacity:.8}
.milk-dot{fill:var(--milk)}.foam{fill:var(--foam);opacity:.8}
.gleam{fill:none;stroke:var(--gleam);stroke-width:5;stroke-linecap:round;opacity:.35}
.napkin{fill:var(--napkin)}.napkin-top{fill:var(--napkin-top)}
.hem{fill:none;stroke:var(--hem);stroke-width:3;stroke-dasharray:9 8;stroke-linecap:round}
.fold{fill:none;stroke:var(--hem);stroke-width:3;stroke-linecap:round;opacity:.6}
.spoon{fill:var(--spoon)}.spoon-in{fill:var(--spoon-in)}.spoon-shine{fill:var(--spoon-shine);opacity:.7}
.plate{fill:var(--plate)}.plate-ring{fill:none;stroke:var(--plate-ring);stroke-width:5}
.biscuit{fill:var(--biscuit)}.biscuit-edge{fill:none;stroke:var(--biscuit-edge);stroke-width:4}.dock{fill:var(--dock)}
.sugar{fill:var(--sugar)}.sugar-top{fill:var(--sugar-top)}
.stain{fill:none;stroke:var(--stain);stroke-width:7;opacity:var(--stain-alpha)}.stain.thin{stroke-width:3;opacity:calc(var(--stain-alpha)*.6)}
.crumb{fill:var(--crumb)}
.steam path{fill:none;stroke:var(--steam);stroke-width:6;stroke-linecap:round}
.steam{opacity:0;animation:steam 10s ease-in-out infinite}
.s1{animation-duration:12s;animation-delay:-4s}.s2{animation-duration:14s;animation-delay:-9s}
.swirl{transform-box:fill-box;transform-origin:center;animation:swirl 48s linear infinite;animation-delay:-7s}
@keyframes steam{0%{opacity:0;transform:translateY(30px)}35%{opacity:var(--steam-alpha)}70%{opacity:calc(var(--steam-alpha)*.4)}100%{opacity:0;transform:translateY(-70px)}}
@keyframes swirl{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.still .steam,.still .swirl{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.steam,.swirl{animation:none}}
`.replace(/\n/g, '')

const DEFS =
  `<defs>` +
  `<radialGradient id="malva-table" cx=".5" cy=".46" r=".75"><stop offset=".45" class="e0"/><stop offset="1" class="e1"/></radialGradient>` +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect width="1600" height="1000" fill="url(#malva-table)"/>` +
  CORNER +
  PLATE +
  NAPKIN +
  CUPSET +
  STEAM +
  CRUMBS +
  `</svg>`
