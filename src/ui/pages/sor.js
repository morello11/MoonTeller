// Sor: soru + harita özeti → Worker → cevap. Worker yoksa kapalı; hata nedenleri bankadaki metinlerle.
import { LLM } from '../../config.js';
import { workerConfigured } from '../../llm/client.js';
import { dailySummary } from '../../llm/summary.js';
import { esc, card, serhBox, emptyState } from '../components.js';

const REASON_COPY = { no_pin: 'sor_no_pin', unauthorized: 'sor_unauthorized', limited: 'sor_limited', offline: 'sor_offline', error: 'sor_error', too_big: 'sor_too_big', no_url: 'sor_closed_text' };

function serhRows(summary, bank) {
  const rows = [
    ['Yerleşimler', summary.placements.map((p) => `${p.body} ${p.sign}${p.house ? ` ${p.house}. ev` : ''}`).join('; ')],
    ['Yükselen', summary.asc ?? 'yok (saat bilinmiyor)'],
    ['Aspektler', summary.aspects.map((a) => `${a.a} ${a.aspect} ${a.b} (${a.orb}°)`).join('; ')],
    ['Bugün', `${summary.daily.date}: Ay ${summary.daily.moon.sign}, ${summary.daily.moon.phase}; ${summary.daily.transits.map((t) => `${t.a} ${t.aspect} ${t.b}`).join('; ')}`],
    ['Gönderilmeyen', bank.copy('sor_not_sent')],
  ];
  return rows;
}

function form(bank) {
  return `<form id="sor-form" class="form"><label class="field"><span>${esc(bank.copy('sor_hint'))}</span>`
    + `<textarea name="question" rows="3" maxlength="${LLM.questionMax}" placeholder="${esc(bank.copy('sor_placeholder'))}" required></textarea>`
    + `<small class="muted num" id="sor-counter">${esc(bank.copy('sor_counter', { n: 0, max: LLM.questionMax }))}</small></label>`
    + `<p class="actions"><button type="submit" class="button">${esc(bank.copy('sor_button'))}</button></p></form>`
    + `<p id="sor-status" class="muted" role="status" hidden></p><div id="sor-answer" hidden></div>`;
}

export function render(state) {
  const { bank } = state;
  const head = `<section class="page-head"><h1>${esc(bank.copy('sor_title'))}</h1></section>`;
  if (!workerConfigured()) return `<div id="sor">${head}${emptyState(bank.copy('sor_closed_title'), bank.copy('sor_closed_text'))}</div>`;
  const summary = dailySummary(state.chart, state.daily);
  return `<div id="sor" class="${state.settings.showSerh ? 'serh-on' : ''}">${head}${card(bank.copy('sor_title'), form(bank))}`
    + serhBox(serhRows(summary, bank), state.settings.showSerh, bank.copy('sor_serh_title'), bank.copy('sor_serh_hint'))
    + `<p class="muted small">${esc(bank.copy('disclaimer'))}</p></div>`;
}

function showStatus(root, text) {
  const el = root.querySelector('#sor-status');
  el.textContent = text;
  el.hidden = !text;
}

async function submit(root, state, actions) {
  const form = root.querySelector('#sor-form');
  const bank = state.bank;
  const question = form.elements.question.value.trim();
  if (!question) return;
  if (!state.settings.pin) { showStatus(root, bank.copy('sor_no_pin')); return; }
  const button = form.querySelector('button');
  button.disabled = true;
  showStatus(root, bank.copy('sor_busy'));
  const answer = root.querySelector('#sor-answer');
  answer.hidden = true;
  try {
    const result = await actions.llm('ask', { question });
    if (!result.ok) { showStatus(root, bank.copy(REASON_COPY[result.reason] ?? 'sor_error')); return; }
    showStatus(root, '');
    answer.innerHTML = card('Cevap', `<p class="answer">${esc(result.text)}</p><p class="scene">${esc(bank.copy('sor_footer'))}</p>`);
    answer.hidden = false;
  } finally {
    button.disabled = false;
  }
}

export function mount(root, state, actions) {
  const form = root.querySelector('#sor-form');
  if (!form) return () => {};
  const onSubmit = (e) => { e.preventDefault(); submit(root, state, actions); };
  const onInput = () => { root.querySelector('#sor-counter').textContent = state.bank.copy('sor_counter', { n: form.elements.question.value.length, max: LLM.questionMax }); };
  form.addEventListener('submit', onSubmit);
  form.addEventListener('input', onInput);
  root.querySelector('.serh')?.addEventListener('toggle', (e) => {
    actions.setSerh(e.target.open);
    root.querySelector('#sor').classList.toggle('serh-on', e.target.open);
  });
  return () => { form.removeEventListener('submit', onSubmit); form.removeEventListener('input', onInput); };
}
