import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signIndex, signName, degreeInSign, normalizeDegrees } from '../src/astro/zodiac.js';

test('burç indeksi ve adı', () => {
  assert.equal(signName(0), 'Koç');
  assert.equal(signName(280.3689), 'Oğlak');
  assert.equal(signIndex(359.99), 11);
  assert.equal(signIndex(360), 0);
});

test('burç içi derece ve normalizasyon', () => {
  assert.ok(Math.abs(degreeInSign(280.3689) - 10.3689) < 1e-9);
  assert.equal(normalizeDegrees(-30), 330);
  assert.equal(normalizeDegrees(725), 5);
});
