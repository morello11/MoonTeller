// localStorage sarmalayıcı: profiller, ayarlar, cache. Repo'da veri yok; her şey tarayıcıda.
// storage parametresi enjekte edilir (Node testinde bellek içi nesne).
import { STORAGE_KEYS, SCHEMA_VERSION, HOUSE_SYSTEM, DEFAULT_TZ, LLM } from './config.js';

const EMPTY_PROFILES = () => ({ version: SCHEMA_VERSION, active: null, list: [] });
const DEFAULT_SETTINGS = () => ({ version: SCHEMA_VERSION, houseSystem: HOUSE_SYSTEM, showSerh: false, pin: '', dailySynthesis: false, voice: LLM.defaultVoice });

function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback();
  } catch {
    return fallback(); // bozuk kayıt: sıfırdan başla, sayfayı kırma
  }
}

function writeJSON(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

// Şema sürümü yükseldikçe buraya adım eklenir. v1 → v1: değişiklik yok.
export function migrate(data, fallback) {
  if (!data || typeof data !== 'object' || !('version' in data)) return fallback();
  return data;
}

// Natal hesabı belirleyen alanlar; biri değişirse cache geçersiz.
export function profileHash(profile) {
  return [profile.date, profile.time ?? '', profile.tz, profile.lat, profile.lon, profile.houseSystem].join('|');
}

const REQUIRED = ['name', 'date', 'tz', 'lat', 'lon'];

export function normalizeProfile(fields) {
  for (const key of REQUIRED) {
    if (fields[key] === undefined || fields[key] === null || fields[key] === '') throw new Error(`Eksik alan: ${key}`);
  }
  return {
    id: fields.id ?? crypto.randomUUID(),
    name: String(fields.name).trim(),
    date: fields.date,
    time: fields.time || null,
    tz: fields.tz || DEFAULT_TZ,
    place: fields.place ?? '',
    lat: Number(fields.lat),
    lon: Number(fields.lon),
    houseSystem: fields.houseSystem ?? HOUSE_SYSTEM,
    createdAt: fields.createdAt ?? new Date().toISOString(),
  };
}

export function createStore(storage = globalThis.localStorage) {
  const loadProfiles = () => migrate(readJSON(storage, STORAGE_KEYS.profiles, EMPTY_PROFILES), EMPTY_PROFILES);
  const saveProfiles = (data) => writeJSON(storage, STORAGE_KEYS.profiles, data);

  return {
    loadProfiles,
    saveProfile(fields) {
      const profile = normalizeProfile(fields);
      const data = loadProfiles();
      const index = data.list.findIndex((p) => p.id === profile.id);
      if (index >= 0) data.list[index] = profile; else data.list.push(profile);
      if (!data.active) data.active = profile.id;
      saveProfiles(data);
      return profile;
    },
    deleteProfile(id) {
      const data = loadProfiles();
      data.list = data.list.filter((p) => p.id !== id);
      if (data.active === id) data.active = data.list[0]?.id ?? null;
      saveProfiles(data);
    },
    getActiveProfile() {
      const data = loadProfiles();
      return data.list.find((p) => p.id === data.active) ?? null;
    },
    setActiveProfile(id) {
      const data = loadProfiles();
      if (!data.list.some((p) => p.id === id)) throw new Error('Profil yok');
      data.active = id;
      saveProfiles(data);
    },
    loadSettings: () => ({ ...DEFAULT_SETTINGS(), ...migrate(readJSON(storage, STORAGE_KEYS.settings, DEFAULT_SETTINGS), DEFAULT_SETTINGS) }),
    saveSettings(patch) {
      const next = { ...this.loadSettings(), ...patch };
      writeJSON(storage, STORAGE_KEYS.settings, next);
      return next;
    },
    cacheGet(namespace, key) {
      return readJSON(storage, STORAGE_KEYS.cache, () => ({}))[namespace]?.[key] ?? null;
    },
    cacheSet(namespace, key, value) {
      const cache = readJSON(storage, STORAGE_KEYS.cache, () => ({}));
      cache[namespace] = { ...(cache[namespace] ?? {}), [key]: value };
      writeJSON(storage, STORAGE_KEYS.cache, cache);
    },
    // Ad alanında yalnızca bu kayıt kalır (günlük gibi eskisi işe yaramayan veriler için).
    cacheReplace(namespace, key, value) {
      const cache = readJSON(storage, STORAGE_KEYS.cache, () => ({}));
      cache[namespace] = { [key]: value };
      writeJSON(storage, STORAGE_KEYS.cache, cache);
    },
    clearAll() {
      for (const key of Object.values(STORAGE_KEYS)) storage.removeItem(key);
    },
  };
}
