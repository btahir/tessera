// Glacies: ice. A cool blue grey page by night and a frosty off white by day,
// with gentle contrast for long reading. The accents are frosted and soft:
// glacier blue, pale teal, a muted red, a soft amber and a dusty violet.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Glacies',
  roles: { accent: '#71add0', danger: '#c87976', success: '#78baac', warning: '#d4ad71', pro: '#a08dc3' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e5ecf3',
        'surface-1': '#ebf1f7',
        'surface-2': '#f1f6fa',
        'text-primary': '#36414d',
        'text-secondary': '#4b5763',
        'text-muted': '#5c6774',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#242c35',
        'surface-1': '#29313a',
        'surface-2': '#2e363f',
        'surface-3': '#343b44',
        'text-primary': '#ccd6de',
        'text-secondary': '#aeb9c2',
        'text-muted': '#a0abb5',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.7 }
