// Ash. One SVG, drawn for both modes: the colors are CSS variables that a
// prefers-color-scheme rule swaps, so day is a clean near white sheet and night
// is a graphite one.
//
// Nearly nothing is drawn. The page is flat. A very large, very soft lift of
// light rests in the top left corner and a matching soft shade in the bottom
// right, so the window has a little depth and does not look dead. One hairline
// runs along the top edge. While Claude works the two tones breathe so slowly
// it is barely seen; when the answer is ready they hold still.

const STYLE = `
svg{--page:#f4f7fa;--lift:#fafdff;--lift-alpha:.9;--shade:#e4e7ea;--shade-alpha:.75;--line:#d4d7da;--line-alpha:.9}
@media (prefers-color-scheme:dark){svg{--page:#202225;--lift:#2e3033;--lift-alpha:.8;--shade:#16181b;--shade-alpha:.85;--line:#383a3d;--line-alpha:.8}}
.page{fill:var(--page)}
.gl{stop-color:var(--lift)}.gs{stop-color:var(--shade)}
.lift{opacity:var(--lift-alpha)}.shade{opacity:var(--shade-alpha)}
.line{stroke:var(--line);stroke-opacity:var(--line-alpha);stroke-width:1;fill:none}
.breathe{animation:breathe 64s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.b1{animation-duration:82s;animation-delay:-41s}.b0{animation-delay:-20s}
@keyframes breathe{0%,100%{opacity:1;transform:translate(0,0) scale(1)}50%{opacity:.82;transform:translate(24px,14px) scale(1.04)}}
.still .breathe{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.breathe{animation:none}}
`.replace(/\n/g, '')

// A radial falloff with no visible edge. Opacity follows a smoothstep from the
// center to the rim, sampled at many stops, so the slope never jumps and the eye
// finds no ring to hold on to.
const falloff = (id: string, cls: string) => {
  let stops = ''
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20
    const a = 1 - t * t * (3 - 2 * t)
    stops += `<stop offset="${t}" class="${cls}" stop-opacity="${a.toFixed(3)}"/>`
  }

  return `<radialGradient id="cinis-${id}">${stops}</radialGradient>`
}

const DEFS = `<defs>${falloff('lift', 'gl')}${falloff('shade', 'gs')}</defs>`

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  DEFS +
  `<rect class="page" width="1600" height="1000"/>` +
  `<g class="lift"><ellipse class="breathe b0" cx="120" cy="60" rx="900" ry="640" fill="url(#cinis-lift)"/></g>` +
  `<g class="shade"><ellipse class="breathe b1" cx="1500" cy="980" rx="920" ry="620" fill="url(#cinis-shade)"/></g>` +
  `<path class="line" d="M0 24.5H1600"/>` +
  `</svg>`
