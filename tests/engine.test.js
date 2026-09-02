import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadEngine, julianDayUT, computePositions, computeHouses, engineVersion,
} from '../src/astro/engine.js';
import { BODIES } from '../src/config.js';

// Regresyon değerleri docs/ENGINE.md'den: 2000-01-01 12:00 UT, İstanbul 41.01 K / 28.98 D, Placidus.
// Kişisel veri değil; motorun kendi çıktısı. astro.com karşılaştırması (altın haritalar) Adım 1'de.
const J2000 = { year: 2000, month: 1, day: 1, utHours: 12 };
const ISTANBUL = { lat: 41.01, lon: 28.98 };
const TOL_PLANET = 1e-3;
const TOL_ANGLE = 5e-3;

let jd;

before(async () => {
  await loadEngine();
  jd = julianDayUT(J2000);
});

test('Julian Day J2000', () => {
  assert.equal(jd, 2451545);
});

test('Ay boylamı ve hızı (regresyon)', () => {
  const [moon] = computePositions(jd, ['moon']);
  assert.ok(Math.abs(moon.lon - 223.3238) < TOL_PLANET, `lon ${moon.lon}`);
  assert.ok(Math.abs(moon.speed - 12.0213) < TOL_PLANET, `speed ${moon.speed}`);
  assert.equal(moon.retrograde, false);
});

test('ASC ve MC (regresyon)', () => {
  const h = computeHouses(jd, ISTANBUL.lat, ISTANBUL.lon);
  assert.equal(h.cusps.length, 12);
  assert.ok(Math.abs(h.asc - 60.27) < TOL_ANGLE, `asc ${h.asc}`);
  assert.ok(Math.abs(h.mc - 307.04) < TOL_ANGLE, `mc ${h.mc}`);
  assert.ok(Math.abs(h.cusps[0] - h.asc) < TOL_PLANET);
  assert.ok(Math.abs(h.cusps[9] - h.mc) < TOL_PLANET);
});

test('retro bayrağı Güneş/Ay/Düğüm için hesaplanmaz', () => {
  const [sun, moon, node] = computePositions(jd, ['sun', 'moon', 'trueNode']);
  assert.equal(sun.retrograde, false);
  assert.equal(moon.retrograde, false);
  assert.equal(node.retrograde, false);
  assert.ok(node.speed < 0);
});

test('tüm cisimler sonlu boylam döner', () => {
  const list = computePositions(jd);
  assert.equal(list.length, BODIES.length);
  for (const p of list) {
    assert.ok(Number.isFinite(p.lon) && p.lon >= 0 && p.lon < 360, p.body);
    assert.ok(Number.isFinite(p.speed), p.body);
    assert.equal(typeof p.retrograde, 'boolean');
  }
});

test('loadEngine tek örnek döner', async () => {
  assert.equal(await loadEngine(), await loadEngine());
});

test('bilinmeyen cisim hata verir', () => {
  assert.throws(() => computePositions(jd, ['lilith']));
});

test('motor sürümü', () => {
  assert.match(engineVersion(), /^2\.10/);
});
