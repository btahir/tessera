// Indicum: indigo. A far city at 2am, deep navy by night and a cool pale
// blue grey by day, with electric blue, cyan, orange, mint and rose for roles.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Indicum',
  roles: { accent: '#66a5ff', danger: '#ee6e91', success: '#5ed8a9', warning: '#f99549', pro: '#47d2e8' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e8edf5',
        'surface-1': '#edf2f8',
        'surface-2': '#f2f6fb',
        'text-primary': '#262f47',
        'text-secondary': '#3e4862',
        'text-muted': '#55607b',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#171c33',
        'surface-1': '#1b2139',
        'surface-2': '#20263d',
        'surface-3': '#262c44',
        'text-primary': '#dadff1',
        'text-secondary': '#bdc3d8',
        'text-muted': '#a0a7be',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.68 }
