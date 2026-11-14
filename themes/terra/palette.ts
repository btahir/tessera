// Terra: earth. A 1970s print poster. A brown charcoal page by night and a cream
// paperback page by day, with earthy inks for the roles: brick, mustard, moss,
// a dusty teal and a plum.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Terra',
  roles: { accent: '#4f8e98', danger: '#c3573f', success: '#7d9341', warning: '#c99a30', pro: '#a1638b' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f3e8d1',
        'surface-1': '#f6eddb',
        'surface-2': '#f9f3e5',
        'text-primary': '#2f2619',
        'text-secondary': '#4f4433',
        'text-muted': '#5a4d3d',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#2b2620',
        'surface-1': '#302a23',
        'surface-2': '#352e27',
        'surface-3': '#3a332b',
        'text-primary': '#ecdfc6',
        'text-secondary': '#d3c5ac',
        'text-muted': '#bcae96',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.72 }
