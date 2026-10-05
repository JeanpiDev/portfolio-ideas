/**
 * Client side of the assistant, shared by the hero chat, the inspector and the
 * recruiter card. Reads the NDJSON stream from /api/chat and renders one answer:
 *  - text revealed by chunks (typewriter), disabled under reduced motion;
 *  - components cloned from server-rendered <template>s (the AI only sends ids);
 *  - citations as links with accessible names ("Source 1: …");
 *  - one polite announcement ("Writing…") and then the full answer once;
 *  - errors in role="alert" with an action (Retry / Edit the question);
 *  - Stop via AbortController keeps the partial answer, marked "(incomplete)".
 */

export type Strings = Record<string, string>;
export type Turn = { role: 'user' | 'assistant'; content: string };
export interface AskPayload {
  message: string;
  lang: 'en' | 'es';
  history?: Turn[];
  mode?: 'chat' | 'inspect' | 'recruiter';
  context?: string;
}
type ServerEvent =
  | { type: 'text'; delta: string }
  | { type: 'component'; name: 'project' | 'piece'; id: string }
  | { type: 'source'; n: number; id: string; label: string }
  | { type: 'done' }
  | { type: 'error'; code: string };

export type Outcome = { status: 'done' | 'stopped' | 'error'; text: string; demo: boolean };

const SPARK = 'M12 2l2.2 6.6L21 11l-6.8 2.3L12 20l-2.2-6.7L3 11l6.8-2.4z';

export function prefersReducedMotion() {
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function fmt(s: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
}

/** Maps a source id from the API to the anchor of that content on the page. */
export function sourceHref(id: string) {
  const [kind, key] = id.split('.');
  switch (kind) {
    case 'projects': return `#project-${key}`;
    case 'experience': return `#exp-${key}`;
    case 'pieces': return `#piece-${key}`;
    case 'skills': return '#skills';
    case 'profile': return key === 'availability' ? '#contact' : '#top';
    default: return '#top';
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

/**
 * Reveals queued text by chunks (~60 per second). Instant under reduced motion
 * or when the tab is hidden (timers are throttled there, the answer must still finish).
 */
class Typewriter {
  private queue = '';
  private timer = 0;
  private idle: (() => void)[] = [];
  constructor(private target: Text) {}
  push(s: string) {
    if (prefersReducedMotion() || document.hidden) {
      this.flush();
      this.target.appendData(s);
      return;
    }
    this.queue += s;
    if (!this.timer) this.timer = window.setTimeout(this.tick, 16);
  }
  private tick = () => {
    const n = Math.max(3, Math.ceil(this.queue.length / 12));
    this.target.appendData(this.queue.slice(0, n));
    this.queue = this.queue.slice(n);
    if (this.queue && !document.hidden) this.timer = window.setTimeout(this.tick, 16);
    else if (this.queue) this.flush();
    else {
      this.timer = 0;
      this.idle.splice(0).forEach((f) => f());
    }
  };
  /** Write everything left right now. */
  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = 0;
    this.target.appendData(this.queue);
    this.queue = '';
    this.idle.splice(0).forEach((f) => f());
  }
  drained() {
    return this.queue || this.timer ? new Promise<void>((r) => this.idle.push(r)) : Promise.resolve();
  }
}

/** One assistant message (DOM + rendering). */
export class AnswerView {
  readonly root: HTMLElement;
  private body: HTMLElement;
  private textP!: HTMLParagraphElement;
  private textNode!: Text;
  private cites!: HTMLSpanElement;
  private compSlot!: HTMLElement;
  private sourceList!: HTMLOListElement;
  private status!: HTMLElement;
  private tw!: Typewriter;
  text = '';
  sources = 0;
  components = 0;

  constructor(private t: Strings, opts: { name?: boolean } = {}) {
    this.root = el('article', 'msg-ai fade-in');
    const mark = el('span', 'ai-mark');
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = `<svg class="spark" width="16" height="16" viewBox="0 0 24 24"><path d="${SPARK}"/></svg>`;
    this.body = el('div', 'msg-ai__body');
    if (opts.name !== false) this.body.append(el('span', 'msg-ai__name', t['ask.assistantName']));
    this.root.append(mark, this.body);
    this.reset();
  }

  /** Clears the message (used on first render and on Retry). */
  reset() {
    this.body.querySelectorAll(':scope > :not(.msg-ai__name)').forEach((n) => n.remove());
    this.text = '';
    this.sources = this.components = 0;
    this.status = el('p', 'msg-ai__note', this.t['ask.thinking']);
    this.textP = el('p', 'msg-ai__text');
    this.textP.hidden = true;
    this.textNode = document.createTextNode('');
    this.cites = el('span');
    this.textP.append(this.textNode, this.cites);
    this.compSlot = el('div', 'flex flex-col gap-3');
    this.sourceList = el('ol', 'sources');
    this.sourceList.hidden = true;
    this.sourceList.setAttribute('aria-label', this.t['ask.sources']);
    this.body.append(this.status, this.textP, this.compSlot, this.sourceList);
    this.tw = new Typewriter(this.textNode);
    this.root.setAttribute('aria-busy', 'true');
  }

  appendText(delta: string) {
    if (!this.text) {
      this.status.remove();
      this.textP.hidden = false;
    }
    this.text += delta;
    this.tw.push(delta);
  }

  addComponent(name: string, id: string) {
    const tpl = document.getElementById(`tpl-${name}-${id}`) as HTMLTemplateElement | null;
    if (!tpl) return;
    this.components++;
    this.compSlot.append(tpl.content.cloneNode(true));
  }

  addSource(n: number, id: string, label: string) {
    this.sources++;
    const name = fmt(this.t['ask.sourceLabel'], { n, label });
    const a = el('a', 'cite', `[${n}]`);
    a.href = sourceHref(id);
    a.setAttribute('aria-label', name);
    this.cites.append(' ', a);
    const li = el('li', '', `[${n}] ${label}`);
    this.sourceList.append(li);
    this.sourceList.hidden = false;
  }

  async finish() {
    await this.tw.drained();
    if (!this.text) {
      this.status.remove();
      this.textP.hidden = false;
    }
    // No source cited: say so plainly rather than presenting an uncited answer as fact.
    if (this.sources === 0 && !this.saidNoSource()) {
      const note = el('p', 'msg-ai__note', this.t['ask.noSource']);
      this.compSlot.before(note);
    }
    this.root.setAttribute('aria-busy', 'false');
  }

  /** Stopped by the user: keep the partial answer, mark it incomplete, offer Retry. */
  /** True when the answer itself already is the "can't find it" sentence. */
  saidNoSource() {
    return this.text.trim() === this.t['ask.noSource'];
  }

  stopped(onRetry: () => void) {
    this.tw.flush();
    this.status.remove();
    this.textP.hidden = false;
    this.textP.append(' ', el('span', 'msg-ai__note', this.t['ask.incomplete']));
    const btn = el('button', 'btn self-start', this.t['ask.retry']);
    btn.type = 'button';
    btn.addEventListener('click', onRetry);
    this.body.append(btn);
    this.root.setAttribute('aria-busy', 'false');
  }

  error(message: string, action: { label: string; run: () => void }) {
    this.tw.flush();
    this.status.remove();
    if (this.text) {
      this.textP.hidden = false;
      this.textP.append(' ', el('span', 'msg-ai__note', this.t['ask.incomplete']));
    }
    const box = el('div', 'alert');
    box.setAttribute('role', 'alert');
    const btn = el('button', 'btn', action.label);
    btn.type = 'button';
    btn.addEventListener('click', action.run);
    box.append(el('span', 'alert__text', message), btn);
    this.body.append(box);
    this.root.setAttribute('aria-busy', 'false');
  }
}

const ERR_KEY: Record<string, string> = {
  rate_limited: 'ask.err.rate',
  too_long: 'ask.err.tooLong',
  empty: 'ask.err.empty',
  invalid_request: 'ask.err.upstream',
  upstream: 'ask.err.upstream',
  stream_cut: 'ask.err.cut',
  network: 'ask.err.network',
};

/**
 * Sends one question and renders the stream into `view`.
 * `live` is an sr-only aria-live="polite" region: it hears "Writing…" once and
 * then the full answer once (never token by token).
 */
export async function ask(opts: {
  payload: AskPayload;
  view: AnswerView;
  live: HTMLElement;
  t: Strings;
  signal: AbortSignal;
  onRetry: () => void;
  onEdit?: () => void;
}): Promise<Outcome> {
  const { payload, view, live, t, signal } = opts;
  let demo = false;
  let finished = false;
  const say = (s: string) => {
    live.textContent = '';
    // A new text node after a tick makes screen readers announce reliably.
    setTimeout(() => (live.textContent = s), 50);
  };
  const fail = (code: string): Outcome => {
    const editable = code === 'too_long' || code === 'empty';
    const message = t[ERR_KEY[code] ?? 'ask.err.network'];
    view.error(message, editable && opts.onEdit ? { label: t['ask.edit'], run: opts.onEdit } : { label: t['ask.retry'], run: opts.onRetry });
    return { status: 'error', text: view.text, demo };
  };

  say(t['ask.writing']);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    demo = res.headers.get('X-Assistant-Mode') === 'demo';
    if (!res.body) return fail('network');
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const raw = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!raw) continue;
        let ev: ServerEvent;
        try {
          ev = JSON.parse(raw);
        } catch {
          continue;
        }
        if (ev.type === 'text') view.appendText(ev.delta);
        else if (ev.type === 'component') view.addComponent(ev.name, ev.id);
        else if (ev.type === 'source') view.addSource(ev.n, ev.id, ev.label);
        else if (ev.type === 'error') return fail(ev.code);
        else if (ev.type === 'done') finished = true;
      }
    }
  } catch (err) {
    if (signal.aborted) {
      view.stopped(opts.onRetry);
      return { status: 'stopped', text: view.text, demo };
    }
    return fail(view.text ? 'stream_cut' : 'network');
  }
  if (!finished) return fail(view.text ? 'stream_cut' : 'network');
  await view.finish();
  say(view.sources === 0 && !view.saidNoSource() ? `${view.text} ${t['ask.noSource']}` : view.text);
  return { status: 'done', text: view.text, demo };
}
