// codecs/morse.js — International Morse code.
// Encode: letters/digits/punctuation → dot-dash, letter gaps ' ', word gaps ' / '.
// Decode: exact inverse; unknown sequences throw.

export const meta = {
  id: 'morse',
  name: 'Morse',
  canEncode: true,
  canDecode: true,
  description: 'Text ↔ International Morse code.',
  explanation: `Morse encodes each letter as short/long tone sequences: S = "...", O = "---", so SOS = "... --- ...". Letters are separated by a space, words by " / ". The table here covers A–Z, 0–9 and common punctuation.`,
};

export const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
  '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.',
};

const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([ch, seq]) => [seq, ch]));

export function encode(input) {
  const text = String(input ?? '').trim().toUpperCase();
  if (text === '') return '';
  const words = text.split(/\s+/);
  const out = words.map((word) =>
    word.split('').map((ch) => {
      const seq = MORSE[ch];
      if (!seq) throw new Error(`Invalid Morse input: unsupported character "${ch}"`);
      return seq;
    }).join(' ')
  ).join(' / ');
  return out;
}

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  if (!/^[.\- /]+$/.test(s.replace(/[|,;]/g, '/'))) {
    // allow '|' and ',' as word separators in lenient input, nothing else
    const cleaned = s.replace(/[|,;]/g, '/');
    return decode(cleaned);
  }
  const words = s.split(/\s*\/\s*/);
  const text = words.map((word) =>
    word.trim().split(/\s+/).filter(Boolean).map((seq) => {
      const ch = REVERSE[seq];
      if (!ch) throw new Error(`Invalid Morse input: unknown sequence "${seq}"`);
      return ch;
    }).join('')
  ).join(' ');
  return text;
}
