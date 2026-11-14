// Tessera's gallery on ShipTiffin: a static Astro site served at tessera.shiptiffin.app.
// Pushes to main that touch site/ deploy: the box runs `bun run build` in site/ and serves dist/.
// Share images and icons are committed (made by `bun run refresh` in site/), so the build needs no browser.
// Page views are counted at the box's edge; site/src/layouts/Base.astro adds the box's script for click events.
// After an edit: tiffin plan, then tiffin apply --confirm <hash>.
export default {
  project: "tessera",
  apps: {
    site: {
      framework: "static",
      routes: ["tessera"],
      output: "dist",
      git: { repo: "btahir/tessera", branch: "main", path: "site", previews: "off" },
      watch: ["site/**"],
    },
  },
  services: {
    analytics: { retentionDays: 365 },
  },
};
