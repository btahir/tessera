// The one place the site's addresses live. Change REPO when the repository moves.

/** GitHub owner/name. It is also the marketplace people add in the app. */
export const REPO = 'btahir/tessera'

/** Where the site is served. Canonical links, share images and the sitemap use it. */
export const SITE_URL = 'https://tessera.shiptiffin.app'

export const SITE_NAME = 'Tessera'
export const REPO_URL = `https://github.com/${REPO}`
export const SPONSOR_URL = 'https://shiptiffin.com'

/** The plugin that carries every plate, and its command. */
export const PLUGIN = 'tessera'

/** Absolute address for a site path such as "/pluvia/". */
export const abs = (path: string) => new URL(path, SITE_URL).toString()
