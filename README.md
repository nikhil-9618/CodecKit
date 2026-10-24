
<div align="center">

# CodecKit

### The Browser-Native Developer & Cybersecurity Toolkit

**Encode. Decode. Analyze. Secure.**

A lightweight, privacy-first toolkit for developers and cybersecurity professionals. Perform encoding, decoding, cryptographic operations, JWT inspection, password breach checks, subnet calculations, CVE lookups, and more — directly in your browser.

[![GitHub Repository](https://img.shields.io/badge/GitHub-nikhil--9618%2FCodecKit-181717?style=for-the-badge&logo=github)](https://github.com/nikhil-9618/CodecKit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Vanilla JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Privacy First](https://img.shields.io/badge/Privacy-First-16A34A?style=for-the-badge&logo=securityscorecard&logoColor=white)](#privacy--security)

**No accounts · No advertisements · No analytics · No backend**

[Explore Features](#-features) · [Quick Start](#-quick-start) · [Deployment](#-deployment) · [Security](#-privacy--security)

</div>

---

## Overview

CodecKit brings essential developer utilities and cybersecurity tools into one accessible web application.

Built with vanilla JavaScript and native browser APIs, it requires no dependency installation, compilation, or application server. Its modular architecture makes it easy to extend with additional codecs and utilities.

### Why CodecKit?

- **Privacy-first architecture** — process data locally whenever possible.
- **Zero-install setup** — no package manager or build pipeline required.
- **Offline-ready experience** — access cached application resources after the initial visit.
- **Modular design** — independent JavaScript ES modules for codec operations.
- **Security-focused utilities** — work with hashes, JWTs, subnet calculations, and public vulnerability information.
- **Simple deployment** — publish the repository directly to a static hosting provider.

## 🚀 Features

### Encoding & Decoding

- Base64 encoder and decoder
- Hexadecimal encoder and decoder
- Binary representation
- Text-to-byte conversions
- File-to-Base64 data URI conversion
- File-to-hex and file-to-binary conversion

### Cryptography & JWT

- Hash generation using Web Crypto
- JWT decoding and inspection
- JWT signing using browser cryptographic APIs
- HMAC test-vector verification
- Input validation and error handling

> Decoding a JWT does not validate its signature. Always verify signatures and relevant claims before trusting a token.

### Password Security

- Password breach checking through Have I Been Pwned
- SHA-1 prefix-based k-anonymity lookup
- Local comparison of returned hash suffixes

The breach checker sends the first five hexadecimal characters of the password's SHA-1 hash, rather than the complete hash or plaintext password.

### Networking & Vulnerability Research

- IPv4 subnet calculations
- CVE information lookup through the NIST National Vulnerability Database
- Regular expression testing
- Timestamp conversion
- Additional developer utilities available in the application

### Application Experience

- Interactive codec playground
- Data-driven tool registry
- Responsive interface
- File drag-and-drop support
- Clipboard integration
- Tool-specific input history
- Progressive Web App support
- Service-worker caching for offline access

*Features listed above should be verified against the current implementation before release.*

## ⚡ Quick Start

CodecKit requires no build step and no dependency installation.

### Prerequisites

- Python 3 or Node.js
- A modern browser with ES module support

### 1. Clone the repository

```bash
git clone https://github.com/nikhil-9618/CodecKit.git
cd CodecKit
```

### 2. Start a local server

**Python**

```bash
python3 -m http.server 8080
```

**Node.js**

```bash
npx --yes serve .
```

### 3. Open the application

Visit:

```text
http://localhost:8080
```

That's it. No `npm install`, build command, or backend configuration is required.

> Opening `index.html` through `file://` is not supported. ES modules and service workers require an appropriate HTTP or HTTPS origin.

## 🌐 Deployment

CodecKit is a static web application. The repository root is the publish directory.

| Platform | Build command | Publish directory |
|---|---|---|
| Vercel | Leave empty | `.` |
| Netlify | Leave empty | `.` |
| Render Static Site | `true` | `.` |
| Cloudflare Pages | No build required | `.` |
| GitHub Pages | No build required | Repository root |

### Vercel

1. Push the repository to GitHub.
2. Import `nikhil-9618/CodecKit` into Vercel.
3. Select **Other** as the framework preset.
4. Leave the build command empty.
5. Set the output directory to `.`.
6. Deploy.

### Netlify

1. Connect your GitHub repository or use [Netlify Drop](https://app.netlify.com/drop).
2. Leave the build command empty.
3. Set the publish directory to `.`.
4. Deploy.

### Render

1. Push the project to GitHub.
2. Open Render and select **New → Blueprint**.
3. Select `nikhil-9618/CodecKit`.
4. Review the `render.yaml` configuration.
5. Deploy the static site.

**Important:** These instructions assume the corresponding deployment configuration files exist and are valid. Verify the deployed security headers and nested routes after publishing.

## 🏗️ Project Structure

```text
CodecKit/
├── index.html
├── app.js
├── router.js
├── styles.css
├── sw.js
├── manifest.json
│
├── lib/
│   ├── debounce.js
│   ├── clipboard.js
│   ├── storage.js
│   ├── detect.js
│   ├── errors.js
│   └── boot.js
│
├── codecs/
│   ├── index.js
│   └── ...
│
├── pages/
│   └── ...
│
├── base64-decoder/
├── jwt-decoder/
├── hex-to-text/
├── subnet-calculator/
├── timestamp-converter/
│
├── blog/
├── tests/
│   └── codec-tests.mjs
│
├── tools/
├── vercel.json
├── netlify.toml
├── render.yaml
├── Staticfile
├── LICENSE
└── README.md
```

### Architecture

| Layer | Responsibility |
|---|---|
| Presentation | HTML and CSS |
| Application | Routing, UI, state, and orchestration |
| Codec | Independent encoding and decoding modules |
| Platform | Web Crypto, File API, Clipboard, and local storage |
| Offline | Service worker and PWA manifest |

The separation between the application and codec layers keeps conversion logic reusable and testable.

## 📁 File Encoding

The Base64, Hex, and Binary playground tabs support local file conversion.

1. Select a file or drag it into the drop zone.
2. The browser reads the file using the File API.
3. CodecKit converts its contents locally.
4. The output appears in the playground.

| Mode | Result |
|---|---|
| Base64 | Encoded data URI |
| Hex | Hexadecimal byte representation |
| Binary | Binary byte representation |

**Maximum file size:** 5 MB.

Files are not uploaded by the documented encoding workflow.

## 🧩 Extending CodecKit

Add new codecs through the existing registry architecture.

Create `codecs/my-thing.js`:

```javascript
export const meta = {
  id: 'my-thing',
  name: 'My Thing',
  canEncode: true,
  canDecode: true,
  description: 'A short description.',
  explanation: 'Explain the format and its use cases.'
};

export function encode(input) {
  // Implement encoding logic.
  // Throw an Error for invalid input.
  return '';
}

export function decode(input) {
  // Implement decoding logic.
  // Throw an Error for invalid input.
  return '';
}
```

Then:

1. Register the module in `codecs/index.js`.
2. Add the file to `PRECACHE` in `sw.js`.
3. Increment `CACHE_VERSION`.
4. Add test cases to `tests/codec-tests.mjs`.

## 🧪 Testing

Run the codec regression suite:

```bash
node tests/codec-tests.mjs
```

The documented suite covers round-trip conversions, UTF-8 edge cases, invalid-input handling, and HMAC comparisons against Node.js cryptographic operations.

Additional manual checks should validate subnet calculations, password breach-check requests, JWT behavior, CVE lookups, nested routes, offline functionality, and production response headers.

## 🔒 Privacy & Security

CodecKit is designed to minimize data transmission.

### Local Processing

- Encoding and decoding run in the browser.
- File conversions use the File API.
- JWT signing uses Web Crypto.
- Application functionality does not require a dedicated backend.

### External API Requests

Two documented features contact external services:

| Feature | Service | Data sent |
|---|---|---|
| Password breach check | Have I Been Pwned | First five hexadecimal characters of the SHA-1 hash |
| CVE lookup | NIST NVD API | Public CVE identifier |

CVE responses are cached locally for 24 hours according to the documented design.

### Local Data

`localStorage` holds preferences, recent tool inputs, and CVE cache entries. Use **Reset all locally saved data** on the About page to clear application-managed saved data.

Do not enter sensitive production secrets into browser utilities unless you understand the security implications and local retention behavior.

### Security Considerations

- SHA-1 is used for compatibility with the breach-checking protocol, not for secure password storage.
- Decoded JWT claims must be treated as untrusted until verified.
- Browser-local processing does not protect against compromised devices or malicious extensions.
- External services receive the information required for their respective lookups.
- Hosting configurations must be checked to confirm that security headers are actually applied.

## ⚙️ Performance & Offline Support

CodecKit uses vanilla JavaScript ES modules, a single stylesheet, system fonts, and native browser APIs.

The service worker precaches application resources to enable offline access after the initial cache has been populated.

Features requiring live API responses may remain unavailable offline unless usable cached data exists.

Increment `CACHE_VERSION` whenever cached assets change.

## 🌍 Browser Compatibility

Target browsers:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Apple Safari

Requirements include JavaScript ES modules, `TextEncoder`, Web Crypto in a secure context, and service workers for offline support.

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Add tests for new functionality.
5. Run `node tests/codec-tests.mjs`.
6. Verify browser behavior and error handling.
7. Submit a pull request with a clear description.

Keep codec modules independent of DOM, storage, and network APIs. Document any new external requests and avoid logging sensitive input.

## 📄 License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

**CodecKit**

*Built for developers. Designed with privacy in mind.*

Maintained by [nikhil-9618](https://github.com/nikhil-9618)

</div>
