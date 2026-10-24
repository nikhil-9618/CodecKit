// app.js — CodecKit UI runtime. Loaded by every page (ES module, no build).
// Responsibilities: playground (codec tabs + mode toggle), static tool
// sections, theme toggle, nav, shortcuts, share links, auto-detect hints,
// history, file→Base64, offline banner, window.CodecKit debug handle.
//
// Page markup contracts (see pages/codecs.html for the canonical example):
//   #playground … [data-tabs] [data-mode] [data-input] [data-output]
//                 [data-error] [data-detect] [data-history]
//   Any static tool: section[data-codec="base64"][data-direction="encode"]
//
// The application layer may touch the DOM; /codecs/*.js never does.

import { list, get, ensure, register, lazyMeta } from './codecs/index.js';
import * as router from './router.js';
import { debounce } from './lib/debounce.js';
import { copyText, flashCopied } from './lib/clipboard.js';
import * as storage from './lib/storage.js';
import { detect } from './lib/detect.js';
import { safe } from './lib/errors.js';

const state = { currentCodec: 'base64', direction: 'encode' };

// ─── boot ────────────────────────────────────────────────────────────────────
function boot() {
  initNav();
  initThemeToggle();
  initOfflineBanner();
  initShortcuts();
  if (document.getElementById('playground')) initPlayground();
  document.querySelectorAll('section[data-codec]').forEach(initSection);
  document.querySelectorAll('[data-action="reset-data"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm('Clear all saved fields and settings from this browser?')) {
        storage.clearAll();
        location.reload();
      }
    });
  });
  router.start();
  // debugging handle (Section 6.10)
  window.CodecKit = {
    app: state,
    codecs: { list, get, ensure, register },
    router,
  };
}

// boot() is called at the bottom of this module so every helper is defined.

// ─── theme / nav / offline ───────────────────────────────────────────────────
/** Theme is applied pre-paint by lib/boot.js; this only toggles + persists. */
function initThemeToggle() {
  document.querySelectorAll('[data-action="theme"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      storage.prefs.set('theme', next);
    });
  });
}

function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('nav.main');
  toggle?.addEventListener('click', () => {
    if (!nav) return;
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

function initOfflineBanner() {
  const setOnline = () => document.documentElement.classList.toggle('offline', !navigator.onLine);
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOnline);
  setOnline();
  const swAllowed = location.protocol === 'https:'
    || ['localhost', '127.0.0.1'].includes(location.hostname); // local PWA testing
  if ('serviceWorker' in navigator && swAllowed) {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* dev / no-SW is fine */ });
  }
}

// ─── shared DOM helpers ──────────────────────────────────────────────────────
// $(root|selector, selector?) — accepts (root, sel), (sel, root) and (sel).
const $ = (root, sel) => {
  if (sel === undefined) return document.querySelector(root);
  if (typeof root === 'string') return sel.querySelector(root);
  return root.querySelector(sel);
};
const all = (root, sel) => {
  if (sel === undefined) return [...document.querySelectorAll(root)];
  if (typeof root === 'string') return [...sel.querySelectorAll(root)];
  return [...root.querySelectorAll(sel)];
};

function showError(root, message) {
  const line = $(root, '[data-error]');
  if (!line) { console.warn(message); return; }
  line.hidden = false;
  line.textContent = message; // textContent — never innerHTML with user data
}

function clearError(root) {
  const line = $(root, '[data-error]');
  if (line) { line.hidden = true; line.textContent = ''; }
}

function setOutput(root, value) {
  const out = $(root, '[data-output]');
  if (out) out.value = value;
  const count = $(root, '[data-output-line]');
  if (count) count.textContent = value === '' ? '0 chars' : `${value.length} chars`;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/** Async-aware safe(): codecs may return promises (hash, jwt-sign). */
async function safeAsync(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── playground (codecs.html) ────────────────────────────────────────────────
function renderTabs(root) {
  const meta = [...list.map((c) => c.meta), ...lazyMeta];
  const wrap = $(root, '[data-tabs]');
  if (!wrap) return;
  wrap.innerHTML = meta.map((m) => `
    <button class="tab${m.id === state.currentCodec ? ' active' : ''}" data-tab="${m.id}"
      type="button" aria-pressed="${m.id === state.currentCodec}">${m.name}</button>`).join('');
  all(wrap, '[data-tab]').forEach((btn) => btn.addEventListener('click', () => selectCodec(btn.dataset.tab)));
}

async function selectCodec(id) {
  const codec = await ensure(id); // loads lazy Web Crypto modules on demand
  if (!codec) { showError(document.getElementById('playground'), `Unknown tool: ${id}`); return; }
  state.currentCodec = id;
  if (!codec.meta.canDecode && codec.meta.canEncode) state.direction = 'encode';
  else if (!codec.meta.canEncode && codec.meta.canDecode) state.direction = 'decode';
  storage.prefs.set('lastCodec', id);
  const root = document.getElementById('playground');
  renderTabs(root);
  applyCodecUI(root, codec);
  setOutput(root, '');
  clearError(root);
  resetFileState(root);
  const input = $(root, '[data-input]');
  input.focus();
  if (input.value) run(state.direction);
}

/** Adjust controls (mode buttons, caesar slider, file drop) for a codec. */
function applyCodecUI(root, codec) {
  const enc = $(root, '[data-mode-encode]');
  const dec = $(root, '[data-mode-decode]');
  enc.disabled = !codec.meta.canEncode;
  dec.disabled = !codec.meta.canDecode;
  enc.classList.toggle('active', state.direction === 'encode');
  dec.classList.toggle('active', state.direction === 'decode');

  const sliderWrap = $(root, '[data-shift-wrap]');
  if (sliderWrap) {
    sliderWrap.hidden = codec.meta.id !== 'caesar';
    const slider = $('input', sliderWrap);
    if (slider) {
      slider.value = String(storage.prefs.get('caesarShift', 3));
      syncShiftLabel(root, slider);
    }
  }

  const fileBit = $(root, '[data-file-controls]');
  if (fileBit) {
    const fileCapable = typeof codec.encodeBytes === 'function';
    fileBit.hidden = !fileCapable;
    if (fileCapable) {
      const title = $('[data-file-title]', fileBit);
      if (title) title.textContent = `File → ${codec.meta.name}`;
    }
  }

  const explain = $(root, '[data-explain]');
  if (explain && codec.meta.explanation) explain.textContent = codec.meta.explanation;
}

function syncShiftLabel(root, slider) {
  const label = $('[data-shift-label]', root);
  if (label) label.textContent = `Shift: ${slider.value}`;
}

function initPlayground() {
  const root = document.getElementById('playground');
  const input = $(root, '[data-input]');

  const live = debounce(() => run(state.direction), 150);
  input.addEventListener('input', () => {
    // Typing means the user moved on from a chosen/dropped file.
    if (root.dataset.fileLoaded) resetFileState(root);
    live();
    detectHint(root);
  });

  $('[data-mode-encode]', root)?.addEventListener('click', () => { state.direction = 'encode'; run('encode'); markMode(root); });
  $('[data-mode-decode]', root)?.addEventListener('click', () => { state.direction = 'decode'; run('decode'); markMode(root); });

  $('[data-action="copy"]', root)?.addEventListener('click', (e) => {
    const out = $(root, '[data-output]');
    if (!out?.value) return;
    // Capture the button now: e.currentTarget is null once dispatch finishes,
    // i.e. by the time this promise resolves.
    const btn = e.currentTarget;
    copyText(out.value).then((ok) => { if (ok) flashCopied(btn, 'Copied!'); });
  });
  $('[data-action="swap"]', root)?.addEventListener('click', () => {
    const out = $(root, '[data-output]');
    if (!out?.value) return;
    input.value = out.value;
    const next = state.direction === 'encode' ? 'decode' : 'encode';
    state.direction = next;
    markMode(root);
    run(next);
  });
  $('[data-action="clear"]', root)?.addEventListener('click', () => {
    input.value = '';
    setOutput(root, '');
    clearError(root);
    hideDetect(root);
    storage.historyClear(state.currentCodec);
    fillHistory(root);
    input.focus();
  });
  $('[data-action="share"]', root)?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const enc = get('base64url');
    const payload = enc.encode(input.value);
    const share = `${location.origin}${location.pathname}#/share?c=${encodeURIComponent(state.currentCodec)}&d=${encodeURIComponent(payload)}`;
    location.hash = `#/share?c=${encodeURIComponent(state.currentCodec)}&d=${encodeURIComponent(payload)}`;
    copyText(share).then((ok) => { if (ok) flashCopied(btn, 'Link copied!'); });
  });

  // Caesar shift slider (Section 8C)
  const slider = $('[data-shift-wrap] input', root);
  slider?.addEventListener('input', () => {
    storage.prefs.set('caesarShift', Number(slider.value));
    syncShiftLabel(root, slider);
    run(state.direction);
  });

  // File → encoding (Section 8D): visible drop zone + picker, 5 MB cap.
  const fileInput = $(root, '[data-file]');
  const dropzone = $(root, '[data-file-controls]');
  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.[0]) consumeFile(root, fileInput.files[0]);
  });
  $('[data-file-clear]', root)?.addEventListener('click', () => {
    resetFileState(root, { clearOutput: true });
    clearError(root);
    input.focus();
  });
  dropzone?.addEventListener('click', (e) => {
    if (e.target.closest('input, button, label')) return;
    fileInput?.click();
  });
  dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag');
    const f = e.dataTransfer?.files?.[0];
    if (f) consumeFile(root, f);
  });
  // Dropping anywhere else in the playground must not navigate away to the file.
  root.addEventListener('dragover', (e) => { if (dropzone && !dropzone.hidden) e.preventDefault(); });
  root.addEventListener('drop', (e) => {
    if (!dropzone || dropzone.hidden) return;
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) consumeFile(root, f);
  });

  // Dismiss the auto-detect hint for good (persisted)
  $('[data-detect-dismiss]', root)?.addEventListener('click', () => {
    storage.prefs.set('detectDismissed', true);
    hideDetect(root);
  });

  // Recent history
  fillHistory(root);
  $('[data-history]', root)?.addEventListener('change', (e) => {
    const item = storage.history(state.currentCodec)[Number(e.target.value)];
    if (item !== undefined) {
      input.value = item;
      run(state.direction);
    }
  });

  // Deep link: #/share?c=hex&d=48... (Section 8G)
  const share = parseShareHash();
  const start = share?.c ?? storage.prefs.get('lastCodec', 'base64');
  const data = share?.d ?? '';
  (async () => {
    await selectCodec(start);
    if (data) {
      input.value = get('base64url').decode(data);
      run(state.direction);
    }
  })();
}

function markMode(root) {
  $('[data-mode-encode]', root)?.classList.toggle('active', state.direction === 'encode');
  $('[data-mode-decode]', root)?.classList.toggle('active', state.direction === 'decode');
}

function parseShareHash() {
  const h = location.hash;
  if (!h.startsWith('#/share')) return null;
  const params = new URLSearchParams(h.replace(/^#\/share/, ''));
  const c = params.get('c');
  const d = params.get('d');
  return c || d ? { c: c ?? 'base64', d: d ?? '' } : null;
}

async function run(dir) {
  const root = document.getElementById('playground');
  const codec = get(state.currentCodec);
  if (!codec || !root) return;
  const input = $(root, '[data-input]');
  const raw = input.value;
  if (raw === '') { setOutput(root, ''); clearError(root); return; }

  try {
    let value;
    if (codec.meta.id === 'caesar') {
      const shift = storage.prefs.get('caesarShift', 3);
      value = dir === 'encode' ? codec.encodeShift(raw, shift) : codec.decodeShift(raw, shift);
    } else if (dir === 'encode') {
      value = await codec.encode(raw); // hash/jwt-sign are async
    } else {
      value = await codec.decode(raw);
    }
    setOutput(root, String(value));
    clearError(root);
    scheduleHistory(raw);
  } catch (err) {
    setOutput(root, '');
    showError(root, err instanceof Error ? err.message : 'Invalid input');
  }
}

/** Record successful input into history (debounced 2 s — Section 6.9). */
const scheduleHistory = debounce((raw) => {
  const root = document.getElementById('playground');
  if (!root) return;
  storage.historyPush(state.currentCodec, raw);
  fillHistory(root);
}, 2000);

function fillHistory(root) {
  const sel = $(root, '[data-history]');
  if (!sel) return;
  const items = storage.history(state.currentCodec);
  sel.innerHTML = '<option value="">Recent…</option>' + items
    .map((item, i) => `<option value="${i}">${escapeHtml(item.length > 36 ? item.slice(0, 36) + '…' : item)}</option>`)
    .join('');
}

// ─── auto-detect hint (Section 8B, dismissible banner) ───────────────────────
function detectHint(root) {
  const banner = $(root, '[data-detect]');
  if (!banner || storage.prefs.get('detectDismissed')) return;
  const input = $(root, '[data-input]');
  const guesses = input.value ? detect(input.value, list.map((c) => c.meta.id)) : [];
  const other = guesses.find((id) => id !== state.currentCodec && get(id));
  if (other) {
    banner.hidden = false;
    $('[data-detect-text]', banner).textContent = `Looks like ${get(other).meta.name}.`;
    const btn = $('[data-detect-use]', banner);
    btn.textContent = `Use ${get(other).meta.name}`;
    btn.onclick = () => { resetDetect(root); selectCodec(other); };
  } else {
    banner.hidden = true;
  }
}

function hideDetect(root) {
  const banner = $(root, '[data-detect]');
  if (banner) banner.hidden = true;
}

function resetDetect(root) {
  hideDetect(root);
}

// ─── static tool sections (SEO pages, embedded tools) ────────────────────────
function initSection(section) {
  const codecId = section.dataset.codec;
  const direction = section.dataset.direction ?? 'encode';
  if (!get(codecId)) return; // unknown/missing codec → section stays inert
  const codec = get(codecId);
  const input = $(section, '[data-input]');
  if (!input) return;

  input.addEventListener('input', debounce(() => {
    const raw = input.value;
    if (raw === '') { setOutput(section, ''); clearError(section); return; }
    const fn = direction === 'decode' ? codec.decode : codec.encode;
    if (!fn) return;
    safeAsync(() => fn(raw)).then((result) => {
      if (result.ok) { setOutput(section, result.value); clearError(section); }
      else { setOutput(section, ''); showError(section, result.error); }
    });
  }, 150));

  $(section, '[data-action="copy"]')?.addEventListener('click', (e) => {
    const out = $(section, '[data-output]');
    const btn = e.currentTarget;
    if (!out?.value) return;
    copyText(out.value).then((ok) => { if (ok) flashCopied(btn, 'Copied!'); });
  });
  // prefill support for SEO landing queries: ?input=<value>
  const v = new URLSearchParams(location.search).get('input');
  if (v) input.value = v;
  if (input.value) input.dispatchEvent(new Event('input'));
}

function consumeFile(root, file) {
  const codec = get(state.currentCodec);
  if (!codec?.encodeBytes) {
    showError(root, 'This codec reads text. Pick Base64, Hex or Binary to encode a file.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError(root, `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB) — 5 MB cap`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const bytes = new Uint8Array(reader.result);
    const text = codec.encodeBytes(bytes);
    // data URI form for Base64 (test: file drop produces a valid data URI)
    setOutput(root, codec.meta.id === 'base64'
      ? `data:${file.type || 'application/octet-stream'};base64,${text}`
      : text);
    clearError(root);
    // Keep the textarea empty: a fake "(file: …)" label would later be
    // encoded as literal text if the user switched direction.
    $(root, '[data-input]').value = '';
    const info = $(root, '[data-file-info]');
    if (info) {
      info.hidden = false;
      info.textContent = `${file.name} · ${formatBytes(file.size)} · ${codec.meta.name}`;
    }
    const clearBtn = $(root, '[data-file-clear]');
    if (clearBtn) clearBtn.hidden = false;
    root.dataset.fileLoaded = '1';
  };
  reader.onerror = () => showError(root, 'Could not read that file');
  reader.readAsArrayBuffer(file);
}

/** Forget the selected file (optionally clearing the output too). */
function resetFileState(root, { clearOutput = false } = {}) {
  const fileInput = $(root, '[data-file]');
  if (fileInput) fileInput.value = '';
  const info = $(root, '[data-file-info]');
  if (info) { info.hidden = true; info.textContent = ''; }
  const clearBtn = $(root, '[data-file-clear]');
  if (clearBtn) clearBtn.hidden = true;
  delete root.dataset.fileLoaded;
  if (clearOutput) setOutput(root, '');
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── keyboard shortcuts (Section 6.6 + "?" modal 8E) ─────────────────────────
function initShortcuts() {
  const dialog = document.getElementById('shortcuts-modal');
  const open = () => { if (dialog && typeof dialog.showModal === 'function') dialog.showModal(); };
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLElement
      && ['TEXTAREA', 'INPUT', 'SELECT'].includes(e.target.tagName);
    const meta = e.ctrlKey || e.metaKey;
    if (meta && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('[data-input]')?.focus();
    } else if (meta && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      $('[data-action="copy"]')?.click();
    } else if (meta && !e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      $('[data-action="swap"]')?.click();
    } else if (e.key === 'Escape' && typing) {
      $('[data-action="clear"]')?.click();
    } else if (e.key === '?' && !typing) {
      open();
    }
  });
  $('[data-shortcuts-open]')?.addEventListener('click', open);
}

// ─── boot trigger ────────────────────────────────────────────────────────────
// Must stay at the very end: boot() reaches fillHistory(), which uses the
// const helpers above (escapeHtml). Calling it earlier throws a TDZ
// ReferenceError on any visit that already has saved history.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
