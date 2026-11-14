// Phosphor: the glow of an old green screen, and the paper it printed on.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Phosphor',
  roles: { accent: '#33a6a0', danger: '#c86459', success: '#5aa75e', warning: '#cc9c42', pro: '#9076be' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e7f0e6',
        'surface-1': '#eef5ed',
        'surface-2': '#f4faf3',
        'text-primary': '#213023',
        'text-secondary': '#3c4c3f',
        'text-muted': '#556558',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#19241b',
        'surface-1': '#1e2a21',
        'surface-2': '#233026',
        'surface-3': '#29372c',
        'text-primary': '#d2e8d5',
        'text-secondary': '#b2c8b5',
        'text-muted': '#96ab99',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.66 }
