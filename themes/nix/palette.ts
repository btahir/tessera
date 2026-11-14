// Nix: quiet snowfall. A pale blue grey winter day, and snow at night under one lamp.
// The neutrals sit near hue 235 with very little chroma, so the page reads as
// cold air rather than as blue. The checks and the gallery site read this file too,
// so keep it plain data.

export const PALETTE = {
  label: 'Nix',
  roles: { accent: '#5685ad', danger: '#bd615b', success: '#4b9779', warning: '#c08e43', pro: '#8475b0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e9f0f4',
        'surface-1': '#eef3f7',
        'surface-2': '#f4f7fa',
        'text-primary': '#262f36',
        'text-secondary': '#434c52',
        'text-muted': '#545c62',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1b2126',
        'surface-1': '#20262b',
        'surface-2': '#252b30',
        'surface-3': '#2a3035',
        'text-primary': '#d7dfe5',
        'text-secondary': '#bac2c8',
        'text-muted': '#a4acb1',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.66 }
