// codecs/html-entity.js — HTML entity encoding/decoding.
// Encode: the five XML-critical characters. Decode: numeric refs + a
// practical named-entity table (no external dependency).

export const meta = {
  id: 'html-entity',
  name: 'HTML Entity',
  canEncode: true,
  canDecode: true,
  description: 'HTML entities (&amp; &#39; &#xущее) escaping.',
  explanation: `HTML entities let <, >, &, quotes and Unicode symbols appear safely in markup: &lt;script&gt; instead of <script>. Encoding covers the five XML-critical characters; decoding understands both numeric (&#65;, &#x41;) and common named entities.`,
};

export function encode(input) {
  const s = String(input ?? '');
  if (s === '') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const NAMES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', copy: '©', reg: '®', trade: '™', hellip: '…',
  mdash: '—', ndash: '–', lsquo: '\u2018', rsquo: '\u2019',
  ldquo: '“', rdquo: '”', bull: '•', middot: '·',
  deg: '°', plusmn: '±', frac12: '½', times: '×', divide: '÷',
  euro: '€', pound: '£', yen: '¥', cent: '¢',
  larr: '←', rarr: '→', uarr: '↑', darr: '↓', infin: '∞',
  check: '✓',
};

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  const out = s.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const num = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(num) || num < 0 || num > 0x10ffff) {
        throw new Error(`Invalid HTML entity input: bad numeric code "${whole}"`);
      }
      return String.fromCodePoint(num);
    }
    const val = NAMES[body.toLowerCase()] ?? NAMES[body];
    if (val === undefined) throw new Error(`Invalid HTML entity input: unknown entity "${whole}"`);
    return val;
  });
  return out;
}
