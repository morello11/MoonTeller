// Ayarlar: yorumcu (ada dokun → seçim), ev sistemi, Şerh varsayılanı, verileri sil.
import { HOUSE_SYSTEMS, LLM } from '../../config.js';
import { workerConfigured } from '../../llm/client.js';
import { esc, card } from '../components.js';
import { sealHtml, voiceEntry } from '../commentary-html.js';
import { mountCommentary } from '../commentary.js';

const HOUSE_LABELS = { P: 'Placidus', W: 'Whole Sign', O: 'Porphyry' };

function field(label, inputHtml, hint = '') {
  return `<label class="field"><span>${esc(label)}</span>${inputHtml}${hint ? `<small class="muted">${esc(hint)}</small>` : ''}</label>`;
}

function check(name, label, checked) {
  return `<label class="check"><input name="${name}" type="checkbox"${checked ? ' checked' : ''}> ${esc(label)}</label>`;
}

function voiceCard(state, bank) {
  const worker = workerConfigured() ? bank.copy('ayarlar_worker_on', { url: LLM.workerUrl }) : bank.copy('ayarlar_worker_off');
  const v = voiceEntry(state);
  return `<div class="sekme-bas yorumcu-satir">${sealHtml(state, 'orta')}<button type="button" class="imza" data-action="voice-picker" aria-label="${esc(bank.copy('yorumcu_imza_label', { name: v.name }))}">`
    + `<span class="imza-ad">${esc(v.name)}</span><span class="imza-ipucu">${esc(bank.copy('yorumcu_degistir'))}</span></button></div>`
    + `<p class="muted small">${esc(bank.copy('ayarlar_voice_hint'))}</p><p class="muted small">${esc(worker)}</p>`;
}

function chartForm(state, bank) {
  const current = state.profile?.houseSystem ?? 'P';
  const options = HOUSE_SYSTEMS.map((h) => `<option value="${h}"${h === current ? ' selected' : ''}>${esc(HOUSE_LABELS[h])}</option>`).join('');
  return field(bank.copy('ayarlar_house'), `<select name="houseSystem">${options}</select>`, bank.copy('ayarlar_house_hint'))
    + check('showSerh', bank.copy('ayarlar_serh'), Boolean(state.settings.showSerh));
}

export function render(state) {
  const { bank } = state;
  return `<div id="ayarlar"><section class="page-head"><h1>${esc(bank.copy('ayarlar_title'))}</h1></section>`
    + card(bank.copy('ayarlar_voice_title'), voiceCard(state, bank))
    + `<form id="ayarlar-form" class="form">${card('Harita', chartForm(state, bank))}`
    + `<p class="actions"><button type="submit" class="button">${esc(bank.copy('ayarlar_save'))}</button><span id="ayarlar-status" class="muted" role="status"></span></p></form>`
    + card('Veriler', `<p class="actions"><button type="button" class="button secondary danger" data-action="clear">${esc(bank.copy('ayarlar_clear'))}</button></p>`)
    + `<p class="muted small">Yıldızname · motor ${esc(state.engineVersion || '')}</p></div>`;
}

export function mount(root, state, actions) {
  const form = root.querySelector('#ayarlar-form');
  const bank = state.bank;
  const unmountCommentary = mountCommentary(root, state, actions);
  const onSubmit = (e) => {
    e.preventDefault();
    actions.saveSettings({ showSerh: form.elements.showSerh.checked });
    if (form.elements.houseSystem.value !== state.profile.houseSystem) actions.setHouseSystem(form.elements.houseSystem.value);
    root.querySelector('#ayarlar-status').textContent = bank.copy('ayarlar_saved');
  };
  const onClear = (e) => {
    if (!e.target.closest('[data-action=clear]') || !confirm(bank.copy('ayarlar_clear_confirm'))) return;
    actions.clearAll();
    location.hash = '#/haritam';
    actions.refresh();
  };
  form.addEventListener('submit', onSubmit);
  root.addEventListener('click', onClear);
  return () => { form.removeEventListener('submit', onSubmit); root.removeEventListener('click', onClear); unmountCommentary(); };
}
