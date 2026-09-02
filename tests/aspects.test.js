import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDegrees, signedSeparation, angularDistance, maxOrb, findAspect, findAspects, pairKey,
} from '../src/astro/aspects.js';

const pt = (body, lon, speed = 0) => ({ body, lon, speed });

test('normalizasyon ve ayrılık', () => {
  assert.equal(normalizeDegrees(-30), 330);
  assert.equal(normalizeDegrees(725), 5);
  assert.equal(signedSeparation(10, 350), 20);
  assert.equal(signedSeparation(350, 10), -20);
  assert.equal(signedSeparation(0, 180), 180);
  assert.equal(angularDistance(359, 1), 2);
});

test('beş majör aspekt tespit edilir', () => {
  const cases = [[0, 'conjunction'], [60, 'sextile'], [90, 'square'], [120, 'trine'], [180, 'opposition']];
  for (const [angle, name] of cases) {
    const r = findAspect(pt('mars', 100), pt('mercury', 100 + angle));
    assert.equal(r.aspect, name, `${angle}`);
    assert.equal(r.orb, 0);
    assert.equal(r.strength, 1);
  }
});

test('orb tablosu ve ışık bonusu', () => {
  assert.equal(maxOrb('square', 'natal', 'mars', 'mercury'), 7);
  assert.equal(maxOrb('square', 'natal', 'sun', 'mercury'), 8);
  assert.equal(maxOrb('trine', 'transit', 'moon', 'saturn'), 2.5 + 1 + 1);
  assert.equal(maxOrb('trine', 'transit', 'saturn', 'moon'), 2.5 + 1);
  assert.equal(maxOrb('sextile', 'synastry', 'venus', 'mars'), 4);
  assert.throws(() => maxOrb('square', 'bilinmeyen', 'mars', 'venus'));
});

test('orb sınırı: içinde aspekt, dışında null', () => {
  assert.equal(findAspect(pt('mars', 0), pt('venus', 96.9)).aspect, 'square');
  assert.equal(findAspect(pt('mars', 0), pt('venus', 97.1)), null);
  assert.equal(findAspect(pt('sun', 0), pt('venus', 97.9)).aspect, 'square');
});

test('yalnızca en yakın aspekt, 360° sarmalı', () => {
  assert.equal(findAspect(pt('jupiter', 358), pt('saturn', 3)).aspect, 'conjunction');
  assert.equal(findAspect(pt('mars', 10), pt('mercury', 355)), null); // 15°: orb dışı
  const r = findAspect(pt('sun', 3), pt('moon', 356)); // 7°, ışık bonusuyla 9 içinde
  assert.equal(r.aspect, 'conjunction');
  assert.ok(Math.abs(r.orb - 7) < 1e-9);
});

test('applying/separating iki yönde', () => {
  // A önde, A daha hızlı: kare 90°'ye yaklaşıyor mu? A=100 B=12 → 88°, A uzaklaşınca 90'a yaklaşır → applying
  assert.equal(findAspect(pt('moon', 100, 13), pt('mars', 12, 0.5)).applying, true);
  // A önde, A daha hızlı, açı 92°: büyümeye devam → separating
  assert.equal(findAspect(pt('moon', 104, 13), pt('mars', 12, 0.5)).applying, false);
  // B önde, B daha hızlı: B=100 A=12, 88° → B uzaklaşınca 90'a yaklaşır → applying
  assert.equal(findAspect(pt('mars', 12, 0.5), pt('moon', 100, 13)).applying, true);
  // B önde, B daha hızlı, 92° → separating
  assert.equal(findAspect(pt('mars', 12, 0.5), pt('moon', 104, 13)).applying, false);
  // Kavuşum: yavaş A önde, hızlı B arkadan geliyor → applying; B geçti → separating
  assert.equal(findAspect(pt('saturn', 50, 0.1), pt('moon', 46, 13)).applying, true);
  assert.equal(findAspect(pt('saturn', 50, 0.1), pt('moon', 54, 13)).applying, false);
});

test('natal liste: çiftler küçük index önce, ASC–MC hariç', () => {
  const points = [pt('mc', 90), pt('asc', 0), pt('moon', 120), pt('sun', 0)];
  const found = findAspects(points);
  const keys = found.map((x) => `${x.a}-${x.b}-${x.aspect}`);
  assert.ok(keys.includes('sun-moon-trine'));
  assert.ok(keys.includes('sun-asc-conjunction'));
  assert.ok(keys.includes('sun-mc-square'));
  assert.ok(!keys.some((k) => k.startsWith('asc-mc') || k.startsWith('mc-asc')));
  for (const x of found) assert.ok(x.a !== 'moon' || x.b !== 'sun');
});

test('transit ve sinastri: A × B', () => {
  const transiting = [pt('saturn', 200, 0.1)];
  const natal = [pt('moon', 110), pt('asc', 20)];
  const r = findAspects(transiting, natal, 'transit');
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((x) => [x.a, x.b, x.aspect]), [['saturn', 'moon', 'square'], ['saturn', 'asc', 'opposition']]);
  assert.equal(findAspects([pt('venus', 0)], [pt('mars', 65)], 'synastry').length, 0);
  assert.equal(findAspects([pt('venus', 0)], [pt('mars', 63)], 'synastry')[0].aspect, 'sextile');
});

test('pairKey cisim sırasını sabitler', () => {
  assert.equal(pairKey({ a: 'mars', b: 'mercury', aspect: 'square' }), 'mercury_square_mars');
  assert.equal(pairKey({ a: 'sun', b: 'asc', aspect: 'conjunction' }), 'sun_conjunction_asc');
});
