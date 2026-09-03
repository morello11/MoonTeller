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

test('yorum odakları: her hedef kuruluyor, doğum verisi yok, "Ne gördü?" satırı dolu', async () => {
  const { commentPayload } = await import('../src/llm/summary.js');
  const bankFiles = Object.fromEntries(['archetypes'].map((n) => [n, JSON.parse(readFileSync(new URL(`../data/tr/${n}.json`, import.meta.url), 'utf8'))]));
  const bank = createBank(bankFiles);
  const B = { name: 'Kerem', date: '2003-07-20', time: '06:05', tz: 'Europe/Istanbul', lat: 36.88, lon: 30.7, houseSystem: 'P' };
  const team = { members: [{ id: 'a', profile: { name: 'Ayşe' }, chart }, { id: 'b', profile: { name: 'Kerem' }, chart: natalChart(B) }] };
  const ctx = { chart, daily, bank, team, data: { type: 'Deploy', when: '2026-09-02 14:00', score: 45, verdict: 'olur', reasons: ['Ay boşlukta −40'] } };
  const { synastryAspects } = await import('../src/astro/synastry.js');
  const first = synastryAspects(team.members[0].chart, team.members[1].chart)[0];
  const cases = [['chart', 'chart'], ['placement', 'sun'], ['placement', 'asc'], ['aspect', chart.aspects[0] && `${chart.aspects[0].a}_${chart.aspects[0].aspect}_${chart.aspects[0].b}`], ['today', 'today'], ['transit', '0'], ['plan', 'plan'], ['pair', 'a:b'], ['pairaspect', `a:b:${first.a}:${first.aspect}:${first.b}`]];
  for (const [target, key] of cases) {
    if (target === 'aspect' && !key) continue;
    const p = commentPayload(target, key, ctx);
    assert.ok(p.focus, `${target} odak yok`);
    assert.ok(p.sent.length > 3, `${target} sent boş`);
    assert.ok(new TextEncoder().encode(JSON.stringify({ chart: p.chart, focus: p.focus })).length < LLM.bodyMax);
    assertNoBirthData({ ...p, focus: { ...p.focus, date: '' }, sent: '' });
  }
  assert.equal(commentPayload('placement', 'sun', ctx).focus.body, 'Güneş');
  assert.equal(commentPayload('pair', 'a:b', ctx).focus.a, 'Ayşe');
  assert.throws(() => commentPayload('placement', 'yok', ctx), /Odak/);
});
