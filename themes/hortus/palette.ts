// Hortus: a greenhouse. Daylight through glass by day, the conservatory by moonlight at night.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Hortus',
  roles: { accent: '#238b8b', danger: '#c65b4c', success: '#539344', warning: '#c18e35', pro: '#8e67ab' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#eaf2e2',
        'surface-1': '#eef5e9',
        'surface-2': '#f3f9ef',
        'text-primary': '#1f2a19',
        'text-secondary': '#404c39',
        'text-muted': '#525f4c',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1c2318',
        'surface-1': '#21281d',
        'surface-2': '#252d22',
        'surface-3': '#2a3227',
        'text-primary': '#dde4d3',
        'text-secondary': '#bcc5b0',
        'text-muted': '#a0a893',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.7 }
