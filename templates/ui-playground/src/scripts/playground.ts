/**
 * Playground behaviour (layers 2 and 3).
 *
 * Layer 2 (always with JS): roving tabindex across pieces in DOM order,
 *   Enter = inspect, Space = pick up / drop, arrows move a picked-up piece
 *   16px (Shift: 64px), Escape cancels. Single click/tap inspects (WCAG 2.5.7),
 *   dragging is never required.
 * Layer 3 (physics): matter-js moves the SAME DOM nodes with transforms. Only
 *   when motion is "full", the viewport is >= 768px, the table is >= 640px wide
 *   and gravity is on. Bodies
 *   sleep; the keyboard-focused piece becomes static.
 */
import { createInspector } from './inspector';

type MatterNS = typeof import('matter-js');
type Body = import('matter-js').Body;

interface PhysicsState {
  M: MatterNS;
  engine: import('matter-js').Engine;
  bodies: Map<HTMLLIElement, Body>;
  sizes: Map<HTMLLIElement, { w: number; h: number }>;
  walls: Body[];
  width: number;
  height: number;
  raf: number;
  drag: { li: HTMLLIElement; constraint: import('matter-js').Constraint } | null;
}

const KEY_STEP = 16;
const KEY_STEP_BIG = 64;
const DRAG_THRESHOLD = 6;
const STEP_MS = 1000 / 60;

export function initPlayground() {
  const data = JSON.parse(document.getElementById('pg-data')!.textContent!);
  const t: Record<string, string> = data.t;
  const root = document.documentElement;
  const table = document.querySelector<HTMLUListElement>('[data-table]')!;
  const lens = document.querySelector<HTMLElement>('[data-lens]')!;
  const announcer = document.querySelector<HTMLElement>('[data-announce]')!;
  const gravityBtn = document.querySelector<HTMLButtonElement>('[data-gravity]')!;
  const gravityNote = document.querySelector<HTMLElement>('[data-gravity-note]')!;
  const discoveredEl = document.querySelector<HTMLElement>('[data-discovered]')!;
  const fill = (s: string, name: string) => s.replace('{name}', name);

  let announceTimer = 0;
  const announce = (msg: string) => {
    window.clearTimeout(announceTimer);
    announcer.textContent = '';
    announceTimer = window.setTimeout(() => (announcer.textContent = msg), 50);
  };

  // ------------------------------------------------------------ discovered
  const discovered = new Set<string>();
  try { (JSON.parse(localStorage.getItem('discovered') || '[]') as string[]).forEach((id) => id in data.pieces && discovered.add(id)); } catch {}
  const renderDiscovered = () => (discoveredEl.textContent = String(discovered.size));
  renderDiscovered();

  // ------------------------------------------------------------ pieces
  const allItems = [...table.querySelectorAll<HTMLLIElement>('li[data-piece]')];
  const originalOrder = [...allItems];
  allItems.forEach((li) => { if (li.dataset.onTable === 'false') li.hidden = true; });
  const visible = () => [...table.querySelectorAll<HTMLLIElement>('li[data-piece]:not([hidden])')];
  const handle = (li: HTMLLIElement) => li.querySelector<HTMLElement>('[data-handle]')!;
  const nameOf = (li: HTMLLIElement) => data.pieces[li.dataset.piece!].name as string;

  let current: HTMLLIElement | null = visible()[0] ?? null;
  function syncRoving() {
    for (const li of allItems) {
      const on = li === current;
      handle(li).tabIndex = on ? 0 : -1;
      li.querySelectorAll<HTMLElement>('.piece-tools a, .piece-tools button').forEach((b) => (b.tabIndex = on ? 0 : -1));
    }
  }
  function setCurrent(li: HTMLLIElement | null, focus = false) {
    current = li;
    syncRoving();
    if (li && focus) handle(li).focus({ preventScroll: physics !== null });
  }
  syncRoving();

  // Track input modality: only keyboard focus makes a body static.
  let keyboardMode = false;
  document.addEventListener('keydown', () => (keyboardMode = true), true);
  document.addEventListener('pointerdown', () => (keyboardMode = false), true);

  // ------------------------------------------------------------ inspector
  const inspector = createInspector({
    data,
    onDiscover(id) {
      discovered.add(id);
      try { localStorage.setItem('discovered', JSON.stringify([...discovered])); } catch {}
      renderDiscovered();
    },
    onInspectAnother() {
      const li = current ?? visible()[0];
      if (li) setCurrent(li, true);
    },
    onRequestPiece(id) {
      const li = allItems.find((l) => l.dataset.piece === id);
      if (li) inspect(li);
    },
  });

  function inspect(li: HTMLLIElement) {
    setCurrent(li);
    announce(fill(t['announce.inspecting'], nameOf(li)));
    inspector.open(li.dataset.piece!);
  }

  // ------------------------------------------------------------ grid-mode offsets
  const offsets = new Map<HTMLLIElement, { x: number; y: number }>();
  function setOffset(li: HTMLLIElement, x: number, y: number) {
    if (x === 0 && y === 0) {
      offsets.delete(li);
      li.style.transform = '';
      li.removeAttribute('data-offset');
    } else {
      offsets.set(li, { x, y });
      li.style.transform = `translate(${x}px, ${y}px)`;
      li.setAttribute('data-offset', '');
    }
  }

  // ------------------------------------------------------------ pick up (keyboard)
  let picked: { li: HTMLLIElement; start: { x: number; y: number; angle: number } } | null = null;

  function pickup(li: HTMLLIElement) {
    if (picked) drop();
    setCurrent(li);
    const body = physics?.bodies.get(li);
    const start = body ? { x: body.position.x, y: body.position.y, angle: body.angle } : { ...(offsets.get(li) ?? { x: 0, y: 0 }), angle: 0 };
    if (body && physics) physics.M.Body.setStatic(body, true);
    picked = { li, start };
    li.classList.add('is-picked');
    syncPickupButton(li, true);
    announce(fill(t['announce.picked'], nameOf(li)));
  }
  function drop(silent = false) {
    if (!picked) return;
    const { li } = picked;
    picked = null;
    li.classList.remove('is-picked');
    syncPickupButton(li, false);
    if (physics) {
      const body = physics.bodies.get(li);
      // Stays static while it keeps keyboard focus; released on blur.
      if (body && !li.contains(document.activeElement)) physics.M.Body.setStatic(body, false);
      wake();
    }
    if (overLens(li)) { inspect(li); return; }
    if (!silent) announce(fill(t['announce.dropped'], nameOf(li)));
  }
  function cancel() {
    if (!picked) return;
    const { li, start } = picked;
    const body = physics?.bodies.get(li);
    if (body && physics) {
      physics.M.Body.setPosition(body, { x: start.x, y: start.y });
      physics.M.Body.setAngle(body, start.angle);
      renderBody(li, body);
    } else setOffset(li, start.x, start.y);
    drop(true);
    announce(fill(t['announce.cancel'], nameOf(li)));
  }
  function moveBy(li: HTMLLIElement, dx: number, dy: number) {
    const body = physics?.bodies.get(li);
    if (body && physics) {
      const { w, h } = physics.sizes.get(li)!;
      const x = clamp(body.position.x + dx, w / 2, physics.width - w / 2);
      const y = clamp(body.position.y + dy, h / 2, physics.height - h / 2);
      physics.M.Body.setPosition(body, { x, y });
      renderBody(li, body);
      wake();
    } else {
      const o = offsets.get(li) ?? { x: 0, y: 0 };
      setOffset(li, o.x + dx, o.y + dy);
    }
  }
  function syncPickupButton(li: HTMLLIElement, on: boolean) {
    const btn = li.querySelector<HTMLButtonElement>('[data-pickup]');
    const label = li.querySelector<HTMLElement>('[data-pickup-label]');
    btn?.setAttribute('aria-pressed', String(on));
    if (label) label.textContent = on ? label.dataset.drop! : label.dataset.up!;
  }
  function overLens(li: HTMLLIElement) {
    const a = handle(li).getBoundingClientRect();
    const b = lens.getBoundingClientRect();
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  // ------------------------------------------------------------ keyboard
  table.addEventListener('keydown', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-handle]');
    if (!card || e.target !== card) return; // ignore keys from toolbar buttons
    const li = card.closest<HTMLLIElement>('li')!;
    const items = visible();
    const i = items.indexOf(li);
    const step = e.shiftKey ? KEY_STEP_BIG : KEY_STEP;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

    if (picked?.li === li) {
      if (e.key in arrows) { e.preventDefault(); const [dx, dy] = arrows[e.key]; moveBy(li, dx * step, dy * step); return; }
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); drop(); return; }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
      if (e.key === 'Enter') { e.preventDefault(); drop(true); inspect(li); return; }
      if (e.key === 'Tab') drop(true);
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); setCurrent(items[(i + 1) % items.length], true); break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); setCurrent(items[(i - 1 + items.length) % items.length], true); break;
      case 'Home': e.preventDefault(); setCurrent(items[0], true); break;
      case 'End': e.preventDefault(); setCurrent(items[items.length - 1], true); break;
      case 'Enter': e.preventDefault(); inspect(li); break;
      case ' ': case 'Spacebar': e.preventDefault(); pickup(li); break;
    }
  });

  table.addEventListener('focusin', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('li[data-piece]');
    if (!li) return;
    if (current !== li) setCurrent(li);
    const body = physics?.bodies.get(li);
    if (body && physics && keyboardMode) physics.M.Body.setStatic(body, true);
  });
  table.addEventListener('focusout', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('li[data-piece]');
    if (!li || li.contains(e.relatedTarget as Node)) return;
    if (picked?.li === li) drop(true);
    const body = physics?.bodies.get(li);
    if (body?.isStatic && physics) { physics.M.Body.setStatic(body, false); wake(); }
  });

  // Toolbar buttons.
  table.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const li = target.closest<HTMLLIElement>('li[data-piece]');
    if (!li) return;
    if (target.closest('[data-inspect]')) { e.preventDefault(); inspect(li); return; }
    if (target.closest('[data-pickup]')) {
      keyboardMode = true;
      if (picked?.li === li) drop(); else pickup(li);
      handle(li).focus({ preventScroll: true });
      return;
    }
    // Keyboard/AT "click" on the card itself (detail === 0) inspects.
    if (target.closest('[data-handle]') && e.detail === 0) inspect(li);
  });

  // ------------------------------------------------------------ pointer: click inspects, drag throws
  let ptr: { id: number; li: HTMLLIElement; x0: number; y0: number; dragging: boolean; base: { x: number; y: number } } | null = null;

  table.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-handle]');
    if (!card) return;
    const li = card.closest<HTMLLIElement>('li')!;
    // In grid mode, touch keeps native scrolling: a tap inspects, no drag.
    if (!physics && e.pointerType === 'touch') { ptr = { id: e.pointerId, li, x0: e.clientX, y0: e.clientY, dragging: false, base: { x: 0, y: 0 } }; return; }
    e.preventDefault(); // no text selection / native drag
    try { card.setPointerCapture(e.pointerId); } catch { /* synthetic or already-released pointer */ }
    ptr = { id: e.pointerId, li, x0: e.clientX, y0: e.clientY, dragging: false, base: { ...(offsets.get(li) ?? { x: 0, y: 0 }) } };
    setCurrent(li);
  });

  table.addEventListener('pointermove', (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x0;
    const dy = e.clientY - ptr.y0;
    if (!ptr.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!physics && e.pointerType === 'touch') { ptr = null; return; } // scrolling
      ptr.dragging = true;
      ptr.li.classList.add('is-dragging');
      if (physics) startBodyDrag(ptr.li, e);
    }
    if (physics) moveBodyDrag(e);
    else setOffset(ptr.li, ptr.base.x + dx, ptr.base.y + dy);
    lens.classList.toggle('is-over', pointInLens(e.clientX, e.clientY));
  });

  const endPointer = (e: PointerEvent, cancelled = false) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const { li, dragging } = ptr;
    ptr = null;
    li.classList.remove('is-dragging');
    lens.classList.remove('is-over');
    if (!dragging) { if (!cancelled) inspect(li); return; }
    const onLens = !cancelled && pointInLens(e.clientX, e.clientY);
    if (physics) endBodyDrag();
    if (onLens) {
      if (!physics) setOffset(li, 0, 0); // snap back into the grid
      inspect(li);
    }
  };
  table.addEventListener('pointerup', (e) => endPointer(e));
  table.addEventListener('pointercancel', (e) => endPointer(e, true));

  function pointInLens(x: number, y: number) {
    const r = lens.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  // ------------------------------------------------------------ tray
  const tray = document.querySelector<HTMLElement>('[data-tray]')!;
  const trayEmpty = document.querySelector<HTMLElement>('[data-tray-empty]')!;
  const syncTray = () => (trayEmpty.hidden = tray.querySelector('button') !== null);
  syncTray();
  tray.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-add]');
    if (!btn) return;
    const li = allItems.find((l) => l.dataset.piece === btn.dataset.add)!;
    table.appendChild(li); // DOM order = keyboard order: new pieces go last
    li.hidden = false;
    btn.closest('li')!.remove();
    syncTray();
    if (physics) { addBody(li, physics.width / 2 + (Math.random() - 0.5) * 120, 0); fitHeight(visible()); const b = physics.bodies.get(li)!; physics.M.Body.setPosition(b, { x: b.position.x, y: physics.sizes.get(li)!.h / 2 + 8 }); renderBody(li, b); }
    setCurrent(li, true);
    announce(fill(t['announce.added'], nameOf(li)));
  });

  // ------------------------------------------------------------ tidy / scatter
  document.querySelector('[data-tidy]')!.addEventListener('click', () => {
    if (picked) drop(true);
    if (physics) tidyBodies();
    else {
      offsets.forEach((_, li) => setOffset(li, 0, 0));
      originalOrder.forEach((li) => table.appendChild(li));
      // pieces added from the tray keep their place after the originals
    }
    announce(t['announce.tidy']);
  });
  document.querySelector('[data-scatter]')!.addEventListener('click', () => {
    if (picked) drop(true);
    if (physics) scatterBodies();
    else {
      const items = visible();
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      items.forEach((li) => table.appendChild(li));
    }
    announce(t['announce.scatter']);
  });

  // ------------------------------------------------------------ gravity + motion => physics on/off
  let gravity = true;
  try { gravity = localStorage.getItem('gravity') !== 'off'; } catch {}
  gravityBtn.setAttribute('aria-checked', String(gravity));
  gravityBtn.addEventListener('click', () => {
    gravity = !gravity;
    gravityBtn.setAttribute('aria-checked', String(gravity));
    try { localStorage.setItem('gravity', gravity ? 'on' : 'off'); } catch {}
    evaluate(true);
  });
  const wide = window.matchMedia('(min-width: 768px)');
  const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Physics needs room for at least two pieces per row (2 × 280px cards + gaps);
  // on narrower tables the pieces would stack into one tall tower, so the grid stays.
  const MIN_TABLE_WIDTH = 640;
  const roomy = () => wide.matches && table.clientWidth >= MIN_TABLE_WIDTH;
  const physicsAllowed = () => !root.classList.contains('reduce-motion') && roomy() && gravity;
  const isReduced = () => root.classList.contains('reduce-motion');

  document.addEventListener('motion-change', () => evaluate(true));
  wide.addEventListener('change', () => evaluate(false));
  // The table width also depends on the inspector column, not just the viewport.
  let lastWidth = table.clientWidth;
  new ResizeObserver(() => {
    if (table.clientWidth === lastWidth) return; // height changes come from fitHeight()
    lastWidth = table.clientWidth;
    evaluate(false);
  }).observe(table);
  systemReduce.addEventListener('change', () => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('motion'); } catch {}
    if (!saved) root.classList.toggle('reduce-motion', systemReduce.matches);
    evaluate(true);
  });

  let enabling = false;
  async function evaluate(userAction: boolean) {
    gravityNote.textContent = isReduced() || !roomy() ? `${t['announce.physicsOff']}` : '';
    const want = physicsAllowed();
    if (want && !physics && !enabling) {
      enabling = true;
      await enablePhysics();
      enabling = false;
      if (userAction) announce(t['announce.physicsOn']);
    } else if (!want && physics) {
      disablePhysics();
      if (userAction) announce(t['announce.physicsOff']);
    }
  }

  // ------------------------------------------------------------ physics (layer 3)
  let physics: PhysicsState | null = null;

  async function enablePhysics() {
    const mod: any = await import('matter-js');
    const M: MatterNS = mod.default ?? mod;
    if (!physicsAllowed()) return; // conditions changed while loading
    if (picked) drop(true);
    offsets.forEach((_, li) => setOffset(li, 0, 0));
    table.classList.add('is-physics');
    const width = table.clientWidth;
    const height = table.clientHeight;
    const engine = M.Engine.create({ enableSleeping: true });
    engine.gravity.y = 1;
    physics = { M, engine, bodies: new Map(), sizes: new Map(), walls: [], width, height, raf: 0, drag: null };
    buildWalls();
    // Spawn INSIDE the table: measure every card, lay them out in rows from the
    // top (with a little jitter) and let gravity drop them onto the floor.
    const items = visible();
    items.forEach((li) => addBody(li, width / 2, height / 2));
    fitHeight(items);
    const slots = rowLayout(items, 'top');
    items.forEach((li, i) => {
      const body = physics!.bodies.get(li)!;
      M.Body.setPosition(body, { x: slots[i].x + (Math.random() - 0.5) * 24, y: slots[i].y });
      M.Body.setAngle(body, (Math.random() - 0.5) * 0.3);
      renderBody(li, body);
    });
    // If the page is hidden (background tab), rAF does not run: settle now so
    // pieces never stay frozen mid-air when the tab becomes visible.
    if (document.visibilityState === 'hidden') settle();
    wake();
  }

  /**
   * Row layout in table coordinates (body centres). 'top' stacks rows from the
   * top edge (spawn), 'bottom' from the floor (Tidy). Rows that do not fit are
   * clamped inside the table; the solver separates any overlap.
   */
  function rowLayout(items: HTMLLIElement[], from: 'top' | 'bottom') {
    const { width, height, sizes } = physics!;
    const gap = 20;
    const rows: { li: HTMLLIElement; w: number; h: number }[][] = [[]];
    let x = gap;
    for (const li of items) {
      const s = sizes.get(li)!;
      if (x + s.w > width - gap && rows[rows.length - 1].length) { rows.push([]); x = gap; }
      rows[rows.length - 1].push({ li, w: s.w, h: s.h });
      x += s.w + gap;
    }
    const out = new Map<HTMLLIElement, { x: number; y: number }>();
    let edge = from === 'top' ? gap : height - gap;
    for (const row of rows) {
      const rowH = Math.max(...row.map((r) => r.h));
      let cx = gap;
      for (const r of row) {
        const y = from === 'top' ? edge + r.h / 2 : edge - r.h / 2;
        out.set(r.li, { x: clamp(cx + r.w / 2, r.w / 2, width - r.w / 2), y: clamp(y, r.h / 2, height - r.h / 2) });
        cx += r.w + gap;
      }
      edge += from === 'top' ? rowH + gap : -(rowH + gap);
    }
    return items.map((li) => out.get(li)!);
  }

  /**
   * Make sure every piece fits when tidied (narrow tables have fewer pieces per
   * row): grow the table height if needed, then rebuild the walls.
   */
  function fitHeight(items: HTMLLIElement[]) {
    if (!physics) return;
    const gap = 20;
    const { width, sizes } = physics;
    let x = gap, rowH = 0, total = gap;
    for (const li of items) {
      const s = sizes.get(li);
      if (!s) continue;
      if (x + s.w > width - gap && x > gap) { total += rowH + gap; x = gap; rowH = 0; }
      x += s.w + gap;
      rowH = Math.max(rowH, s.h);
    }
    total += rowH + gap + 80; // headroom for stacking
    if (total > physics.height) {
      table.style.height = `${Math.ceil(total)}px`;
      physics.height = table.clientHeight;
      buildWalls();
    }
  }

  /** Run the simulation synchronously until everything rests (bounded). */
  function settle(maxSteps = 900) {
    if (!physics) return;
    for (let i = 0; i < maxSteps; i++) {
      physics.M.Engine.update(physics.engine, STEP_MS);
      let awake = false;
      physics.bodies.forEach((b) => { if (!b.isSleeping && !b.isStatic) awake = true; });
      if (!awake) break;
    }
    physics.bodies.forEach((b, li) => renderBody(li, b));
  }

  function buildWalls() {
    if (!physics) return;
    const { M, engine, width: w, height: h } = physics;
    if (physics.walls.length) M.Composite.remove(engine.world, physics.walls);
    const T = 200;
    physics.walls = [
      M.Bodies.rectangle(w / 2, h + T / 2, w + T * 2, T, { isStatic: true }), // floor
      M.Bodies.rectangle(-T / 2, h / 2, T, h + T * 2, { isStatic: true }), // left
      M.Bodies.rectangle(w + T / 2, h / 2, T, h + T * 2, { isStatic: true }), // right
      M.Bodies.rectangle(w / 2, -T / 2, w + T * 2, T, { isStatic: true }), // ceiling: pieces stay inside
    ];
    M.Composite.add(engine.world, physics.walls);
  }

  function addBody(li: HTMLLIElement, x: number, y: number) {
    if (!physics) return;
    const { M } = physics;
    const card = handle(li);
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const body = M.Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: 14 },
      restitution: 0.15,
      friction: 0.5,
      frictionAir: 0.015,
      angle: (Math.random() - 0.5) * 0.4,
    });
    physics.bodies.set(li, body);
    physics.sizes.set(li, { w, h });
    M.Composite.add(physics.engine.world, body);
    renderBody(li, body);
    wake();
  }

  function renderBody(li: HTMLLIElement, body: Body) {
    const s = physics?.sizes.get(li);
    if (!s) return;
    li.style.transform = `translate(${body.position.x - s.w / 2}px, ${body.position.y - s.h / 2}px)`;
    li.style.setProperty('--a', `${body.angle}rad`);
  }

  // Fixed 60 Hz steps driven by real elapsed time, so a throttled or janky
  // frame rate cannot leave bodies hanging mid-air (missed time is caught up,
  // capped so a long pause does not freeze the page).
  let lastTime = 0;
  let acc = 0;
  let lastStepAt = 0;
  function step(now: number) {
    if (!physics) return;
    lastStepAt = performance.now();
    const elapsed = lastTime ? Math.min(now - lastTime, 250) : STEP_MS;
    lastTime = now;
    acc += elapsed;
    let n = 0;
    while (acc >= STEP_MS && n < 15) { physics.M.Engine.update(physics.engine, STEP_MS); acc -= STEP_MS; n++; }
    if (n === 15) acc = 0;
    let awake = !!physics.drag;
    physics.bodies.forEach((body, li) => {
      if (!body.isSleeping && !body.isStatic) awake = true;
      renderBody(li, body);
    });
    if (awake) physics.raf = requestAnimationFrame(step);
    else { physics.raf = 0; lastTime = 0; acc = 0; }
  }
  function wake() {
    if (!physics) return;
    physics.bodies.forEach((b) => physics!.M.Sleeping.set(b, false));
    if (!physics.raf) { lastTime = 0; physics.raf = requestAnimationFrame(step); }
    // Watchdog: some embedded/preview browsers report "visible" but never fire
    // rAF. If no frame arrives soon, settle synchronously so nothing hangs.
    const kickedAt = performance.now();
    window.setTimeout(() => {
      if (physics && physics.raf && lastStepAt < kickedAt && !physics.drag) settle();
    }, 500);
  }
  document.addEventListener('visibilitychange', () => {
    if (!physics) return;
    if (document.visibilityState === 'hidden') { cancelAnimationFrame(physics.raf); physics.raf = 0; settle(); }
    else wake();
  });

  function localPoint(e: PointerEvent) {
    const r = table.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function startBodyDrag(li: HTMLLIElement, e: PointerEvent) {
    if (!physics) return;
    const { M } = physics;
    const body = physics.bodies.get(li)!;
    if (body.isStatic) M.Body.setStatic(body, false);
    const p = localPoint(e);
    const constraint = M.Constraint.create({
      pointA: p,
      bodyB: body,
      pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
      stiffness: 0.2,
      damping: 0.1,
      length: 0,
    });
    M.Composite.add(physics.engine.world, constraint);
    physics.drag = { li, constraint };
    wake();
  }
  function moveBodyDrag(e: PointerEvent) {
    if (!physics?.drag) return;
    const p = localPoint(e);
    physics.drag.constraint.pointA = p;
    wake();
  }
  function endBodyDrag() {
    if (!physics?.drag) return;
    physics.M.Composite.remove(physics.engine.world, physics.drag.constraint);
    physics.drag = null; // the body keeps its velocity: that's the throw
    wake();
  }

  function tidyBodies() {
    if (!physics) return;
    const { M } = physics;
    const items = visible().filter((li) => physics!.bodies.has(li));
    const slots = rowLayout(items, 'bottom');
    items.forEach((li, i) => {
      const body = physics!.bodies.get(li)!;
      M.Body.setAngle(body, 0);
      M.Body.setVelocity(body, { x: 0, y: 0 });
      M.Body.setAngularVelocity(body, 0);
      M.Body.setPosition(body, slots[i]);
    });
    wake();
  }
  function scatterBodies() {
    if (!physics) return;
    const { M, width, height } = physics;
    physics.bodies.forEach((body, li) => {
      if (body.isStatic) return;
      const s = physics!.sizes.get(li)!;
      // Toss from inside the table's upper half; gravity brings them back down.
      M.Body.setPosition(body, {
        x: clamp(s.w / 2 + Math.random() * (width - s.w), s.w / 2, width - s.w / 2),
        y: clamp(s.h / 2 + Math.random() * (height / 2), s.h / 2, height - s.h / 2),
      });
      M.Body.setVelocity(body, { x: (Math.random() - 0.5) * 16, y: -Math.random() * 8 });
      M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
    });
    wake();
  }

  function disablePhysics() {
    if (!physics) return;
    cancelAnimationFrame(physics.raf);
    physics.M.Engine.clear(physics.engine);
    physics.bodies.forEach((_, li) => { li.style.transform = ''; li.style.removeProperty('--a'); });
    physics = null;
    table.style.height = '';
    table.classList.remove('is-physics');
  }

  // Keep walls in sync with the table size.
  let resizeTimer = 0;
  new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!physics) return;
      const w = table.clientWidth;
      const h = table.clientHeight;
      if (w === physics.width && h === physics.height) return;
      physics.width = w;
      physics.height = h;
      buildWalls();
      fitHeight(visible());
      physics.bodies.forEach((body, li) => {
        const s = physics!.sizes.get(li)!;
        physics!.M.Body.setPosition(body, {
          x: clamp(body.position.x, s.w / 2, physics!.width - s.w / 2),
          y: clamp(body.position.y, s.h / 2, physics!.height - s.h / 2),
        });
      });
      wake();
    }, 120);
  }).observe(table);

  evaluate(false);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
