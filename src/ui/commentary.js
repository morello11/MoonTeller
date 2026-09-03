// Yorumcu davranışı: mühre dokun → yuvada takvim yaprağı; ada dokun → seçim sayfası; devamlar; Ne gördü?; hata ve sınır durumları.
// Sayfalar mount içinde mountCommentary(root, state, actions) çağırır; dönüş temizleyici.
import { LLM } from '../config.js';
import { esc } from './components.js';
import { leafShell, leafBody, followupButtons, pickerHtml, voiceEntry, voiceKey, sealHtml } from './commentary-html.js';

const REASON_COPY = { limited: 'yorumcu_limit', offline: 'yorumcu_mesgul', error: 'yorumcu_mesgul', no_url: 'yorumcu_kapali', too_big: 'yorumcu_mesgul' };
const timers = new WeakMap();
let pickerOpener = null; // seçim sayfasını açan düğme; kapanınca odak ona döner

const $ = (sel, el) => el.querySelector(sel);
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function clearTimers(leaf) {
  (timers.get(leaf) ?? []).forEach(clearTimeout);
  timers.set(leaf, []);
}

function setStamp(leaf, text, quiet) {
  const d = $('.damga', leaf);
  d.textContent = text;
  d.classList.toggle('sessiz', Boolean(quiet));
}

function setBusy(leaf, state) {
  const bank = state.bank;
  const v = voiceEntry(state);
  leaf.dataset.state = 'yaziyor';
  $('.durum', leaf).textContent = bank.copy('yorumcu_yaziyor');
  $('.yaprak-govde', leaf).setAttribute('aria-busy', 'true');
  $('.yaprak-govde', leaf).innerHTML = `<p class="sahne">(${esc(v.name)} ${esc(v.busy)}…)</p><p class="gitti">${esc(bank.copy('yorumcu_gitti', { sent: leaf.dataset.sent ?? '…' }))}</p>`;
  $('.kenar', leaf).innerHTML = '';
  setStamp(leaf, bank.copy('yorumcu_damga_yaziyor'), false);
  clearTimers(leaf);
  timers.set(leaf, LLM.waitHintsMs.map((ms, i) => setTimeout(() => { $('.durum', leaf).textContent = bank.copy(`yorumcu_bekle_${i + 1}`); }, ms)));
}

function setReady(leaf, state, result) {
  const bank = state.bank;
  clearTimers(leaf);
  leaf.dataset.state = 'hazir';
  $('.yaprak-govde', leaf).removeAttribute('aria-busy');
  leaf.dataset.sent = result.sent ?? leaf.dataset.sent ?? '';
  $('.durum', leaf).textContent = result.cached ? bank.copy('yorumcu_onbellek') : '';
  $('.yaprak-govde', leaf).innerHTML = leafBody(result.text);
  $('.kenar', leaf).innerHTML = followupButtons(state, Number(leaf.dataset.ek ?? 0));
  setStamp(leaf, bank.copy('yorumcu_damga_yazdi'), false);
  const at = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  const hidden = bank.copy(leaf.dataset.target.startsWith('pair') ? 'yorumcu_gizli_cift' : 'yorumcu_gizli'); // pair/pairaspect'te iki ad gider
  $('.gordu', leaf).innerHTML = [[bank.copy('yorumcu_gonderilen'), leaf.dataset.sent], [bank.copy('yorumcu_gonderilmeyen'), hidden], [bank.copy('yorumcu_yazildi'), at]]
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
}

// Hata satırının altındaki gri neden: zaman aşımı / Worker durum kodu ve mesajı / ağ hatası (teşhis için, dürüstlük için).
function failDetail(bank, detail) {
  if (!detail) return '';
  if (detail.name === 'timeout') return bank.copy('yorumcu_neden_zaman', { s: Math.round(detail.timeoutMs / 1000) });
  if (detail.status) return bank.copy('yorumcu_neden_http', { status: detail.status, message: detail.message || '—' });
  return bank.copy('yorumcu_neden_ag', { name: detail.name });
}

function setFailed(leaf, state, reason, detail = null) {
  const bank = state.bank;
  clearTimers(leaf);
  leaf.dataset.state = reason === 'limited' ? 'limit' : 'hata';
  $('.yaprak-govde', leaf).removeAttribute('aria-busy');
  $('.durum', leaf).textContent = reason === 'limited' ? bank.copy('yorumcu_sinir') : bank.copy('yorumcu_mesgul_kisa');
  const why = failDetail(bank, detail);
  $('.yaprak-govde', leaf).innerHTML = `<p class="sahne">(${esc(bank.copy(REASON_COPY[reason] ?? 'yorumcu_mesgul'))})</p>${why ? `<p class="gitti">${esc(why)}</p>` : ''}`;
  $('.kenar', leaf).innerHTML = reason === 'limited' || reason === 'no_url' ? '' : `<button type="button" data-tekrar>${esc(bank.copy('yorumcu_tekrar'))}</button>`;
  setStamp(leaf, bank.copy('yorumcu_damga_yazmadi'), true);
}

// Aynı yaprağa üst üste istek (ses değişti, tekrar dene): yalnızca son isteğin cevabı yazılır.
async function write(leaf, state, actions, followup = '') {
  const { target, focus } = leaf.dataset;
  const payload = leaf.dataset.payload ? JSON.parse(leaf.dataset.payload) : null;
  const seq = Number(leaf.dataset.seq ?? 0) + 1;
  leaf.dataset.seq = String(seq);
  setBusy(leaf, state);
  const result = await actions.comment(target, focus, { followup, data: payload });
  if (!leaf.isConnected || Number(leaf.dataset.seq) !== seq) return;
  if (result.sent) leaf.dataset.sent = result.sent;
  if (result.ok) setReady(leaf, state, result); else setFailed(leaf, state, result.reason, result.detail);
}

function triggerLabel(trigger) {
  return trigger.classList.contains('yorumlat') ? 'bar' : 'row';
}

function closeLeaf(leaf, root) {
  clearTimers(leaf);
  const key = `${leaf.dataset.target}:${leaf.dataset.focus}`;
  const trigger = root.querySelector(`.yorumlat[data-target="${leaf.dataset.target}"][data-focus="${leaf.dataset.focus}"], .eylem[data-target="${leaf.dataset.target}"][data-focus="${leaf.dataset.focus}"]`);
  leaf.remove();
  if (trigger) { trigger.hidden = false; trigger.setAttribute('aria-expanded', 'false'); trigger.focus({ preventScroll: true }); }
  return key;
}

function openLeaf(trigger, root, state, actions) {
  const { target, focus } = trigger.dataset;
  const slot = root.querySelector(`[data-yuva="${CSS.escape(`${target}:${focus}`)}"]`);
  if (!slot) return;
  const existing = $('.yaprak', slot);
  if (existing) { closeLeaf(existing, root); return; }
  slot.insertAdjacentHTML('beforeend', leafShell(state, target, focus, triggerLabel(trigger) === 'row'));
  const leaf = $('.yaprak', slot);
  if (trigger.dataset.payload) leaf.dataset.payload = trigger.dataset.payload;
  if (!reduceMotion()) leaf.classList.add('gel');
  trigger.setAttribute('aria-expanded', 'true');
  if (triggerLabel(trigger) === 'bar') trigger.hidden = true;
  if (!state.settings.commentHintSeen) { $('.imza', leaf).insertAdjacentHTML('beforeend', `<span class="imza-ipucu">${esc(state.bank.copy('yorumcu_degistir'))}</span>`); actions.saveSettings({ commentHintSeen: true }); }
  write(leaf, state, actions);
  leaf.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
  leaf.focus({ preventScroll: true });
}

function addFollowup(leaf, button, state, actions) {
  const used = Number(leaf.dataset.ek ?? 0);
  if (used >= LLM.followupMax) return;
  const label = button.textContent;
  button.remove();
  leaf.dataset.ek = String(used + 1);
  const block = document.createElement('div');
  block.className = 'ek yaziyor';
  block.innerHTML = `<div class="kalem"></div><span class="ek-etiket">${esc(label.toLocaleLowerCase('tr'))}</span>`;
  $('.yaprak-govde', leaf).appendChild(block);
  actions.comment(leaf.dataset.target, leaf.dataset.focus, { followup: button.dataset.devam, data: leaf.dataset.payload ? JSON.parse(leaf.dataset.payload) : null }).then((r) => {
    if (!block.isConnected) return;
    block.classList.remove('yaziyor');
    block.insertAdjacentHTML('beforeend', r.ok ? leafBody(r.text) : `<p class="sahne">(${esc(state.bank.copy(REASON_COPY[r.reason] ?? 'yorumcu_mesgul'))})</p>`);
    if (used + 1 >= LLM.followupMax) $('.kenar', leaf).innerHTML = '';
  });
}

// Ses değişince: mühür harfleri, bar adları, tanıtım satırı, açık yapraklar yeniden yazılır.
function applyVoice(root, state, actions) {
  const v = voiceEntry(state);
  root.querySelectorAll('.muhur').forEach((m) => { m.outerHTML = sealHtml(state, m.classList.contains('buyuk') ? 'buyuk' : m.classList.contains('orta') ? 'orta' : ''); });
  root.querySelectorAll('.bar-ad, .imza-ad, .yorumcu-ad').forEach((el) => { el.textContent = v.name; });
  root.querySelectorAll('.imza').forEach((el) => { el.setAttribute('aria-label', state.bank.copy('yorumcu_imza_label', { name: v.name })); });
  root.querySelectorAll('.imza-intro').forEach((el) => { el.textContent = v.intro; });
  root.querySelectorAll('.yaprak').forEach((leaf) => { leaf.dataset.ek = '0'; write(leaf, state, actions); });
}

function openPicker(root, state) {
  if ($('.secim', root)) return;
  pickerOpener = document.activeElement;
  root.insertAdjacentHTML('beforeend', pickerHtml(state));
  requestAnimationFrame(() => { $('.perde', root)?.classList.add('acik'); $('.secim', root)?.classList.add('acik'); });
  ($(`.ses[data-ses="${voiceKey(state)}"]`, root) ?? $('.ses', root))?.focus({ preventScroll: true });
}

function closePicker(root) {
  const perde = $('.perde', root); const secim = $('.secim', root);
  if (!secim) return;
  perde.classList.remove('acik'); secim.classList.remove('acik');
  const opener = pickerOpener; pickerOpener = null;
  setTimeout(() => { perde.remove(); secim.remove(); opener?.isConnected && opener.focus({ preventScroll: true }); }, reduceMotion() ? 0 : LLM.sheetMs);
}

// Sekme tuşu seçim sayfasının içinde döner (perdenin arkasındaki sayfaya geçmez).
function trapTab(e, secim) {
  const items = [...secim.querySelectorAll('button')];
  if (!items.length) return;
  const first = items[0]; const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!secim.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
}

function onClick(e, root, state, actions) {
  const t = e.target;
  const ses = t.closest('.ses');
  if (ses) { actions.setVoice(ses.dataset.ses); closePicker(root); applyVoice(root, state, actions); return; }
  if (t.closest('.vazgec') || t.classList.contains('perde')) { closePicker(root); return; }
  if (t.closest('.imza') || t.closest('[data-action="voice-picker"]')) { openPicker(root, state); return; }
  const kapat = t.closest('.yaprak-kapat'); if (kapat) { closeLeaf(kapat.closest('.yaprak'), root); return; }
  const negordu = t.closest('.negordu'); if (negordu) { const open = $('.gordu', negordu.closest('.yaprak')).classList.toggle('acik'); negordu.setAttribute('aria-expanded', String(open)); return; }
  const devam = t.closest('[data-devam]'); if (devam) { addFollowup(devam.closest('.yaprak'), devam, state, actions); return; }
  const tekrar = t.closest('[data-tekrar]'); if (tekrar) { write(tekrar.closest('.yaprak'), state, actions); return; }
  const trigger = t.closest('.yorumlat, .eylem'); if (trigger) openLeaf(trigger, root, state, actions);
}

export function mountCommentary(root, state, actions) {
  const handler = (e) => onClick(e, root, state, actions);
  const onKey = (e) => {
    if (e.key === 'Escape') closePicker(root);
    else if (e.key === 'Tab') { const secim = $('.secim', root); if (secim) trapTab(e, secim); }
  };
  root.addEventListener('click', handler);
  document.addEventListener('keydown', onKey);
  if (!state.settings.commentHintSeen) root.querySelector('.eylem')?.insertAdjacentHTML('beforeend', `<span class="ipucu">${esc(state.bank.copy('yorumcu_ipucu'))}</span>`);
  return () => { root.removeEventListener('click', handler); document.removeEventListener('keydown', onKey); root.querySelectorAll('.yaprak').forEach(clearTimers); pickerOpener = null; };
}
