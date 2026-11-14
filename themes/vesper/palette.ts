// Vesper: the last light of evening over a wide plain. Plum dusk by night,
// peach and rose by day. The checks and the gallery site read this file too,
// so keep it plain data.

export const PALETTE = {
  label: 'Vesper',
  roles: { accent: '#c66ca1', danger: '#c86459', success: '#52a27a', warning: '#d09945', pro: '#8b80ca' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f5e4eb',
        'surface-1': '#f8eaf0',
        'surface-2': '#fbf2f6',
        'text-primary': '#3c2632',
        'text-secondary': '#533947',
        'text-muted': '#6a4f5d',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#2a1c28',
        'surface-1': '#2f212e',
        'surface-2': '#352533',
        'surface-3': '#3b2a39',
        'text-primary': '#eee0ec',
        'text-secondary': '#d6c4d3',
        'text-muted': '#beaabc',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 16, opacity: 0.7 }
