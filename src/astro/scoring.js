// Transit puanı ve Plan Saati Skoru. Saf mantık; girdiler hesaplanmış olarak gelir.
import { TRANSIT_WEIGHTS, PLAN_SCORE, ELEMENTS } from '../config.js';

const ELEMENT_COUNT = ELEMENTS.length;

// puan = strength × wTransit × wNatal × wAspect (docs/ENGINE.md). a: transit eden, b: natal nokta.
export function transitScore(aspect) {
  const w = TRANSIT_WEIGHTS;
  return aspect.strength * (w.transit[aspect.a] ?? 0) * (w.natal[aspect.b] ?? 0) * (w.aspect[aspect.aspect] ?? 0);
}

export function elementOf(signIndex) {
  return ELEMENTS[signIndex % ELEMENT_COUNT];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// inputs: { type, isVoid, mercuryRetro, moonSaturnHard, moonJupiterSoft, marsMercuryHard, moonSign }
export function planScore(inputs) {
  const type = PLAN_SCORE.types[inputs.type] ?? PLAN_SCORE.types.toplanti;
  const reasons = [];
  let score = PLAN_SCORE.base;
  const add = (cond, delta, label) => { if (cond) { score += delta; reasons.push({ label, delta }); } };
  add(inputs.isVoid, PLAN_SCORE.voidOfCourse, 'Ay boşlukta');
  add(inputs.mercuryRetro, PLAN_SCORE.mercuryRetro, 'Merkür retro');
  add(inputs.moonSaturnHard, PLAN_SCORE.moonSaturnHard, 'Ay–Satürn sert açı');
  add(inputs.moonJupiterSoft, PLAN_SCORE.moonJupiterSoft, 'Ay–Jüpiter uyumlu açı');
  add(inputs.marsMercuryHard, PLAN_SCORE.marsMercuryHard, 'Mars–Merkür sert açı');
  const element = elementOf(inputs.moonSign);
  add(element === type.good, PLAN_SCORE.elementFit, `Ay ${element === type.good ? 'uygun' : ''} elementte (${type.label.toLowerCase()} için)`);
  add(element === type.bad, -PLAN_SCORE.elementFit, `Ay zor elementte (${type.label.toLowerCase()} için)`);
  score = clamp(Math.round(score), 0, 100);
  const verdict = PLAN_SCORE.verdicts.find(([min]) => score >= min)[1];
  return { score, verdict, reasons, footer: PLAN_SCORE.footer, type: type.label };
}
