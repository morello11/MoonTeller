// Canlı Gökyüzü: şu anki konumlar, Ay evresi, ufuk üstü/altı ve çıplak gözle görülebilirlik. Saf mantık (motor yüklü olmalı).
import { SKY, TRANSIT } from '../config.js';
import { computePositions, computeHorizontal } from './engine.js';
import { angularDistance } from './aspects.js';
import { signIndex, degreeInSign } from './chart.js';
import { moonPhase } from './moon.js';

export function liveSky(jdUT, latitude, longitude) {
  const positions = computePositions(jdUT, TRANSIT.transitingBodies);
  const sun = positions.find((p) => p.body === 'sun');
  const sunAltitude = computeHorizontal(jdUT, latitude, longitude, sun).altitude;
  const isNight = sunAltitude < SKY.nightSunAltitudeDeg;
  const bodies = positions.map((p) => {
    const { altitude, azimuth } = computeHorizontal(jdUT, latitude, longitude, p);
    const elongation = angularDistance(p.lon, sun.lon);
    const visible = isNight && SKY.nakedEye.includes(p.body) && altitude > SKY.minAltitudeDeg && elongation > SKY.minSunElongationDeg;
    return { body: p.body, lon: p.lon, sign: signIndex(p.lon), deg: degreeInSign(p.lon), retrograde: p.retrograde, altitude, azimuth, aboveHorizon: altitude > 0, visible, elongation };
  });
  const moon = positions.find((p) => p.body === 'moon');
  return { bodies, moon: { ...moonPhase(sun.lon, moon.lon), sign: signIndex(moon.lon) }, isNight, sunAltitude };
}
