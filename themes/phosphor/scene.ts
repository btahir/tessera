// The glow of an old green screen, in spirit only. One SVG, drawn for both modes.
//
// Night is the screen itself: a green-black tube with rounded corners, glow
// pooled in those corners, faint scanlines near the edges, the ghost of old
// lines burned into the glass, and one slow sweep line.
//
// Day is the paper it printed on: pale green-grey fanfold with ruled bands,
// a perforated tractor strip and feed holes down both sides. It feeds up
// slowly while Claude works.
//
// The middle of the frame is where the words sit, so it holds only soft
// gradients. All the character keeps to the corners and the outer edges.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(3)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

// Rows of short bars that read as lines of a listing, with no letters in them.
// Each row is a few "words" of whole character cells.
const listing = (x: number, y: number, rows: number, width: number, cell: number, line: number, cls: string) => {
  let out = ''

  for (let row = 0; row < rows; row += 1) {
    const indent = random() < 0.35 ? Math.floor(between(1, 4)) * 2 : 0
    let at = indent
    const end = Math.floor(between(width * 0.35, width))

    if (random() < 0.12) continue

    while (at < end) {
      const word = Math.max(2, Math.floor(between(2, 9)))
      const stop = Math.min(at + word, end)
      const left = round(x + at * cell)
      const top = round(y + row * line)
      const width = round((stop - at) * cell - 3)
      // Printed rows are struck as columns of dots, so they are lines with a dash.
      out += cls.startsWith('ink')
        ? `<line class="${cls}" x1="${left}" y1="${round(top + line * 0.23)}" x2="${round(left + width)}" y2="${round(top + line * 0.23)}"/>`
        : `<rect class="${cls}" x="${left}" y="${top}" width="${width}" height="${round(line * 0.46)}" rx="2"/>`
      at = stop + 1
    }
  }

  return out
}

// NIGHT ------------------------------------------------------------------

// The glass of the tube: a big rounded shape just inside the frame.
const TUBE_SOFT = 'x="24" y="30" width="1552" height="940" rx="150"'

// Scanlines, one band every six units, shown only near the edges by a mask.
const SCANLINES = Array.from({ length: 167 }, (_, i) => `<rect class="scan" x="0" y="${i * 6}" width="1600" height="2.4"/>`).join('')

// The ghost of old lines burned into the glass, top left and bottom right,
// with a block cursor that fades slowly after the last line.
const GHOST =
  listing(96, 92, 9, 17, 14, 26, 'ghost') +
  listing(1250, 96, 4, 17, 14, 26, 'ghost faint') +
  listing(1262, 694, 7, 17, 14, 26, 'ghost') +
  listing(92, 760, 3, 13, 14, 26, 'ghost faint')
const CURSOR = `<rect class="cursor" x="1262" y="878" width="12" height="15" rx="2"/>`

// Glow pooled in the corners of the tube. Each breathes on its own clock.
const GLOWS = [
  { x: 150, y: 150, r: 540, n: 0, k: '', c: 'y' },
  { x: 1470, y: 130, r: 380, n: 1, k: ' soft', c: 'g' },
  { x: 1460, y: 860, r: 580, n: 2, k: '', c: 'g' },
  { x: 140, y: 880, r: 420, n: 3, k: ' soft', c: 't' },
]
  .map(g => `<circle class="glow b${g.n}${g.k}" cx="${g.x}" cy="${g.y}" r="${g.r}" fill="url(#phosphor-glow-${g.c})"/>`)
  .join('')

const NIGHT =
  `<g class="night">` +
  `<rect width="1600" height="1000" fill="url(#phosphor-screen)"/>` +
  `<g>${GLOWS}</g>` +
  `<g mask="url(#phosphor-edges)">${SCANLINES}</g>` +
  `<g>${GHOST}${CURSOR}</g>` +
  // The sweep: a soft trail that ends in a brighter edge, strongest at the sides.
  `<g mask="url(#phosphor-sides)"><g class="sweep"><rect y="-150" width="1600" height="150" fill="url(#phosphor-trail)"/><rect class="edge" y="-3" width="1600" height="3"/></g></g>` +
  // The curved glass: a sheen across the upper left and a dark fall-off at the rim.
  `<path class="sheen" d="M24 330Q60 90 300 40L760 30Q330 90 170 260Q90 350 24 500Z" fill="url(#phosphor-sheen)"/>` +
  `<rect ${TUBE_SOFT} fill="url(#phosphor-rim)"/>` +
  // The bezel around the glass, and a thin catch of light on its inner lip.
  `<path class="bezel" fill-rule="evenodd" d="M0 0H1600V1000H0Z M174 30H1426A150 150 0 0 1 1576 180V820A150 150 0 0 1 1426 970H174A150 150 0 0 1 24 820V180A150 150 0 0 1 174 30Z"/>` +
  `<rect class="lip" ${TUBE_SOFT}/>` +
  `</g>`

// DAY --------------------------------------------------------------------

// One page of fanfold paper, 1200 tall, drawn twice so it can feed up
// by exactly one page and loop without a seam.
const PAGE = 1200
const BAND = 120
const HOLE = 40

const bands = Array.from({ length: PAGE / BAND }, (_, i) => `<rect class="band" x="0" y="${i * BAND}" width="1600" height="${BAND / 2}"/>`).join('')
// A thin ruled line where each band meets the paper.
const rules = Array.from({ length: (PAGE / BAND) * 2 }, (_, i) => `<rect class="rule" x="100" y="${i * (BAND / 2) - 0.6}" width="1400" height="1.2"/>`).join('')
const holes = Array.from({ length: PAGE / HOLE }, (_, i) => {
  const y = i * HOLE + HOLE / 2

  return (
    `<circle class="hole" cx="54" cy="${y}" r="9.5"/><circle class="hole" cx="1546" cy="${y}" r="9.5"/>` +
    `<path class="hole-lip" d="M45 ${y + 2}A9.5 9.5 0 0 0 63 ${y + 2}M1537 ${y + 2}A9.5 9.5 0 0 0 1555 ${y + 2}"/>`
  )
}).join('')

// Printed lines in the margins only, faint grey-green ink.
const printed =
  listing(140, 88, 10, 16, 13, 30, 'ink') +
  listing(1250, 140, 3, 16, 13, 30, 'ink faint') +
  listing(1250, 600, 11, 16, 13, 30, 'ink') +
  listing(140, 760, 4, 14, 13, 30, 'ink faint') +
  listing(140, 1020, 5, 16, 13, 30, 'ink')

const PAPER_PAGE =
  `<g id="phosphor-page">${bands}${rules}` +
  `<rect class="strip" width="100" height="${PAGE}"/><rect class="strip" x="1500" width="100" height="${PAGE}"/>` +
  // The fold between pages: a faint crease and its perforation.
  `<rect class="crease" x="0" y="${PAGE - 14}" width="1600" height="14" fill="url(#phosphor-crease)"/>` +
  `<line class="perf" x1="0" y1="${PAGE}" x2="1600" y2="${PAGE}"/>` +
  `${printed}${holes}</g>`

const DAY =
  `<g class="day">` +
  `<rect width="1600" height="1000" class="paper"/>` +
  `<g class="feed">${PAPER_PAGE}<use href="#phosphor-page" y="${PAGE}"/></g>` +
  // The tractor strips: a perforated line where they tear off.
  `<line class="perf" x1="100" y1="0" x2="100" y2="1000"/><line class="perf" x1="1500" y1="0" x2="1500" y2="1000"/>` +
  // Light falling across the paper, and soft shade where it curls at the sides.
  `<g>${[
    { x: 1500, y: 60, r: 700, n: 1 },
    { x: 120, y: 120, r: 480, n: 0 },
  ]
    .map(g => `<circle class="warm b${g.n}" cx="${g.x}" cy="${g.y}" r="${g.r}" fill="url(#phosphor-warm)"/>`)
    .join('')}</g>` +
  `<rect width="1600" height="1000" fill="url(#phosphor-curl)"/>` +
  `<circle class="shade b2" cx="80" cy="1000" r="560" fill="url(#phosphor-shade)"/><circle class="shade b3" cx="1560" cy="1000" r="420" fill="url(#phosphor-shade)"/>` +
  `</g>`

const STYLE = `
svg{--glow:#5fb173;--glow-y:#8fbf62;--glow-t:#4fae92;--glow-a:.7;--scan:#0d150f;--scan-a:.5;--ghost:#7fcf8f;--ghost-a:.1;--sweep:#86d896;--edge-a:.22;--bezel:#0c120e;--lip:#7fbf8c;--sheen:#cfeed6;--rim:#0b110c;--s-top:#1c281e;--s-mid:#1a251c;--s-edge:#141d16;--paper:#e7f0e6;--band:#d8e8d6;--perf:#9fb2a0;--hole:#a7b6a6;--hole-lip:#f6fbf5;--ink:#2f4d37;--ink-a:.24;--warm:#fbfdf2;--curl:#97ab98;--strip:#e0eadf}
.night{display:none}
@media (prefers-color-scheme:dark){svg{--paper:#19241b}.night{display:inline}.day{display:none}}
.st{stop-color:var(--s-top)}.sm{stop-color:var(--s-mid)}.se{stop-color:var(--s-edge)}
.gg{stop-color:var(--glow)}.gy{stop-color:var(--glow-y)}.gt{stop-color:var(--glow-t)}.gs{stop-color:var(--sweep)}.gh{stop-color:var(--sheen)}.gr{stop-color:var(--rim)}.gw{stop-color:var(--warm)}.gc{stop-color:var(--curl)}
.mw{stop-color:#fff}
.glow{opacity:var(--glow-a);animation:breathe 11s ease-in-out infinite}.glow.soft{--glow-a:.4}
.b1{animation-duration:13s;animation-delay:-4s}.b2{animation-duration:15s;animation-delay:-9s}.b3{animation-duration:12s;animation-delay:-2s}
.scan{fill:var(--scan);fill-opacity:var(--scan-a)}
.ghost{fill:var(--ghost);fill-opacity:var(--ghost-a)}.ghost.faint{fill-opacity:calc(var(--ghost-a)*.6)}
.cursor{fill:var(--ghost);opacity:.3;animation:cursor 3.2s ease-in-out infinite}
.sweep{animation:sweep 26s linear infinite;animation-delay:-8s}
.edge{fill:var(--sweep);fill-opacity:var(--edge-a)}
.sheen{opacity:.05}
.bezel{fill:var(--bezel)}
.lip{fill:none;stroke:var(--lip);stroke-opacity:.22;stroke-width:2.5}
.paper{fill:var(--paper)}
.band{fill:var(--band)}.strip{fill:var(--strip)}.rule{fill:var(--perf);fill-opacity:.35}
.perf{stroke:var(--perf);stroke-width:1.4;stroke-dasharray:3 6;stroke-opacity:.8}
.hole{fill:var(--hole)}
.hole-lip{fill:none;stroke:var(--hole-lip);stroke-width:1.4;stroke-opacity:.9}
.ink{stroke:var(--ink);stroke-opacity:var(--ink-a);stroke-width:11;stroke-dasharray:2.2 1.6}.ink.faint{stroke-opacity:calc(var(--ink-a)*.6)}
.feed{animation:feed 300s linear infinite;animation-delay:-54s}
.warm{opacity:.7;animation:breathe 14s ease-in-out infinite}.shade{opacity:.5;animation:breathe 16s ease-in-out infinite}.shade{--glow-a:.5}
@keyframes breathe{0%,100%{opacity:var(--glow-a)}50%{opacity:calc(var(--glow-a)*.62)}}
.warm{--glow-a:.7}
@keyframes cursor{0%,100%{opacity:.3}50%{opacity:.08}}
@keyframes sweep{from{transform:translateY(0)}to{transform:translateY(1150px)}}
@keyframes feed{from{transform:translateY(0)}to{transform:translateY(-${PAGE}px)}}
.still .glow,.still .cursor,.still .sweep,.still .feed,.still .warm,.still .shade{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.glow,.cursor,.sweep,.feed,.warm,.shade{animation:none}}
`.replace(/\n/g, '')

const DEFS =
  `<defs>` +
  `<radialGradient id="phosphor-screen" cx=".5" cy=".46" r=".72"><stop offset="0" class="st"/><stop offset=".6" class="sm"/><stop offset="1" class="se"/></radialGradient>` +
  ['g', 'y', 't']
    .map(
      c =>
        `<radialGradient id="phosphor-glow-${c}"><stop offset="0" class="g${c}" stop-opacity=".8"/><stop offset=".25" class="g${c}" stop-opacity=".38"/><stop offset=".6" class="g${c}" stop-opacity=".07"/><stop offset="1" class="g${c}" stop-opacity="0"/></radialGradient>`,
    )
    .join('') +
  `<linearGradient id="phosphor-trail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="gs" stop-opacity="0"/><stop offset=".85" class="gs" stop-opacity=".05"/><stop offset="1" class="gs" stop-opacity=".1"/></linearGradient>` +
  `<linearGradient id="phosphor-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="gh" stop-opacity="1"/><stop offset="1" class="gh" stop-opacity="0"/></linearGradient>` +
  `<radialGradient id="phosphor-rim" cx=".5" cy=".5" r=".62"><stop offset=".7" class="gr" stop-opacity="0"/><stop offset="1" class="gr" stop-opacity=".75"/></radialGradient>` +
  `<radialGradient id="phosphor-warm"><stop offset="0" class="gw" stop-opacity=".9"/><stop offset="1" class="gw" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="phosphor-curl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="gc" stop-opacity=".55"/><stop offset=".1" class="gc" stop-opacity=".08"/><stop offset=".18" class="gc" stop-opacity="0"/><stop offset=".82" class="gc" stop-opacity="0"/><stop offset=".9" class="gc" stop-opacity=".08"/><stop offset="1" class="gc" stop-opacity=".55"/></linearGradient>` +
  `<radialGradient id="phosphor-shade"><stop offset="0" class="gc" stop-opacity=".55"/><stop offset="1" class="gc" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="phosphor-crease" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="gc" stop-opacity="0"/><stop offset="1" class="gc" stop-opacity=".25"/></linearGradient>` +
  // Masks: scanlines show near the edges, the sweep is strongest at the sides.
  `<radialGradient id="phosphor-edge-fade" cx=".5" cy=".5" r=".7"><stop offset=".45" class="mw" stop-opacity="0"/><stop offset=".95" class="mw" stop-opacity="1"/></radialGradient>` +
  `<mask id="phosphor-edges"><rect width="1600" height="1000" fill="url(#phosphor-edge-fade)"/></mask>` +
  `<linearGradient id="phosphor-side-fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="mw" stop-opacity="1"/><stop offset=".3" class="mw" stop-opacity=".18"/><stop offset=".7" class="mw" stop-opacity=".18"/><stop offset="1" class="mw" stop-opacity="1"/></linearGradient>` +
  `<mask id="phosphor-sides"><rect width="1600" height="1000" fill="url(#phosphor-side-fade)"/></mask>` +
  `</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>${DEFS}` +
  `<rect width="1600" height="1000" class="paper"/>` +
  NIGHT +
  DAY +
  `</svg>`
