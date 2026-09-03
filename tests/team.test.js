import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { hardLoad, contagionList, isoWeekKey, weekPair } from '../src/astro/team.js';
import { CONTAGION } from '../src/config.js';

const A = { date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };
const B = { date: '2003-07-20', time: '06:05', tz: 'Europe/Istanbul', lat: 36.88, lon: 30.7, houseSystem: 'P' };
let members; let jd;

before(async () => {
  await loadEngine();
  members = [{ id: 'a', chart: natalChart(A) }, { id: 'b', chart: natalChart(B) }];
  jd = julianDayUT({ year: 2026, month: 9, day: 2, utHours: 9 });
});

test('sert yük: yalnızca kare/karşıt, yalnızca hızlı cisimler, en serti verilir', () => {
  const r = hardLoad(members[0].chart, jd);
  assert.ok(r.load >= 0);
  if (r.top) { assert.ok(CONTAGION.hardAspects.includes(r.top.aspect)); assert.ok(CONTAGION.transitingBodies.includes(r.top.a)); }
});

test('bulaşma listesi: eşik 0 → herkes (yükü olan), eşik 999 → kimse; sıralı', () => {
  const all = contagionList(members, jd, 0);
  assert.ok(all.length <= members.length);
  for (let i = 1; i < all.length; i += 1) assert.ok(all[i - 1].load >= all[i].load);
  assert.deepEqual(contagionList(members, jd, 999), []);
  assert.deepEqual(contagionList(members, jd), contagionList(members, jd));
});

test('ISO hafta anahtarı', () => {
  assert.equal(isoWeekKey('2026-09-02'), '2026-W36');
  assert.equal(isoWeekKey('2021-01-03'), '2020-W53');
  assert.equal(isoWeekKey('2024-12-30'), '2025-W01');
});

test('haftanın çifti: deterministik, aynı hafta aynı çift, çift yoksa null', () => {
  const matrix = { ids: ['a', 'b', 'c'], cells: [[null, 70, 50], [70, null, 60], [50, 60, null]] };
  const p1 = weekPair(matrix, '2026-09-01'); const p2 = weekPair(matrix, '2026-09-06');
  assert.deepEqual(p1, p2);
  assert.ok([70, 60, 50].includes(p1.score));
  assert.equal(weekPair({ ids: ['a'], cells: [[null]] }, '2026-09-01'), null);
});
