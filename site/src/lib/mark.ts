// The Tessera mark: sixteen small stones in a four by four mosaic, one for each plate.
// The favicon, the header and the share images all draw it from here.

const STONES = [
  '#c9b48f', '#8fa3b5', '#b98a72', '#9fb09a',
  '#a99bbd', '#d2c3a6', '#7f9aa0', '#c79c86',
  '#9aab8c', '#c4a77a', '#8c98b8', '#b8a59a',
  '#d0b9a8', '#93a7a0', '#b3967f', '#a6b3c2',
]

/** The mark as an SVG string. `ground` is the color behind the stones. */
export const markSvg = (ground = '#2c2823', size?: number) => {
  const stones = STONES.map((fill, index) => {
    const x = 7 + (index % 4) * 9
    const y = 7 + Math.floor(index / 4) * 9

    return `<rect x="${x}" y="${y}" width="7" height="7" rx="1.2" fill="${fill}"/>`
  }).join('')
  const sized = size === undefined ? '' : ` width="${size}" height="${size}"`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"${sized}><rect width="48" height="48" rx="11" fill="${ground}"/>${stones}</svg>`
}
