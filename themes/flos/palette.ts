// Flos: a blossoming branch in spring. Blush paper by day, a plum night after dark.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Flos',
  roles: { accent: '#a7547e', danger: '#bf544b', success: '#519160', warning: '#c38c37', pro: '#7466b5' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f9ecef',
        'surface-1': '#fbf0f2',
        'surface-2': '#fdf4f6',
        'text-primary': '#3d262b',
        'text-secondary': '#563d42',
        'text-muted': '#6a5458',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#2f1c25',
        'surface-1': '#34212a',
        'surface-2': '#39262f',
        'surface-3': '#3e2b34',
        'text-primary': '#eedee5',
        'text-secondary': '#d5c1c9',
        'text-muted': '#bea7b1',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.72 }
