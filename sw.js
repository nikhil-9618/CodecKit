// sw.js — CodecKit service worker.
// Strategy: versioned precache of every static file, cache-first with a
// background revalidate for same-origin GETs, cache-first for the single
// CDN dependency (blueimp-md5), and NETWORK-ONLY for HIBP + NVD so breach
// and CVE data can never be served stale from a cache.
//
// Bump CACHE_VERSION whenever shipped files change; activate() drops old
// caches and takes control immediately.

const CACHE_VERSION = 'codeckit-v1.0.3';
const CDN_CACHE = 'codeckit-cdn-v1';
const NETWORK_ONLY_HOSTS = ['api.pwnedpasswords.com', 'services.nvd.nist.gov'];

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/app.js',
  '/router.js',

  '/lib/boot.js',
  '/lib/debounce.js',
  '/lib/clipboard.js',
  '/lib/storage.js',
  '/lib/detect.js',
  '/lib/errors.js',

  '/codecs/index.js',
  '/codecs/base64.js',
  '/codecs/base64url.js',
  '/codecs/base32.js',
  '/codecs/base58.js',
  '/codecs/url.js',
  '/codecs/hex.js',
  '/codecs/binary.js',
  '/codecs/rot.js',
  '/codecs/caesar.js',
  '/codecs/morse.js',
  '/codecs/bacon.js',
  '/codecs/html-entity.js',
  '/codecs/unicode-escape.js',
  '/codecs/jwt.js',
  '/codecs/jwt-sign.js',
  '/codecs/hash.js',
  '/codecs/hash-identify.js',

  '/pages/codecs.html',
  '/pages/jwt.html',
  '/pages/hash.html',
  '/pages/password.html',
  '/pages/timestamp.html',
  '/pages/subnet.html',
  '/pages/cve.html',
  '/pages/regex.html',
  '/pages/diff.html',
  '/pages/explain-command.html',
  '/pages/about.html',
  '/pages/cve.js',
  '/pages/diff.js',
  '/pages/explain-command.js',
  '/pages/hash.js',
  '/pages/jwt.js',
  '/pages/password.js',
  '/pages/regex.js',
  '/pages/subnet.js',
  '/pages/timestamp.js',

  '/base64-decoder/',
  '/jwt-decoder/',
  '/hex-to-text/',
  '/subnet-calculator/',
  '/timestamp-converter/',

  '/blog/',
  '/blog/base64-vs-base64url.html',
  '/blog/how-to-read-a-jwt.html',
  '/blog/what-is-k-anonymity.html',

  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: fetch every asset once. If one path is missing the whole precache
// would fail, so failures are collected per-URL and only logged — the app is
// still usable online, and the next activation retries.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const results = await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
    const failed = results
      .map((r, i) => (r.status === 'rejected' ? PRECACHE[i] : null))
      .filter(Boolean);
    if (failed.length) console.warn('[sw] precache missed:', failed);
    await self.skipWaiting();
  })());
});

// Activate: drop caches from older versions and claim open clients.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k !== CACHE_VERSION && k !== CDN_CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache live security data.
  if (NETWORK_ONLY_HOSTS.includes(url.hostname)) return;

  // The one external dependency: cache-first (opaque responses are fine).
  if (url.origin !== self.location.origin) {
    if (url.hostname === 'cdn.jsdelivr.net') {
      event.respondWith((async () => {
        const cache = await caches.open(CDN_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
        return res;
      })());
    }
    return;
  }

  // Same-origin: cache-first, revalidate in the background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });

    const network = fetch(request)
      .then((res) => {
        if (res.ok && res.type === 'basic') cache.put(request, res.clone());
        return res;
      })
      .catch(() => null);

    if (cached) return cached;

    const res = await network;
    if (res) return res;

    // Offline navigation to an unknown URL: fall back to the home shell.
    if (request.mode === 'navigate') {
      const home = await cache.match('/index.html');
      if (home) return home;
    }
    return new Response('Offline — this resource is not cached yet.', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  })());
});
