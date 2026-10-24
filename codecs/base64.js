// codecs/base64.js — standard Base64 for text, UTF-8 safe.
// Pure functions: string in / string out, throw on invalid input.

export const meta = {
  id: 'base64',
  name: 'Base64',
  canEncode: true,
  canDecode: true,
  description: 'Standard Base64 text encoding, UTF-8 safe.',
  explanation: `Base64 maps 3 bytes to 4 ASCII characters — it is how binary data travels through text-only channels like JSON, data URIs and email. Example: "Hello" → "SGVsbG8=". This implementation is UTF-8 safe, so "café ☕" survives the round trip (naive atob/btoa usage does not).`,
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBytesInto(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += B64[b0 >> 2] + B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? '=' : B64[b2 & 63];
  }
  return out;
}

export function encode(input) {
  const str = String(input ?? '');
  if (str === '') return '';
  return encodeBytesInto(new TextEncoder().encode(str));
}

/** Extra export used by File → Base64 (drag & drop). */
export function encodeBytes(bytes) {
  return encodeBytesInto(bytes);
}

export function decode(input) {
  let s = String(input ?? '').replace(/[\s\r\n]/g, '');
  if (s === '') return '';
  if (s.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) {
    throw new Error('Invalid Base64 input');
  }
  let bin;
  try { bin = atob(s); } catch { throw new Error('Invalid Base64 input'); }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  // fatal: reject mojibake (bytes that are not valid UTF-8) instead of
  // silently returning garbage.
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Invalid Base64 input');
  }
}
