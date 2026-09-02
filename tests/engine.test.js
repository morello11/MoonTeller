import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, computePositions, engineVersion } from '../src/astro/engine.js';
import { BODIES } from '../src/config.js';

// Adım 0 duman testi. Altın değerler ve zaman dönüşümü Adım 1'de.
test('motor yüklenir, tüm cisimler sonlu boylam döner', async () => {
  const swe = await loadEngine();
  const jd = swe.julday(2000, 1, 1, 12);
  const list = computePositions(swe, jd);
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

test('bilinmeyen cisim hata verir', async () => {
  const swe = await loadEngine();
  assert.throws(() => computePositions(swe, 2451545, ['lilith']));
});

test('motor sürümü', async () => {
  assert.match(engineVersion(await loadEngine()), /^2\.10/);
});
