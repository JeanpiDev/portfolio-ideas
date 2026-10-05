// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Production URL. Set PUBLIC_SITE_URL in your host (e.g. Vercel); it drives the
  // sitemap, canonical/OG URLs and robots.txt.
  site: process.env.PUBLIC_SITE_URL || 'https://example.com',
  // Static by default; only routes with `export const prerender = false`
  // (today: /api/chat) run as serverless functions.
  output: 'static',
  // Swap for `@astrojs/node` or `@astrojs/netlify` if you deploy elsewhere (see README).
  adapter: vercel(),
  // Server-only environment variables (never shipped to the client).
  env: {
    schema: {
      // Optional: without it the assistant runs in demo mode.
      ANTHROPIC_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      ANTHROPIC_MODEL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'claude-haiku-4-5',
      }),
    },
  },
  server: { host: true, port: 4321 },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({
      // The root only redirects to /en/ or /es/.
      filter: (page) => new URL(page).pathname !== '/',
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', es: 'es-ES' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
