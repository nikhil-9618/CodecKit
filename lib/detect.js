// lib/detect.js — guess which codecs a string might be so the UI can
// suggest "Decode as Base64?" hints. Pure functions only, no side effects.
// Order of checks = confidence order (most specific first).

/** @returns {string[]} codec ids, best guess first */
export function detect(input, codecIds) {
  const s = String(input).trim();
  if (!s) return [];
  const scores = [];
  const has = (id) => codecIds?.includes?.(id) !== false;

  if (has('jwt') && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(s) && s.split('.').length === 3) {
    scores.push('jwt');
  }
  if (has('base64url') && /^[A-Za-z0-9_-]+$/.test(s) && s.length >= 8 && /\d/.test(s)) {
    scores.push('base64url');
  }
  if (has('base64') && /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length >= 4 && s.length % 4 === 0) {
    scores.push('base64');
  }
  if (has('hex') && /^(0x)?[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0 && /[a-fA-F]/.test(s)) {
    scores.push('hex');
  }
  if (has('binary') && /^[01]+$/.test(s) && s.length % 8 === 0 && s.length >= 8) {
    scores.push('binary');
  }
  if (has('morse') && /^[.\/ \-]+$/.test(s) && /[.\-]/.test(s)) {
    scores.push('morse');
  }
  if (has('url') && /%[0-9A-Fa-f]{2}/.test(s)) {
    scores.push('url');
  }
  if (has('html-entity') && /&(#x?[0-9A-Fa-f]+|[a-zA-Z]+);/.test(s)) {
    scores.push('html-entity');
  }
  if (has('unicode-escape') && /\\u[0-9A-Fa-f]{4}|\\x[0-9A-Fa-f]{2}/.test(s)) {
    scores.push('unicode-escape');
  }
  if (has('base32') && /^[A-Z2-7]+=*$/.test(s) && s.length >= 8 && /[2-7]/.test(s)) {
    scores.push('base32');
  }
  if (has('base58') && /^[1-9A-HJ-NP-Za-km-z]+$/.test(s) && s.length >= 8 && /[1-9]/.test(s)) {
    scores.push('base58');
  }
  // ROT/CAESAR: show as a transform suggestion, no strict test possible.
  if (has('rot') && /^[a-zA-Z ]+$/.test(s) && s.length >= 4) {
    scores.push('rot');
  }

  return [...new Set(scores)];
}
