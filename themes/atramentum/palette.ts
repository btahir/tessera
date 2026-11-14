// Atramentum: ink. Black ink on white newsprint by day, off white on near black
// by night. The neutrals carry almost no tint, so the page reads as paper and
// ink and nothing else. The five roles are strong printer's colors chosen to
// hold up at this contrast.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Atramentum',
  contrast: 'more',
  roles: { accent: '#1f5fd6', danger: '#d42c2c', success: '#1e7f45', warning: '#d08a00', pro: '#7a3fd1' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f8f8f6',
        'surface-1': '#fbfbf9',
        'surface-2': '#fdfdfc',
        'text-primary': '#131312',
        'text-secondary': '#2b2b29',
        'text-muted': '#464644',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#111211',
        'surface-1': '#161716',
        'surface-2': '#1b1c1b',
        'surface-3': '#212220',
        'text-primary': '#edece7',
        'text-secondary': '#cfcec8',
        'text-muted': '#adaca6',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.75 }
