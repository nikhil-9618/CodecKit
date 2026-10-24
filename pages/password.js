// pages/password.js — strength heuristics (pure local) + HIBP breach check.
// HIBP flow (k-anonymity): SHA-1 locally → send ONLY first 5 hex chars →
// match the remaining 35 among returned suffixes. Password never leaves.

import { debounce } from '/lib/debounce.js';

const pwInput = document.querySelector('#pw');
const FILL = document.querySelector('[data-meter-fill]');
const LABEL = document.querySelector('[data-meter-label]');
const LEN = document.querySelector('[data-len]');
const CLASSES = document.querySelector('[data-classes]');
const ENTROPY = document.querySelector('[data-entropy]');
const CRACK = document.querySelector('[data-crack]');
const BREACH = document.querySelector('[data-breach]');
const ERR = document.querySelector('[data-error]');

const NAMES = ['lowercase', 'uppercase', 'digits', 'symbols'];

// Small offline list of patterns that make an "entropy" estimate a lie.
// A real attacker's wordlist is huge; this is a floor, not a guarantee.
const COMMON = [
  'password', 'passw0rd', '123456', 'qwerty', 'letmein', 'welcome', 'admin',
  'iloveyou', 'monkey', 'dragon', 'football', 'abc123', 'master', 'sunshine',
  'princess', 'shadow', 'superman', 'michael', 'trustno1', 'login', 'starwars',
];

function analyze(pw) {
  const length = pw.length;
  const classBits = [/[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^a-zA-Z0-9]/.test(pw)];
  const count = classBits.filter(Boolean).length;
  let pool = classBits[0] * 26 + classBits[1] * 26 + classBits[2] * 10 + classBits[3] * 32;
  let entropy = pw ? Math.log2(Math.max(pool, 2)) * length : 0;
  const lower = pw.toLowerCase();
  if (/^[0-9]+$/.test(pw)) entropy *= 0.7;               // pure digits
  if (/^(.)\1+$/.test(pw)) entropy = Math.min(entropy, 1); // one char repeated
  if (/q?werty|asdf|1qaz|2wsx|zaq1/.test(lower)) entropy *= 0.6; // keyboard rows
  if (/abcd|bcde|1234|dcba|4321/.test(lower)) entropy *= 0.8;    // sequences
  if (COMMON.some((w) => lower.includes(w))) entropy = Math.min(entropy, 24); // dictionary hit
  if (/(.)\1{2,}/.test(pw)) entropy = Math.min(entropy, 30);    // aaa / 111 patterns
  const seconds = Math.pow(2, entropy) / 1e11; // fast offline GPU rig
  const label = entropy < 40 ? 'Weak' : entropy < 60 ? 'Fair' : entropy < 90 ? 'Strong' : 'Excellent';
  return {
    length,
    classes: count ? classBits.map((on, i) => on ? NAMES[i] : null).filter(Boolean).join(', ') : '—',
    entropy: Math.round(entropy),
    seconds,
    crack: fmtTime(seconds),
    label,
  };
}

function fmtTime(s) {
  if (!(s > 0)) return 'instantly';
  if (s < 1) return 'instantly';
  if (s < 60) return `${s.toFixed(0)} seconds`;
  if (s < 3600) return `${(s / 60).toFixed(0)} minutes`;
  if (s < 86400) return `${(s / 3600).toFixed(0)} hours`;
  if (s < 86400 * 365.25) return `${(s / 86400).toFixed(0)} days`;
  const years = s / (86400 * 365.25);
  if (years < 1000) return `${Math.round(years)} years`;
  return years.toExponential(0).replace('e+', '×10^') + ' years';
}

pwInput?.addEventListener('input', debounce(() => {
  const r = analyze(pwInput.value);
  const fractions = [0.25, 0.5, 0.75, 1];
  const colors = ['var(--error)', 'var(--warn)', 'var(--accent)', 'var(--success)'];
  const idx = r.entropy < 40 ? 0 : r.entropy < 60 ? 1 : r.entropy < 90 ? 2 : 3;
  FILL.style.width = `${(r.entropy / 128) * 100 < fractions[idx] ? r.entropy / 128 * 100 : fractions[idx] * 100}%`;
  FILL.style.background = colors[idx];
  LABEL.textContent = `Strength: ${r.label}`;
  LEN.textContent = String(r.length);
  CLASSES.textContent = r.classes;
  ENTROPY.textContent = `${r.entropy} bits`;
  CRACK.textContent = r.crack;
  BREACH.textContent = 'not checked';
  ERR.hidden = true;
}, 150));

// Show / hide the password
const showBtn = document.querySelector('[data-show-pw]');
showBtn?.addEventListener('click', () => {
  const show = pwInput.type === 'password';
  pwInput.type = show ? 'text' : 'password';
  showBtn.setAttribute('aria-pressed', String(show));
  showBtn.textContent = show ? 'Hide 🙈' : 'Show 👁';
});

// ★ HIBP k-anonymity — the ONLY network call on this page ★
document.querySelector('[data-check-breach]')?.addEventListener('click', async () => {
  ERR.hidden = true;
  BREACH.textContent = 'checking…';
  const pw = pwInput.value;
  if (!pw) {
    BREACH.textContent = 'not checked';
    return;
  }
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hexFull = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const prefix = hexFull.slice(0, 5);      // only 5 chars go over the wire
    const suffix = hexFull.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) throw new Error(`HIBP returned ${res.status}`);
    const text = await res.text();
    let found = 0;
    for (const line of text.split('\n')) {
      const [part] = line.split(':');
      if (part.trim().toLowerCase() === suffix) { found = parseInt(line.split(':')[1], 10) || 1; break; }
    }
    BREACH.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = `badge ${found ? 'expired' : 'valid'}`;
    badge.textContent = found ? `BREACHED — seen ${found.toLocaleString()} times` : 'No breach records (k-anonymity match)';
    BREACH.appendChild(document.createTextNode(''));
    BREACH.appendChild(badge);
  } catch (err) {
    BREACH.textContent = 'unavailable';
    ERR.hidden = false;
    ERR.textContent = `Breach check failed: ${err.message} (network required for this tool only)`;
  }
});
