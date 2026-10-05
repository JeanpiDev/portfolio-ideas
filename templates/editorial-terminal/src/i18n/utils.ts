import { ui, defaultLang, type Lang, type UIKey } from './ui';
import { profile } from '../data/profile';

/** Reads the language from the pathname (/en/... or /es/...). */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

/** Returns a t() function for the given language. `{name}` becomes the first name. */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey, vars: Record<string, string> = {}): string {
    const raw: string = ui[lang][key] ?? ui[defaultLang][key];
    return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k === 'name' ? profile.firstName : (vars[k] ?? m)));
  };
}

/** The other language, for the switcher. */
export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'es' : 'en';
}

/** Replaces the language prefix in a path, keeping the rest (including #hash). */
export function switchLangPath(url: URL, target: Lang): string {
  const segments = url.pathname.split('/');
  segments[1] = target;
  return segments.join('/') + url.hash;
}
