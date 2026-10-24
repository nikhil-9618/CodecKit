// tests/codec-tests.mjs — plain Node script (no test framework per spec).
// Run from project root:  node tests/codec-tests.mjs
import * as base64 from '../codecs/base64.js';
import * as base64url from '../codecs/base64url.js';
import * as base32 from '../codecs/base32.js';
import * as base58 from '../codecs/base58.js';
import * as url from '../codecs/url.js';
import * as hex from '../codecs/hex.js';
import * as binary from '../codecs/binary.js';
import * as rot from '../codecs/rot.js';
import * as caesar from '../codecs/caesar.js';
import * as morse from '../codecs/morse.js';
import * as bacon from '../codecs/bacon.js';
import * as htmlEntity from '../codecs/html-entity.js';
import * as unicodeEscape from '../codecs/unicode-escape.js';
import * as jwt from '../codecs/jwt.js';
import * as hashIdentify from '../codecs/hash-identify.js';

let passed = 0, failed = 0;
const eq = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`); }
};
const throws = (label, fn) => {
  try { fn(); failed++; console.error(`  ✗ ${label} (did not throw)`); }
  catch (e) { passed++; console.log(`  ✓ ${label} → "${e.message}"`); }
};
const awaitThrows = async (label, p) => {
  try { await p(); failed++; console.error(`  ✗ ${label} (did not throw)`); }
  catch (e) { passed++; console.log(`  ✓ ${label} → "${e.message}"`); }
};

console.log('v1 codecs');
eq('base64 UTF-8 round-trip', base64.decode(base64.encode('café ☕ 日本')), 'café ☕ 日本');
eq('base64 known vector', base64.encode('Hello, World!'), 'SGVsbG8sIFdvcmxkIQ==');
throws('base64 invalid "!!!"', () => base64.decode('!!!'));
eq('url encode', url.encode('a b&c=1'), 'a%20b%26c%3D1');
eq('url decode with +', url.decode('a+b%26c%3D1'), 'a b&c=1');
throws('url bad % sequence', () => url.decode('100%zz'));
eq('hex encode', hex.encode('Hello'), '48656c6c6f');
eq('hex decode spaced', hex.decode('48 65 6c 6c 6f'), 'Hello');
throws('hex odd length', () => hex.decode('486'));
eq('binary decode "Hi"', binary.decode('01001000 01101001'), 'Hi');
eq('binary encode round-trip', binary.decode(binary.encode('Hi')), 'Hi');
eq('rot13', rot.encode('Hello'), 'Uryyb');
eq('rot13 symmetric', rot.decode(rot.encode('Attack at dawn!')), 'Attack at dawn!');
eq('caesar +3', caesar.encode('abc'), 'def');
eq('caesar decode -3', caesar.decode('def'), 'abc');
eq('caesar shift 25', caesar.encodeShift('abc', 25), 'zab');
throws('caesar shift 0 rejected', () => caesar.encodeShift('abc', 0));
eq('unicode escape', unicodeEscape.encode('你'), '\\u4f60');
eq('unicode decode', unicodeEscape.decode('\\u4f60\\u597d'), '你好');
eq('unicode astral surrogate pair', unicodeEscape.decode(unicodeEscape.encode('🐬')), '🐬');

console.log('v2 codecs');
eq('base64url no padding', base64url.encode('Hello'), 'SGVsbG8');
eq('base64url decode padded input', base64url.decode('SGVsbG8='), 'Hello');
eq('base32', base32.encode('abc'), 'MFRGG===');
eq('base32 round-trip', base32.decode(base32.encode('Base32 test!')), 'Base32 test!');
throws('base32 bad alphabet', () => base32.decode('18'));
eq('base58 round-trip', base58.decode(base58.encode('Hello World')), 'Hello World');
throws('base58 ambiguous char "0"', () => base58.decode('0OIl'));
eq('morse SOS round-trip', morse.decode(morse.encode('SOS')), 'SOS');
eq('morse known', morse.encode('SOS'), '... --- ...');
throws('morse unknown char ~', () => morse.encode('~x'));
throws('morse unknown sequence', () => morse.decode('....... ....'));
eq('bacon E/F', bacon.encode('EF'), 'aabaa aabab');
eq('bacon round-trip (I as J merged)', bacon.decode(bacon.encode('HELLO')), 'HELLO');
throws('bacon bad group length', () => bacon.decode('aaaaa aaa'));
eq('html entity round-trip', htmlEntity.decode(htmlEntity.encode('<a href="x">…</a> & \'q\'')), '<a href="x">…</a> & \'q\'');
eq('html numeric decode', htmlEntity.decode('&#65;&#x42;'), 'AB');
throws('html unknown entity', () => htmlEntity.decode('&bogus;'));

console.log('token / hash tooling');
const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const parsed = jwt.parse(SAMPLE);
eq('jwt header', parsed.header, { alg: 'HS256', typ: 'JWT' });
eq('jwt payload', parsed.payload, { sub: '1234567890', name: 'John Doe' });
eq('jwt decode contains payload + NOT verified', jwt.decode(SAMPLE).includes('Signature NOT verified'), true);
throws('jwt 2 parts', () => jwt.decode('aaa.bbb'));
eq('jwt encode disabled', jwt.meta.canEncode, false);

eq('identify md5', hashIdentify.identify('d41d8cd98f00b204e9800998ecf8427e')[0].algo, 'MD5');
eq('identify sha256', hashIdentify.identify('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')[0].algo, 'SHA-256');
eq('identify bcrypt', hashIdentify.identify('$2y$10$' + 'a'.repeat(53))[0].algo, 'bcrypt');
eq('identify argon2', hashIdentify.identify('$argon2id$v=19$m=65536,t=3,p=1$abc')[0].algo, 'Argon2');
eq('identify garbage', hashIdentify.identify('not a hash')[0].algo, 'Unrecognized');
eq('identify sha512 length', hashIdentify.identify('a'.repeat(128))[0].algo, 'SHA-512');
eq('identify sha512 crypt', hashIdentify.identify('$6$salt$' + 'b'.repeat(86))[0].algo, 'SHA-512 crypt ($6$)');
eq('identify sha512 crypt rounds', hashIdentify.identify('$6$rounds=5000$salt$' + 'b'.repeat(86))[0].algo, 'SHA-512 crypt ($6$)');

// async hash module needs crypto.subtle (Node ≥ 20 has it)
const hash = await import('../codecs/hash.js');
eq('sha256("hello")', await hash.encode('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
const d = await hash.digests('test');
eq('sha1("test")', d.sha1, 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
eq('sha512("test") len', d.sha512.length, 128);

// async jwt-sign module: HMAC vector cross-checked independently
const jwtSign = await import('../codecs/jwt-sign.js');
const token = await jwtSign.sign('{"alg":"HS256","typ":"JWT"}', '{"sub":"1234"}', 'hunter2');
eq('jwt-sign round shape', token.split('.').length, 3);
const dec = jwt.parse(token);
eq('jwt-sign payload survives', dec.payload, { sub: '1234' });
// independently compute expected HMAC in Node
const { createHmac } = await import('node:crypto');
const data = token.split('.').slice(0, 2).join('.');
const expSig = createHmac('sha256', 'hunter2').update(data)
  .digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
eq('jwt-sign HMAC matches node:crypto', token.split('.')[2], expSig);
await awaitThrows('jwt-sign rejects alg none', () => jwtSign.sign('{"alg":"none","typ":"JWT"}', '{"sub":"x"}', 's'));
await awaitThrows('jwt-sign missing secret', () => jwtSign.sign('{"alg":"HS256"}', '{"sub":"x"}', ''));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
