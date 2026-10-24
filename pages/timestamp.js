// pages/timestamp.js — epoch ↔ date conversions, live clock, relative time.
import { debounce } from '/lib/debounce.js';
import { copyText, flashCopied } from '/lib/clipboard.js';

const $ = (sel) => document.querySelector(sel);

const set = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };

function relDiff(ms) {
  const d = ms - Date.now();
  const abs = Math.abs(d);
  const units = [
    [31536000000, 'year'], [2592000000, 'month'], [86400000, 'day'],
    [3600000, 'hour'], [60000, 'minute'], [1000, 'second'],
  ];
  for (const [msPer, name] of units) {
    if (abs >= msPer * 2 || name === 'second') {
      const n = Math.round(abs / msPer);
      const s = `${n} ${name}${n === 1 ? '' : 's'} ${d >= 0 ? 'from now' : 'ago'}`;
      return s;
    }
  }
  return 'now';
}

// ---- datetime-local → table ------------------------------------------------
const isoInput = $('[data-iso]');
if (isoInput) setIntervalOfNow(isoInput);

function setIntervalOfNow(el) {
  // prefill "now" in local time, then recompute on change
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  el.value = now.toISOString().slice(0, 19);
  el.addEventListener('input', render);
  document.querySelector('[data-now]').addEventListener('click', () => {
    el.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    render();
  });

  function render() {
    const t = new Date(el.value);
    if (!el.value || Number.isNaN(t.getTime())) {
      set('[data-epoch-s]', '—'); set('[data-epoch-ms]', '—');
      set('[data-iso-utc]', '—'); set('[data-iso-local]', '—'); set('[data-relative]', '—');
      return;
    }
    set('[data-epoch-s]', String(Math.floor(t.getTime() / 1000)));
    set('[data-epoch-ms]', String(t.getTime()));
    set('[data-iso-utc]', t.toISOString());
    set('[data-iso-local]', t.toLocaleString('sv', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(' ', 'T'));
    set('[data-relative]', relDiff(t.getTime()));
  }
  render();
  setInterval(render, 1000);
}

// ---- epoch input → date ----------------------------------------------------
const epochIn = $('[data-epoch-input]');
epochIn?.addEventListener('input', debounce(() => {
  const raw = epochIn.value.replace(/[,\s_.]/g, '');
  if (raw === '') { set('[data-from-epoch-utc]', '—'); set('[data-from-epoch-local]', '—'); set('[data-from-epoch-relative]', '—'); return; }
  if (!/^-?\d{1,13}$/.test(raw)) {
    set('[data-from-epoch-utc]', 'Invalid timestamp'); set('[data-from-epoch-local]', ''); set('[data-from-epoch-relative]', '');
    return;
  }
  const isMs = raw.replace('-', '').length > 10;
  const t = new Date(Number(raw) * (isMs ? 1 : 1000));
  if (Number.isNaN(t.getTime())) {
    set('[data-from-epoch-utc]', 'Invalid timestamp'); set('[data-from-epoch-local]', ''); return;
  }
  set('[data-from-epoch-utc]', t.toISOString());
  set('[data-from-epoch-local]', t.toLocaleString('sv'));
  set('[data-from-epoch-relative]', relDiff(t.getTime()));
}, 150));

// ---- live clock ------------------------------------------------------------
setInterval(() => {
  const el = $('[data-live-clock]');
  if (el) el.textContent = `${Math.floor(Date.now() / 1000)}`;
}, 1000);

// copy buttons
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const src = document.querySelector(`[data-${btn.dataset.copy}]`);
    if (src && src.textContent && src.textContent !== '—') {
      // Use the closure's btn: e.currentTarget is null inside the callback.
      copyText(src.textContent).then((ok) => { if (ok) flashCopied(btn, 'Copied!'); });
    }
  });
});
