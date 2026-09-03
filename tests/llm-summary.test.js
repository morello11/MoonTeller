import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { createBank } from '../src/text/bank.js';
import { composeDaily } from '../src/text/compose-daily.js';
import { chartSummary, dailySummary, weeklySummary } from '../src/llm/summary.js';
import { LLM } from '../src/config.js';

const A = { name: 'GizliAd', date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };
const files = Object.fromEntries(['moon', 'transits', 'ui-copy'].map((n) => [n, JSON.parse(readFileSync(new URL(`../data/tr/${n}.json`, import.meta.url), 'utf8'))]));
let chart; let daily;

before(async () => {
  await loadEngine();
  chart = natalChart(A);
  daily = composeDaily(chart, createBank(files), { dateISO: '2026-09-02', jdNoon: julianDayUT({ year: 2026, month: 9, day: 2, utHours: 9 }), profileId: 'p' });
});

function assertNoBirthData(obj) {
  const text = JSON.stringify(obj);
  for (const leak of ['1988', '23:40', '39.9', '32.8', 'GizliAd', 'Ankara', 'Europe']) assert.ok(!text.includes(leak), `sızıntı: ${leak}`);
}

test('harita özeti: Türkçe etiketler, doğum verisi yok, aspekt sınırı', () => {
  const s = chartSummary(chart);
  assertNoBirthData(s);
  assert.equal(s.placements[0].body, 'Güneş');
  assert.equal(s.placements[0].sign, 'Akrep');
  assert.ok(s.aspects.length <= LLM.summaryAspects);
  assert.equal(typeof s.asc, 'string');
  assert.equal(chartSummary(natalChart({ ...A, time: null })).asc, null);
});

test('günlük özet: Ay ve üç transit; boyut sınırın altında', () => {
  const s = dailySummary(chart, daily);
  assertNoBirthData({ ...s, daily: { ...s.daily, date: '' } });
  assert.equal(s.daily.transits.length, 3);
  assert.ok(new TextEncoder().encode(JSON.stringify(s)).length < LLM.bodyMax);
});

test('haftalık özet: Pazartesi başlangıç, 7 gün, ekip yoksa da çalışır', () => {
  const s = weeklySummary(chart, null, '2026-09-02');
  assert.equal(s.weekly.week, '2026-W36');
  assert.equal(s.weekly.days.length, 7);
  assert.equal(s.weekly.days[0].date, '2026-08-31');
  assert.equal(s.weekly.pair, null);
  assert.equal(s.weekly.teamSize, 1);
  const team = { members: [{ id: 'a', profile: { name: 'Ayşe' } }, { id: 'b', profile: { name: 'Kerem' } }], weekPair: { a: 'a', b: 'b', score: 66 }, contagion: [{ id: 'b', top: { a: 'mars', aspect: 'square', b: 'sun' } }] };
  const t = weeklySummary(chart, team, '2026-09-02');
  assert.deepEqual(t.weekly.pair, { a: 'Ayşe', b: 'Kerem', score: 66 });
  assert.equal(t.weekly.watch.transit, 'Mars kare Güneş');
  assert.ok(new TextEncoder().encode(JSON.stringify(t)).length < LLM.bodyMax);
});
