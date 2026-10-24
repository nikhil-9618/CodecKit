// pages/hash.js — hash page wiring. Imports codecs/hash.js (Web Crypto,
// lazy by page) and codecs/hash-identify.js (pure heuristics).
import { digests } from '/codecs/hash.js';
import { identify } from '/codecs/hash-identify.js';
import { debounce } from '/lib/debounce.js';
import { copyText, flashCopied } from '/lib/clipboard.js';

const $ = (sel) => document.querySelector(sel);

// tabs
document.querySelectorAll('[data-hashtab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-hashtab]').forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    $('#hash-generator').hidden = btn.dataset.hashtab !== 'generator';
    $('#hash-identifier').hidden = btn.dataset.hashtab !== 'identifier';
  });
  if (location.hash === '#identify') btn.click();
});

// generator
const input = $('#hash-in');
input?.addEventListener('input', debounce(async () => {
  const rows = document.querySelectorAll('[data-h]');
  if (input.value === '') { rows.forEach((r) => { r.textContent = '—'; }); return; }
  const d = await digests(input.value);
  rows.forEach((r) => { r.textContent = d[r.dataset.h] || '(MD5 lib unavailable)'; });
}, 150));
if (input?.value) input.dispatchEvent(new Event('input'));

// per-row copy
document.querySelectorAll('[data-copy-h]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cell = $(`[data-h="${btn.dataset.copyH}"]`);
    if (cell && cell.textContent !== '—') copyText(cell.textContent).then((ok) => { if (ok) flashCopied(btn, 'Copied!'); });
  });
});

// identifier
const ident = $('#ident-in');
ident?.addEventListener('input', debounce(() => {
  const box = $('[data-ident-result]');
  const errEl = $('[data-ident-error]');
  errEl.hidden = true;
  if (ident.value.trim() === '') { box.innerHTML = ''; return; }
  const results = identify(ident.value);
  box.innerHTML = results.map((r) => `
    <p style="margin:8px 0">
      <span class="badge ${r.confidence >= 80 ? 'valid' : r.confidence >= 40 ? 'info' : 'warn'}">${r.confidence}% confidence</span>
      <strong style="margin-left:8px">${r.algo}</strong><br>
      <span class="muted small">${r.reason}</span>
    </p>`).join('');
}, 150));
