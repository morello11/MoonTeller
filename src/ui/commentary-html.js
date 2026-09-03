// Yorumcu parçaları: mühür, birincil bar, satır mührü, yuva, takvim yaprağı kabuğu, seçim sayfası. HTML üreten saf fonksiyonlar.
import { LLM } from '../config.js';
import { workerConfigured } from '../llm/client.js';
import { esc } from './components.js';

export function voiceKey(state) {
  return state.settings.voice ?? LLM.defaultVoice;
}

export function voiceEntry(state, key = voiceKey(state)) {
  return state.bank.get('voices', key) ?? { name: key, intro: '', sample: '', role: '', busy: '' };
}

export function voiceInitial(state, key = voiceKey(state)) {
  return voiceEntry(state, key).name.trim().charAt(0).toLocaleUpperCase('tr');
}

// size: '' | 'orta' | 'buyuk'
export function sealHtml(state, size = '', key = voiceKey(state)) {
  const cls = ['muhur', size, key === LLM.squareVoice ? 'sert' : ''].filter(Boolean).join(' ');
  return `<span class="${cls}" aria-hidden="true">${esc(voiceInitial(state, key))}</span>`;
}

const attrs = (target, focus) => `data-target="${esc(target)}" data-focus="${esc(focus)}"`;

// Ekran başına en çok bir tane: mühür + sabit etiket + seçili yorumcunun adı + ›. Yuva hemen altında. Worker ayarlı değilse boş.
export function commentBar(state, target, focus, label, payload = null) {
  if (!workerConfigured()) return '';
  const data = payload ? ` data-payload="${esc(JSON.stringify(payload))}"` : '';
  return `<div class="bar-yuva"><button type="button" class="yorumlat" ${attrs(target, focus)}${data} aria-expanded="false">`
    + `<span class="bar-muhur">${sealHtml(state, 'orta')}</span><span class="bar-orta"><span class="bar-etiket">${esc(label)}</span><span class="bar-ad">${esc(voiceEntry(state).name)}</span></span></button>`
    + `<div class="yuva" data-yuva="${esc(`${target}:${focus}`)}"></div></div>`;
}

// Satırın sağ kenarında 44×44 mühür hücresi; yuva satırın altına ayrıca konur (slotHtml).
export function sealButton(state, target, focus, ariaLabel) {
  return `<button type="button" class="eylem" ${attrs(target, focus)} aria-expanded="false" aria-label="${esc(ariaLabel)}">${sealHtml(state)}</button>`;
}

export function slotHtml(target, focus) {
  return `<div class="yuva" data-yuva="${esc(`${target}:${focus}`)}"></div>`;
}

// Satır + mühür ızgarası: rowHtml (details.reading ya da düz satır) sağda mühürle, altında yuva. Worker ayarlı değilse yalnız satır.
export function sealedRow(state, target, focus, ariaLabel, rowHtml) {
  if (!workerConfigured()) return rowHtml;
  return `<div class="zsatir">${rowHtml}${sealButton(state, target, focus, ariaLabel)}</div>${slotHtml(target, focus)}`;
}

// Yaprak kabuğu: başlık (mühür, ad, durum, kapat), kalem, gövde, devamlar, alt satır (Ne gördü? + damga), Ne gördü? listesi.
export function leafShell(state, target, focus, withNotch) {
  const v = voiceEntry(state);
  return `<div class="yaprak${withNotch ? ' centik' : ''}" data-state="yaziyor" data-target="${esc(target)}" data-focus="${esc(focus)}" tabindex="-1">`
    + `<div class="yaprak-bas">${sealHtml(state, 'orta')}<button type="button" class="imza" aria-label="${esc(state.bank.copy('yorumcu_imza_label', { name: v.name }))}"><span class="imza-ad">${esc(v.name)}</span></button>`
    + `<span class="durum"></span><button type="button" class="yaprak-kapat" aria-label="${esc(state.bank.copy('yorumcu_kapat'))}">×</button></div>`
    + `<div class="kalem"></div><div class="yaprak-govde" aria-live="polite"></div><div class="kenar"></div>`
    + `<div class="yaprak-alt"><button type="button" class="negordu" aria-expanded="false"><span class="i">i</span> ${esc(state.bank.copy('yorumcu_negordu'))}</button><span class="damga"></span></div><dl class="gordu"></dl></div>`;
}

// Metin → ilk cümle başlık gibi (Fraunces), gerisi paragraflar (Manrope).
export function leafBody(text) {
  const paragraphs = String(text).split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  if (!paragraphs.length) return '';
  const { min, max } = LLM.leadSentence;
  const m = paragraphs[0].match(new RegExp(`^(.{${min},${max}}?[.!?…])\\s+(?=[A-ZÇĞİÖŞÜ"“(])(.*)$`, 's')); // "2. ev" gibi kısaltmalarda bölme: sonraki cümle büyük harfle başlamalı
  const giris = m ? m[1] : paragraphs[0];
  const rest = m ? [m[2], ...paragraphs.slice(1)] : paragraphs.slice(1);
  return `<div class="metin"><p class="giris">${esc(giris)}</p>${rest.filter(Boolean).map((p) => `<p class="govde">${esc(p)}</p>`).join('')}</div>`;
}

export function followupButtons(state, used = 0) {
  if (used >= LLM.followupMax) return '';
  return LLM.followups.map((key) => `<button type="button" data-devam="${key}">${esc(state.bank.copy(`yorumcu_devam_${key}`))}</button>`).join('');
}

// Seçim sayfası: alıntı önce, ad sonra; dokun = seç. Şu anki ses işaretli.
export function pickerHtml(state) {
  const current = voiceKey(state);
  const bank = state.bank;
  const rows = LLM.voices.map((key) => {
    const v = voiceEntry(state, key);
    const label = `${v.name}, ${v.role}${key === current ? `, ${bank.copy('yorumcu_suan')}` : ''}`;
    return `<button type="button" class="ses${key === current ? ' suanki' : ''}" data-ses="${key}" aria-label="${esc(label)}"${key === current ? ' aria-current="true"' : ''}><span class="alinti">${esc(v.sample)}</span>`
      + `<span class="kim">${sealHtml(state, 'orta', key)}<span class="ad">${esc(v.name)}</span><span class="rol">${esc(v.role)}</span>${key === current ? `<span class="suan">${esc(bank.copy('yorumcu_suan'))}</span>` : ''}</span></button>`;
  }).join('');
  return `<div class="perde"></div><div class="secim" role="dialog" aria-modal="true" aria-label="${esc(bank.copy('yorumcu_secim_baslik'))}">`
    + `<div class="secim-bas"><h2>${esc(bank.copy('yorumcu_secim_baslik'))}</h2><button type="button" class="vazgec">${esc(bank.copy('yorumcu_vazgec'))}</button></div>`
    + `<p class="sahne-satir">${esc(bank.copy('yorumcu_secim_ornek'))}</p>${rows}<p class="dip">${esc(bank.copy('yorumcu_secim_dip', { name: voiceEntry(state, LLM.defaultVoice).name }))}</p></div>`;
}
