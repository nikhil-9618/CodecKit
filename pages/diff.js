// pages/diff.js — line diff with LCS (no library). O(n·m) DP is fine for
// the text blocks a diff tool sees; guard docs above 2000 lines.
const oldEl = document.querySelector('[data-old]');
const newEl = document.querySelector('[data-new]');
const outBox = document.querySelector('[data-diffout]');
const stat = document.querySelector('[data-stat]');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function diffLines(a, b) {
  const n = a.length, m = b.length;
  // DP table of LCS lengths
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ t: '=', a: a[i], b: b[j] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: '-', a: a[i] }); i++; }
    else { ops.push({ t: '+', b: b[j] }); j++; }
  }
  while (i < n) { ops.push({ t: '-', a: a[i++] }); }
  while (j < m) { ops.push({ t: '+', b: b[j++] }); }
  return ops;
}

function render() {
  const a = oldEl.value.split('\n');
  const b = newEl.value.split('\n');
  if (a.length * b.length > 2000 * 2000) {
    outBox.textContent = 'Input too large for in-browser diff (2000×2000 line cap).';
    return;
  }
  const ops = diffLines(a, b);
  let html = '';
  let added = 0, removed = 0, same = 0;
  for (const op of ops) {
    if (op.t === '=') { same++; html += `<div class="diff-line ctx">${esc(op.a) || '&nbsp;'}</div>`; }
    else if (op.t === '-') { removed++; html += `<div class="diff-line del">${esc(op.a)}</div>`; }
    else { added++; html += `<div class="diff-line add">${esc(op.b)}</div>`; }
  }
  outBox.innerHTML = html;
  stat.textContent = `${same} unchanged · ${added} added · ${removed} removed`;
}

document.querySelector('[data-run]')?.addEventListener('click', render);
oldEl?.addEventListener('input', render);
newEl?.addEventListener('input', render);
render();
