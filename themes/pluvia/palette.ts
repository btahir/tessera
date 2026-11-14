// Pluvia: rain on a window. Wet slate by day, a lit street through glass by night.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Pluvia',
  roles: { accent: '#4a8fc7', danger: '#c9605a', success: '#4d9a78', warning: '#b98a3a', pro: '#8b78c2' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e4e9ed',
        'surface-1': '#ebeff2',
        'surface-2': '#f3f5f7',
        'text-primary': '#222d39',
        'text-secondary': '#404e5d',
        'text-muted': '#556373',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#18212b',
        'surface-1': '#1c2631',
        'surface-2': '#202b37',
        'surface-3': '#24303d',
        'text-primary': '#dde5ee',
        'text-secondary': '#bac6d3',
        'text-muted': '#9dabbb',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.66 }
