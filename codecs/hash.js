// codecs/hash.js — cryptographic hash generation.
// LAZY-LOADED (performance budget): Web Crypto module, imported only by
// hash.html. SHA-1/256/384/512 via crypto.subtle; MD5 via blueimp-md5
// (<script> on hash.html — the only external dependency, per spec).

export const meta = {
  id: 'hash',
  name: 'Hash Generator',
  canEncode: true,
  canDecode: false,
  description: 'MD5 + SHA family digests, lowercase hex.',
  explanation: `A cryptographic hash is a one-way fingerprint: same input always gives the same digest, and there is no "decode". Use SHA-256+ for integrity and signatures; MD5/SHA-1 are shown for legacy compatibility only.`,
};

export async function encode(input) {
  const str = String(input ?? '');
  if (str === '') return ''; // per contract: empty input → ''
  return (await digests(str)).sha256;
}

/** All digests at once — { md5, sha1, sha256, sha384, sha512 } as lowercase hex. */
export async function digests(input) {
  const str = String(input ?? '');
  const bytes = new TextEncoder().encode(str);

  const hexOf = (buf) => [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const sha = async (alg) => hexOf(await crypto.subtle.digest(alg, bytes));

  const [sha1, sha256, sha384, sha512] = await Promise.all([
    sha('SHA-1'), sha('SHA-256'), sha('SHA-384'), sha('SHA-512'),
  ]);

  let md5 = '';
  if (typeof window !== 'undefined' && typeof window.md5 === 'function') {
    md5 = window.md5(str); // blueimp-md5 returns lowercase hex string
  }

  return { md5, sha1, sha256, sha384, sha512 };
}
