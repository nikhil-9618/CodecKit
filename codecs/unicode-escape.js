// codecs/unicode-escape.js — JavaScript-style unicode escapes.
// Encode: non-ASCII characters → \\uXXXX (surrogate pairs for astral chars).
// Decode: \\uXXXX, \\xXX; anything else passes through; a dangling
// backslash at the end is an error.

export const meta = {
  id: 'unicode-escape',
  name: 'Unicode Escape',
  canEncode: true,
  canDecode: true,
  description: '\\uXXXX escapes for non-ASCII characters.',
  explanation: `JS/JSON-style escapes turn non-ASCII characters into \\uXXXX sequences: "你" → "\\u4f60". Useful when data must travel through ASCII-only channels. Characters beyond the BMP encode as UTF-16 surrogate pairs. Decoding also supports \\xNN hex escapes.`,
};

export function encode(input) {
  const s = String(input ?? '');
  if (s === '') return '';
  let out = '';
  // index loop = UTF-16 code units, so astral chars emit proper
  // surrogate-pair escapes (\ud83d\udd42), never 5-hex-digit garbage
  for (let i = 0; i < s.length; i++) {
    const unit = s[i];
    if (unit === '\\') out += '\\u005c';
    else if (unit.charCodeAt(0) >= 128) {
      out += '\\u' + unit.charCodeAt(0).toString(16).padStart(4, '0');
    } else out += unit;
  }
  return out;
}

export function decode(input) {
  const s = String(input ?? '');
  if (s === '') return '';
  if (s.endsWith('\\')) {
    throw new Error('Invalid Unicode escape input: dangling backslash');
  }
  // \u + 4 hex, \x + 2 hex, or \ + escape-letter; literal text preserved
  return s.replace(/\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\\([nt])/g,
    (whole, u, x, l) => {
      if (u) return String.fromCharCode(parseInt(u, 16));
      if (x) return String.fromCharCode(parseInt(x, 16));
      if (l === 'n') return '\n';
      if (l === 't') return '\t';
      return whole;
    });
}
