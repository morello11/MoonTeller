// Ekip sayfası: link paylaşımı, içe aktarma, sinastri matrisi, bugün kime bulaşma, haftanın çifti, kart, üyeler.
import { shareUrl } from '../../share.js';
import { esc, card, emptyState } from '../components.js';
import { makeCardBlob, shareBlob } from '../card.js';
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
  html += cardCard(bank) + membersCard(team, profile, bank);
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
