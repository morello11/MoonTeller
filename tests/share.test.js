import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeProfile, decodeProfile, shareUrl, parseShareHash } from '../src/share.js';

// Uydurma profil (kişisel veri değil).
const P = { id: 'x1', name: 'Ayşe Ö.', date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', place: 'Ankara', lat: 39.93333, lon: 32.86667, houseSystem: 'P', createdAt: '2026-01-01T00:00:00Z' };

test('gidiş-dönüş: alanlar korunur, id taşınmaz, link kısa', () => {
  const encoded = encodeProfile(P);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.ok(encoded.length < 200, `uzunluk ${encoded.length}`);
  const back = decodeProfile(encoded);
  assert.deepEqual(back, { name: 'Ayşe Ö.', date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', place: 'Ankara', lat: 39.9333, lon: 32.8667, houseSystem: 'P' });
  assert.ok(!('id' in back));
});

test('saatsiz profil ve hash ayrıştırma', () => {
  const url = shareUrl('https://ornek.test/', { ...P, time: null, houseSystem: 'W' });
  const encoded = parseShareHash(url.slice(url.indexOf('#')));
  assert.ok(encoded);
  const back = decodeProfile(encoded);
  assert.equal(back.time, null);
  assert.equal(back.houseSystem, 'W');
  assert.equal(parseShareHash('#/haritam'), null);
  assert.equal(parseShareHash('#p='), null);
});

test('bozuk girdiler hata verir', () => {
  assert.throws(() => decodeProfile('abc'), /bozuk/);
  const bad = (patch) => encodeProfileRaw({ v: 1, n: 'A', d: '1988-11-05', t: null, tz: 'Europe/Istanbul', p: '', la: 39.9, lo: 32.9, ...patch });
  assert.throws(() => decodeProfile(bad({ v: 2 })), /sürüm/);
  assert.throws(() => decodeProfile(bad({ n: '' })), /ad/);
  assert.throws(() => decodeProfile(bad({ d: '05.11.1988' })), /tarih/);
  assert.throws(() => decodeProfile(bad({ t: '25:99' })), /saat/);
  assert.throws(() => decodeProfile(bad({ t: '12:60' })), /saat/);
  assert.throws(() => decodeProfile(bad({ d: '1988-02-30' })), /tarih/);
  assert.throws(() => decodeProfile(bad({ tz: 'Mars/Olympus' })), /dilimi/);
  assert.throws(() => decodeProfile(bad({ la: 95 })), /konum/);
});

function encodeProfileRaw(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
