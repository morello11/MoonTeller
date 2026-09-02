// Ay evresi ve Ay boşlukta (void of course). Saf mantık; tarama için motor yüklü olmalı.
import { ASPECTS, MOON_PHASES_TR, VOID_OF_COURSE } from '../config.js';
import { computePositions } from './engine.js';
import { normalizeDegrees, signedSeparation } from './aspects.js';
import { signIndex } from './chart.js';

const FULL_CIRCLE = 360;
const HALF_CIRCLE = 180;
const PHASE_SPAN = FULL_CIRCLE / MOON_PHASES_TR.length;
const MINUTES_PER_DAY = 1440;
const MAX_SCAN_DAYS = 4; // Ay bir burçta en çok ≈ 2,7 gün kalır; güvenlik sınırı
const DEG_TO_RAD = Math.PI / HALF_CIRCLE;

// signedSeparation hedefleri: 0, ±60, ±90, ±120; 180 sarmalı ayrıca ele alınır.
const EXACT_TARGETS = ASPECTS.flatMap(({ angle }) => {
  if (angle === 0 || angle === HALF_CIRCLE) return [];
  return [angle, -angle];
}).concat([0]);

// Evre açısı = Ay − Güneş (0–360). 8 evre, aydınlanma 0..1.
export function moonPhase(sunLon, moonLon) {
  const angle = normalizeDegrees(moonLon - sunLon);
  const index = Math.floor(normalizeDegrees(angle + PHASE_SPAN / 2) / PHASE_SPAN);
  return { angle, index, name: MOON_PHASES_TR[index], illumination: (1 - Math.cos(angle * DEG_TO_RAD)) / 2 };
}

// İki adım arasında Ay–gezegen açısı bir majör aspekt açısından geçtiyse true.
export function crossedExact(prevSep, nextSep) {
  if (Math.abs(nextSep - prevSep) > HALF_CIRCLE) return true; // ±180 sarmalı: karşıt tam oldu
  return EXACT_TARGETS.some((t) => prevSep !== nextSep && (prevSep - t) * (nextSep - t) <= 0);
}

function moonSeparations(jd) {
  const [moon, ...others] = computePositions(jd, ['moon', ...VOID_OF_COURSE.bodies]);
  return { moonLon: moon.lon, seps: others.map((o) => signedSeparation(moon.lon, o.lon)) };
}

// Ay'ın bulunduğu burca giriş anı (geriye tarama).
function signEntry(jdUT, sign, step, maxSteps) {
  let jd = jdUT;
  for (let i = 1; i <= maxSteps; i += 1) {
    const prev = jd - step;
    if (signIndex(moonSeparations(prev).moonLon) !== sign) return jd;
    jd = prev;
  }
  return jd;
}

// Günlük görünüm için: Ay'ın bu burçtaki son tam aspekti (boşluğun başı) ve burçtan çıkışı (sonu).
// Dönüş: { start, end, isVoidNow, sign }. start === null → bu burçta hiç tam aspekt yok (burç girişinden itibaren boşlukta).
export function voidWindow(jdUT) {
  const step = VOID_OF_COURSE.stepMinutes / MINUTES_PER_DAY;
  const maxSteps = (MAX_SCAN_DAYS * MINUTES_PER_DAY) / VOID_OF_COURSE.stepMinutes;
  const sign = signIndex(moonSeparations(jdUT).moonLon);
  const entry = signEntry(jdUT, sign, step, maxSteps);
  let { seps: prevSeps } = moonSeparations(entry);
  let lastExact = null;
  for (let i = 1; i <= maxSteps; i += 1) {
    const jd = entry + i * step;
    const { moonLon, seps } = moonSeparations(jd);
    if (signIndex(moonLon) !== sign) {
      const start = lastExact ?? entry;
      return { start, end: jd, isVoidNow: jdUT >= start, sign, hasExact: lastExact !== null };
    }
    if (seps.some((s, k) => crossedExact(prevSeps[k], s))) lastExact = jd;
    prevSeps = seps;
  }
  throw new Error('Ay burç değiştirmedi: tarama sınırı aşıldı');
}

// Ay bulunduğu burcu terk edene kadar hiçbir majör aspekt tam olmuyorsa boşlukta.
// Dönüş: { isVoid, signExitJd, nextExactJd | null }
export function voidOfCourse(jdUT) {
  const step = VOID_OF_COURSE.stepMinutes / MINUTES_PER_DAY;
  const maxSteps = (MAX_SCAN_DAYS * MINUTES_PER_DAY) / VOID_OF_COURSE.stepMinutes;
  let { moonLon, seps: prevSeps } = moonSeparations(jdUT);
  const sign = signIndex(moonLon);
  let nextExactJd = null;
  for (let i = 1; i <= maxSteps; i += 1) {
    const jd = jdUT + i * step;
    const { moonLon: lon, seps } = moonSeparations(jd);
    if (signIndex(lon) !== sign) return { isVoid: nextExactJd === null, signExitJd: jd, nextExactJd };
    if (nextExactJd === null && seps.some((s, k) => crossedExact(prevSeps[k], s))) nextExactJd = jd;
    prevSeps = seps;
  }
  throw new Error('Ay burç değiştirmedi: tarama sınırı aşıldı');
}
