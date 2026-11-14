// Caementum: raw concrete. A mid grey hall by night, pale board formed concrete
// by day. The greys carry almost no tint. The one loud color is a signal red.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Caementum',
  roles: { accent: '#c8473c', danger: '#b04476', success: '#4f9a6a', warning: '#c49530', pro: '#7d7aa8' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#ece9e3',
        'surface-1': '#f0eee9',
        'surface-2': '#f4f3ef',
        'text-primary': '#2a2826',
        'text-secondary': '#3f3d39',
        'text-muted': '#4f4d48',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#2c2a27',
        'surface-1': '#312f2c',
        'surface-2': '#363431',
        'surface-3': '#3b3936',
        'text-primary': '#dddad5',
        'text-secondary': '#c1beb8',
        'text-muted': '#adaaa4',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.66 }
