# CodecKit

A developer and cybersecurity toolkit that runs **entirely in your browser**.
Encoders, JWT tools, hashes, a password breach check, subnet math, CVE
explainers, regex testing and more — no accounts, no ads, no analytics, no
backend. After the first visit it works offline.

```
No build step. No dependencies to install. No server.
```

## Quick start

ES modules and the service worker need an HTTP origin, so `file://` will not
work. Any static server is enough:

```bash
# Python 3
python3 -m http.server 8080

# or Node
npx --yes serve .
```

Open <http://localhost:8080>. That is the whole setup — there is no `npm
install`, no bundler and no transpiler.

## Deploy

The repository root **is** the publish directory.

### Vercel

1. Push the folder to GitHub.
2. Import it in Vercel; framework preset **Other**, build command empty,
   output directory `.`.
3. Deploy. `vercel.json` adds the security headers and long-lived asset
   caching.

### Netlify

1. Drag the folder onto <https://app.netlify.com/drop>, or connect the repo.
2. Build command empty, publish directory `.`.
3. `netlify.toml` supplies the same headers.

### Cloudflare Workers

Deploy from the repository root with `npx wrangler deploy`. `wrangler.jsonc`
configures the static assets and disables automatic HTML URL rewriting, so
links such as `/pages/codecs.html` are served directly.

### Render

1. Push the repo to GitHub/GitLab.
2. Render → **New** → **Blueprint**, pick the repo. [`render.yaml`](render.yaml)
   creates a static site with build command `true` (a no-op), publish path `.`,
   and the same security headers as the other configs.
3. Or create a **Static Site** manually: build command `true`, publish
   directory `.`.

Render serves directory indexes, so `/base64-decoder/` works without rewrites,
and `/sw.js` is sent with `Cache-Control: no-cache`.

### Railway

Railway's Railpack builder detects a root `index.html` and serves it with
Caddy; [`Staticfile`](Staticfile) pins the root and disables SPA fallback.

```bash
npx @railway/cli login          # opens the browser / device-code flow
npx @railway/cli init           # or: railway link (existing project)
npx @railway/cli up             # uploads this directory, no Git needed
npx @railway/cli domain         # generate the public HTTPS URL
```

No build command or start command is needed. Railway's default static server
does **not** apply the custom CSP from `vercel.json`/`render.yaml`; use Render,
Vercel or Netlify if you need those headers. HTTPS (and therefore the service
worker) is provided by Railway's domain.

### Any static host

Upload the files as-is (GitHub Pages, Cloudflare Pages, S3, nginx). Serve
`/base64-decoder/` style directories with their `index.html`. HTTPS is
required for the service worker and the Clipboard API.

### Before publishing

- [ ] Replace the placeholder GitHub and donation links in
      `pages/about.html` (marked with `TODO`).
- [ ] If you add a custom domain, you can add `<link rel="canonical">` and
      `og:url` tags to the SEO pages.
- [ ] Bump `CACHE_VERSION` in `sw.js` after changing cached files.

## What is inside

```
index.html              landing page, toolkit grid
app.js                  UI runtime: playground, tabs, shortcuts, history
router.js               ~60-line hash router
styles.css              the only stylesheet
sw.js                   service worker (precache + strategies)
manifest.json           PWA manifest
/lib/                   debounce, clipboard, storage, detect, errors, boot
/codecs/                pure codec modules + registry
/pages/                 tool pages and their page-specific wiring
/base64-decoder/        SEO landing pages (static HTML + embedded tool)
/jwt-decoder/
/hex-to-text/
/subnet-calculator/
/timestamp-converter/
/blog/                  three articles
/tests/codec-tests.mjs  Node test suite for the codec layer
/tools/                 icon generator (build-time only, not shipped)
```

## File → Base64

The Base64, Hex and Binary tabs in the playground show a drop zone above the
input. Drop a file (5 MB cap) or use the picker, and the output becomes a
`data:` URI (Base64) or the byte dump (hex/binary). The file never leaves the
browser — it is read with the File API and encoded locally.

### Layers

| Layer | Files | Rule |
| --- | --- | --- |
| Presentation | `*.html`, `styles.css` | markup and styling only |
| Application | `app.js`, `router.js`, `lib/` | may touch the DOM |
| Codec | `codecs/*.js` | **pure** `(string) => string`, no DOM, no storage, no fetch |
| Platform | Web Crypto, TextEncoder, localStorage, Clipboard, File API | browser APIs |
| Offline | `sw.js`, `manifest.json` | cache-first static, network-only APIs |

## Adding a codec

1. Create `codecs/my-thing.js`:

   ```js
   export const meta = {
     id: 'my-thing',
     name: 'My Thing',
     canEncode: true,
     canDecode: true,
     description: 'One line for the tool cards.',
     explanation: 'What it is and where it is used.',
   };
   export function encode(input) { /* ... */ return ''; }   // throw on bad input
   export function decode(input) { /* ... */ return ''; }
   ```

2. Add one line to `codecs/index.js`.
3. Append the file to `PRECACHE` in `sw.js` and bump `CACHE_VERSION`.
4. Add cases to `tests/codec-tests.mjs` and run `node tests/codec-tests.mjs`.

The codec appears automatically in the playground tabs and the home grid is
data-driven, so no other wiring is required.

### Async codecs

`hash.js` and `jwt-sign.js` are async because they use `crypto.subtle`. The
playground awaits any codec that returns a promise; lazy codecs are declared in
`codecs/index.js` so their modules are only fetched when opened.

## Tests

```bash
node tests/codec-tests.mjs
```

Covers round-trips for every codec, UTF-8 edge cases (multi-byte, emoji,
surrogates), invalid-input errors, and an HMAC comparison against Node's
`crypto` module. 55 assertions, no test framework.

For the browser tools, the checklists used during development are in the
project history: round-trips in the playground, subnet values against
`ipcalc`, HIBP prefix visibility in the network panel, JWT output accepted by
jwt.io, CVE lookups against NVD, and a clean console on every page.

## Privacy model

- No accounts, cookies, analytics or third-party fonts.
- All conversions run in the tab; nothing is uploaded.
- **Two network calls exist, both deliberate:**
  1. `api.pwnedpasswords.com/range/<first 5 hex of SHA-1>` — k-anonymity
     breach check. The remaining 35 characters never leave the browser.
  2. `services.nvd.nist.gov/...?cveId=...` — sends a public CVE ID, caches the
     response in `localStorage` for 24 hours.
- Secrets pasted into the JWT signer are used by Web Crypto in the page and
  are never transmitted or stored.
- `localStorage` holds preferences, the last 10 inputs per tool and CVE
  cache entries. "Reset all locally saved data" on the About page clears it.

## Performance notes

Vanilla ES modules, one CSS file, system fonts, no framework or polyfill. The
hash and JWT-signing modules are loaded on demand. The service worker
precaches the static shell so repeat visits and offline use need no network.

## Browser support

Current Chrome, Edge, Firefox and Safari. Requires ES modules, `crypto.subtle`
(secure context), `TextEncoder` and, for offline support, service workers.
`String.prototype.replaceAll` is avoided.

## License

MIT — see [LICENSE](LICENSE).
