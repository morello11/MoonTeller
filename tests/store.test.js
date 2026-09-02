import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, profileHash, normalizeProfile, migrate } from '../src/store.js';

// Bellek içi localStorage taklidi.
function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    raw: map,
  };
}

// Uydurma profil (kişisel veri değil).
const FIELDS = { name: 'A', date: '1988-11-05', time: '23:40', tz: 'Europe/Istanbul', place: 'Ankara', lat: 39.93, lon: 32.86 };

test('kaydet, oku, aktif profil', () => {
  const store = createStore(memoryStorage());
  assert.equal(store.getActiveProfile(), null);
  const p = store.saveProfile(FIELDS);
  assert.ok(p.id && p.createdAt);
  assert.equal(p.houseSystem, 'P');
  assert.equal(store.getActiveProfile().id, p.id);
  assert.equal(store.loadProfiles().list.length, 1);
});

test('güncelleme aynı id ile, ikinci profil ve aktif değiştirme, silme', () => {
  const store = createStore(memoryStorage());
  const a = store.saveProfile(FIELDS);
  store.saveProfile({ ...a, name: 'A2' });
  assert.equal(store.loadProfiles().list.length, 1);
  assert.equal(store.getActiveProfile().name, 'A2');
  const b = store.saveProfile({ ...FIELDS, name: 'B', time: null });
  assert.equal(store.getActiveProfile().id, a.id);
  store.setActiveProfile(b.id);
  assert.equal(store.getActiveProfile().name, 'B');
  assert.equal(store.getActiveProfile().time, null);
  store.deleteProfile(b.id);
  assert.equal(store.getActiveProfile().id, a.id);
  assert.throws(() => store.setActiveProfile('yok'));
});

test('eksik alan hata verir', () => {
  assert.throws(() => normalizeProfile({ ...FIELDS, date: '' }), /Eksik alan: date/);
});

test('ayarlar varsayılan + yama', () => {
  const store = createStore(memoryStorage());
  assert.equal(store.loadSettings().houseSystem, 'P');
  assert.equal(store.loadSettings().showSerh, false);
  store.saveSettings({ showSerh: true });
  assert.equal(store.loadSettings().showSerh, true);
  assert.equal(store.loadSettings().houseSystem, 'P');
});

test('cache ve profil hash', () => {
  const store = createStore(memoryStorage());
  const h = profileHash(FIELDS);
  assert.equal(store.cacheGet('natal', h), null);
  store.cacheSet('natal', h, { ok: 1 });
  assert.deepEqual(store.cacheGet('natal', h), { ok: 1 });
  assert.notEqual(profileHash({ ...FIELDS, time: null }), h);
  assert.equal(profileHash({ ...FIELDS, name: 'başka' }), h);
});

test('bozuk kayıt sıfırdan başlar, migrate sürümsüz veriyi atar', () => {
  const storage = memoryStorage();
  storage.setItem('yn:profiles', '{bozuk');
  const store = createStore(storage);
  assert.equal(store.loadProfiles().list.length, 0);
  assert.deepEqual(migrate({ list: [] }, () => ({ version: 1, active: null, list: [] })), { version: 1, active: null, list: [] });
  store.saveProfile(FIELDS);
  store.clearAll();
  assert.equal(store.getActiveProfile(), null);
});
