import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadEngine, julianDayUT, computePosition, computePositions, computeHouses, engineVersion,
} from '../src/astro/engine.js';
import { BODIES } from '../src/config.js';

// Altın değerler: 2000-01-01 12:00 UT (J2000), İstanbul 41.01N 28.98E, Placidus.
const J2000 = { year: 2000, month: 1, day: 1, utHours: 12 };
const ISTANBUL = { lat: 41.01, lon: 28.98 };
const TOL = 1e-3;

let swe;
let jd;

before(async () => {
  swe = await loadEngine();
  jd = julianDayUT(swe, J2000);
});

test('Julian Day J2000', () => {
  assert.equal(jd, 2451545);
});

test('Ay konumu ve hızı', () => {
  const moon = computePosition(swe, jd, 'moon');
  assert.ok(Math.abs(moon.lon - 223.3238) < TOL, `lon ${moon.lon}`);
  assert.ok(Math.abs(moon.speed - 12.0213) < TOL, `speed ${moon.speed}`);
  assert.equal(moon.retrograde, false);
});

test('Güneş, Chiron, Gerçek Düğüm', () => {
  assert.ok(Math.abs(computePosition(swe, jd, 'sun').lon - 280.3689) < TOL);
  assert.ok(Math.abs(computePosition(swe, jd, 'chiron').lon - 251.6176) < TOL);
  const node = computePosition(swe, jd, 'trueNode');
  assert.ok(Math.abs(node.lon - 123.9540) < TOL);
  assert.equal(node.retrograde, true);
});

test('tüm cisimler sonlu değer döner', () => {
  const list = computePositions(swe, jd);
  assert.equal(list.length, BODIES.length);
  for (const p of list) {
    assert.ok(Number.isFinite(p.lon) && p.lon >= 0 && p.lon < 360, p.body);
    assert.equal(typeof p.retrograde, 'boolean');
  }
});

test('evler: ASC ve MC', () => {
  const h = computeHouses(swe, jd, ISTANBUL.lat, ISTANBUL.lon);
  assert.equal(h.cusps.length, 12);
  assert.ok(Math.abs(h.asc - 60.2735) < TOL, `asc ${h.asc}`);
  assert.ok(Math.abs(h.mc - 307.0394) < TOL, `mc ${h.mc}`);
  assert.ok(Math.abs(h.cusps[0] - h.asc) < TOL);
  assert.ok(Math.abs(h.cusps[9] - h.mc) < TOL);
});

test('bilinmeyen cisim hata verir', () => {
  assert.throws(() => computePosition(swe, jd, 'lilith'));
});

test('motor sürümü', () => {
  assert.match(engineVersion(swe), /^2\.10/);
});
