// pages/jwt.js — signer UI wiring. Imports the lazy Web Crypto codec only
// on this page. The secret stays in the page: sign() is pure crypto.
import { sign } from '/codecs/jwt-sign.js';
import { parse } from '/codecs/jwt.js';

// $ accepts (sel, root), (root, sel) and (sel) — tolerant of both orders.
const $ = (root, sel) => sel === undefined ? document.querySelector(root)
  : typeof root === 'string' ? sel.querySelector(root) : root.querySelector(sel);

// Decoder extras: expiry badge (generic wiring comes from app.js)
const decIn = document.getElementById('jwt-in');
const badge = $('[data-exp-badge]', document);
if (decIn && badge) {
  decIn.addEventListener('input', () => {
    try {
      const { payload } = parse(decIn.value);
      if (typeof payload.exp === 'number') {
        const expired = payload.exp * 1000 < Date.now();
        badge.hidden = false;
        badge.textContent = expired ? 'EXPIRED' : 'VALID';
        badge.className = `badge ${expired ? 'expired' : 'valid'}`;
      } else badge.hidden = true;
    } catch { badge.hidden = true; }
  });
}

// Signer tabs
document.querySelectorAll('[data-jwttab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-jwttab]').forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    const which = btn.dataset.jwttab;
    document.getElementById('jwt-decoder').hidden = which !== 'decoder';
    document.getElementById('jwt-signer').hidden = which !== 'signer';
  });
  if (location.hash === '#signer') btn.click();
});

// Sign action: HS256 via Web Crypto (codecs/jwt-sign.js)
const signBtn = $('[data-sign]', document);
if (signBtn) {
  signBtn.addEventListener('click', async () => {
    const out = $('[data-tok]', document);
    const errEl = $('[data-sign-error]', document);
    const status = $('[data-sign-status]', document);
    errEl.hidden = true;
    out.value = '';
    try {
      const token = await sign($('[data-hdr]', document).value, $('[data-pl]', document).value, $('[data-sec]', document).value);
      out.value = token;
      status.hidden = false;
      status.className = 'badge valid';
      status.textContent = 'signed locally with HS256';
    } catch (err) {
      errEl.hidden = false;
      errEl.textContent = err.message;
      status.hidden = true;
    }
  });
}
