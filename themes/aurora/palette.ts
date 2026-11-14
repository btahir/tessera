// Aurora: northern lights over snow. A polar night by dark, a pale dawn by day.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Aurora',
  roles: { accent: '#32a0c5', danger: '#cd605a', success: '#42b079', warning: '#d09945', pro: '#9675cc' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e0efef',
        'surface-1': '#e7f3f3',
        'surface-2': '#eef7f8',
        'text-primary': '#182f34',
        'text-secondary': '#314d52',
        'text-muted': '#456267',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0e2628',
        'surface-1': '#132b2d',
        'surface-2': '#183032',
        'surface-3': '#1d3538',
        'text-primary': '#d3e6e6',
        'text-secondary': '#afc6c7',
        'text-muted': '#91acad',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.7 }
