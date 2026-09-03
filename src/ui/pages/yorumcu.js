// Yorumcu sekmesi: karakterin evi. İmza (ada dokun → seçim), dürüstlük cümlesi, tarih + ufuk çizgisi, bugünün yaprağı, bağlantılar.
import { LLM, HORIZON } from '../../config.js';
import { transitPoints } from '../../astro/transits.js';
import { workerConfigured } from '../../llm/client.js';
import { esc, emptyState } from '../components.js';
import { sealHtml, commentBar, voiceEntry } from '../commentary-html.js';
import { mountCommentary } from '../commentary.js';

const FULL_CIRCLE = 360;

// Bugünün gezegenleri gerçek ekliptik boylamıyla tek çizgi üstünde: sekmenin tek süsü, o da hesaptan.
function horizonLine(jdNoon) {
  const points = transitPoints(jdNoon).filter((p) => p.body !== 'moon');
  const { width, height, sunRadius, dotRadius } = HORIZON;
  const dots = points.map((p) => `<circle cx="${((p.lon % FULL_CIRCLE) / FULL_CIRCLE * width).toFixed(1)}" cy="${height / 2}" r="${p.body === 'sun' ? sunRadius : dotRadius}" fill="currentColor"><title>${esc(p.body)}</title></circle>`).join('');
  return `<svg class="ufuk" viewBox="0 0 ${width} ${height}" aria-hidden="true"><line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="currentColor" stroke-opacity=".35"/>${dots}</svg>`;
}

function dateHeading(dateISO, tz) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return { day: new Intl.DateTimeFormat('tr-TR', { timeZone: tz, day: 'numeric', month: 'long' }).format(date), week: new Intl.DateTimeFormat('tr-TR', { timeZone: tz, weekday: 'long' }).format(date) };
}

export function render(state) {
  const { bank, daily } = state;
  const v = voiceEntry(state);
  const head = `<section class="page-head"><h1>${esc(bank.copy('yorumcu_title'))}</h1></section>`;
  if (!workerConfigured()) return `<div id="yorumcu">${head}${emptyState(bank.copy('yorumcu_kapali_baslik'), bank.copy('yorumcu_kapali'))}</div>`;
  const { day, week } = dateHeading(daily.dateISO, daily.ctx.tz);
  return `<div id="yorumcu">${head}`
    + `<div class="sekme-bas">${sealHtml(state, 'buyuk')}<button type="button" class="imza buyuk" aria-label="${esc(bank.copy('yorumcu_imza_label', { name: v.name }))}"><span class="imza-ad">${esc(v.name)}</span></button></div>`
    + `<p class="muted imza-intro">${esc(v.intro)}</p><p class="durust">${esc(bank.copy('yorumcu_durust'))}</p>`
    + `<div class="tarih-satir"><span class="tarih">${esc(day)}</span><span class="gun muted">${esc(week)}</span></div>${horizonLine(daily.ctx.jdNoon)}`
    + commentBar(state, 'today', daily.dateISO, bank.copy('yorumcu_bar_today'))
    + `<a class="baglanti" href="#/ekip">${esc(bank.copy('yorumcu_link_ekip'))}</a><a class="baglanti" href="#/ekip">${esc(bank.copy('yorumcu_link_bulten'))}</a>`
    + `<p class="dip muted">${esc(bank.copy('yorumcu_dip', { max: LLM.voices.length }))}</p></div>`;
}

export function mount(root, state, actions) {
  return mountCommentary(root, state, actions);
}
