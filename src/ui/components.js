// Küçük ortak parçalar: HTML üreten saf fonksiyonlar.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TABS = [
  ['haritam', 'Haritam'], ['bugun', 'Bugün'], ['ekip', 'Ekip'], ['sor', 'Sor'], ['ayarlar', 'Ayarlar'],
];

const TAB_ALIASES = { kiyasla: 'ekip', ekle: 'ekip', onboarding: 'haritam' };

export function tabBar(active) {
  const activeTab = TAB_ALIASES[active] ?? active;
  const items = TABS.map(([route, label]) => {
    const current = route === activeTab ? ' aria-current="page"' : '';
    return `<a href="#/${route}"${current}>${label}</a>`;
  });
  return `<nav class="tabbar" aria-label="Sekmeler">${items.join('')}</nav>`;
}

export function stamp(text) {
  return `<span class="stamp">${esc(text)}</span>`;
}

export function card(title, body, className = '') {
  return `<section class="card ${className}"><h2>${esc(title)}</h2>${body}</section>`;
}

// Şüpheci Şerhi: kapalıyken tek satır, açılınca ham veri.
export function serhBox(rows, open = false, summary = 'Şüpheci Şerhi — gökyüzünde aslında ne var', hint = '') {
  const items = rows.map(([k, v]) => `<div class="serh-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const hintHtml = hint ? `<p class="muted small">${esc(hint)}</p>` : '';
  return `<details class="serh"${open ? ' open' : ''}><summary><span class="info-mark" aria-hidden="true">i</span> ${esc(summary)}</summary>${hintHtml}<dl>${items}</dl></details>`;
}

// Seçili yorumcunun adı (Ayarlar'daki 'voice'); banka yoksa anahtarın kendisi.
export function commentatorName(state) {
  const key = state.settings.voice;
  return state.bank.get('voices', key)?.name ?? key ?? '';
}

export function emptyState(title, text, actionHtml = '') {
  return `<section class="empty"><h2>${esc(title)}</h2><p>${esc(text)}</p>${actionHtml}</section>`;
}

export function errorBox(message) {
  return `<section class="error" role="alert"><h2>Bir şey ters gitti</h2><p>${esc(message)}</p><p class="muted">Sayfayı yenile. Devam ederse profili silip yeniden gir.</p></section>`;
}
