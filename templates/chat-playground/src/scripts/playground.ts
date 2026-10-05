/**
 * Playground controller (enhancement levels 2 and 3, see Playground.astro).
 *
 * Keyboard model (roving tabindex over the pieces):
 *   ← → ↑ ↓  choose a piece        Enter  inspect        Space  pick up
 *   while picked up: arrows move 16px (Shift: 64px) · Space/Enter drop · Esc cancel
 * Pointer: a single click/tap inspects (no drag required). Dragging is optional:
 * drop a piece on the inspector to inspect it, or anywhere on the table.
 */
import type { Inspector } from './inspector';
import type { PhysItem, Physics } from './physics';
import { fmt, prefersReducedMotion, type Strings } from './assistant';

type Item = PhysItem & { slot: HTMLElement; piece: HTMLElement; name: string; baseRot: number };

export function initPlayground(root: HTMLElement, inspector: Inspector) {
  const t: Strings = JSON.parse(root.dataset.t!);
  const table = root.querySelector<HTMLElement>('[data-table]')!;
  const live = root.querySelector<HTMLElement>('[data-play-live]')!;
  const gravityBtn = root.querySelector<HTMLButtonElement>('[data-gravity]')!;
  const motionBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-motion]')];
  const osReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 768px)');

  const items = new Map<string, Item>();
  for (const slot of table.querySelectorAll<HTMLElement>('[data-piece]')) {
    const piece = slot.querySelector<HTMLElement>('.piece')!;
    const rot = Number(slot.dataset.rot ?? 0);
    items.set(slot.dataset.piece!, {
      id: slot.dataset.piece!,
      el: slot,
      slot,
      piece,
      name: slot.dataset.name ?? '',
      x: 0, y: 0, w: 0, h: 0,
      rot,
      baseRot: rot,
    });
  }
  const visible = () => [...items.values()].filter((it) => !it.slot.hidden);

  let active: Item | undefined = visible()[0];
  let physics: Physics | null = null;
  let physicsLoading = false;
  let lifted: { it: Item; x: number; y: number; rot: number } | null = null;

  /* ---------- Announcements ---------- */
  const announce = (s: string) => {
    live.textContent = '';
    setTimeout(() => (live.textContent = s), 50);
  };

  /* ---------- Layout ---------- */
  const apply = (it: PhysItem) => {
    it.el.style.transform = `translate(${it.x}px, ${it.y}px) rotate(${it.rot}deg)`;
  };
  const bounds = () => ({ w: table.clientWidth, h: table.clientHeight });
  const clamp = (it: Item) => {
    const { w, h } = bounds();
    it.x = Math.max(0, Math.min(w - it.w, it.x));
    it.y = Math.max(0, Math.min(h - it.h, it.y));
  };

  /**
   * Measures where every visible piece would sit in the static (flex) layout,
   * without painting: classes are toggled and restored in the same task.
   */
  const measureFlow = (rotations: 'keep' | 'zero') => {
    const wasFree = table.classList.contains('is-free');
    const prevHeight = table.style.height;
    table.classList.remove('is-free');
    table.style.height = '';
    const saved = visible().map((it) => [it, it.slot.style.transform] as const);
    saved.forEach(([it]) => {
      it.slot.style.transform = '';
      if (rotations === 'zero') it.slot.style.setProperty('--rot', '0deg');
    });
    const pos = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const it of visible())
      pos.set(it.id, { x: it.slot.offsetLeft, y: it.slot.offsetTop, w: it.slot.offsetWidth, h: it.slot.offsetHeight });
    const height = table.offsetHeight;
    saved.forEach(([it, tr]) => {
      it.slot.style.transform = tr;
      it.slot.style.setProperty('--rot', `${it.baseRot}deg`);
    });
    if (wasFree) table.classList.add('is-free');
    table.style.height = prevHeight;
    return { pos, height };
  };

  /** Puts every visible piece back on the flow grid (initial layout, Tidy, resize). */
  const layoutAll = (rotations: 'keep' | 'zero') => {
    const { pos, height } = measureFlow(rotations);
    table.style.height = `${height}px`;
    table.classList.add('is-free');
    for (const it of visible()) {
      const p = pos.get(it.id)!;
      Object.assign(it, p, { rot: rotations === 'zero' ? 0 : it.baseRot });
      apply(it);
      physics?.setPosition(it);
    }
    physics?.resize(table.clientWidth, table.clientHeight);
  };

  /* ---------- Roving tabindex ---------- */
  const setActive = (it: Item | undefined, focus = false) => {
    active = it;
    for (const other of items.values()) {
      other.piece.tabIndex = other === it ? 0 : -1;
      other.slot.classList.toggle('is-active', other === it);
    }
    if (it && focus) it.piece.focus({ preventScroll: false });
  };
  const neighbour = (it: Item, dir: 1 | -1 | 'first' | 'last') => {
    const list = visible();
    if (dir === 'first') return list[0];
    if (dir === 'last') return list[list.length - 1];
    const i = list.indexOf(it);
    return list[(i + dir + list.length) % list.length];
  };

  /* ---------- Inspect ---------- */
  const inspect = (it: Item) => {
    setActive(it);
    inspector.inspect(it.id, { focus: true });
    announce(fmt(t['play.inspecting'], { name: it.name }));
  };

  /* ---------- Pick up / move / drop ---------- */
  const pickUp = (it: Item) => {
    lifted = { it, x: it.x, y: it.y, rot: it.rot };
    it.slot.classList.add('is-lifted');
    it.piece.setAttribute('aria-pressed', 'true');
    physics?.setStatic(it.id, true);
    announce(fmt(t['play.picked'], { name: it.name }));
  };
  const drop = (cancel = false) => {
    if (!lifted) return;
    const { it } = lifted;
    if (cancel) Object.assign(it, { x: lifted.x, y: lifted.y, rot: lifted.rot });
    clamp(it);
    apply(it);
    physics?.setPosition(it);
    it.slot.classList.remove('is-lifted');
    it.piece.removeAttribute('aria-pressed');
    lifted = null;
    announce(fmt(t[cancel ? 'play.cancelled' : 'play.dropped'], { name: it.name }));
  };
  const move = (it: Item, dx: number, dy: number) => {
    it.x += dx;
    it.y += dy;
    clamp(it);
    apply(it);
    physics?.setPosition(it);
  };

  /* ---------- Keyboard ---------- */
  table.addEventListener('keydown', (e) => {
    const piece = (e.target as HTMLElement).closest<HTMLElement>('.piece');
    if (!piece) return;
    const it = items.get(piece.closest<HTMLElement>('[data-piece]')!.dataset.piece!)!;
    const step = e.shiftKey ? 64 : 16;
    if (lifted?.it === it) {
      const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (d[e.key]) {
        e.preventDefault();
        move(it, ...d[e.key]);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        drop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        drop(true);
      }
      return;
    }
    const nav: Record<string, 1 | -1 | 'first' | 'last'> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' };
    if (nav[e.key]) {
      e.preventDefault();
      setActive(neighbour(it, nav[e.key]), true);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      inspect(it);
    } else if (e.key === ' ') {
      e.preventDefault();
      pickUp(it);
    }
  });
  // Leaving a lifted piece drops it where it is.
  table.addEventListener('focusout', (e) => {
    const it = lifted?.it;
    if (it && e.target === it.piece && !it.slot.contains(e.relatedTarget as Node)) drop();
  });
  // Focused piece stays still under physics.
  table.addEventListener('focusin', (e) => {
    const slot = (e.target as HTMLElement).closest<HTMLElement>('[data-piece]');
    if (!slot) return;
    const it = items.get(slot.dataset.piece!)!;
    if (active !== it) setActive(it);
    physics?.setStatic(it.id, true);
  });
  table.addEventListener('focusout', (e) => {
    const slot = (e.target as HTMLElement).closest<HTMLElement>('[data-piece]');
    if (!slot || slot.contains(e.relatedTarget as Node)) return;
    if (dragging?.it.slot === slot) return;
    physics?.setStatic(slot.dataset.piece!, false);
  });

  /* ---------- Toolbar buttons on each piece ---------- */
  table.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
    if (!btn) return;
    const it = items.get(btn.closest<HTMLElement>('[data-piece]')!.dataset.piece!)!;
    if (btn.dataset.act === 'inspect') inspect(it);
    else {
      setActive(it, true);
      pickUp(it);
    }
  });

  /* ---------- Pointer: click inspects, drag is optional ---------- */
  let dragging: { it: Item; sx: number; sy: number; ox: number; oy: number; moved: boolean; vx: number; vy: number; lx: number; ly: number; lt: number } | null = null;
  const overDropzone = (x: number, y: number) => {
    const r = inspector.dropzone?.getBoundingClientRect();
    return !!r && r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  table.addEventListener('pointerdown', (e) => {
    const piece = (e.target as HTMLElement).closest<HTMLElement>('.piece');
    if (!piece || e.button !== 0) return;
    const it = items.get(piece.closest<HTMLElement>('[data-piece]')!.dataset.piece!)!;
    if (lifted) drop();
    dragging = { it, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false, vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, lt: e.timeStamp };
    piece.setPointerCapture(e.pointerId);
  });
  table.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.sx;
    const dy = e.clientY - dragging.sy;
    if (!dragging.moved && Math.hypot(dx, dy) < 6) return;
    if (!dragging.moved) {
      dragging.moved = true;
      dragging.it.slot.classList.add('is-lifted');
      physics?.setStatic(dragging.it.id, true);
    }
    const dt = Math.max(1, e.timeStamp - dragging.lt);
    dragging.vx = ((e.clientX - dragging.lx) / dt) * 16;
    dragging.vy = ((e.clientY - dragging.ly) / dt) * 16;
    dragging.lx = e.clientX;
    dragging.ly = e.clientY;
    dragging.lt = e.timeStamp;
    // While dragging, the piece may leave the table (to reach the inspector).
    dragging.it.x = dragging.ox + dx;
    dragging.it.y = dragging.oy + dy;
    apply(dragging.it);
    physics?.setPosition(dragging.it);
    inspector.dropzone?.classList.toggle('is-over', overDropzone(e.clientX, e.clientY));
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    const d = dragging;
    dragging = null;
    inspector.dropzone?.classList.remove('is-over');
    if (!d.moved) {
      // Single click / tap: inspect. No dragging required.
      if (e.type === 'pointerup') inspect(d.it);
      return;
    }
    d.it.slot.classList.remove('is-lifted');
    if (overDropzone(e.clientX, e.clientY)) {
      Object.assign(d.it, { x: d.ox, y: d.oy });
      apply(d.it);
      physics?.setPosition(d.it);
      inspect(d.it);
    } else {
      clamp(d.it);
      apply(d.it);
      physics?.setPosition(d.it);
      if (document.activeElement !== d.it.piece) {
        physics?.setStatic(d.it.id, false);
        physics?.fling(d.it.id, d.vx, d.vy);
      }
      announce(fmt(t['play.dropped'], { name: d.it.name }));
    }
  };
  table.addEventListener('pointerup', endDrag);
  table.addEventListener('pointercancel', endDrag);

  /* ---------- Tidy / Scatter ---------- */
  root.querySelector('[data-tidy]')!.addEventListener('click', () => {
    layoutAll('zero');
    announce(t['play.tidied']);
  });
  root.querySelector('[data-scatter]')!.addEventListener('click', () => {
    const { w, h } = bounds();
    for (const it of visible()) {
      it.x = Math.random() * Math.max(0, w - it.w);
      it.y = Math.random() * Math.max(0, h - it.h);
      it.rot = Math.round(Math.random() * 24 - 12);
      apply(it);
      physics?.setPosition(it);
    }
    announce(t['play.scattered']);
  });

  /* ---------- Add from the tray / send from the chat ---------- */
  const addToTable = (it: Item) => {
    if (!it.slot.hidden) return false;
    it.slot.hidden = false;
    root.querySelector(`[data-add="${it.id}"]`)?.remove();
    const { pos, height } = measureFlow('keep');
    table.style.height = `${Math.max(height, table.clientHeight)}px`;
    const p = pos.get(it.id)!;
    Object.assign(it, p);
    if (physics) it.y = 0; // drop it in from the top
    apply(it);
    physics?.resize(table.clientWidth, table.clientHeight);
    physics?.add(it);
    return true;
  };
  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-add]');
    if (!btn) return;
    const it = items.get(btn.dataset.add!)!;
    addToTable(it);
    setActive(it, true);
    announce(fmt(t['play.added'], { name: it.name }));
  });

  /** The bridge from the chat: put the piece on the table, focus it, announce. */
  const send = (id: string, fromChat: boolean) => {
    const it = items.get(id);
    if (!it) return;
    addToTable(it);
    for (const other of items.values()) {
      other.slot.classList.toggle('is-sent', fromChat && other === it);
      other.slot.querySelector<HTMLElement>('[data-flag]')!.hidden = !fromChat || other !== it;
    }
    if (physics) {
      // Bring it to a visible spot near the top centre before it gets focus (and stops).
      it.x = (table.clientWidth - it.w) / 2;
      it.y = 16;
      physics.setPosition(it);
      apply(it);
    }
    root.closest('section')!.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    setActive(it);
    it.piece.focus({ preventScroll: true });
    announce(t['play.sent']);
  };
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-send], a[href^="#piece-"]');
    if (!link) return;
    const id = link.dataset.send ?? link.getAttribute('href')!.slice('#piece-'.length);
    if (!items.has(id)) return;
    e.preventDefault();
    send(id, link.hasAttribute('data-send'));
  });

  /* ---------- Gravity, motion and the physics layer ---------- */
  const reduced = () => osReduced.matches || document.documentElement.classList.contains('reduce-motion');
  const wantPhysics = () => gravityBtn.getAttribute('aria-checked') === 'true' && !reduced() && wide.matches;

  const syncPhysics = async () => {
    if (wantPhysics() && !physics && !physicsLoading) {
      physicsLoading = true;
      const { createPhysics } = await import('./physics');
      physicsLoading = false;
      if (!wantPhysics() || physics) return;
      visible().forEach((it) => {
        it.w = it.slot.offsetWidth;
        it.h = it.slot.offsetHeight;
      });
      physics = createPhysics(table.clientWidth, table.clientHeight, visible(), apply);
      if (active && document.activeElement === active.piece) physics.setStatic(active.id, true);
    } else if (!wantPhysics() && physics) {
      physics.stop();
      physics = null;
      // Settle pieces where they are, inside the table.
      visible().forEach((it) => {
        clamp(it);
        apply(it);
      });
    }
  };

  gravityBtn.addEventListener('click', () => {
    const on = gravityBtn.getAttribute('aria-checked') !== 'true';
    gravityBtn.setAttribute('aria-checked', String(on));
    syncPhysics();
  });

  const syncMotionButtons = () => {
    const r = reduced();
    motionBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.motion === 'reduced') === r)));
    // The OS setting always wins: "Full" cannot override prefers-reduced-motion.
    const full = motionBtns.find((b) => b.dataset.motion === 'full');
    if (full) full.disabled = osReduced.matches;
  };
  motionBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const r = b.dataset.motion === 'reduced';
      document.documentElement.classList.toggle('reduce-motion', r);
      try {
        localStorage.setItem('motion', r ? 'reduced' : 'full');
      } catch {}
      syncMotionButtons();
      syncPhysics();
    }),
  );
  osReduced.addEventListener('change', () => {
    syncMotionButtons();
    syncPhysics();
  });
  wide.addEventListener('change', () => syncPhysics());

  let lastWidth = table.clientWidth;
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (table.clientWidth === lastWidth) return;
      lastWidth = table.clientWidth;
      layoutAll('keep');
    }, 150);
  });

  /* ---------- Start ---------- */
  table.classList.add('is-enhanced');
  setActive(active);
  syncMotionButtons();
  // Fonts change piece sizes: lay out once they are ready.
  const start = () => {
    layoutAll('keep');
    lastWidth = table.clientWidth;
    syncPhysics();
  };
  if (document.fonts?.status === 'loaded') start();
  else document.fonts.ready.then(start);
}
