// pages/cve.js — NVD 2.0 API lookup with a 24 h localStorage cache.
// Sends only the CVE ID (public data). Summaries/severity/action checklist
// are derived locally from the API response.

const input = document.querySelector('[data-cve-input]');
const btn = document.querySelector('[data-fetch]');
const result = document.querySelector('[data-result]');
const errEl = document.querySelector('[data-error]');
const cacheNote = document.querySelector('[data-cache-note]');

const CACHE_KEY = (id) => `ck:cve:${id.toUpperCase()}`;
const CACHE_TTL = 24 * 60 * 60 * 1000;

function readCache(id) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.t > CACHE_TTL) return null;
    return parsed.data;
  } catch { return null; }
}
function writeCache(id, data) {
  try { localStorage.setItem(CACHE_KEY(id), JSON.stringify({ t: Date.now(), data })); } catch { /* quota */ }
}

btn?.addEventListener('click', async () => {
  errEl.hidden = true;
  const id = input.value.trim().toUpperCase();
  if (!/^CVE-\d{4}-\d{4,}$/.test(id)) {
    errEl.hidden = false;
    errEl.textContent = 'Expected a CVE ID like CVE-2021-44228';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Fetching…';
  try {
    let data = readCache(id);
    cacheNote.textContent = data ? '(served from local cache)' : '(from NVD API)';
    if (!data) {
      const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`NVD returned ${res.status}`);
      const json = await res.json();
      const vuln = json.vulnerabilities?.[0]?.cve;
      if (!vuln) throw new Error(`No NVD record found for ${id}`);
      data = summarize(vuln);
      writeCache(id, data);
    }
    render(data);
  } catch (err) {
    errEl.hidden = false;
    errEl.textContent = `Lookup failed: ${err.message}`;
    result.hidden = true;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Fetch & explain';
  }
});
input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });

function summarize(vuln) {
  const desc = vuln.descriptions?.find((d) => d.lang === 'en')?.value ?? 'No description available.';
  const metrics = vuln.metrics?.cvssMetricV31?.[0] ?? vuln.metrics?.cvssMetricV30?.[0];
  const score = metrics?.cvssData?.baseScore;
  const vector = metrics?.cvssData?.vectorString;
  const severity = metrics?.cvssData?.baseSeverity ?? (score != null ? labelFor(score) : 'Unknown');
  const products = (vuln.configurations?.[0]?.nodes?.[0]?.cpeMatch ?? [])
    .slice(0, 8).map((c) => (c.criteria.split(':').slice(3, 5).join(' ')));
  return {
    id: vuln.id,
    desc,
    score: score ?? '—',
    vector: vector ?? '',
    severity,
    published: (vuln.published ?? '').slice(0, 10),
    products,
    refs: (vuln.references ?? []).slice(0, 5).map((r) => r.url),
  };
}

function labelFor(score) {
  return score >= 9 ? 'Critical' : score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low';
}

function render(d) {
  result.hidden = false;
  document.querySelector('[data-cve-id]').textContent = d.id;
  const badge = document.querySelector('[data-sev-badge]');
  badge.hidden = false;
  badge.textContent = d.severity;
  badge.className = `badge ${d.severity === 'Critical' ? 'expired' : d.severity === 'High' ? 'warn' : 'info'}`;
  document.querySelector('[data-summary]').textContent = d.desc;
  document.querySelector('[data-score]').textContent = String(d.score);
  document.querySelector('[data-vector]').textContent = d.vector;
  document.querySelector('[data-published]').textContent = d.published || '—';
  document.querySelector('[data-products]').textContent = d.products.length ? d.products.join(' · ') : 'See NVD for full CPE list';
  document.querySelector('[data-link-nvd]').href = `https://nvd.nist.gov/vuln/detail/${d.id}`;
  document.querySelector('[data-link-advisory]').href = `https://nvd.nist.gov/vuln/detail/${d.id}?refPage=References`;
  const todos = document.querySelector('[data-todos]');
  const items = [
    `Confirm whether any of your systems run affected software (${d.products.slice(0, 2).join(', ') || 'see NVD'}).`,
    `Update to a fixed version — priority ${d.severity}.`,
    `Check for public exploit availability and prune exposed services.`,
    `If patching isn't possible, apply vendor mitigations and monitor logs.`,
  ];
  todos.innerHTML = '';
  items.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    todos.appendChild(li);
  });
}
