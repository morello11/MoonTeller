// Onboarding: 3 alan, 40 saniye. Ad, doğum tarihi, saat ("bilmiyorum"), il; yurt dışı için enlem/boylam + IANA.
import { DEFAULT_TZ, SHARE } from '../../config.js';
import { esc } from '../components.js';

const MIN_DATE = '1900-01-01';

function field(label, inputHtml, hint = '') {
  return `<label class="field"><span>${esc(label)}</span>${inputHtml}${hint ? `<small class="muted">${esc(hint)}</small>` : ''}</label>`;
}

function cityOptions(cities) {
  return cities.map((c) => `<option value="${esc(c.name)}"></option>`).join('');
}

function tzOptions() {
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [DEFAULT_TZ];
  return zones.map((z) => `<option value="${esc(z)}"></option>`).join('');
}

function heading(state, p) {
  if (state.forTeam) return `<h1>Ekibe birini ekle</h1><p class="muted">Bilgiler yalnızca bu telefonda kalır.</p>`;
  const pending = state.pendingImport ? `<p class="notice">Önce kendi haritanı çıkar; sonra ${esc(state.pendingImport.name)} ekibe eklenir.</p>` : '';
  return `<h1>${p.id ? 'Profili düzenle' : 'Haritanı çıkar'}</h1><p class="muted">Üç alan yeter. Bilgiler yalnızca bu telefonda kalır.</p>${pending}`;
}

function submitLabel(state, p) {
  if (state.forTeam) return 'Ekibe ekle';
  return p.id ? 'Kaydet' : 'Haritamı çıkar';
}

export function render(state) {
  const p = state.editingProfile ?? {};
  const abroad = Boolean(p.tz && p.tz !== DEFAULT_TZ);
  const today = new Date().toISOString().slice(0, 10);
  const cancel = state.forTeam ? '#/ekip' : p.id ? '#/haritam' : null;
  return `<section class="page-head">${heading(state, p)}</section>`
    + `<form id="onboarding" class="form" novalidate>`
    + field('Adın', `<input name="name" type="text" required maxlength="${SHARE.nameMax}" autocomplete="given-name" value="${esc(p.name ?? '')}">`)
    + field('Doğum tarihi', `<input name="date" type="date" required min="${MIN_DATE}" max="${today}" value="${esc(p.date ?? '')}">`)
    + field('Doğum saati', `<input name="time" type="time" value="${esc(p.time ?? '')}"${p.id && !p.time ? ' disabled' : ''}>`, 'Nüfus cüzdanında ya da doğum belgesinde yazar.')
    + `<label class="check"><input name="unknownTime" type="checkbox"${p.id && !p.time ? ' checked' : ''}> Saatimi bilmiyorum</label>`
    + field('Doğum yeri (il)', `<input name="place" type="text" list="cities" autocomplete="off" value="${esc(abroad ? '' : p.place ?? '')}"${abroad ? ' disabled' : ''}>`
      + `<datalist id="cities">${cityOptions(state.cities)}</datalist>`)
    + `<label class="check"><input name="abroad" type="checkbox"${abroad ? ' checked' : ''}> Yurt dışında doğdum</label>`
    + `<div id="abroad-fields"${abroad ? '' : ' hidden'}>`
    + field('Yer adı', `<input name="placeAbroad" type="text" value="${esc(abroad ? p.place ?? '' : '')}">`)
    + field('Enlem', `<input name="lat" type="number" step="0.01" min="-90" max="90" value="${abroad ? esc(p.lat) : ''}">`, 'Kuzey +, güney −. Örn. 52.52')
    + field('Boylam', `<input name="lon" type="number" step="0.01" min="-180" max="180" value="${abroad ? esc(p.lon) : ''}">`, 'Doğu +, batı −. Örn. 13.40')
    + field('Saat dilimi (IANA)', `<input name="tz" type="text" list="tzs" value="${esc(abroad ? p.tz : '')}"><datalist id="tzs">${tzOptions()}</datalist>`, 'Örn. Europe/Berlin')
    + `</div>`
    + `<p class="form-error" id="form-error" role="alert" hidden></p>`
    + `<p class="actions"><button type="submit" class="button">${submitLabel(state, p)}</button>`
    + `${cancel ? `<a class="button secondary" href="${cancel}">Vazgeç</a>` : ''}</p></form>`;
}

function readForm(form, cities) {
  const data = Object.fromEntries(new FormData(form).entries());
  const unknownTime = form.elements.unknownTime.checked;
  const abroad = form.elements.abroad.checked;
  const fields = { name: data.name?.trim(), date: data.date, time: unknownTime ? null : data.time || null };
  if (!fields.name) throw new Error('Adını yaz; harita birine ait olmalı.');
  if (!fields.date) throw new Error('Doğum tarihi olmadan gökyüzü hesaplanamaz.');
  if (!unknownTime && !fields.time) throw new Error('Saat gir ya da "Saatimi bilmiyorum" işaretle. Saat yoksa evler ve Yükselen hesaplanmaz.');
  if (abroad) return { ...fields, ...abroadFields(data) };
  const city = cities.find((c) => c.name.localeCompare(data.place?.trim() ?? '', 'tr', { sensitivity: 'base' }) === 0);
  if (!city) throw new Error('İl listeden seçilmeli. Yurt dışında doğduysan alttaki kutuyu işaretle.');
  return { ...fields, place: city.name, lat: city.lat, lon: city.lon, tz: DEFAULT_TZ };
}

function abroadFields(data) {
  const lat = Number(data.lat);
  const lon = Number(data.lon);
  if (!data.lat || !data.lon || Number.isNaN(lat) || Number.isNaN(lon)) throw new Error('Yurt dışı için enlem ve boylam gerekli.');
  try { new Intl.DateTimeFormat('en-US', { timeZone: data.tz }); } catch { throw new Error('Saat dilimi IANA adıyla olmalı, örn. Europe/Berlin.'); }
  return { place: data.placeAbroad?.trim() || 'Yurt dışı', lat, lon, tz: data.tz };
}

export function mount(root, state, actions) {
  const form = root.querySelector('#onboarding');
  const error = root.querySelector('#form-error');
  form.elements.unknownTime.addEventListener('change', (e) => { form.elements.time.disabled = e.target.checked; });
  form.elements.abroad.addEventListener('change', (e) => {
    root.querySelector('#abroad-fields').hidden = !e.target.checked;
    form.elements.place.disabled = e.target.checked;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const fields = readForm(form, state.cities);
      let target = '#/ekip';
      if (state.forTeam) actions.saveTeamProfile(fields);
      else target = actions.saveProfile({ ...fields, id: state.editingProfile?.id, createdAt: state.editingProfile?.createdAt });
      error.hidden = true;
      if (location.hash === target) actions.refresh(); else location.hash = target; // hash aynıysa hashchange gelmez
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    }
  });
  return () => {};
}
