// Başlangıç ve hash router. Adım 0: sayfalar boş, sadece motor testi çalışır.
import { loadEngine, julianDayUT, computePositions, engineVersion } from './astro/engine.js';

const PAGES = {
  haritam: 'Haritam', bugun: 'Bugün', ofis: 'Ofis',
  kiyasla: 'Kıyasla', sor: 'Sor', ayarlar: 'Ayarlar',
};
const DEFAULT_ROUTE = 'haritam';
const MINUTES_PER_HOUR = 60;

function currentRoute() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0];
  return PAGES[name] ? name : DEFAULT_ROUTE;
}

function render() {
  const route = currentRoute();
  document.getElementById('app').innerHTML = `<h1>${PAGES[route]}</h1><p class="muted">Yakında.</p>`;
  for (const link of document.querySelectorAll('#tabs a')) {
    link.classList.toggle('active', link.getAttribute('href') === `#/${route}`);
  }
}

// Şu anın UT parçaları. Yerel doğum saati → UT dönüşümü Adım 1'de src/astro/time.js'e gelir.
function utNow() {
  const now = new Date();
  return {
    year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate(),
    utHours: now.getUTCHours() + now.getUTCMinutes() / MINUTES_PER_HOUR,
  };
}

function formatDegrees(value) {
  return `${value.toFixed(2).replace('.', ',')}°`;
}

async function runEngineTest(out) {
  out.textContent = 'Motor yükleniyor…';
  const started = performance.now();
  await loadEngine();
  const [sun, moon] = computePositions(julianDayUT(utNow()), ['sun', 'moon']);
  const elapsed = Math.round(performance.now() - started);
  out.textContent = `Güneş ${formatDegrees(sun.lon)} · Ay ${formatDegrees(moon.lon)}`
    + ` · Swiss Ephemeris ${engineVersion()} · ${elapsed} ms`;
}

function initEngineTest() {
  const out = document.getElementById('engine-test-out');
  document.getElementById('engine-test-btn').addEventListener('click', () => {
    runEngineTest(out).catch((err) => { out.textContent = `Hata: ${err.message}`; });
  });
}

window.addEventListener('hashchange', render);
render();
initEngineTest();
