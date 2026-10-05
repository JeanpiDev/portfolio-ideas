/**
 * The inspector (AI aside of the playground): Story / States / Code tabs with
 * static content from profile.ts, plus an "Ask the inspector" box that calls the
 * same assistant with `mode: 'inspect'` and `context: <pieceId>`.
 */
import { AnswerView, ask, type Strings } from './assistant';

export interface Inspector {
  inspect(id: string, opts?: { focus?: boolean }): void;
  current(): string;
  dropzone: HTMLElement | null;
}

export function initInspector(root: HTMLElement): Inspector {
  const t: Strings = JSON.parse(root.dataset.t!);
  const lang = root.dataset.lang as 'en' | 'es';
  const nameEl = root.querySelector<HTMLElement>('[data-insp-name]')!;
  const fromEl = root.querySelector<HTMLElement>('[data-insp-from]')!;
  const panelsEl = root.querySelector<HTMLElement>('[data-insp-panels]')!;
  const linkEl = root.querySelector<HTMLAnchorElement>('[data-insp-link]')!;
  const answerEl = root.querySelector<HTMLElement>('[data-insp-answer]')!;
  const live = root.querySelector<HTMLElement>('[data-insp-live]')!;
  const form = root.querySelector<HTMLFormElement>('[data-insp-form]')!;
  const input = form.querySelector('input')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  let currentId = 'loan-simulator';
  let selected = 0;
  let controller: AbortController | null = null;

  /* ----- Tabs (WAI-ARIA tabs pattern, automatic activation) ----- */
  const selectTab = (i: number, focus = false) => {
    selected = i;
    tabs.forEach((tab, j) => {
      tab.setAttribute('aria-selected', String(i === j));
      tab.tabIndex = i === j ? 0 : -1;
      const panel = panelsEl.querySelector<HTMLElement>(`#${tab.getAttribute('aria-controls')}`);
      if (panel) panel.hidden = i !== j;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const next =
        e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (next < 0) return;
      e.preventDefault();
      selectTab(next, true);
    });
  });
  selectTab(0);

  /* ----- Swap the inspected piece ----- */
  const inspect = (id: string, opts: { focus?: boolean } = {}) => {
    const tpl = document.getElementById(`tpl-insp-${id}`) as HTMLTemplateElement | null;
    const slot = document.getElementById(`piece-${id}`);
    if (!tpl || !slot) return;
    controller?.abort();
    currentId = id;
    nameEl.textContent = slot.dataset.name ?? id;
    panelsEl.replaceChildren(tpl.content.cloneNode(true));
    const projectCard = document.querySelector(`#project-${slot.dataset.project ?? ''}`);
    fromEl.textContent = projectCard?.querySelector('h3')?.textContent ?? '';
    linkEl.href = projectCard ? `#project-${slot.dataset.project}` : '#projects';
    answerEl.replaceChildren();
    selectTab(selected);
    if (opts.focus) nameEl.focus();
  };

  /* ----- Ask the inspector ----- */
  const setBusy = (busy: boolean) => {
    submit.textContent = busy ? t['ask.stop'] : t['ask.button'];
    submit.classList.toggle('btn-ai', !busy);
    submit.classList.toggle('btn-ink', busy);
  };
  const run = async (question: string, view: AnswerView) => {
    controller = new AbortController();
    setBusy(true);
    await ask({
      payload: { message: question, lang, mode: 'inspect', context: currentId },
      view,
      live,
      t,
      signal: controller.signal,
      onRetry: () => {
        if (controller) return;
        view.reset();
        run(question, view);
      },
      onEdit: () => {
        input.value = question;
        input.focus();
      },
    });
    controller = null;
    setBusy(false);
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (controller) return controller.abort();
    const q = input.value.trim();
    if (!q) return input.focus();
    input.value = '';
    const user = document.createElement('p');
    user.className = 'msg-user m-0 fade-in';
    user.textContent = q;
    const view = new AnswerView(t, { name: false });
    answerEl.replaceChildren(user, view.root);
    run(q, view);
  });

  return {
    inspect,
    current: () => currentId,
    dropzone: root.querySelector<HTMLElement>('[data-dropzone]'),
  };
}

