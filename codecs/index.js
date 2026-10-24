// codecs/index.js — the registry. Adding a codec = 1 file + 1 import below
// (+ 1 object entry). hash.js and jwt-sign.js (Web Crypto) are registered at
// runtime by their pages via register(), so browsers only load them when a
// page actually needs them (lazy-load per performance budget).

import * as base64 from './base64.js';
import * as base64url from './base64url.js';
import * as base32 from './base32.js';
import * as base58 from './base58.js';
import * as url from './url.js';
import * as hex from './hex.js';
import * as binary from './binary.js';
import * as rot from './rot.js';
import * as caesar from './caesar.js';
import * as morse from './morse.js';
import * as bacon from './bacon.js';
import * as htmlEntity from './html-entity.js';
import * as unicodeEscape from './unicode-escape.js';
import * as jwt from './jwt.js';
import * as hashIdentify from './hash-identify.js';

export const codecs = {
  base64,
  base64url,
  base32,
  base58,
  url,
  hex,
  binary,
  rot,
  caesar,
  morse,
  bacon,
  'html-entity': htmlEntity,
  'unicode-escape': unicodeEscape,
  jwt,
  'hash-identify': hashIdentify,
};

export const list = Object.values(codecs);
export const get = (id) => codecs[id];

/** Runtime registration for lazy modules: register(await import('./hash.js')). */
export function register(mod) {
  if (!mod || !mod.meta || !mod.meta.id || codecs[mod.meta.id]) return;
  codecs[mod.meta.id] = mod;
}

/** Tab metadata for the lazy Web Crypto codecs (not in `list` until loaded). */
export const lazyMeta = [
  {
    id: 'hash', name: 'Hash Generator', canEncode: true, canDecode: false,
    description: 'MD5 + SHA digests, lowercase hex.',
    explanation: '',
  },
  {
    id: 'jwt-sign', name: 'JWT Signer', canEncode: true, canDecode: false,
    description: 'Create HS256-signed JWTs locally (testing only).',
    explanation: '',
  },
];

/** Lazy loader used by app.js playground tabs. */
export async function ensure(id) {
  if (get(id)) return get(id);
  if (id === 'hash') { register(await import('./hash.js')); return get(id); }
  if (id === 'jwt-sign') { register(await import('./jwt-sign.js')); return get(id); }
  return null;
}
