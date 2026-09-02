import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { retroIntervals, retroStatus, shadowFor } from '../src/astro/retrograde.js';

const jdOf = (y, m, d) => julianDayUT({ year: y, month: m, day: d, utHours: 12 });
let intervals;

before(async () => { await loadEngine(); intervals = retroIntervals('mercury', jdOf(2024, 1, 1), jdOf(2024, 12, 31)); });

// 2024 Merkür retroları (bilinen tarihler, UT): 1 Nis–25 Nis, 5 Ağu–28 Ağu, 26 Kas–15 Ara (+ 2023 Ara 13 → 2024 Oca 2 taşan).
test('2024 Merkür retroları ±1 gün', () => {
  const known = [[jdOf(2024, 4, 1), jdOf(2024, 4, 25)], [jdOf(2024, 8, 5), jdOf(2024, 8, 28)], [jdOf(2024, 11, 26), jdOf(2024, 12, 15)]];
  for (const [start, end] of known) {
    const hit = intervals.find((iv) => Math.abs(iv.start - start) <= 1.5 && Math.abs(iv.end - end) <= 1.5);
    assert.ok(hit, `bulunamadı: ${start}–${end}; olanlar ${intervals.map((iv) => `${iv.start.toFixed(1)}–${iv.end.toFixed(1)}`).join(', ')}`);
  }
  assert.equal(intervals.length, 4); // 2023 Aralık'tan taşan dahil
});

test('durum: retro içinde ve sonraki retroya kalan gün', () => {
  const inside = retroStatus(jdOf(2024, 4, 10), intervals);
  assert.ok(inside.current && inside.daysLeft > 10 && inside.daysLeft < 17);
  const before2 = retroStatus(jdOf(2024, 6, 1), intervals);
  assert.equal(before2.current, null);
  assert.ok(before2.daysUntil > 60 && before2.daysUntil < 70);
  assert.ok(before2.previous);
});

test('gölge: retro öncesi ve sonrası tarihler mantıklı', () => {
  const iv = intervals.find((x) => Math.abs(x.start - jdOf(2024, 4, 1)) <= 1.5);
  const sh = shadowFor('mercury', iv);
  assert.ok(sh.preStart && sh.preStart < iv.start && iv.start - sh.preStart < 30, `pre ${iv.start - sh.preStart}`);
  assert.ok(sh.postEnd && sh.postEnd > iv.end && sh.postEnd - iv.end < 30, `post ${sh.postEnd - iv.end}`);
});
