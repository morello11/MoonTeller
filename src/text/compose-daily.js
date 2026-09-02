// Bugün: harita + banka + gün → Ay satırı, günün üç şeyi, ham transit listesi. Saf mantık (motor yüklü olmalı).
import { TRANSIT, MOON_PHASE_IDS } from '../config.js';
import { computePositions } from '../astro/engine.js';
import { signIndex } from '../astro/chart.js';
import { moonPhase, voidWindow } from '../astro/moon.js';
import { dailyTransits, topTransits } from '../astro/transits.js';
import { hashSeed, pickVariant, signKey } from './bank.js';

function moonSection(jdNoon, bank, missing) {
  const [sun, moon] = computePositions(jdNoon, ['sun', 'moon']);
  const phase = moonPhase(sun.lon, moon.lon);
  const sign = signIndex(moon.lon);
  const key = `phase_${MOON_PHASE_IDS[phase.index]}_${signKey(sign)}`;
  const entry = bank.get('moon', key);
  if (!entry) missing.push(key);
  return { phase, sign, lon: moon.lon, key, line: entry?.line ?? null, barnum: entry?.barnum ?? null };
}

function topThree(chart, bank, jdNoon, seed, recent, missing) {
  const all = dailyTransits(chart, jdNoon);
  const top = topTransits(all, TRANSIT.topCount, (key) => bank.has('transits', key));
  const items = top.map((transit, i) => {
    const entry = bank.get('transits', transit.key);
    const text = pickVariant(entry.v, seed + i, recent);
    return { transit, key: transit.key, text, advice: entry.advice, barnum: entry.barnum };
  });
  if (items.length < TRANSIT.topCount) missing.push(`transits:${items.length}/${TRANSIT.topCount}`);
  return { all, items };
}

// { dateISO, jdNoon, profileId, recent } → { dateISO, seed, moon, voc, topThree, transits, missing }
export function composeDaily(chart, bank, { dateISO, jdNoon, profileId, recent = [] }) {
  const missing = [];
  const seed = hashSeed(`${profileId}|${dateISO}`);
  const moon = moonSection(jdNoon, bank, missing);
  const voc = voidWindow(jdNoon);
  const { all, items } = topThree(chart, bank, jdNoon, seed, recent, missing);
  return { dateISO, seed, moon, voc, topThree: items, transits: all, missing };
}
