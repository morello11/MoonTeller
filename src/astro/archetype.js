// Haritadan Kozmik Ekip Rolü: baskın burç oylaması (docs/ENGINE.md 10). Saf mantık.
import { ARCHETYPE_WEIGHTS } from '../config.js';
import { signIndex } from './chart.js';

const SIGN_COUNT = 12;

// Her burcun oy toplamı. Saat yoksa (houses null) Yükselen oy vermez.
export function archetypeVotes(chart) {
  const votes = new Array(SIGN_COUNT).fill(0);
  for (const [body, weight] of Object.entries(ARCHETYPE_WEIGHTS)) {
    if (body === 'asc') {
      if (chart.houses) votes[signIndex(chart.houses.asc)] += weight;
      continue;
    }
    const position = chart.positions.find((p) => p.body === body);
    if (position) votes[position.sign] += weight;
  }
  return votes;
}

// Kazanan burç index'i; beraberlikte Güneş'in burcu, o da yoksa en küçük index.
export function archetypeSign(chart) {
  const votes = archetypeVotes(chart);
  const max = Math.max(...votes);
  const tied = votes.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
  const sunSign = chart.positions.find((p) => p.body === 'sun')?.sign;
  return tied.includes(sunSign) ? sunSign : tied[0];
}
