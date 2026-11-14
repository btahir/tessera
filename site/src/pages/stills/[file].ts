// Each scene held on one frame, as an image file: the hero mosaic shows these and swaps in
// the moving file from /scenes/ while a tile has the pointer or focus.
import type { APIRoute, GetStaticPaths } from 'astro'

import { THEMES, modesOf, sceneFor, type Mode, type Theme } from '../../lib/themes'

export const getStaticPaths = (() =>
  THEMES.flatMap(theme => modesOf(theme).map(mode => ({ params: { file: `${theme.name}.${mode}.svg` }, props: { theme, mode } })))) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) => {
  const { theme, mode } = props as { theme: Theme; mode: Mode }

  return new Response(sceneFor(theme, mode), { headers: { 'Content-Type': 'image/svg+xml' } })
}
