// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Production URL (used for canonical / Open Graph URLs). Set PUBLIC_SITE_URL in your host.
  site: process.env.PUBLIC_SITE_URL || 'https://example.com',
  // Static by default: only routes with `export const prerender = false` (today: /api/chat)
  // run as serverless functions. Swap the adapter for @astrojs/node or @astrojs/netlify if needed.
  output: 'static',
  adapter: vercel(),
  env: {
    schema: {
      // Optional: without a key the assistant runs in demo mode (canned, grounded answers).
      ANTHROPIC_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      ANTHROPIC_MODEL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'claude-haiku-4-5',
      }),
    },
  },
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  vite: { plugins: [tailwindcss()] },
});
