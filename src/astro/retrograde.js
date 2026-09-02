// Retro aralıkları: hız işaretinin değiştiği anlar (günlük adım + ikiye bölme). Saf mantık (motor yüklü olmalı).
import { RETRO } from '../config.js';
import { computePositions } from './engine.js';
import { signedSeparation } from './aspects.js';

function speedAt(body, jd) {
  return computePositions(jd, [body])[0].speed;
}

function lonAt(body, jd) {
  return computePositions(jd, [body])[0].lon;
}

// [a, b] arasında hız işareti değişiyor; değişim anını bisectPrecisionDays hassasiyetle bul.
function bisectStation(body, a, b) {
  let lo = a;
  let hi = b;
  let sLo = speedAt(body, lo);
  while (hi - lo > RETRO.bisectPrecisionDays) {
    const mid = (lo + hi) / 2;
    const sMid = speedAt(body, mid);
    if ((sMid < 0) === (sLo < 0)) { lo = mid; sLo = sMid; } else hi = mid;
  }
  return (lo + hi) / 2;
}

// jdFrom–jdTo penceresiyle kesişen retro aralıkları: [{ start, end, startLon, endLon }]. Uçları kapsamak için pencere genişletilir.
export function retroIntervals(body, jdFrom, jdTo) {
  const from = jdFrom - RETRO.scanDaysBefore;
  const to = jdTo + RETRO.scanDaysAfter;
  const stations = [];
  let prev = speedAt(body, from);
  for (let jd = from + RETRO.stepDays; jd <= to; jd += RETRO.stepDays) {
    const s = speedAt(body, jd);
    if ((s < 0) !== (prev < 0)) stations.push({ jd: bisectStation(body, jd - RETRO.stepDays, jd), retro: s < 0 });
    prev = s;
  }
  const intervals = [];
  for (let i = 0; i < stations.length; i += 1) {
    if (!stations[i].retro) continue;
    const end = stations[i + 1]?.jd ?? null;
    if (end === null) break;
    intervals.push({ start: stations[i].jd, end, startLon: lonAt(body, stations[i].jd), endLon: lonAt(body, end) });
  }
  return intervals.filter((iv) => iv.end >= jdFrom && iv.start <= jdTo);
}

// Gölge: retro öncesi gezegenin endLon'u ilk geçtiği an, retro sonrası startLon'u tekrar geçtiği an (günlük tarama + ikiye bölme).
function crossing(body, target, from, direction) {
  let jd = from;
  let prev = signedSeparation(lonAt(body, jd), target);
  for (let i = 0; i < RETRO.scanDaysBefore; i += 1) {
    const next = jd + direction * RETRO.stepDays;
    const sep = signedSeparation(lonAt(body, next), target);
    if ((sep < 0) !== (prev < 0) && Math.abs(sep - prev) < 180) return refineCrossing(body, target, Math.min(jd, next), Math.max(jd, next));
    jd = next;
    prev = sep;
  }
  return null;
}

function refineCrossing(body, target, lo, hi) {
  let sLo = signedSeparation(lonAt(body, lo), target);
  while (hi - lo > RETRO.bisectPrecisionDays) {
    const mid = (lo + hi) / 2;
    const sMid = signedSeparation(lonAt(body, mid), target);
    if ((sMid < 0) === (sLo < 0)) { lo = mid; sLo = sMid; } else hi = mid;
  }
  return (lo + hi) / 2;
}

export function shadowFor(body, interval) {
  return {
    preStart: crossing(body, interval.endLon, interval.start, -1),
    postEnd: crossing(body, interval.startLon, interval.end, +1),
  };
}

// Şu ana göre durum: { current, next, previous, daysUntil, daysLeft }
export function retroStatus(jdNow, intervals) {
  const current = intervals.find((iv) => jdNow >= iv.start && jdNow <= iv.end) ?? null;
  const next = intervals.find((iv) => iv.start > jdNow) ?? null;
  const previous = [...intervals].reverse().find((iv) => iv.end < jdNow) ?? null;
  return {
    current, next, previous,
    daysUntil: next ? next.start - jdNow : null,
    daysLeft: current ? current.end - jdNow : null,
  };
}
