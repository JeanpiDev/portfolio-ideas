/**
 * Colour scheme (Blue / Olive Green / Silver) and motion preference.
 * The inline <head> script applies stored values before paint; this keeps controls in sync.
 */
import { fmt, storage, strings } from './client';

const THEMES = ['blue', 'olive', 'silver'] as const;
type Theme = (typeof THEMES)[number];
const html = document.documentElement;
const live = () => document.querySelector<HTMLElement>('[data-pref-live]');

const currentTheme = (): Theme => {
  const t = html.dataset.theme as Theme;
  return THEMES.includes(t) ? t : 'blue';
};

function syncTheme() {
  const s = strings();
  const theme = currentTheme();
  document.querySelectorAll<HTMLSelectElement>('[data-theme-select]').forEach((sel) => (sel.value = theme));
  document.querySelectorAll<HTMLElement>('[data-theme-name]').forEach((el) => (el.textContent = s[`theme.${theme}`]));
}

export function setTheme(theme: Theme, announce = true) {
  html.dataset.theme = theme;
  storage('theme', theme);
  syncTheme();
  const el = live();
  if (announce && el) el.textContent = fmt(strings()['theme.changed'], { label: strings()[`theme.${theme}`] });
}

function syncMotion() {
  const s = strings();
  const reduced = html.classList.contains('motion-reduced');
  document.querySelectorAll<HTMLElement>('[data-motion-toggle]').forEach((b) => {
    if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(reduced));
  });
  document.querySelectorAll<HTMLElement>('[data-motion-label]').forEach(
    (l) => (l.textContent = reduced ? s['start.motionReduced'] : s['start.motionFull']),
  );
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-theme-cycle]')) {
    setTheme(THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length]);
  } else if (t.closest('[data-motion-toggle]')) {
    const reduced = !html.classList.contains('motion-reduced');
    html.classList.toggle('motion-reduced', reduced);
    storage('motion', reduced ? 'reduced' : 'full');
    syncMotion();
  }
});
document.addEventListener('change', (e) => {
  const sel = (e.target as HTMLElement).closest<HTMLSelectElement>('[data-theme-select]');
  if (sel && THEMES.includes(sel.value as Theme)) setTheme(sel.value as Theme);
});

syncTheme();
syncMotion();
