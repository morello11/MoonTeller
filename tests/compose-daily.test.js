import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine, julianDayUT } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { localToUT } from '../src/astro/time.js';
import { createBank } from '../src/text/bank.js';
import { composeDaily } from '../src/text/compose-daily.js';
import { voidWindow, voidOfCourse } from '../src/astro/moon.js';
import { BANK, TRANSIT } from '../src/config.js';

const A = { id: 'test-a', date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };
const files = Object.fromEntries(BANK.files.map((n) => [n, JSON.parse(readFileSync(new URL(`../data/tr/${n}.json`, import.meta.url), 'utf8'))]));
const bank = createBank(files);
let chart;
const noon = (d) => julianDayUT(localToUT(d, '12:00', 'Europe/Istanbul'));

before(async () => { await loadEngine(); chart = natalChart(A); });

test('günlük kompozisyon dolu ve deterministik', () => {
  const a = composeDaily(chart, bank, { dateISO: '2026-09-02', jdNoon: noon('2026-09-02'), profileId: A.id });
  const b = composeDaily(chart, bank, { dateISO: '2026-09-02', jdNoon: noon('2026-09-02'), profileId: A.id });
  assert.deepEqual(a.missing, []);
  assert.equal(a.topThree.length, TRANSIT.topCount);
  assert.ok(a.moon.line);
  assert.deepEqual(a.topThree.map((t) => t.text), b.topThree.map((t) => t.text));
  for (const t of a.topThree) assert.ok(t.text && t.advice && TRANSIT.textTargets.includes(t.transit.b));
});

test('ertesi gün farklı seed ve farklı metin', () => {
  const a = composeDaily(chart, bank, { dateISO: '2026-09-02', jdNoon: noon('2026-09-02'), profileId: A.id });
  const c = composeDaily(chart, bank, { dateISO: '2026-09-03', jdNoon: noon('2026-09-03'), profileId: A.id });
  assert.notEqual(a.seed, c.seed);
  assert.notDeepEqual(a.topThree.map((t) => t.key), c.topThree.map((t) => t.key));
});

test('recent listesi varyantı kaydırır', () => {
  const a = composeDaily(chart, bank, { dateISO: '2026-09-02', jdNoon: noon('2026-09-02'), profileId: A.id });
  const r = composeDaily(chart, bank, { dateISO: '2026-09-02', jdNoon: noon('2026-09-02'), profileId: A.id, recent: [a.topThree[0].text] });
  assert.notEqual(r.topThree[0].text, a.topThree[0].text);
});

test('saatsiz profil: ASC hedefli transit yok, yine dolu', () => {
  const d = composeDaily(natalChart({ ...A, time: null }), bank, { dateISO: '2026-09-02', jdNoon: noon('2026-09-02'), profileId: 'x' });
  assert.equal(d.topThree.length, TRANSIT.topCount);
  assert.ok(d.topThree.every((t) => t.transit.b !== 'asc'));
});

test('voidWindow: burç girişi–çıkışı içinde, voidOfCourse ile tutarlı', () => {
  const jd = noon('2026-09-02');
  const w = voidWindow(jd);
  assert.ok(w.start < w.end && w.end - jd < 2.8 && w.end > jd);
  const v = voidOfCourse(jd);
  assert.ok(Math.abs(v.signExitJd - w.end) < 1e-6);
  assert.equal(w.isVoidNow, v.isVoid);
});
