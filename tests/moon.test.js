import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { moonPhase, crossedExact, voidOfCourse } from '../src/astro/moon.js';

before(() => loadEngine());

test('evre açısı → 8 evre ve aydınlanma', () => {
  assert.equal(moonPhase(10, 10).name, 'Yeni Ay');
  assert.ok(moonPhase(10, 10).illumination < 1e-9);
  assert.equal(moonPhase(0, 180).name, 'Dolunay');
  assert.ok(Math.abs(moonPhase(0, 180).illumination - 1) < 1e-9);
  assert.equal(moonPhase(0, 90).name, 'İlk Dördün');
  assert.equal(moonPhase(0, 270).name, 'Son Dördün');
  assert.equal(moonPhase(350, 20).index, 1); // 30° → Hilal
  assert.equal(moonPhase(0, 337.4).index, 7);  // sınırın altı: Küçülen Hilal
  assert.equal(moonPhase(0, 337.5).index, 0);  // tam sınır Yeni Ay'a dahil
  assert.equal(moonPhase(0, 22.4).index, 0);
  assert.equal(moonPhase(0, 22.5).index, 1);
});

test('crossedExact: aspekt açısından geçiş', () => {
  assert.equal(crossedExact(-1, 1), true);       // kavuşum
  assert.equal(crossedExact(89, 91), true);      // kare
  assert.equal(crossedExact(-119, -121), true);  // üçgen
  assert.equal(crossedExact(179, -179), true);   // karşıt (sarmal)
  assert.equal(crossedExact(30, 32), false);
  assert.equal(crossedExact(45, 45), false);
});

test('voidOfCourse tutarlı sonuç döner', () => {
  const jd = julianDayUT({ year: 2000, month: 1, day: 1, utHours: 12 });
  const r = voidOfCourse(jd);
  assert.equal(typeof r.isVoid, 'boolean');
  assert.ok(r.signExitJd > jd && r.signExitJd - jd < 2.8, `${r.signExitJd - jd}`);
  if (r.nextExactJd !== null) assert.ok(r.nextExactJd > jd && r.nextExactJd <= r.signExitJd);
  assert.equal(r.isVoid, r.nextExactJd === null);
});
