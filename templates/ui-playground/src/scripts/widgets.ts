/**
 * Delegated behaviour for the live widgets rendered by PieceWidget.astro.
 * Bound once on `document`, so widgets cloned into the inspector just work.
 * Table previews are `inert`, so they never receive these events.
 */
export function initWidgets() {
  if ((window as any).__widgetsBound) return;
  (window as any).__widgetsBound = true;

  document.addEventListener('input', (e) => {
    const el = e.target as HTMLElement;
    // Loan slider: keep the <output> in sync.
    if (el.matches('[data-range]')) {
      const wrap = el.closest<HTMLElement>('[data-loan]')!;
      const out = wrap.querySelector('[data-out]')!;
      const fmt = new Intl.NumberFormat(wrap.dataset.locale || 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
      out.textContent = fmt.format(Number((el as HTMLInputElement).value));
    }
    // OTP: digits only, auto-advance.
    if (el.matches('.w-otp-box')) {
      const input = el as HTMLInputElement;
      input.value = input.value.replace(/\D/g, '').slice(-1);
      const boxes = [...input.closest('[data-otp]')!.querySelectorAll<HTMLInputElement>('.w-otp-box')];
      const i = boxes.indexOf(input);
      if (input.value && boxes[i + 1]) boxes[i + 1].focus();
      boxes.forEach((b) => b.removeAttribute('aria-invalid'));
    }
  });

  document.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement;
    if (el.matches('.w-otp-box') && e.key === 'Backspace' && !(el as HTMLInputElement).value) {
      const boxes = [...el.closest('[data-otp]')!.querySelectorAll<HTMLInputElement>('.w-otp-box')];
      boxes[boxes.indexOf(el as HTMLInputElement) - 1]?.focus();
    }
    // Mini tabs: arrow keys (WAI-ARIA tabs pattern, automatic activation).
    if (el.matches('[data-minitabs] [role="tab"]') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End')) {
      e.preventDefault();
      e.stopPropagation(); // don't let the table's roving tabindex see it
      const tabs = [...el.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')];
      let i = tabs.indexOf(el as HTMLButtonElement);
      i = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[i]);
      tabs[i].focus();
    }
  });

  document.addEventListener('paste', (e) => {
    const el = e.target as HTMLElement;
    if (!el.matches('.w-otp-box')) return;
    const code = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!code) return;
    e.preventDefault();
    const boxes = [...el.closest('[data-otp]')!.querySelectorAll<HTMLInputElement>('.w-otp-box')];
    [...code].slice(0, boxes.length).forEach((d, j) => (boxes[j].value = d));
    boxes[Math.min(code.length, boxes.length) - 1].focus();
  });

  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!el || el.hasAttribute('disabled')) return;
    if (el.matches('[data-switch]')) el.setAttribute('aria-checked', String(el.getAttribute('aria-checked') !== 'true'));
    if (el.matches('[data-minitabs] [role="tab"]')) selectTab(el as HTMLButtonElement);
    if (el.matches('.w-bar')) {
      const group = el.parentElement!;
      group.querySelectorAll('.w-bar').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      const readout = el.closest('[data-chart]')!.querySelector('[data-readout]');
      if (readout) readout.textContent = el.dataset.label ?? '';
    }
    if (el.matches('[data-retry]')) {
      const card = el.closest<HTMLElement>('[data-job]')!;
      setJob(card, 'running');
      el.remove();
      window.setTimeout(() => setJob(card, 'done'), 1200);
    }
    if (el.matches('.w-chip')) {
      el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true'));
      const wrap = el.closest<HTMLElement>('[data-chips]')!;
      const on = wrap.querySelectorAll('.w-chip[aria-pressed="true"]').length;
      const counts = [24, 9, 3, 0];
      const n = counts[on] ?? 0;
      wrap.querySelector('[data-count]')!.textContent = n === 0 ? wrap.dataset.zero! : wrap.dataset.tpl!.replace('{n}', String(n));
    }
    if (el.matches('[data-undo]')) {
      const toast = el.closest<HTMLElement>('[data-toast]')!;
      toast.querySelector('[data-toast-text]')!.textContent = toast.dataset.undone ?? '';
      el.remove();
    }
  });
}

function selectTab(tab: HTMLButtonElement) {
  const list = tab.parentElement!;
  list.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
    if (panel) panel.hidden = !on;
  });
}

function setJob(card: HTMLElement, status: 'running' | 'done') {
  card.dataset.status = status;
  const label = card.querySelector('[data-status-label]');
  if (label) label.lastChild!.textContent = status === 'done' ? card.dataset.lDone! : card.dataset.lRunning!;
}
