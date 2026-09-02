// Swiss Ephemeris sarmalayıcısı. Saf mantık: DOM yok, window yok.
// Motor (swe) tembel yüklenir ve fonksiyonlara parametre olarak verilir; Node testleri de aynı yolu kullanır.
import { EPHEMERIS, BODIES } from '../config.js';

const BODY_CONSTANTS = {
  sun: 'SE_SUN', moon: 'SE_MOON', mercury: 'SE_MERCURY', venus: 'SE_VENUS', mars: 'SE_MARS',
  jupiter: 'SE_JUPITER', saturn: 'SE_SATURN', uranus: 'SE_URANUS', neptune: 'SE_NEPTUNE',
  pluto: 'SE_PLUTO', trueNode: 'SE_TRUE_NODE', chiron: 'SE_CHIRON',
};

const HOUSE_COUNT = 12;
const ASC_INDEX = 0;
const MC_INDEX = 1;

let enginePromise = null;

async function createEngine() {
  const { default: SwissEph } = await import('../../vendor/swisseph/src/swisseph.js');
  const swe = new SwissEph();
  await swe.initSwissEph();
  return swe;
}

// Tek örnek; WASM ilk çağrıda yüklenir.
export function loadEngine() {
  if (!enginePromise) enginePromise = createEngine();
  return enginePromise;
}

export function ephemerisFlags(swe) {
  const base = EPHEMERIS.useMoshier ? swe.SEFLG_MOSEPH : swe.SEFLG_SWIEPH;
  return base | swe.SEFLG_SPEED;
}

export function julianDayUT(swe, { year, month, day, utHours }) {
  return swe.julday(year, month, day, utHours);
}

export function computePosition(swe, jdUT, body) {
  const constant = BODY_CONSTANTS[body];
  if (!constant) throw new Error(`Bilinmeyen gök cismi: ${body}`);
  const [lon, lat, dist, speed] = swe.calc_ut(jdUT, swe[constant], ephemerisFlags(swe));
  return { body, lon, lat, dist, speed, retrograde: speed < 0 };
}

export function computePositions(swe, jdUT, bodies = BODIES) {
  return bodies.map((body) => computePosition(swe, jdUT, body));
}

// cusps: 12 elemanlı dizi (1. ev index 0), asc ve mc derece.
export function computeHouses(swe, jdUT, latitude, longitude) {
  const { cusps, ascmc } = swe.houses(jdUT, latitude, longitude, EPHEMERIS.houseSystem);
  return {
    cusps: Array.from(cusps.subarray(1, HOUSE_COUNT + 1)),
    asc: ascmc[ASC_INDEX],
    mc: ascmc[MC_INDEX],
  };
}

export function engineVersion(swe) {
  return swe.version();
}
