// Başlangıç, hash router, tek state. Sayfa modülleri render(state) + mount(root, state, actions) → unmount.
import { SCHEMA_VERSION } from './config.js';
import { createStore, profileHash } from './store.js';
import { loadEngine, engineVersion } from './astro/engine.js';
import { natalChart } from './astro/chart.js';
import * as onboarding from './ui/pages/onboarding.js';
import * as haritam from './ui/pages/haritam.js';
import { tabBar, errorBox, comingSoon } from './ui/components.js';

const PAGES = { haritam: 'Haritam', bugun: 'Bugün', ofis: 'Ofis', kiyasla: 'Kıyasla', sor: 'Sor', ayarlar: 'Ayarlar', onboarding: 'Profil' };
const DEFAULT_ROUTE = 'haritam';
const CITIES_URL = 'data/cities-tr.json';

const store = createStore();
const state = {
  route: DEFAULT_ROUTE, profile: null, chart: null, settings: store.loadSettings(),
  cities: [], engineVersion: '', wheelAnimated: false, editingProfile: null,
};
let unmount = () => {};

const actions = {
  saveProfile(fields) {
    state.profile = store.saveProfile(fields);
    store.setActiveProfile(state.profile.id);
    state.chart = null;
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
  if (state.route !== 'haritam') { paint(comingSoon(PAGES[state.route]), null); return; }
  if (!state.chart) state.chart = await ensureChart(state.profile);
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
