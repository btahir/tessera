// Aurum: black and gold, after the decorative art of the 1920s. A warm near black
// by night, ivory and brass by day. The gold stays at the edges; body text is a
// calm warm off white on dark and a deep umber on light.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Aurum',
  roles: { accent: '#ceae48', danger: '#d7695f', success: '#5eaf7d', warning: '#e8954a', pro: '#a082c3' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f3ecde',
        'surface-1': '#f7f1e5',
        'surface-2': '#faf6ee',
        'text-primary': '#2c2618',
        'text-secondary': '#4c4434',
        'text-muted': '#615846',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#221e15',
        'surface-1': '#26221a',
        'surface-2': '#2b271f',
        'surface-3': '#302c23',
        'text-primary': '#e6dfd0',
        'text-secondary': '#cac2b1',
        'text-muted': '#b4ab9a',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.66 }
