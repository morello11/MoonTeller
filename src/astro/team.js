// Ekip: bugün kime bulaşma (sert transit yükü) ve haftanın çifti. Saf mantık (motor yüklü olmalı).
import { CONTAGION, WEEK_PAIR } from '../config.js';
import { dailyTransits } from './transits.js';
import { hashSeed } from '../text/bank.js';

const DAY_MS = 86400000;
const WEEK_DAYS = 7;
const THURSDAY_OFFSET = 3;

// Hızlı cisimlerin sert transit puan toplamı ve en serti.
export function hardLoad(chart, jdNoon) {
  const hard = dailyTransits(chart, jdNoon)
    .filter((t) => CONTAGION.hardAspects.includes(t.aspect) && CONTAGION.transitingBodies.includes(t.a));
  return { load: hard.reduce((s, t) => s + t.score, 0), top: hard[0] ?? null };
}

// members: [{ id, chart }] → eşik üstündekiler, yük sırasında, en çok maxCount.
export function contagionList(members, jdNoon, threshold = CONTAGION.threshold) {
  return members
    .map((m) => ({ id: m.id, ...hardLoad(m.chart, jdNoon) }))
    .filter((m) => m.load >= threshold && m.top)
    .sort((x, y) => y.load - x.load)
    .slice(0, CONTAGION.maxCount);
}

// ISO hafta anahtarı, örn. "2026-W36" (Perşembe kuralı).
export function isoWeekKey(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = (date.getUTCDay() + 6) % WEEK_DAYS; // Pazartesi 0
  date.setUTCDate(date.getUTCDate() - day + THURSDAY_OFFSET);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date - yearStart) / DAY_MS + 1) / WEEK_DAYS);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function allPairs(matrix) {
  const pairs = [];
  for (let i = 0; i < matrix.ids.length; i += 1) {
    for (let j = i + 1; j < matrix.ids.length; j += 1) pairs.push({ a: matrix.ids[i], b: matrix.ids[j], score: matrix.cells[i][j] });
  }
  return pairs.sort((x, y) => y.score - x.score || (x.a + x.b).localeCompare(y.a + y.b));
}

// En yüksek skorlu ilk N çiftten hafta seed'iyle biri; çift yoksa null. Aynı hafta aynı çift.
export function weekPair(matrix, dateISO) {
  const candidates = allPairs(matrix).slice(0, WEEK_PAIR.candidates);
  if (!candidates.length) return null;
  const seed = hashSeed(`${isoWeekKey(dateISO)}|${matrix.ids.join(',')}`);
  return { ...candidates[seed % candidates.length], week: isoWeekKey(dateISO) };
}
