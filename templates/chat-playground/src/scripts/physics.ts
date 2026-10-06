/**
 * Physics layer (enhancement level 3). Loaded on demand only when motion is
 * allowed, the viewport is ≥768px and gravity is on.
 *
 * matter-js simulates invisible bodies; on every frame we copy each body's
 * position/angle onto the SAME DOM node (a CSS transform). Nothing is cloned or
 * drawn on a canvas, so focus, accessibility and click handlers stay intact.
 * Bodies sleep when they come to rest and the loop pauses until something wakes.
 */
import Matter from 'matter-js';

export interface PhysItem {
  id: string;
  el: HTMLElement;
  x: number; // top-left, px, relative to the table
  y: number;
  rot: number; // degrees
  w: number;
  h: number;
}

const { Engine, Bodies, Body, Composite, Sleeping } = Matter;
const WALL = 200;

export function createPhysics(width: number, height: number, items: PhysItem[], apply: (it: PhysItem) => void) {
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  const bodies = new Map<string, Matter.Body>();
  let walls: Matter.Body[] = [];
  let raf = 0;
  let last = 0;

  const makeWalls = (w: number, h: number) => {
    walls.forEach((b) => Composite.remove(engine.world, b));
    const o = { isStatic: true, friction: 0.6 };
    walls = [
      Bodies.rectangle(w / 2, h + WALL / 2, w + WALL * 2, WALL, o), // floor
      Bodies.rectangle(w / 2, -WALL / 2, w + WALL * 2, WALL, o), // ceiling
      Bodies.rectangle(-WALL / 2, h / 2, WALL, h * 2, o), // left
      Bodies.rectangle(w + WALL / 2, h / 2, WALL, h * 2, o), // right
    ];
    Composite.add(engine.world, walls);
  };

  const addBody = (it: PhysItem) => {
    const b = Bodies.rectangle(it.x + it.w / 2, it.y + it.h / 2, it.w, it.h, {
      angle: (it.rot * Math.PI) / 180,
      chamfer: { radius: 12 },
      restitution: 0.15,
      friction: 0.5,
      frictionAir: 0.02,
      sleepThreshold: 40,
    });
    bodies.set(it.id, b);
    Composite.add(engine.world, b);
  };

  const sync = () => {
    for (const it of items) {
      const b = bodies.get(it.id);
      if (!b) continue;
      it.x = b.position.x - it.w / 2;
      it.y = b.position.y - it.h / 2;
      it.rot = (b.angle * 180) / Math.PI;
      apply(it);
    }
  };

  const tick = (now: number) => {
    const dt = Math.min(1000 / 30, last ? now - last : 1000 / 60);
    last = now;
    Engine.update(engine, dt);
    sync();
    const resting = [...bodies.values()].every((b) => b.isSleeping || b.isStatic);
    if (resting) {
      raf = 0;
      last = 0;
    } else raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    bodies.forEach((b) => !b.isStatic && Sleeping.set(b, false));
    if (!raf) raf = requestAnimationFrame(tick);
  };

  makeWalls(width, height);
  items.forEach(addBody);
  wake();

  return {
    add(it: PhysItem) {
      // Also track it in the list that is synced every step (otherwise its node never moves).
      if (!items.includes(it)) items.push(it);
      addBody(it);
      wake();
    },
    /** A focused or dragged piece is static: it stays still while you work with it. */
    setStatic(id: string, isStatic: boolean) {
      const b = bodies.get(id);
      if (!b || b.isStatic === isStatic) return;
      Body.setStatic(b, isStatic);
      if (!isStatic) Body.setAngularVelocity(b, 0);
      wake();
    },
    setPosition(it: PhysItem) {
      const b = bodies.get(it.id);
      if (!b) return;
      Body.setPosition(b, { x: it.x + it.w / 2, y: it.y + it.h / 2 });
      Body.setAngle(b, (it.rot * Math.PI) / 180);
      Body.setVelocity(b, { x: 0, y: 0 });
      wake();
    },
    fling(id: string, vx: number, vy: number) {
      const b = bodies.get(id);
      if (!b || b.isStatic) return;
      const cap = (v: number) => Math.max(-25, Math.min(25, v));
      Body.setVelocity(b, { x: cap(vx), y: cap(vy) });
      wake();
    },
    resize(w: number, h: number) {
      makeWalls(w, h);
      wake();
    },
    wake,
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      bodies.clear();
    },
  };
}

export type Physics = ReturnType<typeof createPhysics>;
