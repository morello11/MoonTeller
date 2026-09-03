// Sinastri: iki natal harita arasındaki aspektler ve 0–100 uyum skoru (docs/ENGINE.md 8). Saf mantık.
import { SYNASTRY } from '../config.js';
import { findAspects, pairKey } from './aspects.js';
import { signIndex } from './chart.js';
import { elementOf } from './scoring.js';

const PERCENT = 100;
const HALF = 50;
const MODALITIES = 3; // burç index % 3: öncü, sabit, değişken

// Sinastriye giren noktalar: gezegenler + Yükselen (saat biliniyorsa), hız 0.
export function synastryPoints(chart) {
  const points = chart.positions.filter((p) => SYNASTRY.bodies.includes(p.body)).map((p) => ({ body: p.body, lon: p.lon, speed: 0 }));
  if (chart.houses) points.push({ body: 'asc', lon: chart.houses.asc, speed: 0 });
  return points;
}

function aspectWeight(aspect) {
  if (aspect.aspect === 'conjunction') {
    const hard = SYNASTRY.conjunctionHard.bodies.some((b) => b === aspect.a || b === aspect.b);
    return hard ? SYNASTRY.conjunctionHard.weight : SYNASTRY.wAspect.conjunction;
  }
  return SYNASTRY.wAspect[aspect.aspect] ?? 0;
}

// İşaretli katkı: güç × cisim ağırlıkları × aspekt ağırlığı.
export function contribution(aspect) {
  return aspect.strength * (SYNASTRY.wBody[aspect.a] ?? 0) * (SYNASTRY.wBody[aspect.b] ?? 0) * aspectWeight(aspect);
}

// A × B aspektleri, |katkı| sırasında. a = A'nın noktası, b = B'nin noktası.
export function synastryAspects(chartA, chartB) {
  return findAspects(synastryPoints(chartA), synastryPoints(chartB), 'synastry')
    .map((aspect) => ({ ...aspect, key: pairKey(aspect), contribution: contribution(aspect) }))
    .sort((x, y) => Math.abs(y.contribution) - Math.abs(x.contribution));
}

// Aspekt payı 0–100: 50 + 50 × (toplam katkı / (|katkılar| toplamı + sönüm)).
export function aspectPart(aspects) {
  const total = aspects.reduce((s, a) => s + a.contribution, 0);
  const magnitude = aspects.reduce((s, a) => s + Math.abs(a.contribution), 0);
  return HALF + HALF * (total / (magnitude + SYNASTRY.aspectDamping));
}

function bigThreeSign(chart, body) {
  if (body === 'asc') return chart.houses ? signIndex(chart.houses.asc) : null;
  return chart.positions.find((p) => p.body === body)?.sign ?? null;
}

function pairFit(signA, signB) {
  const ea = elementOf(signA); const eb = elementOf(signB);
  let fit = 0;
  if (ea === eb) fit += SYNASTRY.elementSame;
  else if (SYNASTRY.compatibleElements[ea] === eb) fit += SYNASTRY.elementCompatible;
  if (signA % MODALITIES === signB % MODALITIES) fit += SYNASTRY.modalitySame;
  return fit;
}

// Büyük Üçlü uyumu 0–100: aynı nokta (Güneş–Güneş, Ay–Ay, ASC–ASC) element + nitelik. ASC birinde yoksa atlanır.
export function bigThreeFit(chartA, chartB) {
  const max = SYNASTRY.elementSame + SYNASTRY.modalitySame;
  let sum = 0; let count = 0;
  for (const body of SYNASTRY.bigThree) {
    const a = bigThreeSign(chartA, body); const b = bigThreeSign(chartB, body);
    if (a === null || b === null) continue;
    sum += pairFit(a, b); count += 1;
  }
  return count ? (sum / (count * max)) * PERCENT : HALF;
}

export function synastryLabel(score) {
  return SYNASTRY.labels.find(([min]) => score >= min)?.[1] ?? 'low';
}

// En güçlü aspektler: metni olanlar öncelikli ve her metin bir kez; yetmezse metinsizler.
export function topAspects(aspects, hasText = () => true, n = SYNASTRY.topCount) {
  const seen = new Set();
  const withText = aspects.filter((a) => hasText(a.key) && !seen.has(a.key) && seen.add(a.key));
  const rest = aspects.filter((a) => !withText.includes(a));
  return [...withText, ...rest].slice(0, n);
}

// Dönüş: { score, aspectPart, fitPart, aspects, label }. Skor simetrik (A×B = B×A).
export function synastryScore(chartA, chartB) {
  const aspects = synastryAspects(chartA, chartB);
  const ap = aspectPart(aspects);
  const fp = bigThreeFit(chartA, chartB);
  const score = Math.round(SYNASTRY.aspectShare * ap + SYNASTRY.bigThreeShare * fp);
  return { score, aspectPart: ap, fitPart: fp, aspects, label: synastryLabel(score) };
}

// members: [{ id, chart }] → { ids, cells: cells[i][j] = skor (i === j → null) }.
export function synastryMatrix(members) {
  const ids = members.map((m) => m.id);
  const cells = members.map((a, i) => members.map((b, j) => (i === j ? null : synastryScore(a.chart, b.chart).score)));
  return { ids, cells };
}

