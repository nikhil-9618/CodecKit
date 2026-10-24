// codecs/jwt-sign.js — HS256 JWT signing with Web Crypto HMAC.
// LAZY-LOADED (performance budget): imported only by the JWT Signer page.
// Pure crypto: the secret never leaves the browser, nothing is fetched.

export const meta = {
  id: 'jwt-sign',
  name: 'JWT Signer',
  canEncode: true,
  canDecode: false,
  description: 'Create HS256-signed JWTs locally (testing only).',
  explanation: `Signs a header + payload pair with HMAC-SHA-256 (Web Crypto) and assembles token = header.payload.signature. ⚠️ For testing/learning only — never paste production secrets into a browser tool.`,
};

import { encode as b64urlEncode } from './base64url.js';

/**
 * @param {string} headerJson   e.g. '{"alg":"HS256","typ":"JWT"}'
 * @param {string} payloadJson  e.g. '{"sub":"1234"}'
 * @param {string} secret       HMAC key (kept local)
 * @returns {Promise<string>} compact JWT
 */
export async function sign(headerJson, payloadJson, secret) {
  if (!String(secret ?? '').length) throw new Error('Invalid JWT signer input: missing secret');

  // Accept either JSON text (page textareas) or already-parsed objects
  // (playground input is a JSON document: {"header":…,"payload":…,"secret":…}).
  const header = parseObject(headerJson ?? { alg: 'HS256', typ: 'JWT' }, 'header');
  if (header.alg !== 'HS256') {
    throw new Error('Invalid JWT signer input: only alg=HS256 is supported (Web Crypto HMAC-SHA-256)');
  }
  const payload = parseObject(payloadJson, 'payload');

  const data = `${b64urlEncode(JSON.stringify(header))}.${b64urlEncode(JSON.stringify(payload))}`;
  const sig = await hmacB64url(secret, data);
  return `${data}.${sig}`;
}

/** Contract shape: input is {"header":..., "payload":..., "secret":...} JSON. */
export async function encode(input) {
  const str = String(input ?? '').trim();
  if (str === '') return '';
  let args;
  try { args = JSON.parse(str); } catch { throw new Error('Invalid JWT signer input: not JSON'); }
  return sign(args.header, args.payload, args.secret);
}

async function hmacB64url(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const bin = String.fromCharCode(...new Uint8Array(sig));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parseObject(value, what) {
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); }
    catch { throw new Error(`Invalid JWT signer input: bad ${what} JSON`); }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid JWT signer input: bad ${what} JSON`);
  }
  return parsed;
}
