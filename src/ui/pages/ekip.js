// Ekip sayfası: link paylaşımı, içe aktarma, sinastri matrisi, bugün kime bulaşma, haftanın çifti, kart, üyeler.
import { shareUrl } from '../../share.js';
import { esc, card, emptyState, commentatorName } from '../components.js';
import { makeCardBlob, shareBlob } from '../card.js';
import { workerConfigured } from '../../llm/client.js';
import { importCard, shareCard, matrixCard, contagionCard, weekPairCard, membersCard } from './ekip-cards.js';

const MIN_MEMBERS = 2;

function baseUrl() {
  return location.href.split('#')[0];
}

function cardCard(bank) {
  return card(bank.copy('ekip_card_title'), `<p class="muted">${esc(bank.copy('ekip_card_text'))}</p>`
    + `<p class="actions"><button type="button" class="button" data-action="card">${esc(bank.copy('ekip_card_button'))}</button></p>`
    + `<p id="card-status" class="muted small" hidden></p>`);
}

function bulletinCard(state) {
  const bank = state.bank;
  const body = workerConfigured()
    ? `<p class="actions"><button type="button" class="button" data-action="bulletin">${esc(bank.copy('ekip_bulletin_button'))}</button></p>`
      + `<p id="bulletin-status" class="muted" role="status" hidden></p><div id="bulletin-out" hidden><p class="answer" id="bulletin-text"></p>`
      + `<p class="actions"><button type="button" class="button secondary" data-action="bulletin-copy">${esc(bank.copy('ekip_bulletin_copy'))}</button></p></div>`
    : `<p class="muted">${esc(bank.copy('ekip_bulletin_closed'))}</p>`;
  const who = workerConfigured() ? `<p class="muted small">${esc(bank.copy('ekip_bulletin_by', { name: commentatorName(state) }))}</p>` : '';
  return card(bank.copy('ekip_bulletin_title'), `<p class="muted">${esc(bank.copy('ekip_bulletin_text'))}</p>${who}${body}`);
}

async function makeBulletin(root, state, actions) {
  const bank = state.bank;
  const status = root.querySelector('#bulletin-status');
  const out = root.querySelector('#bulletin-out');
  status.textContent = bank.copy('ekip_bulletin_busy'); status.hidden = false; out.hidden = true;
  const r = await actions.bulletin();
  if (!r.ok) { status.textContent = bank.copy(r.reason === 'limited' ? 'yorumcu_limit' : 'yorumcu_mesgul'); return; }
  status.hidden = true;
  root.querySelector('#bulletin-text').textContent = r.text;
  out.hidden = false;
}

export function render(state) {
  const { team, bank, profile } = state;
  const n = team.members.length;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  let html = `<div id="ekip" class="ekip ${state.settings.showSerh ? 'serh-on' : ''}"><section class="page-head"><h1>${esc(bank.copy('ekip_title'))} <span class="muted">${esc(bank.copy('ekip_count', { n }))}</span></h1></section>`;
  html += importCard(state);
  html += shareCard(shareUrl(baseUrl(), profile), canShare, bank);
  if (n < MIN_MEMBERS) {
    html += emptyState(bank.copy('empty_team_title'), bank.copy('empty_team_text'), `<p class="actions"><a class="button" href="#/ekle">${esc(bank.copy('ekip_add'))}</a></p>`);
  } else {
    html += matrixCard(team, bank) + contagionCard(team, bank) + weekPairCard(team, bank);
  }
  html += cardCard(bank) + bulletinCard(state) + membersCard(team, profile, bank);
  return `${html}<p class="muted small">${esc(bank.copy('disclaimer'))}</p></div>`;
}

function setStatus(root, text) {
  const el = root.querySelector('#card-status');
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
}

async function handleAction(btn, root, state, actions) {
  const { action, id, name } = btn.dataset;
  const bank = state.bank;
  const url = () => root.querySelector('#share-url').value;
  if (action === 'copy') { await navigator.clipboard.writeText(url()); btn.textContent = bank.copy('ekip_copied'); return; }
  if (action === 'share') { await navigator.share({ title: 'Yıldızname', url: url() }); return; }
  if (action === 'card') {
    setStatus(root, bank.copy('ekip_card_busy'));
    try { await shareBlob(await makeCardBlob(state), bank); } finally { setStatus(root, ''); }
    return;
  }
  if (action === 'bulletin') { await makeBulletin(root, state, actions); return; }
  if (action === 'bulletin-copy') { await navigator.clipboard.writeText(root.querySelector('#bulletin-text').textContent); btn.textContent = bank.copy('ekip_bulletin_copied'); return; }
  if (action === 'import-add') { actions.importPending(); await actions.refresh(); return; }
  if (action === 'import-cancel') { actions.dismissImport(); await actions.refresh(); return; }
  if (action === 'delete' && confirm(bank.copy('ekip_delete_confirm', { name }))) { actions.deleteProfile(id); await actions.refresh(); }
}

export function mount(root, state, actions) {
  const handler = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    handleAction(btn, root, state, actions).catch((err) => { if (err?.name !== 'AbortError') setStatus(root, err.message); });
  };
  root.addEventListener('click', handler);
  return () => root.removeEventListener('click', handler);
}
