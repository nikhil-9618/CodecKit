// codecs/rot.js — ROT13: symmetric rotation of A–Z / a–z by 13.
// Pure self-inverse cipher; digits, punctuation and Unicode are unchanged.

export const meta = {
  id: 'rot',
  name: 'ROT13',
  canEncode: true,
  canDecode: true,
  description: 'ROT13 — self-inverse letter rotation (obfuscation).',
  explanation: `ROT13 rotates every letter 13 positions through the alphabet (A→N, Z→M). Encoding and decoding are the same operation, so one button does both. It hides spoilers and puzzle text — it is NOT encryption. "Hello" → "Uryyb".`,
};

export function encode(input) {
  return String(input ?? '').replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function decode(input) {
  return encode(input); // symmetric by construction
}
