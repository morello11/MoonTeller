import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { createBank } from '../src/text/bank.js';
import { composeNatal } from '../src/text/compose.js';
import { BODIES, COMPOSE } from '../src/config.js';

const A = { date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', lat: 39.93, lon: 32.86, houseSystem: 'P' };
const files = Object.fromEntries(['planets-signs', 'planets-houses', 'aspects', 'archetypes', 'moon', 'ui-copy']
  .map((n) => [n, JSON.parse(readFileSync(new URL(`../data/tr/${n}.json`, import.meta.url), 'utf8'))]));
const bank = createBank(files);

before(() => loadEngine());

test('saatli harita: her bölüm dolu, eksik yok', () => {
  const r = composeNatal(natalChart(A), bank);
  assert.deepEqual(r.missing, []);
  assert.equal(r.bigThree.length, 3);
  assert.equal(r.placements.length, BODIES.length + 1);
  for (const p of r.placements) {
    assert.ok(p.entry?.hook && p.entry?.body && p.entry?.scene, p.key);
    if (p.body !== 'asc') assert.ok(p.house?.hook, `${p.key} ev metni`);
  }
  assert.ok(r.aspects.length > 0 && r.aspects.length <= COMPOSE.topAspects);
  for (const a of r.aspects) assert.ok(a.entry.natal);
  assert.ok(r.archetype.entry.title);
});

test('saatsiz harita: Yükselen ve ev metni yok, yine eksik yok', () => {
  const r = composeNatal(natalChart({ ...A, time: null }), bank);
  assert.deepEqual(r.missing, []);
  assert.equal(r.bigThree.length, 2);
  assert.equal(r.placements.length, BODIES.length);
  assert.ok(r.placements.every((p) => p.house === null));
});

test('aspektler güç sırasında ve natal metinli', () => {
  const r = composeNatal(natalChart(A), bank);
  for (let i = 1; i < r.aspects.length; i += 1) assert.ok(r.aspects[i - 1].aspect.strength >= r.aspects[i].aspect.strength);
});

test('eksik anahtar raporlanır', () => {
  const r = composeNatal(natalChart(A), createBank({ 'ui-copy': {} }));
  assert.ok(r.missing.length > BODIES.length);
  assert.equal(r.archetype.entry, null);
});
