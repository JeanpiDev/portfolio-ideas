import type { APIRoute } from 'astro';

// Dynamic robots.txt so the sitemap URL always matches PUBLIC_SITE_URL.
const site = (import.meta.env.PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
