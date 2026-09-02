// Yerel saat → UT dönüşümü, yalnızca Intl ile (IANA kuralları, tarihsel yaz saati dahil). Saf mantık.
import { DEFAULT_TZ, UNKNOWN_TIME_HOUR } from '../config.js';

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = 3600;

const formatterCache = new Map();

function formatterFor(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return formatterCache.get(timeZone);
}

function wallClockParts(date, timeZone) {
  const p = {};
  for (const part of formatterFor(timeZone).formatToParts(date)) p[part.type] = part.value;
  return p;
}

// Verilen andaki duvar saatini, sanki UTC'ymiş gibi milisaniye olarak döndürür.
function wallClockAsUTC(date, timeZone) {
  const p = wallClockParts(date, timeZone);
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}

// Bölgenin verilen andaki UTC farkı (dakika). İstanbul yazı 1990 → 180, kışı 1990 → 120.
export function tzOffsetMinutes(date, timeZone = DEFAULT_TZ) {
  return Math.round((wallClockAsUTC(date, timeZone) - date.getTime()) / MS_PER_MINUTE);
}

// Verilen anın o bölgedeki yerel tarihi, 'YYYY-MM-DD'. "Bugün" = İstanbul yerel tarihi, UTC değil.
export function localDateISO(date, timeZone = DEFAULT_TZ) {
  const p = wallClockParts(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function parseDate(dateISO) {
  const [y, m, d] = String(dateISO).split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Geçersiz tarih: ${dateISO}`);
  return { y, m, d };
}

function parseTime(timeHHMM) {
  if (!timeHHMM) return { h: UNKNOWN_TIME_HOUR, mi: 0 };
  const [h, mi] = String(timeHHMM).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(mi)) throw new Error(`Geçersiz saat: ${timeHHMM}`);
  return { h, mi };
}

// Date → motorun istediği UT parçaları.
export function utParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    utHours: date.getUTCHours()
      + date.getUTCMinutes() / MINUTES_PER_HOUR
      + date.getUTCSeconds() / SECONDS_PER_HOUR,
  };
}

// dateISO 'YYYY-MM-DD', timeHHMM 'HH:MM' (null → saat bilinmiyor, UNKNOWN_TIME_HOUR), timeZone IANA.
// Dönüş: { year, month, day, utHours, timeKnown, utc: Date }. Yaz saati geçişi için iki adımlı düzeltme.
export function localToUT(dateISO, timeHHMM, timeZone = DEFAULT_TZ) {
  const { y, m, d } = parseDate(dateISO);
  const { h, mi } = parseTime(timeHHMM);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const firstOffset = tzOffsetMinutes(new Date(guess), timeZone);
  let utc = guess - firstOffset * MS_PER_MINUTE;
  const secondOffset = tzOffsetMinutes(new Date(utc), timeZone);
  if (secondOffset !== firstOffset) utc = guess - secondOffset * MS_PER_MINUTE;
  const date = new Date(utc);
  return { ...utParts(date), timeKnown: Boolean(timeHHMM), utc: date };
}
