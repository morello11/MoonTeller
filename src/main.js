// Başlangıç, hash router, tek state. Sayfa modülleri render(state) + mount(root, state, actions) → unmount.
import { SCHEMA_VERSION, BANK, BANK_URL, RETRO, DAILY_REPEAT_DAYS, TEAM_MAX, TODAY } from './config.js';
import { localDateISO, localToUT, utParts } from './astro/time.js';
import { julianDayUT, loadEngine, engineVersion } from './astro/engine.js';
import { natalChart } from './astro/chart.js';
import { composeDaily } from './text/compose-daily.js';
import { retroIntervals, retroStatus, shadowFor } from './astro/retrograde.js';
import { synastryMatrix } from './astro/synastry.js';
import { contagionList, weekPair } from './astro/team.js';
import { createBank, hashSeed } from './text/bank.js';
import { createStore, profileHash } from './store.js';
import { decodeProfile, parseShareHash } from './share.js';
import * as onboarding from './ui/pages/onboarding.js';
import * as haritam from './ui/pages/haritam.js';
import * as bugun from './ui/pages/bugun.js';
import * as ekip from './ui/pages/ekip.js';
import * as kiyasla from './ui/pages/kiyasla.js';
import { tabBar, errorBox, comingSoon } from './ui/components.js';

const PAGES = { haritam: 'Haritam', bugun: 'Bugün', ekip: 'Ekip', kiyasla: 'Kıyasla', ekle: 'Ekle', sor: 'Sor', ayarlar: 'Ayarlar', onboarding: 'Profil' };
const ROUTE_ALIASES = { ofis: 'ekip' };
const FORM_ROUTES = ['onboarding', 'ekle'];
const TEAM_ROUTES = ['ekip', 'kiyasla'];
const DEFAULT_ROUTE = 'haritam';
const CITIES_URL = 'data/cities-tr.json';

const store = createStore();
const state = {
  route: DEFAULT_ROUTE, params: [], profile: null, chart: null, settings: store.loadSettings(),
  cities: [], engineVersion: '', wheelAnimated: false, editingProfile: null, forTeam: false, bank: null, reading: null,
  daily: null, retro: null, team: null, pendingImport: null, importError: null,
};
let unmount = () => {};
let renderSeq = 0; // hızlı sekme değişiminde eski render'ın sonradan boyamasını engeller

function saveTeamProfile(fields) {
  if (store.loadProfiles().list.length >= TEAM_MAX) throw new Error(`Ekip en çok ${TEAM_MAX} kişi.`);
  store.saveProfile(fields);
  state.team = null;
}

const actions = {
  // Kendi profili. Bekleyen içe aktarma varsa o da ekibe yazılır; dönüş: gidilecek rota.
  saveProfile(fields) {
    state.profile = store.saveProfile(fields);
    store.setActiveProfile(state.profile.id);
    state.chart = null; state.daily = null; state.team = null; state.wheelAnimated = false;
    const pending = state.pendingImport;
    state.pendingImport = null;
    if (pending) saveTeamProfile(pending);
    return pending ? '#/ekip' : '#/haritam';
  },
  saveTeamProfile,
  importPending() {
    const pending = state.pendingImport;
    state.pendingImport = null;
    if (pending) saveTeamProfile(pending);
  },
  dismissImport() { state.pendingImport = null; state.importError = null; },
  deleteProfile(id) { store.deleteProfile(id); state.team = null; },
  setSerh(open) { state.settings = store.saveSettings({ showSerh: open }); },
  refresh: () => renderRoute(),
};

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const name = ROUTE_ALIASES[parts[0]] ?? parts[0];
  return { route: PAGES[name] ? name : DEFAULT_ROUTE, params: parts.slice(1) };
}

function isDuplicate(fields) {
  return store.loadProfiles().list.some((p) => p.name === fields.name && p.date === fields.date && (p.time ?? null) === fields.time);
}

// "#p=..." linki: çözümle, beklemeye al, adres çubuğunu #/ekip yap (link yeniden işlenmesin).
function takeShareHash() {
  const encoded = parseShareHash(location.hash);
  if (!encoded) return;
  state.pendingImport = null; state.importError = null;
  try {
    const fields = decodeProfile(encoded);
    if (isDuplicate(fields)) state.importError = { key: 'import_exists', name: fields.name };
    else state.pendingImport = fields;
  } catch {
    state.importError = { key: 'import_error' };
  }
  history.replaceState(null, '', `${location.pathname}${location.search}#/ekip`);
}

// Natal hesap bir kez: profil alanları değişmediyse cache'ten.
async function ensureChart(profile) {
  const key = `${SCHEMA_VERSION}:${profileHash(profile)}`;
  const cached = store.cacheGet('natal', key);
  await loadEngine();
  state.engineVersion = engineVersion();
  if (cached) return cached;
  const chart = natalChart(profile);
  store.cacheSet('natal', key, chart);
  return chart;
}

// Metin bankası: ilk açılışta bir kez, paralel.
async function ensureBank() {
  if (state.bank) return state.bank;
  const entries = await Promise.all(BANK.files.map(async (name) => {
    const res = await fetch(`${BANK_URL}${name}.json`);
    if (!res.ok) throw new Error(`Metin bankası yüklenemedi: ${name}`);
    return [name, await res.json()];
  }));
  state.bank = createBank(Object.fromEntries(entries));
  return state.bank;
}

// Günün bağlamı: İstanbul yerel tarihi (doğum yerinin saat dilimi değil).
function dayContext(tz = TODAY.tz) {
  const dateISO = localDateISO(new Date(), tz);
  const dayStartJd = julianDayUT(localToUT(dateISO, '00:00', tz));
  return { tz, dateISO, jdNoon: julianDayUT(localToUT(dateISO, '12:00', tz)), jdNow: julianDayUT(utParts(new Date())), dayStartJd, dayEndJd: dayStartJd + 1, seed: 0 };
}

// Bugün: yerel tarih başına bir kez hesaplanır ve cache'lenir (yenileyince değişmez, ertesi gün değişir).
function ensureDaily(profile) {
  const ctx = dayContext();
  const key = `${SCHEMA_VERSION}:${profileHash(profile)}:${profile.id}:${ctx.dateISO}`;
  let daily = store.cacheGet('daily', key);
  if (!daily) {
    const shown = (store.cacheGet('shown', profile.id) ?? []).filter((s) => daysBetween(s.date, ctx.dateISO) < DAILY_REPEAT_DAYS);
    daily = composeDaily(state.chart, state.bank, { dateISO: ctx.dateISO, jdNoon: ctx.jdNoon, profileId: profile.id, recent: shown.flatMap((s) => s.texts) });
    store.cacheReplace('daily', key, daily); // eski günler atılır; cache şişmesin
    store.cacheSet('shown', profile.id, [...shown, { date: ctx.dateISO, texts: daily.topThree.map((t) => t.text) }]);
  }
  ctx.seed = daily.seed;
  return { ...daily, ctx };
}

function daysBetween(a, b) {
  return Math.abs((new Date(b) - new Date(a)) / 86400000);
}

// Retro aralıkları yılda bir hesaplanır (docs/REVIEW.md 13).
function ensureRetro(jdNow) {
  const year = new Date().getUTCFullYear();
  const key = `${RETRO.bodies[0]}:${year}`;
  let intervals = store.cacheGet(RETRO.cacheNamespace, key);
  if (!intervals) {
    intervals = retroIntervals(RETRO.bodies[0], jdNow - RETRO.scanDaysBefore / 2, jdNow + RETRO.scanDaysAfter);
    store.cacheSet(RETRO.cacheNamespace, key, intervals);
  }
  const status = retroStatus(jdNow, intervals);
  const target = status.current ?? status.next;
  return { status, shadow: target ? shadowFor(RETRO.bodies[0], target) : null, previousShadow: status.previous ? shadowFor(RETRO.bodies[0], status.previous) : null };
}

// Ekip: ben önce, sonra diğerleri; haritalar natal cache'ten; matris, bulaşma, haftanın çifti (n ≤ 30, ms düzeyi).
async function ensureTeam() {
  const ctx = dayContext();
  if (state.team && state.team.dateISO === ctx.dateISO) return state.team;
  const others = store.loadProfiles().list.filter((p) => p.id !== state.profile.id);
  const members = [{ id: state.profile.id, profile: state.profile, chart: state.chart }];
  for (const p of others) members.push({ id: p.id, profile: p, chart: await ensureChart(p) });
  const matrix = synastryMatrix(members);
  return {
    members, matrix, dateISO: ctx.dateISO,
    contagion: contagionList(members, ctx.jdNoon),
    weekPair: weekPair(matrix, ctx.dateISO),
    seed: hashSeed(`${state.profile.id}|${ctx.dateISO}`),
  };
}

function paint(html, page) {
  unmount();
  const root = document.getElementById('app');
  root.innerHTML = html;
  document.getElementById('tabs').innerHTML = tabBar(state.route);
  unmount = page ? page.mount(root, state, actions) : () => {};
  window.scrollTo(0, 0);
}

function paintForm(route) {
  state.forTeam = route === 'ekle' && Boolean(state.profile);
  state.editingProfile = route === 'onboarding' ? state.profile : null;
  paint(onboarding.render(state), onboarding);
}

async function renderRoute() {
  const token = ++renderSeq;
  takeShareHash();
  const { route, params } = parseHash();
  state.route = route; state.params = params;
  state.profile = store.getActiveProfile();
  if (FORM_ROUTES.includes(route) || !state.profile) { paintForm(route); return; }
  if (!['haritam', 'bugun', ...TEAM_ROUTES].includes(route)) { paint(comingSoon(PAGES[route]), null); return; }
  const [chart] = await Promise.all([state.chart ?? ensureChart(state.profile), ensureBank()]);
  if (token !== renderSeq) return;
  state.chart = chart;
  if (route === 'bugun') {
    state.daily = ensureDaily(state.profile);
    state.retro = ensureRetro(state.daily.ctx.jdNow);
    paint(bugun.render(state), bugun);
    return;
  }
  if (TEAM_ROUTES.includes(route)) {
    state.team = await ensureTeam();
    if (token !== renderSeq) return;
    if (route === 'ekip') state.daily = ensureDaily(state.profile); // kart için günün cümlesi
    paint(route === 'ekip' ? ekip.render(state) : kiyasla.render(state), route === 'ekip' ? ekip : kiyasla);
    return;
  }
  paint(haritam.render(state), haritam);
}

function showError(err) {
  document.getElementById('app').innerHTML = errorBox(err?.message ?? String(err));
}

async function loadCities() {
  const res = await fetch(CITIES_URL);
  if (!res.ok) throw new Error('İl listesi yüklenemedi');
  state.cities = await res.json();
}

window.addEventListener('hashchange', () => renderRoute().catch(showError));
window.addEventListener('unhandledrejection', (e) => showError(e.reason));
loadCities().then(() => renderRoute()).catch(showError);
