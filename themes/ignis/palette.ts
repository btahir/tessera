// Ignis: a hearth at night. Warm charcoal by night, ash and cream by day.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Ignis',
  roles: { accent: '#d67f45', danger: '#c94f58', success: '#7f9f58', warning: '#c4a83e', pro: '#a77ab0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f0e7dd',
        'surface-1': '#f4ede5',
        'surface-2': '#f9f4ee',
        'text-primary': '#2e231c',
        'text-secondary': '#4e3f34',
        'text-muted': '#65544a',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#2a211c',
        'surface-1': '#2f2520',
        'surface-2': '#342a24',
        'surface-3': '#3a2f28',
        'text-primary': '#efe1d4',
        'text-secondary': '#d3c0b0',
        'text-muted': '#bfab9b',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.68 }
