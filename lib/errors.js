// lib/errors.js — one error pipeline: safe() runs code, show() displays
// "Invalid <format> input" in a red line under the tool. No white-screens.

/** Wrap a transform. Returns { ok, value } or { ok, error }. */
export function safe(fn) {
  try {
    const value = fn();
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function showError(el, message) {
  if (!el) return;
  el.hidden = false;
  el.textContent = message || 'Invalid input'; // textContent — never innerHTML
  el.setAttribute('role', 'alert');
}

export function clearError(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
  el.removeAttribute('role');
}

/**
 * Standard "Invalid <format> input" copy used across all pages,
 * so codec error messages stay uniform in the UI.
 */
export function invalidMessage(name = 'input') {
  return `Invalid ${name} input`;
}
