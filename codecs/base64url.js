// codecs/base64url.js — URL-safe Base64 (used by JWTs): '-' and '_' instead
// of '+' and '/', no padding on encode, tolerated padding on decode.

export const meta = {
  id: 'base64url',
  name: 'Base64URL',
  canEncode: true,
  canDecode: true,
  description: 'URL-safe Base64 (JWT alphabet), no padding.',
  explanation: `Base64URL is Base64 with the unsafe URL characters '+' and '/' swapped for '-' and '_', and without '=' padding. It is the alphabet JSON Web Tokens use. Example: "Hello" → "SGVsbG8".`,
};

const B64U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function encode(input) {
  const str = String(input ?? '');
  if (str === '') return '';
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += B64U[b0 >> 2] + B64U[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += B64U[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += B64U[b2 & 63];
  }
  return out;
}

export function decode(input) {
  let s = String(input ?? '').trim();
  if (s === '') return '';
  const unpadded = s.replace(/=+$/, ''); // tolerate padded and unpadded input
  if (!/^[A-Za-z0-9_-]+$/.test(unpadded)) throw new Error('Invalid Base64 URL input');
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '='; // tolerate padded and unpadded input
  let bin;
  try { bin = atob(s); } catch { throw new Error('Invalid Base64 URL input'); }
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Invalid Base64 URL input');
  }
}
