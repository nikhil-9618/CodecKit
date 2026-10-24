// codecs/bacon.js — Bacon's cipher (classical 24-letter variant).
// Each letter → five symbols 'a'/'b' (often rendered 0/1). I=J and U=V share
// codes, as in the original 1605 design. Groups are space-separated.

export const meta = {
  id: 'bacon',
  name: 'Bacon',
  canEncode: true,
  canDecode: true,
  description: "Bacon's cipher — letters as 5-symbol a/b groups.",
  explanation: `Bacon's cipher renders each letter as five 'a'/'b' symbols (often styled 0/1): E = "aabaa", F = "aabab". Classical variant merges I/J and U/V, so 24 codes cover the alphabet — a steganography mainstay, not encryption.`,
};

// Canonical decode alphabet of 24 letters (I/J merged, U/V merged).
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'W', 'X', 'Y', 'Z'];

const CODES = LETTERS.map((_, i) =>
  i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b'));

const TO_CODE = new Map();
CODES.forEach((code, i) => {
  TO_CODE.set(LETTERS[i], code);
});
// J shares I's code, V shares U's code.
TO_CODE.set('J', TO_CODE.get('I'));
TO_CODE.set('V', TO_CODE.get('U'));

export function encode(input) {
  const text = String(input ?? '').trim().toUpperCase();
  if (text === '') return '';
  const groups = [...text].map((ch) => {
    const code = TO_CODE.get(ch);
    if (!code) throw new Error(`Invalid Bacon input: unsupported character "${ch}"`);
    return code;
  });
  return groups.join(' ');
}

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  // Accept a/b and 0/1 symbol fonts; group by fives.
  const normalized = s.toUpperCase().replace(/1/g, 'B').replace(/0/g, 'A')
    .replace(/[^AB]/g, ' ');
  const groups = normalized.trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (const g of groups) {
    if (g.length !== 5) throw new Error('Invalid Bacon input: every group needs exactly 5 symbols');
    const idx = CODES.indexOf(g.toLowerCase());
    if (idx === -1) throw new Error(`Invalid Bacon input: unknown group "${g}"`);
    out.push(LETTERS[idx]);
  }
  return out.join('');
}
