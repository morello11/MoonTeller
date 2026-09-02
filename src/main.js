// Başlangıç, hash router, tek state. Sayfa modülleri render(state) + mount(root, state, actions) → unmount.
import { SCHEMA_VERSION, BANK, BANK_URL, TRANSIT, RETRO, DAILY_REPEAT_DAYS } from './config.js';
import { localDateISO, localToUT, utParts } from './astro/time.js';
import { julianDayUT } from './astro/engine.js';
import { composeDaily } from './text/compose-daily.js';
import { retroIntervals, retroStatus, shadowFor } from './astro/retrograde.js';
import * as bugun from './ui/pages/bugun.js';
import { createBank } from './text/bank.js';
import { createStore, profileHash } from './store.js';
import { loadEngine, engineVersion } from './astro/engine.js';
import { natalChart } from './astro/chart.js';
import * as onboarding from './ui/pages/onboarding.js';
import * as haritam from './ui/pages/haritam.js';
import { tabBar, errorBox, comingSoon } from './ui/components.js';

const PAGES = { haritam: 'Haritam', bugun: 'Bugün', ofis: 'Ekip', kiyasla: 'Kıyasla', sor: 'Sor', ayarlar: 'Ayarlar', onboarding: 'Profil' };
const DEFAULT_ROUTE = 'haritam';
const CITIES_URL = 'data/cities-tr.json';

const store = createStore();
const state = {
  route: DEFAULT_ROUTE, profile: null, chart: null, settings: store.loadSettings(),
  cities: [], engineVersion: '', wheelAnimated: false, editingProfile: null, bank: null, reading: null,
  daily: null, retro: null,
};
let unmount = () => {};

const actions = {
  saveProfile(fields) {
    state.profile = store.saveProfile(fields);
    store.setActiveProfile(state.profile.id);
    state.chart = null;
    state.daily = null;
    state.wheelAnimated = false;
  },
  setSerh(open) { state.settings = store.saveSettings({ showSerh: open }); },
};

function currentRoute() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0];
  return PAGES[name] ? name : DEFAULT_ROUTE;
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

// Metin bankası: ilk Haritam açılışında bir kez, paralel.
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

// Bugün: yerel tarih başına bir kez hesaplanır ve cache'lenir (yenileyince değişmez, ertesi gün değişir).
function ensureDaily(profile) {
  const tz = profile.tz;
  const dateISO = localDateISO(new Date(), tz);
  const key = `${profile.id}:${dateISO}`;
  const dayStartJd = julianDayUT(localToUT(dateISO, '00:00', tz));
  const ctx = { tz, dateISO, jdNoon: julianDayUT(localToUT(dateISO, '12:00', tz)), jdNow: julianDayUT(utParts(new Date())), dayStartJd, dayEndJd: dayStartJd + 1, seed: 0 };
  let daily = store.cacheGet('daily', key);
  if (!daily) {
    const shown = (store.cacheGet('shown', profile.id) ?? []).filter((s) => daysBetween(s.date, dateISO) < DAILY_REPEAT_DAYS);
    daily = composeDaily(state.chart, state.bank, { dateISO, jdNoon: ctx.jdNoon, profileId: profile.id, recent: shown.flatMap((s) => s.texts) });
    store.cacheSet('daily', key, daily);
    store.cacheSet('shown', profile.id, [...shown, { date: dateISO, texts: daily.topThree.map((t) => t.text) }]);
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

function paint(html, page) {
  unmount();
  const root = document.getElementById('app');
  root.innerHTML = html;
  document.getElementById('tabs').innerHTML = tabBar(state.route);
  unmount = page ? page.mount(root, state, actions) : () => {};
  window.scrollTo(0, 0);
}

async function renderRoute() {
  state.route = currentRoute();
  state.profile = store.getActiveProfile();
  if (state.route === 'onboarding' || (!state.profile && state.route === 'haritam')) {
    state.editingProfile = state.route === 'onboarding' ? state.profile : null;
    paint(onboarding.render(state), onboarding);
    return;
  }
  if (!['haritam', 'bugun'].includes(state.route)) { paint(comingSoon(PAGES[state.route]), null); return; }
  const [chart] = await Promise.all([state.chart ?? ensureChart(state.profile), ensureBank()]);
  state.chart = chart;
  if (state.route === 'bugun') {
    state.daily = ensureDaily(state.profile);
    state.retro = ensureRetro(state.daily.ctx.jdNow);
    paint(bugun.render(state), bugun);
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
