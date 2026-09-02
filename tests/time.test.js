import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localToUT, tzOffsetMinutes } from '../src/astro/time.js';

const TZ = 'Europe/Istanbul';

test('İstanbul 1990 yazı UTC+3', () => {
  const r = localToUT('1990-07-15', '12:00', TZ);
  assert.deepEqual([r.year, r.month, r.day, r.utHours], [1990, 7, 15, 9]);
  assert.equal(r.timeKnown, true);
});

test('İstanbul 2015 kışı UTC+2', () => {
  const r = localToUT('2015-01-15', '12:00', TZ);
  assert.equal(r.utHours, 10);
});

test('İstanbul 2020 (kalıcı UTC+3)', () => {
  const r = localToUT('2020-01-15', '12:00', TZ);
  assert.equal(r.utHours, 9);
});

test('gece yarısına yakın saat gün değiştirir', () => {
  const r = localToUT('2000-03-01', '01:30', TZ);
  assert.deepEqual([r.year, r.month, r.day], [2000, 2, 29]);
  assert.equal(r.utHours, 23.5);
});

test('saat bilinmiyorsa 12:00 varsayılır', () => {
  const r = localToUT('2000-06-01', null, TZ);
  assert.equal(r.timeKnown, false);
  assert.equal(r.utHours, 9);
});

test('tzOffsetMinutes yaz/kış', () => {
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(1990, 6, 15)), TZ), 180);
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(2015, 0, 15)), TZ), 120);
  assert.equal(tzOffsetMinutes(new Date(Date.UTC(2015, 0, 15)), 'America/New_York'), -300);
});

test('geçersiz tarih hata verir', () => {
  assert.throws(() => localToUT('bozuk', '12:00', TZ));
});
