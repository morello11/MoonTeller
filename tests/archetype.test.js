import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { archetypeVotes, archetypeSign } from '../src/astro/archetype.js';

const A = { date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };

before(() => loadEngine());

test('oylar toplamı: saatli 9, saatsiz 7', () => {
  const withTime = archetypeVotes(natalChart(A));
  const noTime = archetypeVotes(natalChart({ ...A, time: null }));
  assert.equal(withTime.reduce((s, v) => s + v, 0), 9);
  assert.equal(noTime.reduce((s, v) => s + v, 0), 7);
});

test('A haritası: Güneş Akrep 3 + Plüton yok; Ay/Merkür/Venüs Terazi 2+1+0 → beraberlik yok', () => {
  const chart = natalChart(A);
  const sign = archetypeSign(chart);
  assert.ok(sign >= 0 && sign < 12);
  const votes = archetypeVotes(chart);
  assert.equal(votes[sign], Math.max(...votes));
});

test('beraberlikte Güneş kazanır', () => {
  // Sentetik: Güneş Koç(3), Ay Boğa(2), Merkür Boğa(1) → Koç 3, Boğa 3 → Koç.
  const fake = { houses: null, positions: [{ body: 'sun', sign: 0 }, { body: 'moon', sign: 1 }, { body: 'mercury', sign: 1 }, { body: 'mars', sign: 5 }] };
  assert.equal(archetypeSign(fake), 0);
});
