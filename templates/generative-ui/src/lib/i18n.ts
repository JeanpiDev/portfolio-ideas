import type { Lang } from '../data/profile';

export const LANGS: Lang[] = ['en', 'es'];

/** getStaticPaths helper for `src/pages/[lang]/*` routes. */
export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'es';
