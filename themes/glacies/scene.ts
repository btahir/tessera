// Ice. One SVG for both modes: the colors are CSS variables that a
// prefers-color-scheme rule swaps, so night is blue grey ice on a cold page and
// day is pale frosted ice on an off white one.
//
// Two opposite corners, top left and bottom right, each hold a cluster of
// large flat facets, like the planes of a cut crystal. Each cluster is built
// on a broken radial grid: rays leave the corner, rings cross them at uneven
// radii, and each cell is cut into one or two flat planes. A wider and fainter
// cluster sits behind the near one, so the planes look stacked. Every plane
// takes one of a few close tones and a hairline edge.
//
// While Claude works a soft band of light slides across the near planes, one
// plane at a time, by translating a gradient strip clipped to that plane.
// Only transforms move. The middle of the page is a plain soft gradient.

// A small seeded generator, so the scene is the same on every load.
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296

  return seed / 4294967296
}

const round = (n: number) => Math.round(n * 10) / 10

type Point = [number, number]
type Plane = { points: Point[]; tone: number; ring: number }

// One cluster of planes around the origin, reaching into +x and +y.
// rings are the radii where the grid is cut; the last ring is jagged.
const cluster = (seed: number, rings: number[], rays: number, jag: number) => {
  const random = seeded(seed)
  const between = (low: number, high: number) => low + random() * (high - low)

  // Ray angles from -4 to 94 degrees, unevenly spaced.
  const angles: number[] = []
  for (let j = 0; j <= rays; j += 1) {
    const even = -4 + (98 * j) / rays
    angles.push(j === 0 || j === rays ? even : even + between(-4, 4))
  }

  // The grid of points. Ring 0 is the corner itself.
  const grid: Point[][] = rings.map((r, i) =>
    angles.map(a => {
      if (r === 0) return [0, 0] as Point
      const last = i === rings.length - 1
      const reach = r * (last ? between(1 - jag, 1 + jag) : between(0.9, 1.1))
      const t = (a * Math.PI) / 180

      return [round(reach * Math.cos(t)), round(reach * Math.sin(t))] as Point
    }),
  )

  const planes: Plane[] = []
  for (let i = 0; i < rings.length - 1; i += 1) {
    for (let j = 0; j < rays; j += 1) {
      const a = grid[i]![j]!
      const b = grid[i]![j + 1]!
      const c = grid[i + 1]![j + 1]!
      const d = grid[i + 1]![j]!
      const plane = (points: Point[]) => ({ points, tone: Math.floor(random() * 4), ring: i })
      if (i === 0) {
        planes.push(plane([a, c, d]))
      } else if (random() < 0.35) {
        planes.push(plane([a, b, c, d]))
      } else if (random() < 0.5) {
        planes.push(plane([a, b, c]), plane([a, c, d]))
      } else {
        planes.push(plane([a, b, d]), plane([b, c, d]))
      }
    }
  }

  // Neighbors with the same tone merge into one plane to the eye, so nudge
  // each plane off the tone of the one before it.
  for (let k = 1; k < planes.length; k += 1) {
    if (planes[k]!.tone === planes[k - 1]!.tone) planes[k]!.tone = (planes[k]!.tone + 1 + Math.floor(random() * 3)) % 4
  }

  return planes
}

const pathOf = (points: Point[]) => `M${points.map(p => `${p[0]} ${p[1]}`).join('L')}Z`

const area = (points: Point[]) => {
  let sum = 0
  for (let k = 0; k < points.length; k += 1) {
    const [x1, y1] = points[k]!
    const [x2, y2] = points[(k + 1) % points.length]!
    sum += x1 * y2 - x2 * y1
  }

  return Math.abs(sum) / 2
}

const centroid = (points: Point[]): Point => [
  points.reduce((s, p) => s + p[0], 0) / points.length,
  points.reduce((s, p) => s + p[1], 0) / points.length,
]

// The sheen: how long one full pass takes, and how long each plane holds it.
const CYCLE = 40
const clips: string[] = []
const sheenRules: string[] = []

// Picks the larger near planes, orders them outward from the corner, and lays
// a band of light over each in turn.
const sheen = (planes: Plane[], prefix: string, phase: number, count: number) => {
  const chosen = planes
    .map(plane => ({ plane, size: area(plane.points), at: centroid(plane.points) }))
    .filter(p => p.size > 6000 && Math.hypot(p.at[0], p.at[1]) > 110 && Math.hypot(p.at[0], p.at[1]) < 420)
    .sort((a, b) => b.size - a.size)
    .slice(0, count)
    .sort((a, b) => Math.atan2(a.at[1], a.at[0]) - Math.atan2(b.at[1], b.at[0]))

  return chosen
    .map(({ plane, at }, k) => {
      const id = `glacies-${prefix}${k}`
      const n = sheenRules.length
      const delay = round(-(((CYCLE - k * (CYCLE / count) + phase) % CYCLE + CYCLE) % CYCLE))
      clips.push(`<clipPath id="${id}"><path d="${pathOf(plane.points)}"/></clipPath>`)
      sheenRules.push(`.s${n}{animation-delay:${delay}s}`)

      return (
        `<g clip-path="url(#${id})"><g transform="translate(${round(at[0])} ${round(at[1])}) rotate(-24)">` +
        `<rect class="band s${n}" x="-130" y="-500" width="260" height="1000" fill="url(#glacies-band)"/></g></g>`
      )
    })
    .join('')
}

// Planes are grouped by tone and by ring, so the hairlines can fade outward:
// crisp near the corner, almost gone where the ice meets the open page.
const draw = (planes: Plane[], layer: string) =>
  [0, 1, 2, 3]
    .flatMap(tone =>
      [0, 1, 2, 3].map(ring => {
        const d = planes
          .filter(p => p.tone === tone && p.ring === ring)
          .map(p => pathOf(p.points))
          .join('')

        return d ? `<path class="${layer} t${tone} r${ring}" d="${d}"/>` : ''
      }),
    )
    .join('')

const corner = (seed: number, prefix: string, phase: number) => {
  const back = cluster(seed + 7, [0, 360, 580, 700], 4, 0.14)
  const near = cluster(seed, [0, 220, 400, 530], 5, 0.18)

  return (
    `<path d="M0 0L900 0A900 900 0 0 1 0 900Z" fill="url(#glacies-mist)"/>` +
    draw(back, 'far') +
    draw(near, 'near') +
    sheen(near, prefix, phase, 8)
  )
}

// Built first, so every sheen rule and clip exists before the style is written.
const ART =
  `<g transform="translate(0 0)">${corner(5, 'a', 0)}</g>` +
  `<g transform="translate(1600 1000) rotate(180)">${corner(23, 'b', CYCLE / 18)}</g>`

const STYLE =
  `
svg{--top:#e9eff5;--bottom:#e2e9f1;--mid:#edf2f7;--mist:#d4dfea;--f0:#dfe7ef;--f1:#e8eef5;--f2:#d9e2ec;--f3:#eef3f8;--n0:#d1dde9;--n1:#e2eaf3;--n2:#c7d5e4;--n3:#edf3f9;--edge:#f7fafd;--edge-mid:#f3f7fb;--edge-far:#eef3f8;--sheen:#ffffff;--sheen-a:.7}
@media (prefers-color-scheme:dark){svg{--top:#222a33;--bottom:#252d37;--mid:#27303a;--mist:#2b3540;--f0:#27303a;--f1:#2a333e;--f2:#262e38;--f3:#2d3742;--n0:#2b3642;--n1:#313c49;--n2:#28323e;--n3:#364352;--edge:#4f5d6c;--edge-mid:#414d5a;--edge-far:#333d48;--sheen:#a9c3d8;--sheen-a:.26}}
.top{stop-color:var(--top)}.bottom{stop-color:var(--bottom)}.mid{stop-color:var(--mid)}.ms{stop-color:var(--mist)}.sh{stop-color:var(--sheen)}
.far{stroke:var(--edge-far);stroke-width:1;stroke-linejoin:round}
.near{stroke:var(--edge);stroke-width:1.2;stroke-linejoin:round}.near.r2{stroke:var(--edge-mid)}.near.r3{stroke:var(--edge-far)}
.far.t0{fill:var(--f0)}.far.t1{fill:var(--f1)}.far.t2{fill:var(--f2)}.far.t3{fill:var(--f3)}
.near.t0{fill:var(--n0)}.near.t1{fill:var(--n1)}.near.t2{fill:var(--n2)}.near.t3{fill:var(--n3)}
.band{opacity:var(--sheen-a);transform:translateX(-360px);animation:slide ${CYCLE}s linear infinite}
${sheenRules.join('')}
@keyframes slide{0%{transform:translateX(-360px)}16%{transform:translateX(360px)}100%{transform:translateX(360px)}}
.still .band{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.band{animation:none}}
`.replace(/\n/g, '')

/** The scene with its motion running. Add class "still" to the root to hold it. */
export const SCENE =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` +
  `<style>${STYLE}</style>` +
  `<defs>` +
  `<linearGradient id="glacies-sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="top"/><stop offset="1" class="bottom"/></linearGradient>` +
  `<radialGradient id="glacies-lamp" cx=".5" cy=".45" r=".5"><stop offset="0" class="mid"/><stop offset="1" class="mid" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="glacies-mist" cx="0" cy="0" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" class="ms"/><stop offset="1" class="ms" stop-opacity="0"/></radialGradient>` +
  `<linearGradient id="glacies-band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="sh" stop-opacity="0"/><stop offset=".5" class="sh" stop-opacity=".9"/><stop offset="1" class="sh" stop-opacity="0"/></linearGradient>` +
  clips.join('') +
  `</defs>` +
  `<rect width="1600" height="1000" fill="url(#glacies-sky)"/>` +
  `<rect width="1600" height="1000" fill="url(#glacies-lamp)"/>` +
  ART +
  `</svg>`
