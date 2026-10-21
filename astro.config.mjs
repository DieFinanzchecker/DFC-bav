// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SEO-Landingpage (im Gegensatz zu DFC-empfehlung) -> indexierbar, keine noindex-Defaults.
// site-URL anpassen, sobald die Domain final feststeht (Vorschlag: bav.diefinanzchecker.de).
export default defineConfig({
  site: 'https://bav.diefinanzchecker.de',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
