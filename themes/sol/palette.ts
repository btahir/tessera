// Sol: a sundial drawn in thin lines. A deep teal page by night and a warm cream
// page by day, with the same lightness steps between text levels in both, so a
// switch feels like the same room at another hour. The five roles sit on an even
// wheel, 72 degrees apart: yellow, orange red, magenta, blue and sea green.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Sol',
  roles: { accent: '#4498ca', danger: '#d36c6b', success: '#54ac8a', warning: '#c7ac4b', pro: '#a171c3' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f3ebd5',
        'surface-1': '#f7f0dd',
        'surface-2': '#faf5e6',
        'text-primary': '#494230',
        'text-secondary': '#5c5541',
        'text-muted': '#6e6650',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0c333c',
        'surface-1': '#153841',
        'surface-2': '#1c3d45',
        'surface-3': '#23424a',
        'text-primary': '#c9d7db',
        'text-secondary': '#b1c1c5',
        'text-muted': '#9daeb3',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.68 }
