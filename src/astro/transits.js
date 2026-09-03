// Günlük transitler: hedef günün öğlesindeki gök cisimleri × natal noktalar → puanlı aspekt listesi. Saf mantık (motor yüklü olmalı).
import { TRANSIT } from '../config.js';
import { computePositions } from './engine.js';
import { findAspects } from './aspects.js';
import { signIndex, degreeInSign } from './chart.js';
import { voidOfCourse } from './moon.js';
import { transitScore, planScore } from './scoring.js';

const HARD = ['square', 'opposition'];
const SOFT = ['trine', 'sextile'];

export function transitPoints(jdUT, bodies = TRANSIT.transitingBodies) {
  return computePositions(jdUT, bodies).map((p) => ({ ...p, sign: signIndex(p.lon), deg: degreeInSign(p.lon) }));
}

// Natal noktalar sabittir: hız 0 (applying/separating transit hızıyla belirlenir).
export function natalPoints(chart) {
  return [...chart.positions, ...chart.angles].map((p) => ({ body: p.body, lon: p.lon, speed: 0 }));
}

export function transitKey(aspect) {
  return `t_${aspect.a}_${aspect.aspect}_n_${aspect.b}`;
}

// Puanlanmış, güç sırasında transit aspektleri.
export function dailyTransits(chart, jdUT) {
  const transiting = transitPoints(jdUT);
  const aspects = findAspects(transiting, natalPoints(chart), 'transit');
  return aspects
    .map((aspect) => ({ ...aspect, key: transitKey(aspect), score: transitScore(aspect) }))
    .sort((x, y) => y.score - x.score);
}

// Metni olabilecek hedeflerden ilk n.
export function topTransits(list, n = TRANSIT.topCount, hasText = () => true) {
  return list.filter((t) => TRANSIT.textTargets.includes(t.b) && hasText(t.key)).slice(0, n);
}

function mundaneAspect(points, a, b, kinds) {
  const pa = points.find((p) => p.body === a);
  const pb = points.find((p) => p.body === b);
  const found = findAspects([pa], [pb], 'transit');
  return found.some((x) => kinds.includes(x.aspect));
}

// Plan Saati Skoru girdileri: verilen an için gökyüzü durumu.
export function planInputs(jdUT, type) {
  const points = transitPoints(jdUT);
  const moon = points.find((p) => p.body === 'moon');
  const mercury = points.find((p) => p.body === 'mercury');
  return {
    type,
    isVoid: voidOfCourse(jdUT).isVoid,
    mercuryRetro: mercury.retrograde,
    moonSaturnHard: mundaneAspect(points, 'moon', 'saturn', HARD),
    moonJupiterSoft: mundaneAspect(points, 'moon', 'jupiter', SOFT),
    marsMercuryHard: mundaneAspect(points, 'mars', 'mercury', HARD),
    moonSign: moon.sign,
  };
}

export function evaluatePlan(jdUT, type) {
  return planScore(planInputs(jdUT, type));
}

