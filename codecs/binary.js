// codecs/binary.js — text ↔ 8-bit binary, space-separated groups.
// Encodes "Hi" → "01001000 01101001"; decodes with or without spaces.

export const meta = {
  id: 'binary',
  name: 'Binary',
  canEncode: true,
  canDecode: true,
  description: 'Text ↔ 8-bit binary (01001000-style).',
  explanation: `Binary encoding shows each byte as eight 0/1 digits — how computers actually store text (ASCII/UTF-8). "Hi" → "01001000 01101001". Groups are space-separated for readability; decoding tolerates missing spaces.`,
};

export function encode(input) {
  const str = String(input ?? '');
  if (str === '') return '';
  const bytes = new TextEncoder().encode(str);
  const groups = [];
  for (let i = 0; i < bytes.length; i++) {
    groups.push(bytes[i].toString(2).padStart(8, '0'));
  }
  return groups.join(' ');
}

/** Extra export for File → Binary. */
export function encodeBytes(bytes) {
  const groups = [];
  for (let i = 0; i < bytes.length; i++) groups.push(bytes[i].toString(2).padStart(8, '0'));
  return groups.join(' ');
}

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  const bits = s.replace(/[\s.,_-]+/g, '');
  if (bits.length === 0 || bits.length % 8 !== 0 || !/^[01]+$/.test(bits)) {
    throw new Error('Invalid Binary input');
  }
  const bytes = new Uint8Array(bits.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Invalid Binary input');
  }
}
