import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wheelAngle, pointAt, tickSpecs, signGlyphAngles, resolveCollisions, planetRadius } from '../src/ui/wheel-layout.js';
import { WHEEL } from '../src/config.js';

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('ASC solda, IC altta, DC sağda, MC üstte', () => {
  const c = WHEEL.size / 2;
  assert.ok(near(pointAt(0, 100).x, c - 100) && near(pointAt(0, 100).y, c));
  assert.ok(near(pointAt(90, 100).x, c) && near(pointAt(90, 100).y, c + 100));
  assert.ok(near(pointAt(180, 100).x, c + 100));
  assert.ok(near(pointAt(270, 100).y, c - 100));
  assert.equal(wheelAngle(100, 60), 40);
  assert.equal(wheelAngle(20, 60), 320);
});

test('çentikler: 360 adet, 12 burç sınırı, 60 beşlik', () => {
  const ticks = tickSpecs(0);
  assert.equal(ticks.length, 360);
  assert.equal(ticks.filter((t) => t.kind === 'sign').length, 12);
  assert.equal(ticks.filter((t) => t.kind === 'five').length, 60);
  assert.equal(signGlyphAngles(15)[0], 0);
});

test('çakışma çözümü: yakın glifler iç halkaya', () => {
  const placed = resolveCollisions([{ body: 'a', angle: 100 }, { body: 'b', angle: 103 }, { body: 'c', angle: 130 }], 9, 3);
  const ring = Object.fromEntries(placed.map((p) => [p.body, p.ring]));
  assert.deepEqual(ring, { a: 0, b: 1, c: 0 });
  const wrap = resolveCollisions([{ body: 'x', angle: 1 }, { body: 'y', angle: 358 }], 9, 3);
  assert.notEqual(wrap[0].ring, wrap[1].ring);
  const three = resolveCollisions([{ body: 'p', angle: 10 }, { body: 'q', angle: 12 }, { body: 'r', angle: 14 }, { body: 's', angle: 16 }], 9, 3);
  assert.equal(Math.max(...three.map((t) => t.ring)), 2); // halka sayısı aşılmaz
  assert.ok(planetRadius(1) < planetRadius(0));
});
