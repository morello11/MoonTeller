import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localToUT, tzOffsetMinutes, localDateISO, utParts } from '../src/astro/time.js';

const TZ = 'Europe/Istanbul';
const ut = (date, time) => {
  const r = localToUT(date, time, TZ);
  return [r.year, r.month, r.day, r.utHours];
};

// docs/ENGINE.md'nin zorunlu üç satırı.
test('1990-07-15 12:00 İstanbul = 09:00 UTC (yaz saati +3)', () => {
  assert.deepEqual(ut('1990-07-15', '12:00'), [1990, 7, 15, 9]);
});
test('1990-01-15 12:00 İstanbul = 10:00 UTC (+2)', () => {
  assert.deepEqual(ut('1990-01-15', '12:00'), [1990, 1, 15, 10]);
});
test('2020-07-15 12:00 İstanbul = 09:00 UTC (kalıcı +3)', () => {
  assert.deepEqual(ut('2020-07-15', '12:00'), [2020, 7, 15, 9]);
});

// 1978-06-29 → 1984-11-01 arası Türkiye taban saati UTC+3, yaz saati yok (IANA tzdata `europe`, Rule Turkey;
// tek istisna 1983-07-31 → 1983-10-02 UTC+4). 1982'de yaz ve kış aynı: +3.
test('1982-07-15 12:00 İstanbul = 09:00 UTC (+3, yaz saati yok)', () => {
  assert.deepEqual(ut('1982-07-15', '12:00'), [1982, 7, 15, 9]);
});
test('1982-01-15 12:00 İstanbul = 09:00 UTC (+3 taban)', () => {
  assert.deepEqual(ut('1982-01-15', '12:00'), [1982, 1, 15, 9]);
});
test('1983-08-15 12:00 İstanbul = 08:00 UTC (+4, o yazın istisnası)', () => {
  assert.deepEqual(ut('1983-08-15', '12:00'), [1983, 8, 15, 8]);
});

test('gece yarısına yakın saat gün değiştirir', () => {
  assert.deepEqual(ut('2000-03-01', '01:30'), [2000, 2, 29, 23.5]);
});

// 2014'te yaz saati yerel seçim nedeniyle 30 Mart yerine 31 Mart'ta başladı (IANA tzdata).
test('2014 istisnası: 30 Mart hâlâ +2, 31 Mart +3', () => {
  assert.deepEqual(ut('2014-03-30', '12:00'), [2014, 3, 30, 10]);
  assert.deepEqual(ut('2014-03-31', '12:00'), [2014, 3, 31, 9]);
});

test('saat bilinmiyorsa 12:00 varsayılır ve timeKnown false', () => {
  const r = localToUT('2000-06-01', null, TZ);
  assert.equal(r.timeKnown, false);
  assert.equal(r.utHours, 9);
  assert.equal(localToUT('2000-06-01', '14:30', TZ).timeKnown, true);
});

test('başka bölge: New York', () => {
  assert.deepEqual(localToUT('2015-01-15', '12:00', 'America/New_York').utHours, 17);
});

test('tzOffsetMinutes', () => {
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(1990, 6, 15)), TZ), 180);
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(1990, 0, 15)), TZ), 120);
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(1982, 6, 15)), TZ), 180);
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(2015, 0, 15)), 'America/New_York'), -300);
});

test('localDateISO: İstanbul yerel tarihi, UTC değil', () => {
  assert.equal(localDateISO(new Date(Date.UTC(2026, 8, 2, 22, 30)), TZ), '2026-09-03');
  assert.equal(localDateISO(new Date(Date.UTC(2026, 8, 2, 20, 30)), TZ), '2026-09-02');
});

test('utParts', () => {
  assert.deepEqual(utParts(new Date(Date.UTC(2000, 0, 1, 12, 30))), { year: 2000, month: 1, day: 1, utHours: 12.5 });
});

test('geçersiz girdi hata verir', () => {
  assert.throws(() => localToUT('bozuk', '12:00', TZ));
  assert.throws(() => localToUT('2000-01-01', 'bozuk', TZ));
});
