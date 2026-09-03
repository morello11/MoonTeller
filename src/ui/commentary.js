// Yorumcu davranışı: mühre dokun → yuvada takvim yaprağı; ada dokun → seçim sayfası; devamlar; Ne gördü?; hata ve sınır durumları.
// Sayfalar mount içinde mountCommentary(root, state, actions) çağırır; dönüş temizleyici.
import { LLM } from '../config.js';
import { esc } from './components.js';
import { leafShell, leafBody, followupButtons, pickerHtml, voiceEntry, voiceInitial, voiceKey, sealHtml } from './commentary-html.js';

const REASON_COPY = { limited: 'yorumcu_limit', offline: 'yorumcu_mesgul', error: 'yorumcu_mesgul', no_url: 'yorumcu_kapali', too_big: 'yorumcu_mesgul' };
const timers = new WeakMap();

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
  $('.yaprak-govde', leaf).innerHTML = `<p class="sahne">(${esc(v.name)} ${esc(v.busy)}…)</p><p class="gitti">${esc(bank.copy('yorumcu_gitti', { sent: leaf.dataset.sent ?? '…' }))}</p>`;
  $('.kenar', leaf).innerHTML = '';
  setStamp(leaf, bank.copy('yorumcu_damga_yaziyor'), false);
  clearTimers(leaf);
  timers.set(leaf, LLM.waitHintsMs.map(([ms, text]) => setTimeout(() => { $('.durum', leaf).textContent = text; }, ms)));
}

function setReady(leaf, state, result) {
  const bank = state.bank;
  clearTimers(leaf);
  leaf.dataset.state = 'hazir';
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

function setFailed(leaf, state, reason) {
  const bank = state.bank;
  clearTimers(leaf);
  leaf.dataset.state = reason === 'limited' ? 'limit' : 'hata';
  $('.durum', leaf).textContent = reason === 'limited' ? bank.copy('yorumcu_sinir') : bank.copy('yorumcu_mesgul_kisa');
  $('.yaprak-govde', leaf).innerHTML = `<p class="sahne">(${esc(bank.copy(REASON_COPY[reason] ?? 'yorumcu_mesgul'))})</p>`;
  $('.kenar', leaf).innerHTML = reason === 'limited' || reason === 'no_url' ? '' : `<button type="button" data-tekrar>${esc(bank.copy('yorumcu_tekrar'))}</button>`;
  setStamp(leaf, bank.copy('yorumcu_damga_yazmadi'), true);
}

async function write(leaf, state, actions, followup = '') {
  const { target, focus } = leaf.dataset;
  const payload = leaf.dataset.payload ? JSON.parse(leaf.dataset.payload) : null;
  setBusy(leaf, state);
  const result = await actions.comment(target, focus, { followup, data: payload });
  if (!leaf.isConnected) return;
  if (result.sent) leaf.dataset.sent = result.sent;
  if (result.ok) setReady(leaf, state, result); else setFailed(leaf, state, result.reason);
}

function triggerLabel(trigger) {
  return trigger.classList.contains('yorumlat') ? 'bar' : 'row';
}

function closeLeaf(leaf, root) {
  clearTimers(leaf);
  const key = `${leaf.dataset.target}:${leaf.dataset.focus}`;
  const trigger = root.querySelector(`.yorumlat[data-target="${leaf.dataset.target}"][data-focus="${leaf.dataset.focus}"], .eylem[data-target="${leaf.dataset.target}"][data-focus="${leaf.dataset.focus}"]`);
  leaf.remove();
  if (trigger) { trigger.hidden = false; trigger.setAttribute('aria-expanded', 'false'); trigger.closest('.zsatir')?.removeAttribute('aria-busy'); }
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
  if (triggerLabel(trigger) === 'bar') trigger.hidden = true; else trigger.closest('.zsatir')?.setAttribute('aria-busy', 'true');
  if (!state.settings.yorumcuIpucu) { $('.imza', leaf).insertAdjacentHTML('beforeend', `<span class="imza-ipucu">${esc(state.bank.copy('yorumcu_degistir'))}</span>`); actions.saveSettings({ yorumcuIpucu: true }); }
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

// Ses değişince: mühür harfleri, bar adları, açık yapraklar yeniden yazılır.
function applyVoice(root, state, actions) {
  const name = voiceEntry(state).name;
  root.querySelectorAll('.muhur').forEach((m) => { m.textContent = voiceInitial(state); m.classList.toggle('sert', voiceKey(state) === 'sert'); });
  root.querySelectorAll('.bar-ad, .imza-ad, .yorumcu-ad').forEach((el) => { el.textContent = name; });
  root.querySelectorAll('.yaprak').forEach((leaf) => { leaf.dataset.ek = '0'; write(leaf, state, actions); });
}

function openPicker(root, state) {
  if ($('.secim', root)) return;
  root.insertAdjacentHTML('beforeend', pickerHtml(state));
  requestAnimationFrame(() => { $('.perde', root)?.classList.add('acik'); $('.secim', root)?.classList.add('acik'); });
  ($(`.ses[data-ses="${voiceKey(state)}"]`, root) ?? $('.ses', root))?.focus({ preventScroll: true });
}

function closePicker(root) {
  const perde = $('.perde', root); const secim = $('.secim', root);
  if (!secim) return;
  perde.classList.remove('acik'); secim.classList.remove('acik');
  setTimeout(() => { perde.remove(); secim.remove(); }, reduceMotion() ? 0 : 160);
}

function onClick(e, root, state, actions) {
  const t = e.target;
  const ses = t.closest('.ses');
  if (ses) { actions.setVoice(ses.dataset.ses); closePicker(root); applyVoice(root, state, actions); return; }
  if (t.closest('.vazgec') || t.classList.contains('perde')) { closePicker(root); return; }
  if (t.closest('.imza') || t.closest('[data-action="voice-picker"]')) { openPicker(root, state); return; }
  const kapat = t.closest('.yaprak-kapat'); if (kapat) { closeLeaf(kapat.closest('.yaprak'), root); return; }
  const negordu = t.closest('.negordu'); if (negordu) { $('.gordu', negordu.closest('.yaprak')).classList.toggle('acik'); return; }
  const devam = t.closest('[data-devam]'); if (devam) { addFollowup(devam.closest('.yaprak'), devam, state, actions); return; }
  const tekrar = t.closest('[data-tekrar]'); if (tekrar) { write(tekrar.closest('.yaprak'), state, actions); return; }
  const trigger = t.closest('.yorumlat, .eylem'); if (trigger) openLeaf(trigger, root, state, actions);
}

export function mountCommentary(root, state, actions) {
  const handler = (e) => onClick(e, root, state, actions);
  const onKey = (e) => { if (e.key === 'Escape') closePicker(root); };
  root.addEventListener('click', handler);
  document.addEventListener('keydown', onKey);
  if (!state.settings.yorumcuIpucu) root.querySelector('.eylem')?.insertAdjacentHTML('beforeend', `<span class="ipucu">${esc(state.bank.copy('yorumcu_ipucu'))}</span>`);
  return () => { root.removeEventListener('click', handler); document.removeEventListener('keydown', onKey); root.querySelectorAll('.yaprak').forEach(clearTimers); };
}

export { sealHtml };
