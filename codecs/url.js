// codecs/url.js — percent-encoding (URL encoding).

export const meta = {
  id: 'url',
  name: 'URL Encode',
  canEncode: true,
  canDecode: true,
  description: 'Percent-encoding for URLs and query strings.',
  explanation: `URL encoding escapes characters that have special meaning in URLs (spaces, &, =, #…) as %XX byte sequences. "a b&c=1" → "a%20b%26c%3D1". Decoding also treats '+' as a space, since many query strings use it.`,
};

export function encode(input) {
  const s = String(input ?? '');
  if (s === '') return '';
  return encodeURIComponent(s);
}

export function decode(input) {
  const s = String(input ?? '').trim();
  if (s === '') return '';
  const normalized = s.replace(/\+/g, '%20'); // form-style spaces
  try {
    return decodeURIComponent(normalized); // throws URIError on bad % sequences
  } catch {
    throw new Error('Invalid URL encoded input');
  }
}
