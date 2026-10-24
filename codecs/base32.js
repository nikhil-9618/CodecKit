// codecs/base32.js — standard Base32 (RFC 4648, A–Z + 2–7, padded).
// Lowercase input tolerated on decode; output is uppercase.

export const meta = {
  id: 'base32',
  name: 'Base32',
  canEncode: true,
  canDecode: true,
  description: 'Standard Base32 (RFC 4648 alphabet).',
  explanation: `Base32 uses 32 case-insensitive, visually unambiguous characters (A–Z, 2–7) — chosen for systems that can't preserve case or confuse glyphs, like TOTP secret keys in authenticator apps (the O and 0 would be risky in Base64). "abc" → "MFRGG===".`,
};

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encode(input) {
  const str = String(input ?? '');
  if (str === '') return '';
  const bytes = new TextEncoder().encode(str);
  let bits = 0, value = 0, out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += A[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += A[(value << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += '=';
  return out;
}

export function decode(input) {
  let s = String(input ?? '').trim().toUpperCase().replace(/[\s\r\n-]/g, '');
  if (s === '') return '';
  const clean = s.replace(/=+$/, '');
  if (!/^[A-Z2-7]+$/.test(clean)) throw new Error('Invalid Base32 input');
  s = clean;
  while (s.length % 8 !== 0) s += '=';
  let bits = 0, value = 0;
  const bytes = [];
  for (const ch of s) {
    if (ch === '=') break;
    value = (value << 5) | A.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    throw new Error('Invalid Base32 input');
  }
}
