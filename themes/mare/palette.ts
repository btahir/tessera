// Mare: a quiet shore seen from above. Pale sand and clear water by day,
// deep blue water and a path of moonlight by night.
// The checks and the gallery site read this file too, so keep it plain data.

export const PALETTE = {
  label: 'Mare',
  roles: { accent: '#2f93b8', danger: '#c85f55', success: '#3f9a6e', warning: '#b8892f', pro: '#8a76c4' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e2f2f5',
        'surface-1': '#e9f6f9',
        'surface-2': '#f1fafb',
        'text-primary': '#153036',
        'text-secondary': '#2c474e',
        'text-muted': '#405c62',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#10252c',
        'surface-1': '#152a31',
        'surface-2': '#1a2f36',
        'surface-3': '#20343b',
        'text-primary': '#d3e5ea',
        'text-secondary': '#b3c8ce',
        'text-muted': '#97aeb4',
      },
    },
  },
}

// How the app frosts its panels over the scene.
export const GLASS = { blur: 20, opacity: 0.68 }
