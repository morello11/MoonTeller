// Başlangıç ve hash router. Adım 0: sayfalar boş, sadece motor testi çalışır.
import { loadEngine, computePositions, engineVersion } from './astro/engine.js';

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

// Şu anın Julian Day'i (UT). Yerel saat → UT dönüşümü Adım 1'de src/astro/time.js'e taşınır.
function julianDayNow(swe) {
  const now = new Date();
  const utHours = now.getUTCHours() + now.getUTCMinutes() / MINUTES_PER_HOUR;
  return swe.julday(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), utHours);
}

async function runEngineTest(out) {
  out.textContent = 'Motor yükleniyor…';
  const started = performance.now();
  const swe = await loadEngine();
  const [sun] = computePositions(swe, julianDayNow(swe), ['sun']);
  const elapsed = Math.round(performance.now() - started);
  out.textContent = `Güneş boylamı: ${sun.lon.toFixed(2).replace('.', ',')}°`
    + ` · Swiss Ephemeris ${engineVersion(swe)} · ${elapsed} ms`;
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
