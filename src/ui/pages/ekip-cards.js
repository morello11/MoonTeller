// Ekip sayfası kartları: içe aktarma, link, matris, bulaşma, haftanın çifti, üyeler. HTML üreten saf fonksiyonlar.
import { SIGNS_TR, signIndex } from '../../astro/chart.js';
import { synastryLabel } from '../../astro/synastry.js';
import { pickVariant, hashSeed } from '../../text/bank.js';
import { BODY_GLYPHS, BODY_NAMES_TR, ASPECT_GLYPHS, ASPECT_NAMES_TR, SIGN_GLYPHS } from '../glyphs.js';
import { esc, card, stamp } from '../components.js';
import { barnumBadge } from './haritam-text.js';

const SHORT_NAME = 6;

// "☉ Akrep · ☽ Terazi · AC Aslan"
export function bigThreeLine(chart) {
  const sign = (body) => chart.positions.find((p) => p.body === body).sign;
  const parts = [`${BODY_GLYPHS.sun} ${SIGNS_TR[sign('sun')]}`, `${BODY_GLYPHS.moon} ${SIGNS_TR[sign('moon')]}`];
  if (chart.houses) parts.push(`${BODY_GLYPHS.asc} ${SIGNS_TR[signIndex(chart.houses.asc)]}`);
  return parts.map(esc).join(' · ');
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, n) => String(vars[n] ?? ''));
}

export function teamLine(bank, key, seed, vars = {}) {
  const entry = bank.get('team', key);
  if (!entry) return { text: '', barnum: null };
  return { text: fill(pickVariant(entry.v, seed), vars), barnum: entry.barnum };
}

export function importCard(state) {
  const bank = state.bank;
  if (state.pendingImport) {
    const name = state.pendingImport.name;
    return card(bank.copy('import_title', { name }), `<p>${esc(bank.copy('import_text'))}</p><p class="muted small">${esc(bigThreeText(state.pendingImport))}</p>`
      + `<p class="actions"><button type="button" class="button" data-action="import-add">${esc(bank.copy('import_add'))}</button>`
      + `<button type="button" class="button secondary" data-action="import-cancel">${esc(bank.copy('import_cancel'))}</button></p>`, 'role-card');
  }
  if (state.importError) {
    return card(bank.copy('ekip_title'), `<p class="form-error">${esc(bank.copy(state.importError.key, { name: state.importError.name ?? '' }))}</p>`
      + `<p class="actions"><button type="button" class="button secondary" data-action="import-cancel">${esc(bank.copy('import_cancel'))}</button></p>`);
  }
  return '';
}

function bigThreeText(fields) {
  return `${fields.date}${fields.time ? ` ${fields.time}` : ' (saat bilinmiyor)'} · ${fields.place || fields.tz}`;
}

export function shareCard(url, canShare, bank) {
  const share = canShare ? `<button type="button" class="button secondary" data-action="share">${esc(bank.copy('ekip_share_button'))}</button>` : '';
  return card(bank.copy('ekip_share_title'), `<p class="muted">${esc(bank.copy('ekip_share_text'))}</p>`
    + `<input id="share-url" class="share-url" type="text" readonly value="${esc(url)}" aria-label="Paylaşım linki">`
    + `<p class="actions"><button type="button" class="button" data-action="copy">${esc(bank.copy('ekip_copy'))}</button>${share}</p>`);
}

function shortName(name) {
  const first = name.trim().split(/\s+/)[0];
  return first.length > SHORT_NAME ? `${first.slice(0, SHORT_NAME)}.` : first;
}

export function matrixCard(team, bank) {
  const { members, matrix } = team;
  const head = members.map((m) => `<th scope="col"><abbr title="${esc(m.profile.name)}">${esc(shortName(m.profile.name))}</abbr></th>`).join('');
  const rows = members.map((a, i) => {
    const cells = members.map((b, j) => {
      if (i === j) return '<td class="self">·</td>';
      const score = matrix.cells[i][j];
      return `<td class="heat heat-${synastryLabel(score)}"><a href="#/kiyasla/${esc(a.id)}/${esc(b.id)}" aria-label="${esc(a.profile.name)} ve ${esc(b.profile.name)}: ${score}">${score}</a></td>`;
    }).join('');
    return `<tr><th scope="row"><abbr title="${esc(a.profile.name)}">${esc(shortName(a.profile.name))}</abbr></th>${cells}</tr>`;
  }).join('');
  return card(bank.copy('ekip_matrix_title'), `<p class="muted small">${esc(bank.copy('ekip_matrix_hint'))}</p>`
    + `<div class="table-wrap"><table class="matrix"><thead><tr><td></td>${head}</tr></thead><tbody>${rows}</tbody></table></div>`);
}

function contagionItem(entry, team, bank) {
  const member = team.members.find((m) => m.id === entry.id);
  const t = entry.top;
  const line = teamLine(bank, `contagion_${t.a}_${t.aspect}`, team.seed + hashSeed(entry.id), { name: member.profile.name });
  const title = `<strong class="member-name">${esc(member.profile.name)}</strong> <span class="glyph">${BODY_GLYPHS[t.a]}</span> <span class="asp hard">${ASPECT_GLYPHS[t.aspect]}</span> <span class="glyph">${BODY_GLYPHS[t.b]}</span>`
    + ` <span class="muted small">${esc(BODY_NAMES_TR[t.a])} ${esc(ASPECT_NAMES_TR[t.aspect])} ${esc(BODY_NAMES_TR[t.b])}</span>`;
  return `<li>${title}<br>${esc(line.text)} ${barnumBadge(line.barnum)}</li>`;
}

export function contagionCard(team, bank) {
  const items = team.contagion.map((e) => contagionItem(e, team, bank)).join('');
  const body = items ? `<ul class="contagion">${items}</ul>` : `<p class="muted">${esc(bank.copy('ekip_contagion_none'))}</p>`;
  return card(bank.copy('ekip_contagion_title'), body);
}

export function weekPairCard(team, bank) {
  const p = team.weekPair;
  if (!p) return '';
  const a = team.members.find((m) => m.id === p.a).profile.name;
  const b = team.members.find((m) => m.id === p.b).profile.name;
  const line = teamLine(bank, 'week_pair', hashSeed(p.week), { a, b });
  return card(bank.copy('ekip_week_title'), `<p class="pair-line"><a href="#/kiyasla/${esc(p.a)}/${esc(p.b)}"><strong>${esc(a)} &amp; ${esc(b)}</strong></a> <span class="num muted">${p.score}</span></p>`
    + `<p>${esc(line.text)}</p>${barnumBadge(line.barnum)}`);
}

export function membersCard(team, profile, bank) {
  const rows = team.members.map((m) => {
    const me = m.id === profile.id;
    const action = me ? stamp(bank.copy('ekip_me')) : `<button type="button" class="button secondary" data-action="delete" data-id="${esc(m.id)}" data-name="${esc(m.profile.name)}">${esc(bank.copy('ekip_delete'))}</button>`;
    return `<li class="member-row"><span><span class="member-name">${esc(m.profile.name)}</span><br><span class="muted small">${bigThreeLine(m.chart)}${m.chart.timeKnown ? '' : ' · saat yok'}</span></span>${action}</li>`;
  }).join('');
  return card(bank.copy('ekip_members_title'), `<ul class="members">${rows}</ul><p class="actions"><a class="button secondary" href="#/ekle">${esc(bank.copy('ekip_add'))}</a></p>`);
}

