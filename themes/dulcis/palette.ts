// Dulcis: candy colors on a warm olive dark page. Hot pink keywords, lime
// strings, violet literals, tangerine variables, after the mood of Monokai but
// in its own values. Light mode is a warm white page; the app deepens the same
// hues so they stay readable there.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Dulcis',
  roles: { accent: '#f85da5', danger: '#f75e51', success: '#98dc38', warning: '#ff971e', pro: '#b48df4' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f3f0e7',
        'surface-1': '#f8f5ee',
        'surface-2': '#faf8f2',
        'text-primary': '#28271c',
        'text-secondary': '#444337',
        'text-muted': '#5c5c4e',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#24231a',
        'surface-1': '#29281f',
        'surface-2': '#2e2d24',
        'surface-3': '#333229',
        'text-primary': '#e3e2d3',
        'text-secondary': '#cacabb',
        'text-muted': '#aead9e',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.68 }
