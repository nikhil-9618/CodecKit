// router.js — a tiny (~40 line) hash router.
// Routes live in location.hash, e.g. "#/codecs/base64".
// Pages register handlers via on(); active path is always readable via current().

const routes = new Map(); // path -> handler(ctx)
let notFoundHandler = null;
let started = false;

export function on(path, handler) {
  routes.set(normalize(path), handler);
}

export function onNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path, { replace = false } = {}) {
  const target = '#' + normalize(path);
  if (location.hash === target) {
    dispatch(); // re-dispatch even if same hash
    return;
  }
  if (replace) location.replace(location.pathname + location.search + target);
  else location.hash = target;
}

export function current() {
  return normalize(location.hash.replace(/^#/, ''));
}

/** Split "codecs/base64" into segments; root path is []. */
export function segments() {
  const p = current();
  return p === '/' ? [] : p.split('/');
}

function normalize(path) {
  path = String(path || '').replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  return path === '' ? '/' : '/' + path;
}

function dispatch() {
  const path = current();
  const handler = routes.get(path) ?? matchesPrefix(path) ?? notFoundHandler;
  if (handler) handler({ path, segments: segments() });
}

// Longest-prefix lookup, so "#/codecs/base64" can hit a handler
// registered for "#/codecs" that reads ctx.segments itself.
function matchesPrefix(path) {
  const parts = path.split('/');
  while (parts.length > 2) {
    parts.pop();
    const handler = routes.get(parts.join('/') || '/');
    if (handler) return handler;
  }
  return routes.get('/') ?? null;
}

export function start() {
  if (started) return;
  started = true;
  window.addEventListener('hashchange', dispatch);
  dispatch();
}
