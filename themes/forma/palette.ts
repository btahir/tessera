// Forma: primary colors and pure geometry, after the modernist design schools of
// the 1920s. A warm off white page by day, charcoal by night. The roles follow
// the idea: blue accent, red danger, yellow warning, a plain green and a violet.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Forma',
  roles: { accent: '#2f5fd0', danger: '#d63a2b', success: '#3a9a4e', warning: '#e5ad12', pro: '#8b52c8' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f2eee4',
        'surface-1': '#f6f3ec',
        'surface-2': '#faf8f3',
        'text-primary': '#2a2823',
        'text-secondary': '#3f3c34',
        'text-muted': '#514e45',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#252420',
        'surface-1': '#2a2925',
        'surface-2': '#2f2e29',
        'surface-3': '#35342e',
        'text-primary': '#e5e1d6',
        'text-secondary': '#cbc6b9',
        'text-muted': '#b6b1a4',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 18, opacity: 0.72 }
