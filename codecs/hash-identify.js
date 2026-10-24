// codecs/hash-identify.js — identify a hash format from length + charset.
// Pure heuristics (F. no network): 32-hex = MD5, 64-hex = SHA-256, $2y$ =
// bcrypt, etc. Confidence reflects ambiguity (several algos share lengths).

export const meta = {
  id: 'hash-identify',
  name: 'Hash Identifier',
  // "encode" is the meaningful direction here: it renders the candidate list
  // from the input hash. There is nothing to decode (one-way function).
  canEncode: true,
  canDecode: false,
  description: 'Guess hash algo from length/charset: MD5, SHA-1…bcrypt.',
  explanation: `Hashes have tell-tale shapes: 32 hex chars → MD5 or NTLM, 40 hex → SHA-1, 60 chars starting "\\$2y\\$" → bcrypt, "\\$argon2" → Argon2. This tool lists matching candidates with confidence and the reason it matched — identification, never verification.`,
};

const LENGTHS = {
  32: [
    { algo: 'MD5', confidence: 90, reason: '32 hex chars is MD5 length' },
    { algo: 'NTLM', confidence: 60, reason: 'NTLM hashes are also 32 hex chars' },
    { algo: 'MD4 / RIPEMD-128', confidence: 30, reason: 'legacy 128-bit digests share this length' },
  ],
  40: [
    { algo: 'SHA-1', confidence: 90, reason: '40 hex chars is SHA-1 length' },
    { algo: 'MySQL5 (old)', confidence: 25, reason: 'also stores 40 hex chars' },
  ],
  56: [
    { algo: 'SHA-224', confidence: 90, reason: '56 hex chars is SHA-224 length' },
    { algo: 'SHA-512/224', confidence: 40, reason: 'SHA-512/224 output is also 56 hex chars' },
  ],
  64: [
    { algo: 'SHA-256', confidence: 95, reason: '64 hex chars is SHA-256 length' },
    { algo: 'SHA3-256 / BLAKE2s', confidence: 35, reason: '256-bit SHA3 and BLAKE2s share this length' },
  ],
  96: [
    { algo: 'SHA-384', confidence: 90, reason: '96 hex chars is SHA-384 length' },
  ],
  128: [
    { algo: 'SHA-512', confidence: 95, reason: '128 hex chars is SHA-512 length' },
    { algo: 'SHA3-512 / Whirlpool', confidence: 30, reason: '512-bit digests share this length' },
  ],
};

export function identify(input) {
  const s = String(input ?? '').trim();
  if (s === '') return [];
  const results = [];

  if (/^[a-fA-F0-9]+$/.test(s)) {
    for (const { algo, confidence, reason } of LENGTHS[s.length] ?? []) {
      results.push({ algo, confidence, reason });
    }
    if (!results.length && /^[a-fA-F0-9]+$/.test(s) && s.length % 2 === 0) {
      results.push({ algo: 'Unknown hex digest', confidence: 10, reason: `hex string of length ${s.length} — no common algorithm matches` });
    }
  }

  if (/^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s)) {
    results.push({ algo: 'bcrypt', confidence: 99, reason: 'matches $2a/$2b/$2y$ 60-char bcrypt signature' });
  }
  if (/^\$argon2(id|i|d)\$/.test(s)) {
    results.push({ algo: 'Argon2', confidence: 99, reason: 'starts with $argon2 variant marker' });
  }
  if (/^\$1\$[./A-Za-z0-9]{8,16}\$[./A-Za-z0-9]{22}$/.test(s)) {
    results.push({ algo: 'MD5 crypt (uniscrypt $1$)', confidence: 95, reason: 'matches $1$ salt+22-char digest layout' });
  }
  if (/^\$5\$/.test(s)) {
    results.push({ algo: 'SHA-256 crypt ($5$)', confidence: 90, reason: 'starts with $5$ marker' });
  }
  if (/^\$6\$(?:rounds=\d+\$)?[./A-Za-z0-9]{1,16}\$[./A-Za-z0-9]{86}$/.test(s)) {
    results.push({ algo: 'SHA-512 crypt ($6$)', confidence: 95, reason: 'matches $6$ salt+86-char digest layout' });
  }

  if (!results.length) {
    results.push({ algo: 'Unrecognized', confidence: 0, reason: 'charset/length do not match common hash formats' });
  }
  return results.sort((a, b) => b.confidence - a.confidence);
}

export function decode() {
  throw new Error('Hashes are one-way — nothing to decode');
}

/** Registry-shaped text form ("encode" = render candidates). */
export function encode(input) {
  const list = identify(input);
  if (!list.length) return '';
  return list.map((r) => `${r.confidence.toString().padStart(3, ' ')}%  ${r.algo}\n      ${r.reason}`).join('\n');
}
