// Scriptorium: a monk's writing desk. Vellum by day, the same room by candlelight at night.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Scriptorium',
  // Lapis, vermilion, verdigris, gold ochre and murex purple: the pots on the desk.
  roles: { accent: '#3f68a8', danger: '#b5473a', success: '#4f8a5c', warning: '#b88a2c', pro: '#8a5c96' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f5e8d6',
        'surface-1': '#f7ecdc',
        'surface-2': '#faf2e6',
        'text-primary': '#2e2417',
        'text-secondary': '#4d4030',
        'text-muted': '#5c4e3b',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#2a2219',
        'surface-1': '#30271d',
        'surface-2': '#352b21',
        'surface-3': '#3b3025',
        'text-primary': '#ede0cb',
        'text-secondary': '#cfbea6',
        'text-muted': '#b8a68d',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.72 }
