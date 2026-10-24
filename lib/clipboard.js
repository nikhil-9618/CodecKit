// lib/clipboard.js — copy text, with feedback handled by the caller.

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path (e.g. non-secure contexts)
  }
  return legacyCopy(text);
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

/** Flip a copy button into "Copied ✓" for ~1.2 s. */
export function flashCopied(btn, label = 'Copied!') {
  if (!btn || btn.dataset.busy) return;
  const original = btn.textContent;
  btn.dataset.busy = '1';
  btn.textContent = label;
  setTimeout(() => {
    btn.textContent = original;
    delete btn.dataset.busy;
  }, 1200);
}
