// Purpura: a theatre at night. A blue violet charcoal page by night, pale lilac by day,
// with loud joyful accents in purple, pink, green, orange and cyan.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Purpura',
  roles: { accent: '#b167f7', danger: '#f84b7c', success: '#40d868', warning: '#fb8d41', pro: '#2ad5e5' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f2edfd',
        'surface-1': '#f6f3ff',
        'surface-2': '#faf8ff',
        'text-primary': '#292344',
        'text-secondary': '#474266',
        'text-muted': '#605b80',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#212033',
        'surface-1': '#262539',
        'surface-2': '#2a2a3e',
        'surface-3': '#2f2f44',
        'text-primary': '#e4e3f1',
        'text-secondary': '#c6c4da',
        'text-muted': '#aaa7c3',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.68 }
