import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { synastryPoints, synastryAspects, synastryScore, synastryMatrix, bigThreeFit, aspectPart, topAspects, synastryLabel } from '../src/astro/synastry.js';
import { SYNASTRY } from '../src/config.js';

const A = { date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };
const B = { date: '2003-07-20', time: '06:05', tz: 'Europe/Istanbul', lat: 36.88, lon: 30.7, houseSystem: 'P' };
let a; let b; let aNoTime;

before(async () => { await loadEngine(); a = natalChart(A); b = natalChart(B); aNoTime = natalChart({ ...A, time: null }); });

test('noktalar: gezegenler + ASC; saatsizde ASC yok', () => {
  assert.equal(synastryPoints(a).length, SYNASTRY.bodies.length);
  assert.ok(!synastryPoints(aNoTime).some((p) => p.body === 'asc'));
});

test('aspektler |katkı| sırasında, anahtar ve işaret doğru', () => {
  const list = synastryAspects(a, b);
  assert.ok(list.length > 0);
  for (let i = 1; i < list.length; i += 1) assert.ok(Math.abs(list[i - 1].contribution) >= Math.abs(list[i].contribution));
  for (const x of list) {
    assert.match(x.key, /^\w+_(conjunction|sextile|square|trine|opposition)_\w+$/);
    if (x.aspect === 'square' || x.aspect === 'opposition') assert.ok(x.contribution < 0);
    if (x.aspect === 'trine' || x.aspect === 'sextile') assert.ok(x.contribution > 0);
  }
});

test('skor 0–100, simetrik, deterministik; aynı harita yüksek', () => {
  const ab = synastryScore(a, b); const ba = synastryScore(b, a);
  assert.ok(ab.score >= 0 && ab.score <= 100);
  assert.equal(ab.score, ba.score);
  assert.equal(synastryScore(a, b).score, ab.score);
  assert.ok(synastryScore(a, a).score > ab.score);
  assert.ok(['high', 'mid', 'low'].includes(ab.label));
});

test('aspekt payı ve Büyük Üçlü uyumu sınırları', () => {
  assert.equal(aspectPart([]), 50);
  assert.ok(aspectPart([{ contribution: 5 }]) > 50 && aspectPart([{ contribution: 5 }]) < 100);
  assert.ok(aspectPart([{ contribution: -5 }]) < 50);
  assert.equal(bigThreeFit(a, a), 100);
  const fit = bigThreeFit(a, b);
  assert.ok(fit >= 0 && fit <= 100);
  assert.ok(bigThreeFit(aNoTime, b) >= 0);
  assert.equal(synastryLabel(SYNASTRY.labels[0][0]), 'high');
  assert.equal(synastryLabel(0), 'low');
});

test('ilk üç: metni olanlar önce', () => {
  const list = synastryAspects(a, b);
  const top = topAspects(list, (key) => !key.endsWith('_sun'), 3);
  assert.equal(top.length, 3);
  assert.ok(list.some((x) => x.key.endsWith('_sun')) ? top.every((x) => !x.key.endsWith('_sun') || top.indexOf(x) > 0) : true);
});

test('matris: köşegen boş, simetrik', () => {
  const m = synastryMatrix([{ id: 'a', chart: a }, { id: 'b', chart: b }, { id: 'c', chart: aNoTime }]);
  assert.deepEqual(m.ids, ['a', 'b', 'c']);
  for (let i = 0; i < 3; i += 1) { assert.equal(m.cells[i][i], null); for (let j = 0; j < 3; j += 1) if (i !== j) assert.equal(m.cells[i][j], m.cells[j][i]); }
});
