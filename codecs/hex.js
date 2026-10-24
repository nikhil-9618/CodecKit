// codecs/hex.js — text ↔ hex bytes. Accepts optional 0x prefix and spaces
// or colons between bytes on decode (e.g. "48 65 6C", "48:65:6c").

export const meta = {
  id: 'hex',
  name: 'Hex',
  canEncode: true,
  canDecode: true,
  description: 'Text ↔ hexadecimal bytes (0x optional).',
  explanation: `Hexadecimal represents each byte as two base-16 digits — the universal format for keys, hashes, network payloads and binary debugging. "Hello" → "48656c6c6f". Decoding accepts accents like "48 65 6c 6c 6f", "0x4865" and colons.`,
};

export function encode(input) {
  const str = String(input ?? '');
  if (str === '') return '';
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Extra export for File → Hex. */
export function encodeBytes(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  const hex = s.replace(/^0[xX]/, '').replace(/[\s:,-]+/g, '');
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Invalid Hex input');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Invalid Hex input');
  }
}
