import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { liveSky } from '../src/astro/sky.js';

before(() => loadEngine());
const IST = { lat: 41.01, lon: 28.98 };

test('öğlen Güneş ufkun üstünde, gece altında', () => {
  const noon = liveSky(julianDayUT({ year: 2026, month: 6, day: 21, utHours: 9.5 }), IST.lat, IST.lon);
  assert.ok(noon.sunAltitude > 60, `${noon.sunAltitude}`);
  assert.equal(noon.isNight, false);
  const midnight = liveSky(julianDayUT({ year: 2026, month: 6, day: 21, utHours: 22 }), IST.lat, IST.lon);
  assert.ok(midnight.sunAltitude < -20);
  assert.equal(midnight.isNight, true);
  assert.ok(midnight.bodies.every((b) => !b.visible || (b.aboveHorizon && b.elongation > 15)));
});

test('Ay evresi ve 10 cisim', () => {
  const sky = liveSky(julianDayUT({ year: 2026, month: 9, day: 2, utHours: 18 }), IST.lat, IST.lon);
  assert.equal(sky.bodies.length, 10);
  assert.ok(sky.moon.name && sky.moon.illumination >= 0 && sky.moon.illumination <= 1);
});
