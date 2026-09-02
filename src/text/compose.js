// Harita + banka → okunur bölümler (Haritam). Saf mantık; metin seçimi burada, HTML UI'da.
import { COMPOSE, BODIES } from '../config.js';
import { signIndex } from '../astro/chart.js';
import { pairKey } from '../astro/aspects.js';
import { archetypeSign } from '../astro/archetype.js';
import { signKey } from './bank.js';

const ANGLE_BODIES = ['asc', 'mc'];

function placement(chart, bank, position, missing) {
  const key = `${position.body}_${signKey(position.sign)}`;
  const entry = bank.get('planets-signs', key);
  if (!entry) missing.push(key);
  let house = null;
  if (chart.houses && position.house) {
    const houseKey = `${position.body}_h${position.house}`;
    house = bank.get('planets-houses', houseKey);
    if (!house) missing.push(houseKey);
  }
  return { body: position.body, sign: position.sign, houseNumber: position.house ?? null, key, entry, house };
}

function ascendant(chart, bank, missing) {
  if (!chart.houses) return null;
  const sign = signIndex(chart.houses.asc);
  const key = `asc_${signKey(sign)}`;
  const entry = bank.get('planets-signs', key);
  if (!entry) missing.push(key);
  return { body: 'asc', sign, houseNumber: null, key, entry, house: null };
}

// Açılar (ASC/MC hariç), güç sırasına göre, natal metni olanlardan ilk N.
function strongestAspects(chart, bank, missing) {
  return [...chart.aspects]
    .filter((a) => !ANGLE_BODIES.includes(a.a) && !ANGLE_BODIES.includes(a.b))
    .sort((x, y) => y.strength - x.strength)
    .map((aspect) => {
      const key = pairKey(aspect);
      const entry = bank.get('aspects', key);
      if (!entry) missing.push(key);
      return { aspect, key, entry };
    })
    .filter((item) => item.entry?.natal)
    .slice(0, COMPOSE.topAspects);
}

// Dönüş: { bigThree, placements, aspects, archetype, missing }
export function composeNatal(chart, bank) {
  const missing = [];
  const placements = BODIES.map((body) => chart.positions.find((p) => p.body === body))
    .filter(Boolean)
    .map((p) => placement(chart, bank, p, missing));
  const asc = ascendant(chart, bank, missing);
  const byBody = Object.fromEntries(placements.map((p) => [p.body, p]));
  const sign = archetypeSign(chart);
  const archetypeEntry = bank.get('archetypes', signKey(sign));
  if (!archetypeEntry) missing.push(`archetype:${signKey(sign)}`);
  return {
    bigThree: [byBody.sun, byBody.moon, asc].filter(Boolean),
    placements: asc ? [...placements, asc] : placements,
    aspects: strongestAspects(chart, bank, missing),
    archetype: { sign, entry: archetypeEntry },
    missing,
  };
}
