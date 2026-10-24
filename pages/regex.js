// pages/regex.js — live highlight + capture-group listing.
// Highlighting uses escaped HTML with <mark class=match> inserted only at
// verified match boundaries from exec() — user text is never injected raw.
import { debounce } from '/lib/debounce.js';

const patternEl = document.querySelector('[data-pattern]');
const flagsEl = document.querySelector('[data-flags]');
const testEl = document.querySelector('[data-test]');
const out = document.querySelector('[data-highlights]');
const matchesBox = document.querySelector('[data-matches]');
const errEl = document.querySelector('[data-error]');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function run() {
  errEl.hidden = true;
  const pattern = patternEl.value;
  const flags = flagsEl.value.replace(/[^dgimsuvy]/g, '');
  if (pattern === '') { out.textContent = testEl.value; matchesBox.textContent = 'No pattern.'; return; }
  let re;
  try {
    re = new RegExp(pattern, flags.includes('g') || flags.includes('y') ? flags : flags + 'g');
  } catch (err) {
    errEl.hidden = false;
    errEl.textContent = `Invalid Regex input: ${err.message}`;
    out.textContent = testEl.value;
    return;
  }
  try {
    const text = testEl.value;
    let html = '';
    let last = 0;
    const groups = [];
    let count = 0;
    let m;
    while ((m = re.exec(text)) !== null && count < 500) {
      if (m[0].length === 0) { re.lastIndex++; continue; } // zero-width loop guard
      html += esc(text.slice(last, m.index)) + '<mark class="match">' + esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
      count++;
      groups.push({
        index: m.index,
        match: m[0],
        named: Object.entries(m.groups ?? {}).filter(([, v]) => v !== undefined),
        positional: m.slice(1).map((v, i) => ({ i: i + 1, v })),
      });
    }
    html += esc(text.slice(last));
    if (count === 0) html = esc(text);
    out.innerHTML = html;
    matchesBox.innerHTML = groups.length === 0
      ? 'No matches.'
      : groups.map((g, i) => {
        const bits = [`<strong>#${i + 1}</strong> @${g.index}: <code>${esc(g.match)}</code>`];
        for (const [name, v] of g.named) bits.push(`<code>${esc(name)}=${esc(v)}</code>`);
        for (const p of g.positional) if (p.v !== undefined) bits.push(`<code>${p.i}=${esc(p.v)}</code>`);
        return `<p style="margin:4px 0">${bits.join(' · ')}</p>`;
      }).join('');
  } catch (err) {
    errEl.hidden = false;
    errEl.textContent = err.message;
  }
}

const live = debounce(run, 150);
patternEl?.addEventListener('input', live);
flagsEl?.addEventListener('input', live);
testEl?.addEventListener('input', live);
if (patternEl) run();
