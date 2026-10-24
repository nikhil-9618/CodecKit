// codecs/caesar.js — Caesar cipher: rotate letters by N (default 3).
// The generic codec contract uses shift 3; the UI slider calls
// encodeShift/decodeShift directly for shifts 1–25.

export const meta = {
  id: 'caesar',
  name: 'Caesar',
  canEncode: true,
  canDecode: true,
  description: 'Caesar cipher with adjustable shift (default 3).',
  explanation: `The Caesar cipher shifts every letter N positions through the alphabet — Julius Caesar reportedly used a shift of 3. "abc" → "def" at shift 3. It scrolls alphabets, so it's a classic classroom cipher, not real encryption. Decoding shifts the opposite direction.`,
};

function shiftLetters(input, amount) {
  return String(input ?? '').replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + (amount % 26) + 26) % 26) + base);
  });
}

export function encodeShift(input, n = 3) {
  const shift = Math.trunc(Number(n));
  if (Number.isNaN(shift)) throw new Error('Invalid Caesar input');
  if (shift < 1 || shift > 25) throw new Error('Invalid Caesar input: shift must be 1–25');
  return shiftLetters(input, shift);
}

export function decodeShift(input, n = 3) {
  const shift = Math.trunc(Number(n));
  if (Number.isNaN(shift)) throw new Error('Invalid Caesar input');
  if (shift < 1 || shift > 25) throw new Error('Invalid Caesar input: shift must be 1–25');
  return shiftLetters(input, -shift);
}

export function encode(input) {
  return encodeShift(input, 3);
}

export function decode(input) {
  return decodeShift(input, 3);
}
