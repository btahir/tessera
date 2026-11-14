import type { APIRoute } from 'astro'

import { SITE_NAME } from '../config'

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: SITE_NAME,
        short_name: SITE_NAME,
        description: 'Themes for the Claude Code desktop app, made to read in.',
        start_url: '/',
        scope: '/',
        display: 'browser',
        background_color: '#f1eee8',
        theme_color: '#f1eee8',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json' } },
  )
