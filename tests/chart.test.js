import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../src/astro/engine.js';
import { signIndex, degreeInSign, houseOf, effectiveHouseSystem, natalChart, SIGNS_TR } from '../src/astro/chart.js';
import { BODIES } from '../src/config.js';

// Uydurma profil (kişisel veri değil).
const PROFILE = { date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.85, houseSystem: 'P' };

before(() => loadEngine());

test('signIndex önce mod 360 normalize eder', () => {
  assert.equal(signIndex(-30), 11);
  assert.equal(signIndex(360), 0);
  assert.equal(signIndex(725), 0);
  assert.equal(SIGNS_TR[signIndex(280.37)], 'Oğlak');
  assert.ok(Math.abs(degreeInSign(-10) - 20) < 1e-9);
});

test('houseOf cusp aralığı ve sarmal', () => {
  const cusps = [350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320];
  assert.equal(houseOf(355, cusps), 1);
  assert.equal(houseOf(5, cusps), 1);
  assert.equal(houseOf(20, cusps), 2);
  assert.equal(houseOf(349.9, cusps), 12);
});

test('ev sistemi seçimi', () => {
  assert.equal(effectiveHouseSystem('W', 41), 'W');
  assert.equal(effectiveHouseSystem('X', 41), 'P');
  assert.equal(effectiveHouseSystem('P', 65), 'W');
  assert.equal(effectiveHouseSystem('O', 65), 'O');
});

test('natalChart saatli: evler, açılar, aspektler', () => {
  const c = natalChart(PROFILE);
  assert.equal(c.timeKnown, true);
  assert.equal(c.houseSystem, 'P');
  assert.equal(c.positions.length, BODIES.length);
  for (const p of c.positions) {
    assert.ok(p.sign >= 0 && p.sign < 12);
    assert.ok(p.house >= 1 && p.house <= 12);
  }
  assert.equal(c.angles.length, 2);
  assert.ok(c.aspects.length > 0);
  assert.ok(!c.aspects.some((x) => x.a === 'asc' && x.b === 'mc'));
});

test('natalChart saatsiz: evler yok, 12:00 varsayılır', () => {
  const c = natalChart({ ...PROFILE, time: null });
  assert.equal(c.timeKnown, false);
  assert.equal(c.houses, null);
  assert.equal(c.angles.length, 0);
  assert.equal(c.positions[0].house, null);
  assert.ok(c.aspects.every((x) => !['asc', 'mc'].includes(x.a) && !['asc', 'mc'].includes(x.b)));
});
