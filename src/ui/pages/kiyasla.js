// Kıyasla: iki üyenin sinastri skoru, en güçlü üç aspekt, Büyük Üçlü yan yana, Şerh.
import { SIGNS_TR, signIndex } from '../../astro/chart.js';
import { synastryScore, topAspects } from '../../astro/synastry.js';
import { hashSeed } from '../../text/bank.js';
import { BODY_GLYPHS, BODY_NAMES_TR, ASPECT_GLYPHS, ASPECT_NAMES_TR, HARD_ASPECTS, SIGN_GLYPHS } from '../glyphs.js';
import { esc, card, serhBox, emptyState } from '../components.js';
import { barnumBadge } from './haritam-text.js';
import { teamLine } from './ekip-cards.js';

const BIG_THREE = ['sun', 'moon', 'asc'];

function backLink(bank) {
  return `<p class="actions"><a class="button secondary" href="#/ekip">${esc(bank.copy('kiyasla_back'))}</a></p>`;
}

function aspectText(x, a, b, bank) {
  const entry = bank.get('aspects', x.key);
  if (entry?.synastry) return { text: entry.synastry, barnum: entry.barnum };
  if (x.a === x.b) return teamLine(bank, 'same_point', hashSeed(x.key), { body: BODY_NAMES_TR[x.a] });
  return { text: bank.copy('synastry_generic', { a: `${a.profile.name} ${BODY_NAMES_TR[x.a]}`, b: `${b.profile.name} ${BODY_NAMES_TR[x.b]}`, aspect: ASPECT_NAMES_TR[x.aspect] }), barnum: null };
}

function topCard(top, a, b, bank) {
  const items = top.map((x, i) => {
    const cls = HARD_ASPECTS.includes(x.aspect) ? 'hard' : 'soft';
    const title = `${i + 1}. ${esc(a.profile.name)} · <span class="glyph">${BODY_GLYPHS[x.a]}</span> ${esc(BODY_NAMES_TR[x.a])} <span class="asp ${cls}">${ASPECT_GLYPHS[x.aspect]}</span> `
      + `${esc(b.profile.name)} · <span class="glyph">${BODY_GLYPHS[x.b]}</span> ${esc(BODY_NAMES_TR[x.b])} <span class="muted num">orb ${x.orb.toFixed(1)}°</span>`;
    const t = aspectText(x, a, b, bank);
    return `<section class="reading"><h3>${title}</h3><p>${esc(t.text)}</p>${barnumBadge(t.barnum)}</section>`;
  }).join('');
  return card(bank.copy('kiyasla_top_title'), items || `<p class="muted">${esc(bank.copy('reading_missing'))}</p>`);
}

function signCell(chart, body) {
  const sign = body === 'asc' ? (chart.houses ? signIndex(chart.houses.asc) : null) : chart.positions.find((p) => p.body === body).sign;
  return sign === null ? '<span class="muted">—</span>' : `<span class="glyph">${SIGN_GLYPHS[sign]}</span> ${esc(SIGNS_TR[sign])}`;
}

function bigThreeCard(a, b, bank) {
  const rows = BIG_THREE.map((body) => `<tr><th scope="row"><span class="glyph">${BODY_GLYPHS[body]}</span> ${esc(BODY_NAMES_TR[body])}</th><td>${signCell(a.chart, body)}</td><td>${signCell(b.chart, body)}</td></tr>`).join('');
  return card(bank.copy('kiyasla_big3_title'), `<div class="table-wrap"><table class="big3-table"><thead><tr><td></td><th scope="col">${esc(a.profile.name)}</th><th scope="col">${esc(b.profile.name)}</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function serhRows(r, a, b) {
  const rows = [['Aspekt payı (%70)', r.aspectPart.toFixed(1)], ['Büyük Üçlü payı (%30)', r.fitPart.toFixed(1)], ['Aspekt sayısı', String(r.aspects.length)]];
  for (const x of r.aspects) {
    rows.push([`${a.profile.name} ${BODY_NAMES_TR[x.a]} ${ASPECT_NAMES_TR[x.aspect]} ${b.profile.name} ${BODY_NAMES_TR[x.b]}`, `orb ${x.orb.toFixed(2)}°, katkı ${x.contribution >= 0 ? '+' : ''}${x.contribution.toFixed(2)}`]);
  }
  return rows;
}

export function render(state) {
  const { team, bank } = state;
  const [idA, idB] = state.params;
  const a = team.members.find((m) => m.id === idA);
  const b = team.members.find((m) => m.id === idB);
  const head = `<section class="page-head"><h1>${esc(bank.copy('kiyasla_title'))}</h1></section>`;
  if (!a || !b || a === b) return `<div id="kiyasla">${head}${emptyState(bank.copy('kiyasla_missing'), '', backLink(bank))}</div>`;
  const r = synastryScore(a.chart, b.chart);
  const top = topAspects(r.aspects, (key) => Boolean(bank.get('aspects', key)?.synastry));
  const label = teamLine(bank, `synastry_label_${r.label}`, hashSeed(`${a.id}|${b.id}`));
  const score = `<div class="plan-score score-${r.label}"><span class="score-num">${r.score}</span><span class="score-verdict">${esc(a.profile.name)} &amp; ${esc(b.profile.name)}</span></div>`
    + `<p class="hook">${esc(label.text)}</p>${barnumBadge(label.barnum)}`;
  return `<div id="kiyasla" class="${state.settings.showSerh ? 'serh-on' : ''}">${head}${card('Uyum', score)}${topCard(top, a, b, bank)}${bigThreeCard(a, b, bank)}`
    + serhBox(serhRows(r, a, b), state.settings.showSerh, bank.copy('kiyasla_serh_title'), bank.copy('serh_hint'))
    + `<p class="muted small">${esc(bank.copy('disclaimer'))}</p>${backLink(bank)}</div>`;
}

export function mount(root, state, actions) {
  root.querySelector('.serh')?.addEventListener('toggle', (e) => {
    actions.setSerh(e.target.open);
    root.querySelector('#kiyasla').classList.toggle('serh-on', e.target.open);
  });
  return () => {};
}
