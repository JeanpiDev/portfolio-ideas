// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Replace with your production URL (used for canonical / OG URLs).
  site: 'https://example.com',
  // Static by default. Only routes with `export const prerender = false`
  // (today: /api/chat) run as serverless functions.
  output: 'static',
  // Swap for `@astrojs/node` ({ mode: 'standalone' }) or `@astrojs/netlify` if you
  // deploy elsewhere — see README.
  adapter: vercel(),
  env: {
    schema: {
      // Optional: without a key the assistant runs in demo mode.
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
  vite: {
    plugins: [tailwindcss()],
  },
});
