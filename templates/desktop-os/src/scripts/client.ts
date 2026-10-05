/**
 * Shared client helpers: page data, motion preference and the NDJSON client for /api/chat.
 */
import type { WindowId } from '../lib/windows';

interface PageData {
  lang: 'en' | 'es';
  strings: Record<string, string>;
  projects: Record<string, string>;
}

let data: PageData | null = null;
export function pageData(): PageData {
  if (!data) {
    const el = document.getElementById('os-data');
    data = el ? (JSON.parse(el.textContent || '{}') as PageData) : { lang: 'en', strings: {}, projects: {} };
  }
  return data;
}
export const strings = () => pageData().strings;
export const fmt = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), s);

/** True when the visitor prefers reduced motion (OS setting or the in-page toggle). */
export function reducedMotion(): boolean {
  return (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('motion-reduced')
  );
}

export function storage(key: string, value?: string | null): string | null {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage can be blocked */
  }
  return value ?? null;
}

/* --------------------------------------------------------------- AI stream */

export type AiEvent =
  | { type: 'text'; delta: string }
  | { type: 'component'; name: 'project'; id: string }
  | { type: 'source'; n: number; id: string; label: string }
  | { type: 'done' }
  | { type: 'error'; code: string };

export interface AskOptions {
  message: string;
  mode: 'chat' | 'search' | 'tip';
  context?: WindowId;
  history?: { role: 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
  onEvent: (e: AiEvent) => void;
  /** Called once with `true` when the server runs without an API key. */
  onDemo?: (demo: boolean) => void;
}

/**
 * POSTs to /api/chat and dispatches each NDJSON line. Resolves with a final status:
 * 'done' | 'aborted' | an error code ('network', 'rate_limited', 'stream_cut', …).
 */
export async function ask(opts: AskOptions): Promise<string> {
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: opts.message,
        lang: pageData().lang,
        mode: opts.mode,
        context: opts.context,
        history: opts.history ?? [],
      }),
      signal: opts.signal,
    });
  } catch (err) {
    return (err as Error)?.name === 'AbortError' ? 'aborted' : 'network';
  }
  opts.onDemo?.(res.headers.get('X-Assistant-Mode') === 'demo');
  if (!res.body) return 'network';

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let status = 'stream_cut';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const raw = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!raw) continue;
        let event: AiEvent;
        try {
          event = JSON.parse(raw) as AiEvent;
        } catch {
          continue;
        }
        if (event.type === 'done') status = 'done';
        else if (event.type === 'error') status = event.code;
        else opts.onEvent(event);
      }
    }
  } catch (err) {
    return (err as Error)?.name === 'AbortError' ? 'aborted' : status === 'done' ? 'done' : 'stream_cut';
  }
  if (!res.ok && status === 'stream_cut') return res.status === 429 ? 'rate_limited' : 'network';
  return status;
}

/** Opens a window through the window manager, or falls back to the anchor (classic mode). */
export function openWindow(id: WindowId, opener?: HTMLElement | null, highlight?: string) {
  const wm = document.querySelector('window-manager') as (HTMLElement & {
    enabled?: boolean;
    open?: (id: WindowId, opener?: HTMLElement | null, highlight?: string) => void;
  }) | null;
  if (wm?.enabled && wm.open) wm.open(id, opener, highlight);
  else location.hash = highlight || `win-${id}`;
}
