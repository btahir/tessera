// Fulgur: lightning. A near black page with a blue-violet cast and neon at the
// edges by night; a pale cool grey with the same neon deepened by day.
// High contrast: bright cool text on the dark page, near black ink on the light one.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Fulgur',
  contrast: 'more' as const,
  roles: { accent: '#22e3f2', danger: '#ff2f7e', success: '#3dfa78', warning: '#f2e33a', pro: '#a464ff' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f4f5fa',
        'surface-1': '#f8f9fc',
        'surface-2': '#fbfbfd',
        'text-primary': '#14122a',
        'text-secondary': '#2e2b48',
        'text-muted': '#46435f',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0e0c1a',
        'surface-1': '#131124',
        'surface-2': '#18152b',
        'surface-3': '#1d1a33',
        'text-primary': '#f2effe',
        'text-secondary': '#c9c5e6',
        'text-muted': '#a7a3c8',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.7 }
