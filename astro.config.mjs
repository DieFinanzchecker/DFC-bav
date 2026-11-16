// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SEO-Landingpage (im Gegensatz zu DFC-empfehlung) -> indexierbar, keine noindex-Defaults.
// Domain der Marke bAVhelden (Stand 16.11.2026 noch nicht registriert).
export default defineConfig({
  site: 'https://bavhelden.de',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
