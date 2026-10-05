/**
 * The inspector (AI). Story tab streams NDJSON from /api/chat with
 * `mode: 'inspect'` and `context: <pieceId>`; States and Code tabs clone
 * server-rendered <template>s.
 *
 * Accessibility: streaming is NOT announced token by token. A polite live
 * region says "Writing…" and then the full answer once; the message carries
 * aria-busy while streaming; errors go into a role="alert" with an action.
 * With reduced motion the answer appears at once (no typewriter effect).
 */

interface Opts {
  data: any;
  onDiscover(id: string): void;
  onInspectAnother(): void;
  onRequestPiece(id: string): void;
}
type Turn = { role: 'user' | 'assistant'; content: string };

export function createInspector({ data, onDiscover, onInspectAnother, onRequestPiece }: Opts) {
  const t: Record<string, string> = data.t;
  const lang: string = data.lang;
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
  const aside = $('[data-inspector]');
  const empty = $('[data-insp-empty]');
  const body = $('[data-insp-body]');
  const nameEl = $('[data-insp-name]');
  const projectEl = $('[data-insp-project]');
  const tabs = [...aside.querySelectorAll<HTMLButtonElement>('[data-insp-tabs] [role="tab"]')];
  const statesPanel = $('[data-insp-states]');
  const codePanel = $('[data-insp-code]');
  const thread = $('[data-thread]');
  const noStory = $('[data-nostory]');
  const errorBox = $('[data-error]');
  const live = $('[data-live]');
  const demoNote = $('[data-demo]');
  const form = $<HTMLFormElement>('[data-ask]');
  const input = $<HTMLInputElement>('#ask-input');
  const askBtn = $<HTMLButtonElement>('[data-ask-btn]');
  const pageLink = $<HTMLAnchorElement>('[data-insp-page]');

  let pieceId: string | null = null;
  let history: Turn[] = [];
  let controller: AbortController | null = null;

  const reduced = () => document.documentElement.classList.contains('reduce-motion');

  // ---------------------------------------------------------------- tabs
  function selectTab(tab: HTMLButtonElement, focus = false) {
    tabs.forEach((x) => {
      const on = x === tab;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')!)!.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const map: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      selectTab(tabs[(map[e.key] + tabs.length) % tabs.length], true);
    });
  });

  // ---------------------------------------------------------------- open
  function open(id: string) {
    const piece = data.pieces[id];
    if (!piece) return;
    stop();
    pieceId = id;
    history = [];
    onDiscover(id);
    empty.hidden = true;
    body.hidden = false;
    nameEl.textContent = piece.name;
    projectEl.textContent = `${t['insp.project']}: ${piece.projectName}`;
    pageLink.href = `/${lang}/pieces/${id}/`;
    statesPanel.replaceChildren(cloneTpl(`tpl-states-${id}`));
    codePanel.replaceChildren(cloneTpl(`tpl-code-${id}`));
    thread.replaceChildren();
    errorBox.replaceChildren();
    selectTab(tabs[0]);

    const isWide = window.matchMedia('(min-width: 1024px)').matches;
    if (!isWide) aside.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
    nameEl.focus({ preventScroll: isWide });

    if (piece.hasStory) {
      noStory.hidden = true;
      ask(t['insp.storyPrompt'], false);
    } else {
      noStory.hidden = false;
    }
  }

  function cloneTpl(id: string) {
    const tpl = document.getElementById(id) as HTMLTemplateElement | null;
    return tpl ? tpl.content.cloneNode(true) : document.createTextNode('');
  }

  $('[data-insp-clear]').addEventListener('click', () => {
    stop();
    pieceId = null;
    body.hidden = true;
    empty.hidden = false;
    onInspectAnother();
  });
  $('[data-nostory-ask]').addEventListener('click', () => { noStory.hidden = true; ask(t['insp.storyPrompt'], false); });
  $('[data-nostory-other]').addEventListener('click', () => onInspectAnother());

  // ---------------------------------------------------------------- ask
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (controller) { stop(); return; } // the button reads "Stop" while streaming
    const q = input.value.trim();
    if (!q) { input.focus(); return; }
    if (q.length > 500) { showError('too_long'); return; }
    input.value = '';
    ask(q, true);
  });

  function setBusy(on: boolean) {
    askBtn.textContent = on ? t['chat.stop'] : t['chat.ask'];
  }

  function stop() {
    controller?.abort();
    controller = null;
    setBusy(false);
  }

  let lastQuestion: { q: string; display: boolean } | null = null;

  async function ask(question: string, display: boolean) {
    if (!pieceId) return;
    stop();
    lastQuestion = { q: question, display };
    errorBox.replaceChildren();
    const ctrl = new AbortController();
    controller = ctrl;
    setBusy(true);

    if (display) {
      const u = el('p', 'msg-user');
      u.innerHTML = `<span class="sr-only">${esc(t['chat.you'])}: </span>`;
      u.append(question);
      thread.append(u);
    }
    const msg = el('article', 'msg');
    msg.setAttribute('aria-busy', 'true');
    const text = el('p', 'msg-text msg-thinking');
    text.textContent = t['chat.thinking'];
    msg.append(text);
    thread.append(msg);
    live.textContent = t['chat.writing'];

    let buf = '';
    let done = false;
    let errored = false;
    let first = true;
    const sourcesList = el('ol', 'sources');
    sourcesList.setAttribute('aria-label', t['chat.sources']);

    const handle = (ev: any) => {
      if (ev.type === 'text' && typeof ev.delta === 'string') {
        buf += ev.delta;
        if (!reduced()) {
          if (first) { text.classList.remove('msg-thinking'); first = false; }
          text.textContent = buf;
        }
      } else if (ev.type === 'component') {
        const card = renderComponent(ev.name, ev.id);
        if (card) msg.append(card);
      } else if (ev.type === 'source') {
        const li = el('li');
        const a = el('a') as HTMLAnchorElement;
        a.href = sourceHref(ev.id);
        a.textContent = `[${ev.n}] ${ev.label}`;
        a.setAttribute('aria-label', `${t['chat.source']} ${ev.n}: ${ev.label}`);
        li.append(a);
        sourcesList.append(li);
        if (!sourcesList.isConnected) msg.append(sourcesList);
      } else if (ev.type === 'done') {
        done = true;
      } else if (ev.type === 'error') {
        errored = true;
        showError(ev.code);
      }
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, lang, history, mode: 'inspect', context: pieceId }),
        signal: ctrl.signal,
      });
      demoNote.hidden = res.headers.get('x-assistant-mode') !== 'demo';
      if (!res.body) throw new Error('no body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      while (true) {
        const { value, done: end } = await reader.read();
        if (end) break;
        pending += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = pending.indexOf('\n')) >= 0) {
          const line = pending.slice(0, nl).trim();
          pending = pending.slice(nl + 1);
          if (line) { try { handle(JSON.parse(line)); } catch { /* skip malformed line */ } }
        }
      }
      if (pending.trim()) { try { handle(JSON.parse(pending)); } catch {} }
      if (!done && !errored) { errored = true; showError('stream_cut'); }
    } catch (err) {
      if (ctrl.signal.aborted) { /* user pressed Stop or opened another piece */ }
      else { errored = true; showError('network'); }
    } finally {
      if (controller === ctrl) { controller = null; setBusy(false); }
      text.classList.remove('msg-thinking');
      if (buf) text.textContent = buf;
      else if (errored || ctrl.signal.aborted) msg.remove();
      msg.setAttribute('aria-busy', 'false');
      if (buf) {
        live.textContent = buf; // the full answer, announced once
        history.push({ role: 'user', content: question }, { role: 'assistant', content: buf });
        history = history.slice(-6);
      } else live.textContent = '';
    }
  }

  function showError(code: string) {
    const copy: Record<string, string> = {
      rate_limited: t['err.rate'],
      too_long: t['err.long'],
      stream_cut: t['err.cut'],
      empty: t['err.long'],
    };
    const p = el('p');
    p.textContent = copy[code] ?? t['err.network'];
    const actions = el('div', 'error-actions');
    const btn = el('button', 'btn btn-sm') as HTMLButtonElement;
    btn.type = 'button';
    if (code === 'too_long' || code === 'empty') {
      btn.textContent = t['chat.label'];
      btn.addEventListener('click', () => { errorBox.replaceChildren(); input.focus(); });
    } else {
      btn.textContent = t['err.retry'];
      btn.addEventListener('click', () => { if (lastQuestion) ask(lastQuestion.q, false); });
    }
    actions.append(btn);
    errorBox.replaceChildren(p, actions);
  }

  // ---------------------------------------------------------------- components & sources
  function renderComponent(name: string, id: string): HTMLElement | null {
    const card = el('div', 'card');
    if (name === 'project' && data.projects[id]) {
      const p = data.projects[id];
      card.innerHTML = `<strong>${esc(p.name)}</strong><p>${esc(p.description)}</p><p class="tags">${esc(p.tags.join(' · '))}</p>`;
      const a = el('a', 'btn btn-sm') as HTMLAnchorElement;
      a.href = `/${lang}/resume/#project-${id}`;
      a.textContent = `${t['nav.resume']}: ${p.name}`;
      card.append(a);
      return card;
    }
    if (name === 'experience' && data.experience[id]) {
      const x = data.experience[id];
      card.innerHTML = `<strong>${esc(x.role)} · ${esc(x.company)}</strong><p>${esc(x.period)}</p>`;
      return card;
    }
    if (name === 'piece' && data.pieces[id] && id !== pieceId) {
      const p = data.pieces[id];
      card.innerHTML = `<strong>${esc(p.name)}</strong><p>${esc(p.projectName)}</p>`;
      const b = el('button', 'btn btn-sm') as HTMLButtonElement;
      b.type = 'button';
      b.textContent = `${t['piece.inspect']}: ${p.name}`;
      b.addEventListener('click', () => onRequestPiece(id));
      card.append(b);
      return card;
    }
    return null;
  }

  function sourceHref(id: string) {
    const [kind, key] = id.split('.');
    const base = `/${lang}/resume/`;
    switch (kind) {
      case 'projects': return `${base}#project-${key}`;
      case 'experience': return `${base}#exp-${key}`;
      case 'skills': return `${base}#skills`;
      case 'pieces': return `/${lang}/pieces/${key}/`;
      case 'profile': return key === 'contact' ? `${base}#contact` : `${base}#about`;
      default: return base;
    }
  }

  return { open };
}

function el(tag: string, cls?: string) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}
function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
