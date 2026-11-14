// @ts-check
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'

import { SITE_URL as SITE } from './src/config.ts'

// Writes dist/sitemap.xml from the pages the build produced: every index.html except the ones
// marked noindex. No dependency, and it cannot miss a page.
const sitemap = () => ({
  name: 'tessera-sitemap',
  hooks: {
    /** @param {{ dir: URL }} options */
    'astro:build:done': ({ dir }) => {
      const root = fileURLToPath(dir)
      /** @type {string[]} */
      const paths = []
      /** @param {string} folder @param {string} rel */
      const walk = (folder, rel) => {
        for (const entry of readdirSync(folder, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            walk(join(folder, entry.name), `${rel}${entry.name}/`)
          } else if (entry.name === 'index.html') {
            const html = readFileSync(join(folder, entry.name), 'utf8')
            if (!/<meta name="robots" content="noindex"/.test(html)) paths.push(`/${rel}`)
          }
        }
      }
      walk(root, '')
      paths.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
      const urls = paths.map(path => `  <url><loc>${SITE}${path}</loc><priority>${path === '/' ? '1.0' : '0.8'}</priority></url>`)
      writeFileSync(
        join(root, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
      )
    },
  },
})

// Static output: every page is prerendered HTML in dist/, which the box's edge serves.
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  devToolbar: { enabled: false },
  prefetch: false,
  integrations: [sitemap()],
})
