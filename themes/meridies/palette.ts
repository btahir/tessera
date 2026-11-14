// Meridies: the desert at noon. Warm sand by day, the same dunes under a moon by night.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Meridies',
  roles: { accent: '#008b96', danger: '#c3513d', success: '#4d8b50', warning: '#cd9219', pro: '#7d5fad' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#fae9dc',
        'surface-1': '#fceee3',
        'surface-2': '#fdf3eb',
        'text-primary': '#3a261b',
        'text-secondary': '#523d32',
        'text-muted': '#6a5448',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#28201a',
        'surface-1': '#2d241f',
        'surface-2': '#322924',
        'surface-3': '#38302a',
        'text-primary': '#e8ded2',
        'text-secondary': '#c8bbaf',
        'text-muted': '#b0a295',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.7 }
