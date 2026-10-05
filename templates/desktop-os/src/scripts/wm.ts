/**
 * <window-manager> — framework-free window manager.
 *
 * - Desktop mode only when JS runs, the viewport is >= 768px and the visitor did not pick
 *   classic mode. Otherwise every window is a normal section of a scrolling page.
 * - Each window becomes a NON-modal role="dialog" labelled by its title.
 * - Open / focus (raise) / minimize / maximize / close, drag by the title bar (pointer events).
 * - Keyboard: Alt+Shift+Arrow moves the focused window by 16px, Esc closes it and returns
 *   focus to the icon / Start-menu item / taskbar tab that opened it. Taskbar tabs switch windows.
 *   Dragging is never required: every action has a button or a key.
 *
 * Events dispatched on document: `wm:open` { id, user }, `wm:mode` { os }.
 */
import { isWindowId, type WindowId } from '../lib/windows';
import { reducedMotion, storage } from './client';

type State = 'open' | 'min' | 'closed';
interface Geo {
  x: number;
  y: number;
  w: number;
}

const STEP = 16;
const MIN_VISIBLE = 64;

class WindowManager extends HTMLElement {
  enabled = false;
  private wins = new Map<WindowId, HTMLElement>();
  private state = new Map<WindowId, State>();
  private geo = new Map<WindowId, Geo>();
  private openers = new Map<WindowId, HTMLElement>();
  private order: WindowId[] = []; // z-order, last = top
  private active: WindowId | null = null;
  private mq = matchMedia('(min-width: 768px)');
  private drag: { id: WindowId; px: number; py: number; gx: number; gy: number } | null = null;

  connectedCallback() {
    this.querySelectorAll<HTMLElement>('.win[data-win]').forEach((w) => {
      const id = w.dataset.win;
      if (isWindowId(id)) {
        this.wins.set(id, w);
        this.state.set(id, 'closed');
      }
    });
    document.addEventListener('click', this.onDocClick);
    this.addEventListener('click', this.onCtrlClick);
    this.addEventListener('keydown', this.onKey);
    this.addEventListener('pointerdown', this.onPointerDown);
    this.addEventListener('focusin', this.onFocusIn);
    this.mq.addEventListener('change', () => this.sync());
    let t = 0;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = window.setTimeout(() => this.enabled && this.wins.forEach((_, id) => this.apply(id)), 100);
    });
    this.sync(true);
  }

  /* ------------------------------------------------------------ modes */

  private wantsDesktop() {
    return this.mq.matches && storage('view') !== 'classic';
  }

  private sync(first = false) {
    if (this.wantsDesktop()) this.enable(first);
    else this.disable();
  }

  private enable(first: boolean) {
    if (this.enabled) return;
    this.enabled = true;
    const root = document.documentElement;
    root.classList.add('os', 'os-ready');
    for (const [id, w] of this.wins) {
      w.setAttribute('role', 'dialog');
      w.setAttribute('tabindex', '-1');
      this.apply(id);
    }
    if (first) {
      const hashTarget = location.hash.slice(1);
      const target = hashTarget ? document.getElementById(hashTarget) : null;
      const winEl = target?.closest<HTMLElement>('.win[data-win]');
      const id = winEl?.dataset.win;
      if (isWindowId(id)) this.open(id, null, hashTarget !== winEl!.id ? hashTarget : undefined, false);
      else this.open('projects', null, undefined, false);
    } else {
      this.wins.forEach((_, id) => this.apply(id));
    }
    this.renderTaskbar();
    document.dispatchEvent(new CustomEvent('wm:mode', { detail: { os: true } }));
  }

  private disable() {
    const root = document.documentElement;
    root.classList.remove('os', 'os-ready');
    if (!this.enabled) {
      document.dispatchEvent(new CustomEvent('wm:mode', { detail: { os: false } }));
      return;
    }
    this.enabled = false;
    for (const w of this.wins.values()) {
      w.removeAttribute('role');
      w.removeAttribute('tabindex');
      w.removeAttribute('data-state');
      w.removeAttribute('data-max');
      w.classList.remove('is-active', 'is-opening');
      w.style.cssText = '';
    }
    document.dispatchEvent(new CustomEvent('wm:mode', { detail: { os: false } }));
  }

  /* ---------------------------------------------------------- actions */

  open(id: WindowId, opener?: HTMLElement | null, highlight?: string, user = true) {
    const w = this.wins.get(id);
    if (!w) return;
    if (opener) this.openers.set(id, opener);
    const prev = this.state.get(id);
    this.state.set(id, 'open');
    if (prev === 'closed') {
      this.geo.delete(id); // reopen at its default place
      if (!reducedMotion()) {
        w.classList.add('is-opening');
        w.addEventListener('animationend', () => w.classList.remove('is-opening'), { once: true });
      }
    }
    this.apply(id);
    this.focus(id, !highlight);
    if (highlight) this.highlight(w, highlight);
    if (prev !== 'open') document.dispatchEvent(new CustomEvent('wm:open', { detail: { id, user } }));
  }

  focus(id: WindowId, moveFocus: boolean) {
    const w = this.wins.get(id);
    if (!w || this.state.get(id) !== 'open') return;
    this.order = this.order.filter((x) => x !== id).concat(id);
    this.order.forEach((wid, i) => {
      const el = this.wins.get(wid);
      if (el) el.style.zIndex = String(10 + i);
    });
    this.active = id;
    this.wins.forEach((el, wid) => el.classList.toggle('is-active', wid === id));
    if (moveFocus) w.focus({ preventScroll: true });
    this.renderTaskbar();
  }

  minimize(id: WindowId) {
    this.state.set(id, 'min');
    this.apply(id);
    this.activateTop(false);
    this.renderTaskbar();
    this.tab(id)?.focus();
  }

  minimizeAll() {
    this.wins.forEach((_, id) => this.state.get(id) === 'open' && this.state.set(id, 'min'));
    this.wins.forEach((_, id) => this.apply(id));
    this.active = null;
    this.renderTaskbar();
  }

  close(id: WindowId) {
    const w = this.wins.get(id)!;
    this.state.set(id, 'closed');
    w.removeAttribute('data-max');
    this.apply(id);
    this.order = this.order.filter((x) => x !== id);
    this.activateTop(false);
    this.renderTaskbar();
    // Return focus to whatever opened it, if still visible; else its desktop icon.
    const opener = this.openers.get(id);
    const visible = opener && opener.isConnected && opener.getClientRects().length > 0;
    const fallback = document.querySelector<HTMLElement>(`.desk-icon[data-open="${id}"]`);
    (visible ? opener : fallback)?.focus();
  }

  toggleMax(id: WindowId) {
    const w = this.wins.get(id)!;
    const max = w.dataset.max !== 'true';
    w.dataset.max = String(max);
    const btn = w.querySelector<HTMLElement>('[data-action="max"]');
    if (btn) btn.setAttribute('aria-label', (max ? btn.dataset.labelRestore : btn.dataset.labelMax) ?? '');
  }

  move(id: WindowId, dx: number, dy: number) {
    const g = this.geometry(id);
    this.geo.set(id, { ...g, x: g.x + dx, y: g.y + dy });
    this.apply(id);
  }

  /* --------------------------------------------------------- internals */

  private activateTop(moveFocus: boolean) {
    const top = [...this.order].reverse().find((id) => this.state.get(id) === 'open');
    this.active = null;
    this.wins.forEach((el) => el.classList.remove('is-active'));
    if (top) this.focus(top, moveFocus);
  }

  private highlight(w: HTMLElement, elId: string) {
    const el = document.getElementById(elId);
    if (!el || !w.contains(el)) return;
    w.querySelectorAll('.is-highlight').forEach((x) => x.classList.remove('is-highlight'));
    if (el.hidden) {
      // A filter hid it: reset to "All".
      w.querySelector<HTMLButtonElement>('[data-filter="all"]')?.click();
    }
    el.classList.add('is-highlight');
    el.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  }

  private geometry(id: WindowId): Geo {
    let g = this.geo.get(id);
    if (!g) {
      const w = this.wins.get(id)!;
      const rect = this.getBoundingClientRect();
      const width = Math.min(Number(w.dataset.w) || 560, rect.width - 16);
      g = {
        w: width,
        x: Math.round((Number(w.dataset.x) || 0.2) * rect.width),
        y: Math.round((Number(w.dataset.y) || 0.08) * rect.height),
      };
      // Keep clear of the desktop icon column when there is room.
      if (rect.width - width > 120) g.x = Math.max(g.x, 112);
      this.geo.set(id, g);
    }
    return g;
  }

  private apply(id: WindowId) {
    const w = this.wins.get(id);
    if (!w || !this.enabled) return;
    const s = this.state.get(id)!;
    w.dataset.state = s;
    if (s !== 'open') return;
    const rect = this.getBoundingClientRect();
    const g = this.geometry(id);
    const width = Math.min(g.w, rect.width - 8);
    // Clamp so the title bar always stays reachable.
    g.x = Math.min(Math.max(g.x, MIN_VISIBLE - width), rect.width - MIN_VISIBLE);
    g.y = Math.min(Math.max(g.y, 0), rect.height - 44);
    w.style.left = `${g.x}px`;
    w.style.top = `${g.y}px`;
    w.style.width = `${width}px`;
    w.style.maxHeight = `${Math.max(200, rect.height - g.y - 8)}px`;
  }

  private tab(id: WindowId) {
    return document.querySelector<HTMLButtonElement>(`.tb-tab[data-tab="${id}"]`);
  }

  private renderTaskbar() {
    document.querySelectorAll<HTMLButtonElement>('.tb-tab[data-tab]').forEach((tab) => {
      const id = tab.dataset.tab as WindowId;
      const s = this.state.get(id);
      tab.hidden = !this.enabled || s === 'closed';
      tab.setAttribute('aria-pressed', String(s === 'open' && this.active === id));
    });
    document.querySelectorAll<HTMLElement>('.desk-icon[data-open]').forEach((icon) => {
      icon.setAttribute('aria-current', String(this.active === icon.dataset.open));
    });
  }

  private winOf(el: EventTarget | null): WindowId | null {
    const w = (el as HTMLElement | null)?.closest?.<HTMLElement>('.win[data-win]');
    const id = w?.dataset.win;
    return isWindowId(id) ? id : null;
  }

  /* ----------------------------------------------------------- events */

  private onDocClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Taskbar tabs: restore / focus, or minimize the active window.
    const tab = target.closest<HTMLElement>('.tb-tab[data-tab]');
    if (tab && this.enabled) {
      const id = tab.dataset.tab as WindowId;
      if (this.state.get(id) === 'open' && this.active === id) this.minimize(id);
      else this.open(id, tab, undefined, false);
      return;
    }
    if (target.closest('[data-show-desktop]') && this.enabled) {
      this.minimizeAll();
      return;
    }
    // Anything with data-open (desktop icons, Start menu, citations): single click / tap / Enter.
    const opener = target.closest<HTMLElement>('[data-open]');
    if (!opener || !this.enabled) return; // classic mode: let the anchor link scroll
    const id = opener.dataset.open;
    if (!isWindowId(id)) return;
    e.preventDefault();
    this.open(id, opener, opener.dataset.highlight);
  };

  private onCtrlClick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    const id = this.winOf(btn);
    if (!btn || !id || !this.enabled) return;
    const action = btn.dataset.action;
    if (action === 'min') this.minimize(id);
    else if (action === 'max') this.toggleMax(id);
    else if (action === 'close') this.close(id);
  };

  private onKey = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    const id = this.winOf(e.target);
    if (!id) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close(id);
      return;
    }
    if (e.altKey && e.shiftKey && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key];
      if (d) this.move(id, d[0], d[1]);
    }
  };

  private onFocusIn = (e: FocusEvent) => {
    const id = this.winOf(e.target);
    if (id && this.enabled && this.active !== id) this.focus(id, false);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    const id = this.winOf(e.target);
    if (!id) return;
    if (this.active !== id) this.focus(id, false);
    const target = e.target as HTMLElement;
    const bar = target.closest('[data-drag]');
    const w = this.wins.get(id)!;
    if (!bar || target.closest('button') || e.button !== 0 || w.dataset.max === 'true') return;
    e.preventDefault();
    const g = this.geometry(id);
    this.drag = { id, px: e.clientX, py: e.clientY, gx: g.x, gy: g.y };
    (bar as HTMLElement).setPointerCapture(e.pointerId);
    w.classList.add('is-dragging');
    const move = (ev: PointerEvent) => {
      if (!this.drag) return;
      this.geo.set(id, { ...g, x: this.drag.gx + ev.clientX - this.drag.px, y: this.drag.gy + ev.clientY - this.drag.py });
      this.apply(id);
    };
    const up = () => {
      this.drag = null;
      w.classList.remove('is-dragging');
      bar.removeEventListener('pointermove', move as EventListener);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
    };
    bar.addEventListener('pointermove', move as EventListener);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  };
}

if (!customElements.get('window-manager')) customElements.define('window-manager', WindowManager);
