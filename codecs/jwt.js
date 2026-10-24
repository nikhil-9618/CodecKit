// codecs/jwt.js — JWT decoder. Pure: split token, base64url-decode header
// and payload, pretty-print, humanize iat/exp/nbf, flag expiry.
// Decode only — a decoder cannot verify a signature and never pretends to.

export const meta = {
  id: 'jwt',
  name: 'JWT Decoder',
  canEncode: false,
  canDecode: true,
  description: 'Decode JSON Web Tokens: header, payload, expiry status.',
  explanation: `A JWT is three Base64URL strings joined by dots: header.payload.signature. Decoding shows what the server put inside — claims like sub, iss, and exp timestamps converted to human-readable dates. Decoded only: the signature is NOT verified here.`,
};

import { decode as b64urlDecode } from './base64url.js';

const DONKEY = (id) => `Invalid JWT input: ${id}`;

export function parse(token) {
  const parts = String(token ?? '').trim().split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT input: a token has 3 dot-separated parts');

  let header, payload;
  try { header = JSON.parse(b64urlDecode(parts[0])); } catch { throw new Error('Invalid JWT input: header is not valid JSON'); }
  try { payload = JSON.parse(b64urlDecode(parts[1])); } catch { throw new Error('Invalid JWT input: payload is not valid JSON'); }
  if (!header || !payload || typeof header !== 'object' || typeof payload !== 'object') {
    throw new Error('Invalid JWT input');
  }
  return { header, payload, signature: parts[2] };
}

const DATE_KEYS = { iat: 'issued at', exp: 'expires', nbf: 'not before' };

function pretty(json) {
  // JSON.stringify with sorted-ish insertion order preserved, 2-space indent
  return JSON.stringify(json, null, 2);
}

export function decode(input) {
  const token = String(input ?? '').trim();
  if (token === '') return '';
  const { header, payload } = parse(token);

  const humanize = (obj) => stringifyWithDates(obj);
  const now = Date.now();
  let expLine = '';
  if (typeof payload.exp === 'number') {
    const expired = payload.exp * 1000 < now;
    expLine = expired
      ? `\n// ⛔ EXPIRED since ${new Date(payload.exp * 1000).toISOString()}`
      : `\n// ✅ valid until ${new Date(payload.exp * 1000).toISOString()}`;
  }

  return [
    '// Header',
    pretty(humanize(header)),
    '',
    '// Payload',
    pretty(humanize(payload)) + expLine,
    '',
    '// ⚠️ Decoded only. Signature NOT verified.',
  ].join('\n');
}

/** Recursively convert iat/exp/nbf numeric timestamps to ISO strings. */
function stringifyWithDates(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stringifyWithDates);
  const out = {};
  for (const key of Object.keys(value)) {
    const v = value[key];
    if (DATE_KEYS[key] && typeof v === 'number') {
      out[key] = `${v} (${new Date(v * 1000).toISOString()})`;
    } else {
      out[key] = stringifyWithDates(v);
    }
  }
  return out;
}
