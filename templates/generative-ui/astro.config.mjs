// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static by default: every page is prerendered. Only routes that export
// `prerender = false` (today: /api/chat) run as serverless functions.
// To deploy elsewhere, swap the adapter for `@astrojs/node` or `@astrojs/netlify`.
export default defineConfig({
  // @ts-ignore -- Node global; avoids requiring @types/node just for this line
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  output: 'static',
  adapter: vercel(),
  env: {
    schema: {
      // Both optional: without a key the endpoint runs in demo mode.
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
