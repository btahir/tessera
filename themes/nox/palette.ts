// Nox: a clear night sky. Violet indigo by night, pale lavender in the hour before sunrise.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Nox',
  roles: { accent: '#8388e0', danger: '#d46565', success: '#4ca77b', warning: '#d09945', pro: '#bc6cab' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#edeaf9',
        'surface-1': '#f2f0fc',
        'surface-2': '#f7f6fd',
        'text-primary': '#292440',
        'text-secondary': '#47445f',
        'text-muted': '#57546d',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#201f34',
        'surface-1': '#242439',
        'surface-2': '#29283f',
        'surface-3': '#2e2d44',
        'text-primary': '#dcdcee',
        'text-secondary': '#bbbbd1',
        'text-muted': '#a3a3bb',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.66 }
