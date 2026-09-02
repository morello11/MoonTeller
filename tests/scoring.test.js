import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitScore, planScore, elementOf } from '../src/astro/scoring.js';
import { PLAN_SCORE } from '../src/config.js';

test('transit puanı formülü', () => {
  const a = { a: 'saturn', b: 'moon', aspect: 'square', strength: 1 };
  assert.ok(Math.abs(transitScore(a) - 1 * 1.0 * 1.0 * 0.9) < 1e-9);
  assert.ok(Math.abs(transitScore({ a: 'moon', b: 'chiron', aspect: 'sextile', strength: 0.5 }) - 0.5 * 0.6 * 0.4 * 0.5) < 1e-9);
  assert.equal(transitScore({ a: 'bilinmeyen', b: 'moon', aspect: 'square', strength: 1 }), 0);
});

test('element', () => {
  assert.equal(elementOf(0), 'fire'); assert.equal(elementOf(1), 'earth'); assert.equal(elementOf(6), 'air'); assert.equal(elementOf(11), 'water');
});

test('plan skoru: temiz gün → yap', () => {
  const r = planScore({ type: 'toplanti', isVoid: false, mercuryRetro: false, moonSaturnHard: false, moonJupiterSoft: true, marsMercuryHard: false, moonSign: 6 });
  assert.equal(r.score, 100);
  assert.equal(r.verdict, 'yap');
  assert.equal(r.footer, PLAN_SCORE.footer);
});

test('plan skoru: en kötü gün → ertele, 0 altına inmez', () => {
  const r = planScore({ type: 'toplanti', isVoid: true, mercuryRetro: true, moonSaturnHard: true, moonJupiterSoft: false, marsMercuryHard: true, moonSign: 3 });
  assert.equal(r.score, 0);
  assert.equal(r.verdict, 'ertele');
  assert.ok(r.reasons.length >= 5);
});

test('plan skoru: sadece Merkür retro → olur', () => {
  const r = planScore({ type: 'deploy', isVoid: false, mercuryRetro: true, moonSaturnHard: false, moonJupiterSoft: false, marsMercuryHard: false, moonSign: 4 });
  assert.equal(r.score, 50);
  assert.equal(r.verdict, 'olur');
});
