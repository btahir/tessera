// Rewrites the plates section of README.md from themes/.
//
//   bun scripts/readme.ts
//
// Everything between the two "plates" comment markers in README.md is replaced.

import { join } from 'node:path'

import { loadThemes, root, type Family, type LoadedTheme } from './themes'

const SITE = 'https://tessera.shiptiffin.app'
const START = '<!-- plates:start -->'
const END = '<!-- plates:end -->'
const COLUMNS = 3

const WINGS: { family: Family; title: string; line: string }[] = [
  { family: 'essential', title: 'Essentials', line: 'Clean defaults with little or no scenery.' },
  { family: 'bold', title: 'Bold', line: 'Graphic themes with attitude.' },
  { family: 'place', title: 'Places', line: 'Soft scenes.' },
]

const themes = await loadThemes()

const cell = (theme: LoadedTheme) => {
  const kin = theme.kin.length > 0 ? `<br><sub><em>If you like ${theme.kin.join(' or ')}.</em></sub>` : ''

  return [
    `    <td width="33%" valign="top"><a href="${SITE}/${theme.name}/"><img src="site/public/og/${theme.name}.png" alt="${theme.title}"></a><br>`,
    `<strong>${theme.numeral}. ${theme.title}</strong> · ${theme.meaning}<br>`,
    `<sub>${theme.tagline}</sub>${kin}</td>`,
  ].join('')
}

const wing = ({ family, title, line }: (typeof WINGS)[number]) => {
  const hung = themes.filter(theme => theme.family === family)
  const rows = []

  for (let i = 0; i < hung.length; i += COLUMNS) {
    rows.push(`  <tr>\n${hung.slice(i, i + COLUMNS).map(cell).join('\n')}\n  </tr>`)
  }

  return `### ${title}\n\n${line}\n\n<table>\n${rows.join('\n')}\n</table>`
}

const path = join(root, 'README.md')
const readme = await Bun.file(path).text()
const from = readme.indexOf(START)
const to = readme.indexOf(END)

if (from === -1 || to === -1) {
  console.error(`README.md needs the markers ${START} and ${END}`)
  process.exit(1)
}

const plates = WINGS.map(wing).join('\n\n')
await Bun.write(path, `${readme.slice(0, from + START.length)}\n\n${plates}\n\n${readme.slice(to)}`)
console.log(`README plates rewritten: ${themes.length} themes`)
