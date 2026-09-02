import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { dailyTransits, topTransits, transitPoints, planInputs, evaluatePlan } from '../src/astro/transits.js';
import { TRANSIT } from '../src/config.js';

const A = { date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };
let chart; let jd;

before(async () => { await loadEngine(); chart = natalChart(A); jd = julianDayUT({ year: 2026, month: 9, day: 2, utHours: 9 }); });

test('transit noktaları 10 cisim, burç ve derece ile', () => {
  const pts = transitPoints(jd);
  assert.equal(pts.length, TRANSIT.transitingBodies.length);
  for (const p of pts) assert.ok(p.sign >= 0 && p.sign < 12 && p.deg >= 0 && p.deg < 30);
});

test('günlük transitler puanlı ve sıralı, deterministik', () => {
  const list = dailyTransits(chart, jd);
  assert.ok(list.length > 0);
  for (let i = 1; i < list.length; i += 1) assert.ok(list[i - 1].score >= list[i].score);
  for (const t of list) assert.match(t.key, /^t_\w+_(conjunction|sextile|square|trine|opposition)_n_\w+$/);
  assert.deepEqual(dailyTransits(chart, jd).map((t) => t.key), list.map((t) => t.key));
});

test('ilk üç: yalnızca metin hedefleri, metni olanlar', () => {
  const list = dailyTransits(chart, jd);
  const top = topTransits(list, 3, (key) => !key.endsWith('_n_sun'));
  assert.ok(top.length <= 3);
  for (const t of top) { assert.ok(TRANSIT.textTargets.includes(t.b)); assert.ok(!t.key.endsWith('_n_sun')); }
  const noTime = dailyTransits(natalChart({ ...A, time: null }), jd);
  assert.ok(noTime.every((t) => t.b !== 'asc' && t.b !== 'mc'));
});

test('plan girdileri ve skoru', () => {
  const inputs = planInputs(jd, 'toplanti');
  assert.equal(typeof inputs.isVoid, 'boolean');
  assert.equal(typeof inputs.mercuryRetro, 'boolean');
  assert.ok(inputs.moonSign >= 0 && inputs.moonSign < 12);
  const r = evaluatePlan(jd, 'deploy');
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.ok(['yap', 'olur', 'ertele'].includes(r.verdict));
});
