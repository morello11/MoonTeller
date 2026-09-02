// Çark geometrisi: derece → koordinat, çentikler, glif çakışma çözümü. Saf mantık (DOM yok), testlenebilir.
import { WHEEL } from '../config.js';
import { normalizeDegrees } from '../astro/aspects.js';

const DEG_TO_RAD = Math.PI / 180;
const SIGN_SPAN = 30;
const FIVE = 5;

// Çark açısı: ASC solda (0), zodyak saat yönünün tersine büyür (IC altta 90, DC sağda 180, MC üstte 270).
export function wheelAngle(lon, ascLon) {
  return normalizeDegrees(lon - ascLon);
}

export function pointAt(angleDeg, radius, center = WHEEL.size / 2) {
  const rad = angleDeg * DEG_TO_RAD;
  return { x: center - radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
}

// 360 çentik: 1° kısa, 5° orta, 30° burç sınırı (halka boyunca).
export function tickSpecs(ascLon) {
  const ticks = [];
  for (let lon = 0; lon < 360; lon += 1) {
    const kind = lon % SIGN_SPAN === 0 ? 'sign' : lon % FIVE === 0 ? 'five' : 'minor';
    ticks.push({ angle: wheelAngle(lon, ascLon), kind, length: WHEEL.tick[kind] });
  }
  return ticks;
}

// Burç gliflerinin açıları (her burcun ortası).
export function signGlyphAngles(ascLon) {
  return Array.from({ length: 12 }, (_, i) => wheelAngle(i * SIGN_SPAN + SIGN_SPAN / 2, ascLon));
}

function circularDistance(a, b) {
  const d = Math.abs(normalizeDegrees(a - b));
  return Math.min(d, 360 - d);
}

// Yakın glifler ardışık iç halkalara itilir: her glif, önceki gliflerle minSep'i koruyan en dıştaki halkaya konur.
export function resolveCollisions(items, minSep = WHEEL.planetMinSeparationDeg, rings = WHEEL.planetRings) {
  const placed = [];
  const sorted = [...items].sort((a, b) => a.angle - b.angle);
  for (const item of sorted) {
    let ring = 0;
    while (ring < rings - 1 && placed.some((p) => p.ring === ring && circularDistance(p.angle, item.angle) < minSep)) {
      ring += 1;
    }
    placed.push({ ...item, ring });
  }
  return placed;
}

export function planetRadius(ring) {
  return WHEEL.planetRadius - ring * WHEEL.planetRingStep;
}
