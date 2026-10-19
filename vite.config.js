import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Content Security Policy for the built app: only our own files run, and the only outside
// server the app may talk to is Anthropic (for "Fix my sentence"). Added at build time only,
// because the dev server needs inline scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.anthropic.com",
  "media-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const cspPlugin = {
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: (html) => html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta name="referrer" content="no-referrer" />`,
  ),
};

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/Learning-Spanish/").
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    cspPlugin,
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Español con Dan',
        short_name: 'Español',
        description: 'Personal Spanish trainer: flashcards, quizzes, Caribbean slang.',
        theme_color: '#111318',
        background_color: '#111318',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
      },
    }),
  ],
  build: {
    // All decks are bundled so the app works offline; ~150 KB gzipped is fine.
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['src/**/*.test.js'],
  },
});
