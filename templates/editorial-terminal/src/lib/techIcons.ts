import fs from 'node:fs';
import path from 'node:path';

// simple-icons SVGs live in node_modules/simple-icons/icons/<slug>.svg.
// They are read at build time (static generation), never in the browser.
const iconsDir = path.join(process.cwd(), 'node_modules', 'simple-icons', 'icons');

/**
 * Technology name (lowercase) → simple-icons slug.
 * Names without an entry (or with a missing slug) render as a text-only badge.
 * Add your own: https://simpleicons.org
 */
const NAME_TO_SLUG: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  astro: 'astro',
  react: 'react',
  'web components': 'webcomponentsdotorg',
  css: 'css',
  html5: 'html5',
  sass: 'sass',
  'tailwind css': 'tailwindcss',
  figma: 'figma',
  storybook: 'storybook',
  'node.js': 'nodedotjs',
  websockets: 'socketdotio',
  postgresql: 'postgresql',
  leaflet: 'leaflet',
  claude: 'claude',
};

const cache = new Map<string, string>();

/** Returns the `d` attribute of the logo path, or '' when there is no logo. */
export function getIconPath(name: string): string {
  const key = name.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const slug = NAME_TO_SLUG[key];
  let d = '';
  if (slug) {
    try {
      const svg = fs.readFileSync(path.join(iconsDir, `${slug}.svg`), 'utf8');
      d = svg.match(/ d="([^"]+)"/)?.[1] ?? '';
    } catch {
      d = '';
    }
  }
  cache.set(key, d);
  return d;
}
