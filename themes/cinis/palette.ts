// Cinis: ash. A plain graphite page by night and a clean near white by day,
// with almost no tint. Every neutral comes from one cool grey hue (about 250)
// at a chroma of 0.005 to 0.008, so the greys read as neutral without going dead.
// Surfaces step by about 0.02 of lightness in dark mode, paper on paper.
// The five roles are muted and evenly weighted, so no one of them shouts in code.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Cinis',
  roles: { accent: '#78a6d5', danger: '#cf7f7c', success: '#7cb48a', warning: '#d1aa6e', pro: '#ab91c9' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f4f7fa',
        'surface-1': '#f7f9fc',
        'surface-2': '#f9fbfd',
        'text-primary': '#2a2d30',
        'text-secondary': '#45484c',
        'text-muted': '#5d6165',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#202225',
        'surface-1': '#25272a',
        'surface-2': '#2a2c2f',
        'surface-3': '#303235',
        'text-primary': '#dde0e3',
        'text-secondary': '#bbbec2',
        'text-muted': '#a0a3a7',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.7 }
