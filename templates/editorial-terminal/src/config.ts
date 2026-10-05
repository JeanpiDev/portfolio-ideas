/**
 * Site plumbing (not personal content — that lives in src/data/profile.ts).
 * Values come from environment variables with safe fallbacks.
 * Anything read in the browser must use the PUBLIC_ prefix.
 */
import { profile } from './data/profile';

const env = import.meta.env;

export const SITE = {
  name: profile.name,
  /** Production URL — also set PUBLIC_SITE_URL so astro.config.mjs and robots.txt agree. */
  url: env.PUBLIC_SITE_URL || 'https://example.com',
  /**
   * Web3Forms access key for the contact form (free at https://web3forms.com).
   * Empty = the form is not rendered and only the mailto link is shown.
   */
  web3formsKey: env.PUBLIC_WEB3FORMS_KEY ?? '',
} as const;

export const SOCIALS = [
  { name: 'GitHub', href: profile.links.github, icon: 'github' },
  { name: 'LinkedIn', href: profile.links.linkedin, icon: 'linkedin' },
  { name: 'Email', href: `mailto:${profile.email}`, icon: 'mail' },
] as const;
