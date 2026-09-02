// Küçük ortak parçalar: HTML üreten saf fonksiyonlar.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TABS = [
  ['haritam', 'Haritam'], ['bugun', 'Bugün'], ['ofis', 'Ekip'], ['sor', 'Sor'], ['ayarlar', 'Ayarlar'],
];

export function tabBar(active) {
  const items = TABS.map(([route, label]) => {
    const current = route === active ? ' aria-current="page"' : '';
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
export function serhBox(rows, open = false) {
  const items = rows.map(([k, v]) => `<div class="serh-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  return `<details class="serh"${open ? ' open' : ''}><summary>Şüpheci Şerhi — gökyüzünde aslında ne var</summary><dl>${items}</dl></details>`;
}

export function emptyState(title, text, actionHtml = '') {
  return `<section class="empty"><h2>${esc(title)}</h2><p>${esc(text)}</p>${actionHtml}</section>`;
}

export function errorBox(message) {
  return `<section class="error" role="alert"><h2>Bir şey ters gitti</h2><p>${esc(message)}</p><p class="muted">Sayfayı yenile. Devam ederse profili silip yeniden gir.</p></section>`;
}

export function comingSoon(title) {
  return `<section class="page-head"><h1>${esc(title)}</h1></section>${emptyState('Yakında', 'Bu sekme sonraki adımda dolacak.')}`;
}
