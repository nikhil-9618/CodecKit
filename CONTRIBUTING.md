# Contributing to CodecKit

Thanks for helping. The project has a deliberately small surface: static
files, vanilla ES modules, no build step. Keeping it that way is the point.

## Ground rules

- **No dependencies.** No framework, no CSS library, no bundler, no npm
  install. The only external script is blueimp-md5 from jsDelivr, used for
  MD5 because Web Crypto does not provide it.
- **No backend.** Everything is computed in the browser. The only network
  calls allowed are the HIBP range endpoint and the NVD CVE API.
- **No tracking.** No analytics, cookies, fonts or images from third parties.
- **Accessibility matters.** Keyboard reachable, labelled controls, visible
  focus, sensible heading order. The theme toggle must not be the only way to
  read the page.

## Adding a codec

A codec is one file plus one registry line. Follow the contract in
`codecs/base64.js`:

```js
export const meta = {
  id: 'base64',                 // unique, kebab-case
  name: 'Base64',               // tab label
  canEncode: true,
  canDecode: true,
  description: 'One line for cards.',
  explanation: 'A short paragraph for the "About" panel.',
};
export function encode(input) { /* ... */ }
export function decode(input) { /* ... */ }
```

Requirements:

- Pure functions: `(string) => string`. No DOM, no `localStorage`, no `fetch`,
  no module-level mutable state.
- Empty input returns `''`.
- Invalid input throws `new Error('Invalid <format> input…')` with a short,
  actionable message. Never return `null` or `undefined`.
- Decode must accept the whitespace and padding variants real data contains.
- Async is allowed (`hash.js`, `jwt-sign.js`); the UI awaits promises.
- Add the file to `PRECACHE` in `sw.js` and bump `CACHE_VERSION`.
- Add round-trip and invalid-input cases to `tests/codec-tests.mjs`.

## Adding a tool page

1. Create `pages/name.html` and, if needed, `pages/name.js`.
2. Reuse the header, footer, `.tool` section and `error-line` markup from an
   existing page.
3. Add the link to the nav on every page (there is no templating) and a card
   to `index.html`.
4. Add both files to `PRECACHE`.
5. Handle errors with the shared red error line; never let an exception reach
   the console unhandled.

## Style

- Two-space indent, semicolons, single quotes.
- Prefer `textContent` over `innerHTML` when inserting data derived from user
  input. If markup is unavoidable, escape it (`pages/regex.js` shows the
  pattern).
- Small, focused functions with a short comment saying why, not what.
- No classes or abstractions for a single use.

## Testing

```bash
node tests/codec-tests.mjs
```

The suite is dependency-free. For page changes, run a static server and check
the page in a browser with the console open; verify one success case and one
invalid-input case.

## Pull requests

- One topic per PR.
- Describe the user-visible change and how you verified it.
- Do not reformat unrelated files, and do not commit generated build output.

By contributing you agree that your work is licensed under the MIT license.
