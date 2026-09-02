// Swiss Ephemeris sarmalayıcısı. Saf mantık: DOM yok, window yok.
// `swe.` çağrıları yalnızca bu dosyada yaşar. Motor tembel yüklenir, tek örnektir; önce `await loadEngine()`.
import { EPHEMERIS_FLAGS, HOUSE_SYSTEM, BODIES } from '../config.js';

const BODY_CONSTANTS = {
  sun: 'SE_SUN', moon: 'SE_MOON', mercury: 'SE_MERCURY', venus: 'SE_VENUS', mars: 'SE_MARS',
  jupiter: 'SE_JUPITER', saturn: 'SE_SATURN', uranus: 'SE_URANUS', neptune: 'SE_NEPTUNE',
  pluto: 'SE_PLUTO', trueNode: 'SE_TRUE_NODE', chiron: 'SE_CHIRON',
};

const HOUSE_COUNT = 12;
const ASC_INDEX = 0;
const MC_INDEX = 1;

let enginePromise = null;
let engine = null;

async function createEngine() {
  const { default: SwissEph } = await import('../../vendor/swisseph/src/swisseph.js');
  const swe = new SwissEph();
  await swe.initSwissEph();
  engine = swe;
  return swe;
}

// WASM ilk çağrıda yüklenir; sonraki çağrılar aynı örneği döndürür.
export function loadEngine() {
  if (!enginePromise) enginePromise = createEngine();
  return enginePromise;
}

function requireEngine() {
  if (!engine) throw new Error('Motor yüklü değil: önce await loadEngine()');
  return engine;
}

function ephemerisFlags(swe) {
  return EPHEMERIS_FLAGS.reduce((flags, name) => flags | swe[name], 0);
}

export function julianDayUT({ year, month, day, utHours }) {
  return requireEngine().julday(year, month, day, utHours);
}

function computePosition(swe, jdUT, body) {
  const constant = BODY_CONSTANTS[body];
  if (!constant) throw new Error(`Bilinmeyen gök cismi: ${body}`);
  const [lon, lat, dist, speed] = swe.calc_ut(jdUT, swe[constant], ephemerisFlags(swe));
  return { body, lon, lat, dist, speed, retrograde: speed < 0 };
}

// Dönüş: [{ body, lon, lat, dist, speed, retrograde }]
export function computePositions(jdUT, bodies = BODIES) {
  const swe = requireEngine();
  return bodies.map((body) => computePosition(swe, jdUT, body));
}

// Dönüş: { cusps: 12 elemanlı dizi (1. ev index 0), asc, mc } — derece.
export function computeHouses(jdUT, latitude, longitude) {
  const { cusps, ascmc } = requireEngine().houses(jdUT, latitude, longitude, HOUSE_SYSTEM);
  return {
    cusps: Array.from(cusps.subarray(1, HOUSE_COUNT + 1)),
    asc: ascmc[ASC_INDEX],
    mc: ascmc[MC_INDEX],
  };
}

export function engineVersion() {
  return requireEngine().version();
}
