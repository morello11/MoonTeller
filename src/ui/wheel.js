// Usturlap çarkı: natal harita → SVG. Saf fonksiyon; olaylar ve animasyon sınıfı haritam.js'te.
import { WHEEL } from '../config.js';
import { pointAt, wheelAngle, tickSpecs, signGlyphAngles, resolveCollisions, planetRadius } from './wheel-layout.js';
import { SIGN_GLYPHS, BODY_GLYPHS, HARD_ASPECTS } from './glyphs.js';
import { esc } from './components.js';

const C = WHEEL.size / 2;
const SIGN_GLYPH_RADIUS = (WHEEL.outerRadius + WHEEL.signRingInner) / 2;
const HOUSE_NUMBER_RADIUS = (WHEEL.signRingInner + WHEEL.houseRingInner) / 2;
const DEGREE_MARK_LENGTH = 6;
const HIT_RADIUS = 11;
const ASPECT_MIN_OPACITY = 0.3;
const ANGLE_BODIES = ['asc', 'mc'];

const f = (n) => n.toFixed(2);
const line = (a, b, cls) => `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" class="${cls}"/>`;

function rings(hasHouses) {
  const circles = [WHEEL.outerRadius, WHEEL.signRingInner, WHEEL.aspectRadius];
  if (hasHouses) circles.push(WHEEL.houseRingInner);
  return circles.map((r) => `<circle cx="${C}" cy="${C}" r="${r}" class="wheel-ring"/>`).join('');
}

function ticks(ascLon) {
  return tickSpecs(ascLon)
    .map((t) => line(pointAt(t.angle, WHEEL.signRingInner), pointAt(t.angle, WHEEL.signRingInner + t.length), `tick tick-${t.kind}`))
    .join('');
}

function signGlyphs(ascLon) {
  return signGlyphAngles(ascLon).map((angle, i) => {
    const p = pointAt(angle, SIGN_GLYPH_RADIUS);
    return `<text x="${f(p.x)}" y="${f(p.y)}" class="sign-glyph" font-size="${WHEEL.signGlyphSize}">${SIGN_GLYPHS[i]}</text>`;
  }).join('');
}

function houseLines(houses, ascLon) {
  return houses.cusps.map((cusp, i) => {
    const angle = wheelAngle(cusp, ascLon);
    const isAxis = i % 3 === 0; // 1, 4, 7, 10: ASC, IC, DC, MC
    const outer = isAxis ? WHEEL.outerRadius : WHEEL.signRingInner;
    const inner = isAxis ? WHEEL.aspectRadius : WHEEL.houseRingInner;
    const next = houses.cusps[(i + 1) % houses.cusps.length];
    const mid = wheelAngle(cusp + ((next - cusp + 360) % 360) / 2, ascLon);
    const num = pointAt(mid, HOUSE_NUMBER_RADIUS);
    return line(pointAt(angle, inner), pointAt(angle, outer), isAxis ? 'house-line house-axis' : 'house-line')
      + `<text x="${f(num.x)}" y="${f(num.y)}" class="house-number" font-size="${WHEEL.houseNumberSize}">${i + 1}</text>`;
  }).join('');
}

function planetGlyphs(positions, ascLon, markInner) {
  const placed = resolveCollisions(positions.map((p) => ({ body: p.body, angle: wheelAngle(p.lon, ascLon), retro: p.retrograde })));
  return placed.map((p) => {
    const pos = pointAt(p.angle, planetRadius(p.ring));
    const mark = line(pointAt(p.angle, markInner), pointAt(p.angle, markInner - DEGREE_MARK_LENGTH), 'degree-mark');
    const retro = p.retro ? `<text x="9" y="-7" class="retro-mark">℞</text>` : '';
    return `${mark}<g class="wheel-planet" data-body="${p.body}" tabindex="0" role="button" style="--x:${f(pos.x)}px;--y:${f(pos.y)}px">`
      + `<circle r="${HIT_RADIUS}" class="hit"/><text class="planet-glyph" font-size="${WHEEL.glyphSize}">${BODY_GLYPHS[p.body]}</text>${retro}</g>`;
  }).join('');
}

function aspectLines(aspects, lonOf, ascLon) {
  return aspects.map((a) => {
    const from = pointAt(wheelAngle(lonOf[a.a], ascLon), WHEEL.aspectRadius);
    const to = pointAt(wheelAngle(lonOf[a.b], ascLon), WHEEL.aspectRadius);
    const cls = HARD_ASPECTS.includes(a.aspect) ? 'aspect-hard' : 'aspect-soft';
    const opacity = ASPECT_MIN_OPACITY + (1 - ASPECT_MIN_OPACITY) * a.strength;
    return `<line x1="${f(from.x)}" y1="${f(from.y)}" x2="${f(to.x)}" y2="${f(to.y)}" class="aspect ${cls}" style="opacity:${opacity.toFixed(2)}"/>`;
  }).join('');
}

// chart: natalChart çıktısı. Saat yoksa ev halkası çizilmez, Koç 0° solda durur.
export function renderWheel(chart, label = 'Doğum haritası çarkı') {
  const hasHouses = Boolean(chart.houses);
  const ascLon = hasHouses ? chart.houses.asc : 0;
  const lonOf = Object.fromEntries([...chart.positions, ...chart.angles].map((p) => [p.body, p.lon]));
  const aspects = chart.aspects.filter((a) => !ANGLE_BODIES.includes(a.a) && !ANGLE_BODIES.includes(a.b));
  return `<svg viewBox="0 0 ${WHEEL.size} ${WHEEL.size}" class="wheel" role="img" aria-label="${esc(label)}">`
    + rings(hasHouses) + ticks(ascLon) + signGlyphs(ascLon)
    + (hasHouses ? houseLines(chart.houses, ascLon) : '')
    + aspectLines(aspects, lonOf, ascLon)
    + planetGlyphs(chart.positions, ascLon, hasHouses ? WHEEL.houseRingInner : WHEEL.signRingInner)
    + '</svg>';
}
