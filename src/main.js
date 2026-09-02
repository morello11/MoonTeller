// Başlangıç ve hash router. Adım 0: sayfalar boş, sadece motor testi çalışır.
import { loadEngine, julianDayUT, computePosition, engineVersion } from './astro/engine.js';
import { utParts } from './astro/time.js';
import { signName, degreeInSign } from './astro/zodiac.js';

const PAGES = {
  haritam: 'Haritam', bugun: 'Bugün', ofis: 'Ofis',
  kiyasla: 'Kıyasla', sor: 'Sor', ayarlar: 'Ayarlar',
};
const DEFAULT_ROUTE = 'haritam';

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

function formatDegrees(value) {
  return value.toFixed(1).replace('.', ',');
}

async function runEngineTest(out) {
  out.textContent = 'Motor yükleniyor…';
  const started = performance.now();
  const swe = await loadEngine();
  const jd = julianDayUT(swe, utParts(new Date()));
  const moon = computePosition(swe, jd, 'moon');
  const elapsed = Math.round(performance.now() - started);
  out.textContent = `Ay: ${signName(moon.lon)} ${formatDegrees(degreeInSign(moon.lon))}°`
    + ` (${formatDegrees(moon.speed)}°/gün) · Swiss Ephemeris ${engineVersion(swe)} · ${elapsed} ms`;
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
