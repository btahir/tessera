// Raw concrete, drawn in flat slabs. One SVG for both modes: the colors are CSS
// variables that a prefers-color-scheme rule swaps, so night is a mid grey hall
// and day is pale board formed concrete.
//
// Everything sits on a 40 unit grid. Heavy blocks are stacked off the left and
// right edges like the corners of a building. Each block has a hard offset
// shadow drawn as a solid darker shape, a thick dark outline, the horizontal
// planks of the boards it was cast in, and rows of square tie holes. Deep
// window slots are cut into the tower. One small red square is the only mark
// of color. The middle holds only the faint planks of the wall behind.
//
// While Claude works, two slabs slide one or two grid steps and stop, slowly,
// then slide back. Only transforms move. No gradients, no blur, no curves.

const G = 40
const SHADOW = 40

// Plank tones for the formwork, in rows of 40 units. A fixed uneven order, so
// the stripes read as boards and not as ruled paper.
const PLANKS = [0, 2, 1, 0, 2, 0, 1, 2, 1, 0, 0, 2]

const planks = (id: string, prefix: string) =>
  `<pattern id="caementum-${id}" width="${G * 4}" height="${G * PLANKS.length}" patternUnits="userSpaceOnUse">` +
  PLANKS.map((tone, row) =>
    tone === 0 ? '' : `<rect class="${prefix}${tone}" y="${row * G}" width="${G * 4}" height="${G}"/>`,
  ).join('') +
  `</pattern>`

type Block = { x: number; y: number; w: number; h: number; holes?: boolean }

// Square tie holes on an 80 unit grid, inset from the block's edges.
const holes = ({ x, y, w, h }: Block) => {
  let d = ''
  for (let hy = y + G; hy <= y + h - G; hy += 2 * G) {
    for (let hx = x + G; hx <= x + w - G; hx += 2 * G) {
      if (hx < 0 || hy < 0 || hx > 1600 || hy > 1000) continue
      d += `M${hx - 6} ${hy - 6}h12v12h-12Z`
    }
  }

  return d === '' ? '' : `<path class="hole" d="${d}"/>`
}

// One slab: its shadow, its face, the planks cast into it, and its outline.
const block = (b: Block) => {
  const { x, y, w, h } = b

  return (
    `<rect class="shade" x="${x + SHADOW}" y="${y + SHADOW}" width="${w}" height="${h}"/>` +
    `<rect class="face" x="${x}" y="${y}" width="${w}" height="${h}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#caementum-board)"/>` +
    (b.holes ? holes(b) : '') +
    `<rect class="rule" x="${x}" y="${y}" width="${w}" height="${h}"/>`
  )
}

const blocks = (list: Block[]) => list.map(block).join('')

// Deep recessed slots: a dark void with a thick rule round it.
const slots = (list: [number, number, number, number][]) =>
  list.map(([x, y, w, h]) => `<rect class="void" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('') +
  `<path class="rule" d="${list.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}Z`).join('')}"/>`

// The left corner: a tall pier, a short step, and a heavy base with a slot.
// The top slab cantilevers out and slides one step.
const LEFT =
  blocks([
    { x: -40, y: -40, w: 240, h: 1080, holes: true },
    { x: 200, y: 440, w: 120, h: 160 },
    { x: -40, y: 720, w: 360, h: 320 },
  ]) +
  slots([[40, 800, 240, 40]]) +
  holes({ x: -40, y: 840, w: 360, h: 200 }) +
  `<g class="slide-a">${blocks([{ x: -40, y: 80, w: 320, h: 200, holes: true }])}</g>`

// The right corner: a tower with window slots, a block that slides down its
// face, a ledge that carries the red mark, and a low footing.
const RIGHT =
  blocks([{ x: 1360, y: -40, w: 280, h: 640 }]) +
  slots([
    [1400, 80, 80, 120],
    [1520, 80, 80, 120],
    [1400, 280, 80, 120],
    [1520, 280, 80, 120],
  ]) +
  `<g class="slide-b">${blocks([{ x: 1240, y: 120, w: 80, h: 200 }])}</g>` +
  blocks([
    { x: 1240, y: 640, w: 400, h: 120 },
    { x: 1440, y: 760, w: 200, h: 280, holes: true },
  ]) +
  `<rect class="mark" x="1520" y="680" width="40" height="40"/>`

const STYLE = `
svg{--page:#ece9e3;--wall1:#e9e6e0;--wall2:#e7e4de;--face:#d3d0c9;--plank1:#cfccc5;--plank2:#cbc8c1;--shade:#b3afa8;--void:#8a8781;--rule:#2f2d2a;--hole:#8a8781;--mark:#c8392d}
@media (prefers-color-scheme:dark){svg{--page:#2c2a27;--wall1:#2e2c29;--wall2:#302e2b;--face:#464440;--plank1:#42403c;--plank2:#3e3c38;--shade:#1d1c1a;--void:#181715;--rule:#121110;--hole:#1d1c1a;--mark:#c4473a}}
.page{fill:var(--page)}.w1{fill:var(--wall1)}.w2{fill:var(--wall2)}
.face{fill:var(--face)}.p1{fill:var(--plank1)}.p2{fill:var(--plank2)}
.shade{fill:var(--shade)}.void{fill:var(--void)}.hole{fill:var(--hole)}.mark{fill:var(--mark)}
.rule{fill:none;stroke:var(--rule);stroke-width:8;stroke-linejoin:miter}
.slide-a{animation:slide-a 22s infinite;animation-delay:-6s}
.slide-b{animation:slide-b 28s infinite;animation-delay:-9s}
@keyframes slide-a{0%,30%{transform:translate(0,0);animation-timing-function:cubic-bezier(.7,0,.3,1)}45%,80%{transform:translate(40px,0);animation-timing-function:cubic-bezier(.7,0,.3,1)}95%,100%{transform:translate(0,0)}}
@keyframes slide-b{0%,30%{transform:translate(0,0);animation-timing-function:cubic-bezier(.7,0,.3,1)}46%,78%{transform:translate(0,80px);animation-timing-function:cubic-bezier(.7,0,.3,1)}94%,100%{transform:translate(0,0)}}
.still .slide-a,.still .slide-b{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.slide-a,.slide-b{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  planks('board', 'p') +
  planks('wall', 'w') +
  `</defs>` +
  `<rect class="page" width="1600" height="1000"/>` +
  `<rect width="1600" height="1000" fill="url(#caementum-wall)"/>` +
  LEFT +
  RIGHT +
  `</svg>`
