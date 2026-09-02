// Aspekt tespiti: natal / transit / sinastri. Saf mantık.
// Nokta: { body, lon, speed }. Açılar (asc, mc) speed 0 ile katılır.
import {
  ASPECTS, ORBS, LUMINARIES, ORB_LUMINARY_BONUS, ORB_TRANSIT_MOON_BONUS, BODIES, ANGLES,
} from '../config.js';

const FULL_CIRCLE = 360;
const HALF_CIRCLE = 180;
const POINT_ORDER = [...BODIES, ...ANGLES];

export function normalizeDegrees(deg) {
  return ((deg % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
}

// a − b, (−180, 180] aralığına indirgenmiş.
export function signedSeparation(a, b) {
  const d = normalizeDegrees(a - b);
  return d > HALF_CIRCLE ? d - FULL_CIRCLE : d;
}

// İki boylam arasındaki açı, 0–180.
export function angularDistance(a, b) {
  return Math.abs(signedSeparation(a, b));
}

export function bodyIndex(body) {
  return POINT_ORDER.indexOf(body);
}

// mode: 'natal' | 'transit' | 'synastry'. Transitte A transit eden cisimdir.
export function maxOrb(aspectName, mode, bodyA, bodyB) {
  let orb = ORBS[aspectName][mode];
  if (orb === undefined) throw new Error(`Bilinmeyen mod: ${mode}`);
  if (LUMINARIES.includes(bodyA) || LUMINARIES.includes(bodyB)) orb += ORB_LUMINARY_BONUS;
  if (mode === 'transit' && bodyA === 'moon') orb += ORB_TRANSIT_MOON_BONUS;
  return orb;
}

// Aradaki açı hedef açıya yaklaşıyorsa applying (true), uzaklaşıyorsa separating (false).
function isApplying(pointA, pointB, angle) {
  const sep = signedSeparation(pointA.lon, pointB.lon);
  const rate = ((pointA.speed ?? 0) - (pointB.speed ?? 0)) * (sep < 0 ? -1 : 1);
  return (Math.abs(sep) - angle) * rate < 0;
}

// Çift için yalnızca en yakın aspekt; orb dışındaysa null.
export function findAspect(pointA, pointB, mode = 'natal') {
  const distance = angularDistance(pointA.lon, pointB.lon);
  let best = null;
  for (const { name, angle } of ASPECTS) {
    const orb = Math.abs(distance - angle);
    const limit = maxOrb(name, mode, pointA.body, pointB.body);
    if (orb <= limit && (best === null || orb < best.orb)) best = { aspect: name, angle, orb, maxOrb: limit };
  }
  if (best === null) return null;
  return {
    a: pointA.body, b: pointB.body, ...best,
    strength: 1 - best.orb / best.maxOrb,
    applying: isApplying(pointA, pointB, best.angle),
  };
}

function isAnglePair(pointA, pointB) {
  return ANGLES.includes(pointA.body) && ANGLES.includes(pointB.body);
}

function natalPairs(points) {
  const sorted = [...points].sort((p, q) => bodyIndex(p.body) - bodyIndex(q.body));
  const pairs = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (!isAnglePair(sorted[i], sorted[j])) pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
}

function crossPairs(pointsA, pointsB) {
  return pointsA.flatMap((a) => pointsB.map((b) => [a, b]));
}

// pointsB null → tek haritanın kendi içi ('natal', ASC–MC çifti hariç). Değilse A × B ('transit' | 'synastry').
export function findAspects(pointsA, pointsB = null, mode = 'natal') {
  const pairs = pointsB === null ? natalPairs(pointsA) : crossPairs(pointsA, pointsB);
  return pairs.map(([a, b]) => findAspect(a, b, mode)).filter((x) => x !== null);
}

// Metin bankası anahtarı: küçük index'li cisim önce, örn. mars_square_mercury → mercury_square_mars.
export function pairKey({ a, b, aspect }) {
  const [x, y] = bodyIndex(a) <= bodyIndex(b) ? [a, b] : [b, a];
  return `${x}_${aspect}_${y}`;
}
