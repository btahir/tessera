// Malva: mallow, the flower mauve is named for. A cafe table seen from above.
// By night a warm mauve charcoal, by day a milky latte with a rose tint. The
// accents are pastels with enough depth to read: lavender, rose, peach, butter
// and sage.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Malva',
  roles: { accent: '#ad93dc', danger: '#e08e97', success: '#83b386', warning: '#e2a074', pro: '#d0bc72' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f6e5de',
        'surface-1': '#f9ebe5',
        'surface-2': '#fbf1ec',
        'text-primary': '#3d2a2f',
        'text-secondary': '#54404a',
        'text-muted': '#665156',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#29212f',
        'surface-1': '#2e2635',
        'surface-2': '#332a3a',
        'surface-3': '#382f3f',
        'text-primary': '#e3dbe8',
        'text-secondary': '#cbc2d0',
        'text-muted': '#b6adbd',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.68 }
