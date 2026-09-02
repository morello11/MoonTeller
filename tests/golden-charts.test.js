import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadEngine } from '../src/astro/engine.js';
import { natalChart } from '../src/astro/chart.js';
import { angularDistance } from '../src/astro/aspects.js';

// Altın haritalar: astro.com'dan alınan değerler (ondalık derece, 0–360).
// golden-charts.json: uydurma haritalar, repoda. private.local.json: Mehmet'in haritası, .gitignore'da; yoksa atlanır.
const TOL = { planet: 0.02, angle: 0.2, cusp: 0.5 };
const dir = dirname(fileURLToPath(import.meta.url));

function loadCharts(file) {
  const path = join(dir, file);
  if (!existsSync(path)) return [];
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(data) ? data : [data];
}

const charts = [...loadCharts('golden-charts.json'), ...loadCharts('private.local.json')];

before(() => loadEngine());

// Veri gelene kadar "todo" olarak görünür; Adım 1 kapısı bu testler geçmeden kapanmaz.
test('altın harita dosyaları', { todo: charts.length === 0 && 'tests/golden-charts.json yok — astro.com değerleri bekleniyor' }, () => {
  assert.ok(charts.length > 0);
});

for (const chart of charts) {
  test(`altın harita: ${chart.name}`, () => {
    const c = natalChart(chart);
    const errors = [];
    const check = (label, got, want, tol) => {
      const diff = angularDistance(got, want);
      if (diff > tol) errors.push(`${label}: hesap ${got.toFixed(3)} beklenen ${want} fark ${diff.toFixed(3)}`);
    };
    for (const p of c.positions) {
      if (chart.expected[p.body] !== undefined) check(p.body, p.lon, chart.expected[p.body], TOL.planet);
    }
    if (chart.expected.asc !== undefined) check('asc', c.houses.asc, chart.expected.asc, TOL.angle);
    if (chart.expected.mc !== undefined) check('mc', c.houses.mc, chart.expected.mc, TOL.angle);
    (chart.expected.cusps ?? []).forEach((want, i) => check(`ev ${i + 1}`, c.houses.cusps[i], want, TOL.cusp));
    assert.equal(errors.length, 0, errors.join('\n'));
  });
}
