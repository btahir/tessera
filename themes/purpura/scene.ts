// A theatre at night. One SVG for both modes: the colors are CSS variables that a
// prefers-color-scheme rule swaps, so night is plum velvet on a blue violet dark and
// day is orchid velvet on pale lilac.
//
// Heavy curtains hang down the far left and right edges as flat vertical bands,
// each fold drawn as a shadow, a body, a lit face and a thin sheen. A swagged
// valance runs across the top in tones close to the page. Stage light glows low
// in the two bottom corners, pink on one side and cyan on the other, and a few
// small four point glints sit near the velvet. The middle is a soft gradient only.
//
// While Claude works each curtain sways a little from its rod, the lit faces of
// the folds brighten in a slow ripple, the glows breathe and the glints pulse.
// Every motion is a transform or an opacity.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const random = seeded(23)
const between = (low: number, high: number) => low + random() * (high - low)
const round = (n: number) => Math.round(n * 10) / 10

const TOP = -20
const BOTTOM = 1040

// The folds of one curtain, laid out from the outer edge inward. Each fold is a
// tall quad, a little narrower at the rod than at the floor, so the cloth fans.
type Fold = { t0: number; t1: number; b0: number; b1: number }
const layFolds = (): Fold[] => {
  const folds: Fold[] = []
  let top = -60
  let bottom = -60
  while (bottom < 300) {
    const w = between(56, 80)
    const tw = w * between(0.62, 0.74)
    folds.push({ t0: top, t1: top + tw, b0: bottom, b1: bottom + w })
    top += tw
    bottom += w
  }

  return folds
}

// A strip of a fold between fractions f0 and f1 of its width.
const strip = (fold: Fold, f0: number, f1: number) => {
  const tx = (f: number) => round(fold.t0 + (fold.t1 - fold.t0) * f)
  const bx = (f: number) => round(fold.b0 + (fold.b1 - fold.b0) * f)

  return `M${tx(f0)} ${TOP}L${tx(f1)} ${TOP}L${bx(f1)} ${BOTTOM}L${bx(f0)} ${BOTTOM}Z`
}

const ripple: string[] = []
const curtain = (side: 'l' | 'r', offset: number) => {
  const folds = layFolds()
  const body = folds.map(f => strip(f, 0, 1)).join('')
  const shade = folds.map(f => strip(f, 0, 0.3)).join('')
  const crease = folds.map(f => strip(f, 0, 0.1)).join('')
  const last = folds[folds.length - 1]!
  // The inner edge: a deep hem and a thin trim line that catches the light.
  const hem = `M${round(last.t1 - 10)} ${TOP}L${round(last.t1)} ${TOP}L${round(last.b1)} ${BOTTOM}L${round(last.b1 - 14)} ${BOTTOM}Z`
  const trim = `M${round(last.t1 - 4)} ${TOP}L${round(last.b1 - 6)} ${BOTTOM}`
  const faces = folds
    .map((f, i) => {
      const n = ripple.length
      const seconds = 9
      ripple.push(`.f${n}{animation-delay:-${round(((i * 0.9 + offset * 9) % seconds) + 0.01)}s}`)

      return `<path class="face f${n}" d="${strip(f, 0.44, 0.8)}"/><path class="sheen f${n}" d="${strip(f, 0.58, 0.64)}"/>`
    })
    .join('')

  return (
    `<g class="curtain sway-${side}">` +
    `<path class="velvet" d="${body}"/>` +
    `<path class="shade" d="${shade}"/>` +
    `<path class="crease" d="${crease}"/>` +
    faces +
    `<path class="hem" d="${hem}"/>` +
    `<path class="trim" d="${trim}"/>` +
    `</g>`
  )
}

// The valance: a band across the top with swags hanging in a row.
const valance = () => {
  const swags = 8
  const width = 1600 / swags
  let d = `M0 -10H1600V44`
  for (let i = swags - 1; i >= 0; i -= 1) {
    const x0 = i * width
    d += `L${round(x0 + width)} 44Q${round(x0 + width / 2)} 132 ${round(x0)} 44`
  }
  d += 'Z'
  let lines = ''
  for (let i = 0; i < swags; i += 1) {
    const x0 = i * width
    lines += `M${round(x0 + 10)} 50Q${round(x0 + width / 2)} 118 ${round(x0 + width - 10)} 50`
  }

  return `<path class="valance" d="${d}"/><path class="swag" d="${lines}"/>`
}

// Four point glints, each with its own color, pace and starting point.
const glintRules: string[] = []
const star = (r: number) => {
  const k = r * 0.22

  return `M0 ${-r}Q${k} ${-k} ${r} 0Q${k} ${k} 0 ${r}Q${-k} ${k} ${-r} 0Q${-k} ${-k} 0 ${-r}Z`
}
const GLINTS: [number, number, number, string][] = [
  // x, y, size, color
  [312, 190, 13, 'ga'], [352, 420, 8, 'gb'], [300, 640, 10, 'gc'], [362, 830, 7, 'gd'],
  [128, 160, 7, 'ge'], [210, 560, 6, 'gb'], [96, 860, 9, 'ga'],
  [1290, 230, 11, 'gc'], [1250, 470, 7, 'ga'], [1302, 700, 12, 'gd'], [1238, 860, 8, 'ge'],
  [1480, 150, 8, 'gb'], [1392, 610, 6, 'gc'], [1510, 820, 9, 'ga'],
  [70, 70, 8, 'gd'], [1530, 70, 8, 'ge'],
]
const glints = GLINTS.map(([x, y, size, color], i) => {
  const seconds = round(between(4.5, 8))
  glintRules.push(`.k${i}{animation-duration:${seconds}s;animation-delay:-${round(seconds * random())}s}`)

  return `<g transform="translate(${x} ${y})"><g class="glint ${color} k${i}"><path class="spark" d="${star(size)}"/></g></g>`
}).join('')

const ART =
  `<g transform="translate(0 0)">${curtain('l', 0)}</g>` +
  `<g transform="translate(1600 0) scale(-1 1)">${curtain('r', 0.5)}</g>` +
  valance() +
  glints

const STYLE =
  `
svg{--top:#ece5fa;--bottom:#efe9fc;--mid:#f4f0ff;--floor:#e9e1f7;--edge:#ddd1f0;--v0:#c09ad8;--v1:#d4b6e8;--v2:#e2cbf2;--face:#e2ccf3;--sheen:#ecdaf8;--hem:#b58bcf;--trim:#e8a6cf;--val:#e4d9f5;--swag:#d6c6ee;--pink:#f28dc0;--cyan:#7fd8e6;--glow-a:.5;--ga:#c46ef2;--gb:#ef4f8e;--gc:#18b9c9;--gd:#e7801f;--ge:#2fb860}
@media (prefers-color-scheme:dark){svg{--top:#1d1c2e;--bottom:#222033;--mid:#252438;--floor:#1c1a2c;--edge:#2c2940;--v0:#230f33;--v1:#361a50;--v2:#3e2056;--face:#5a2b80;--sheen:#8048b0;--hem:#160b20;--trim:#e05aa4;--val:#1e1c30;--swag:#2a2840;--pink:#d03c8c;--cyan:#1a9db4;--glow-a:.46;--ga:#c98bff;--gb:#ff6c9c;--gc:#4fe3f0;--gd:#ffa25c;--ge:#62e885}}
.top{stop-color:var(--top)}.bottom{stop-color:var(--bottom)}.mid{stop-color:var(--mid)}.fl{stop-color:var(--floor)}
.gp{stop-color:var(--pink)}.gq{stop-color:var(--cyan)}
.glow{opacity:var(--glow-a);transform-box:fill-box;transform-origin:50% 100%;animation:breathe 12s ease-in-out infinite}.glow.q{animation-delay:-6s}
.stage{fill:none;stroke:var(--edge);stroke-width:2}
.curtain{transform-box:view-box;transform-origin:0 0}
.sway-l{animation:sway 13s ease-in-out infinite}.sway-r{animation:sway 15s ease-in-out infinite;animation-delay:-7s}
.velvet{fill:var(--v1)}.shade{fill:var(--v0)}.crease{fill:var(--hem);opacity:.7}
.face{fill:var(--face);animation:ripple 9s ease-in-out infinite}
.sheen{fill:var(--sheen);opacity:.55;animation:ripple 9s ease-in-out infinite}
.hem{fill:var(--hem)}.trim{fill:none;stroke:var(--trim);stroke-width:2.4;opacity:.8}
.valance{fill:var(--val)}.swag{fill:none;stroke:var(--swag);stroke-width:3}
.glint{transform-box:fill-box;transform-origin:50% 50%;animation:twinkle 6s ease-in-out infinite}
.ga{fill:var(--ga)}.gb{fill:var(--gb)}.gc{fill:var(--gc)}.gd{fill:var(--gd)}.ge{fill:var(--ge)}
${ripple.join('')}${glintRules.join('')}
@keyframes sway{0%,100%{transform:skewX(0deg)}30%{transform:skewX(.55deg)}70%{transform:skewX(-.35deg)}}
@keyframes ripple{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes breathe{0%,100%{opacity:var(--glow-a);transform:scale(1)}50%{opacity:calc(var(--glow-a)*.7);transform:scale(.94)}}
@keyframes twinkle{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:1;transform:scale(1.08)}}
.still .curtain,.still .face,.still .sheen,.still .glow,.still .glint{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.curtain,.face,.sheen,.glow,.glint{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  `<linearGradient id="purpura-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="top"/><stop offset=".86" class="bottom"/><stop offset="1" class="fl"/></linearGradient>` +
  `<radialGradient id="purpura-lamp" cx=".5" cy=".45" r=".5"><stop offset="0" class="mid"/><stop offset="1" class="mid" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="purpura-pink"><stop offset="0" class="gp" stop-opacity=".9"/><stop offset=".45" class="gp" stop-opacity=".35"/><stop offset="1" class="gp" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="purpura-cyan"><stop offset="0" class="gq" stop-opacity=".9"/><stop offset=".45" class="gq" stop-opacity=".35"/><stop offset="1" class="gq" stop-opacity="0"/></radialGradient>` +
  `</defs>` +
  `<rect width="1600" height="1000" fill="url(#purpura-sky)"/>` +
  `<rect width="1600" height="1000" fill="url(#purpura-lamp)"/>` +
  `<ellipse class="glow" cx="340" cy="1010" rx="520" ry="380" fill="url(#purpura-pink)"/>` +
  `<ellipse class="glow q" cx="1260" cy="1010" rx="520" ry="380" fill="url(#purpura-cyan)"/>` +
  `<path class="stage" d="M0 952H1600"/>` +
  ART +
  `</svg>`
