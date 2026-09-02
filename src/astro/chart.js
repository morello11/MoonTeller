// Profil → natal harita: zaman, cisimler, evler, aspektler (docs/ENGINE.md adım 1–4). Saf mantık.
import { HOUSE_SYSTEM, HOUSE_SYSTEMS, PLACIDUS_MAX_LATITUDE } from '../config.js';
import { localToUT } from './time.js';
import { julianDayUT, computePositions, computeHouses } from './engine.js';
import { findAspects, normalizeDegrees } from './aspects.js';

export const SIGNS_TR = [
  'Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
  'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık',
];

const SIGN_SPAN = 360 / SIGNS_TR.length;

export function signIndex(lon) {
  return Math.floor(normalizeDegrees(lon) / SIGN_SPAN);
}

export function degreeInSign(lon) {
  return normalizeDegrees(lon) % SIGN_SPAN;
}

// İstenen sistem geçersizse varsayılan; yüksek enlemde Placidus yerine Whole Sign.
export function effectiveHouseSystem(requested, latitude) {
  const system = HOUSE_SYSTEMS.includes(requested) ? requested : HOUSE_SYSTEM;
  return system === 'P' && Math.abs(latitude) > PLACIDUS_MAX_LATITUDE ? 'W' : system;
}

// cusps: 12 elemanlı (1. ev index 0). Dönüş 1–12. Cusp aralığı 360° sarmalını gözetir.
export function houseOf(lon, cusps) {
  for (let i = 0; i < cusps.length; i += 1) {
    const start = cusps[i];
    const span = normalizeDegrees(cusps[(i + 1) % cusps.length] - start);
    if (normalizeDegrees(lon - start) < span) return i + 1;
  }
  return cusps.length;
}

function anglePoints(houses) {
  return [{ body: 'asc', lon: houses.asc, speed: 0 }, { body: 'mc', lon: houses.mc, speed: 0 }];
}

// profile: { date, time|null, tz, lat, lon, houseSystem? }. Motor yüklü olmalı (await loadEngine()).
export function natalChart(profile) {
  const ut = localToUT(profile.date, profile.time ?? null, profile.tz);
  const jdUT = julianDayUT(ut);
  const system = effectiveHouseSystem(profile.houseSystem, profile.lat);
  const houses = ut.timeKnown ? computeHouses(jdUT, profile.lat, profile.lon, system) : null;
  const positions = computePositions(jdUT).map((p) => ({
    ...p,
    sign: signIndex(p.lon),
    deg: degreeInSign(p.lon),
    house: houses ? houseOf(p.lon, houses.cusps) : null,
  }));
  const angles = houses ? anglePoints(houses) : [];
  return {
    jdUT, timeKnown: ut.timeKnown, houseSystem: houses ? system : null,
    positions, houses, angles,
    aspects: findAspects([...positions, ...angles], null, 'natal'),
  };
}
