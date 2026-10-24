// codecs/base58.js — Bitcoin alphabet Base58 (excludes 0, O, I, l).
// Blockchain addresses and keys use it for hand-copy safety.

export const meta = {
  id: 'base58',
  name: 'Base58',
  canEncode: true,
  canDecode: true,
  description: 'Base58 (Bitcoin alphabet, no 0/O/I/l).',
  explanation: `Base58 drops the most confusable characters (0/O, I/l) and never pads — Bitcoin addresses and IPFS CIDs use it so humans can copy values correctly. Encoding is big-integer division, so leading zero bytes become '1' characters.`,
};

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encode(input) {
  const str = String(input ?? '');
  if (str === '') return '';
  const bytes = new TextEncoder().encode(str);
  let out = BigInt(0);
  for (const b of bytes) out = (out << 8n) | BigInt(b);
  let digits = '';
  while (out > 0n) {
    digits = ALPHABET[Number(out % 58n)] + digits;
    out /= 58n;
  }
  // every leading zero byte becomes a literal '1'
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) digits = '1' + digits;
  return digits || '';
}

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  for (const ch of s) {
    if (!ALPHABET.includes(ch)) throw new Error('Invalid Base58 input');
  }
  let n = BigInt(0);
  for (const ch of s) n = n * 58n + BigInt(ALPHABET.indexOf(ch));
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
  const leadingOnes = s.length - s.replace(/^1+/, '').length;
  const data = new Uint8Array(leadingOnes + bytes.length);
  data.set(bytes, leadingOnes);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch {
    throw new Error('Invalid Base58 input');
  }
}
