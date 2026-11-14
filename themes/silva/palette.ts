// Silva: a pine forest in mist. Pale sage fog by day, green-black woods by night.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Silva',
  roles: { accent: '#3799a3', danger: '#bd6157', success: '#519962', warning: '#c5953b', pro: '#8e70b0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e4f0ea',
        'surface-1': '#eaf4ef',
        'surface-2': '#f0f8f4',
        'text-primary': '#22322b',
        'text-secondary': '#3b4c44',
        'text-muted': '#4a5e55',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#15241e',
        'surface-1': '#1a2922',
        'surface-2': '#1f2e27',
        'surface-3': '#24332c',
        'text-primary': '#d7e5de',
        'text-secondary': '#b9c8c1',
        'text-muted': '#a3b3ab',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.63 }
