// lib/storage.js — thin, crash-proof wrapper around localStorage.
// All keys are namespaced under "ck:" so the app owns its own data
// and can be wiped with one localStorage.clear() by the user.

const PREFIX = 'ck:';

function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    // values are stored as "{type:"j|x", data:<json>|<string>}"
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    // QuotaExceeded / private mode: silent failure is correct for prefs.
    return false;
  }
}

// ---- Preferences -----------------------------------------------------------
export const prefs = {
  get(key, fallback) {
    const all = read('prefs', {});
    return key === undefined ? all : (all[key] ?? fallback);
  },
  set(key, value) {
    const all = read('prefs', {});
    all[key] = value;
    return write('prefs', all);
  },
};

// ---- History (last N inputs per tool, for "Recent inputs" list) ------------
const HISTORY_KEY = (tool) => `history:${tool}`;
const HISTORY_LIMIT = 10;

export function history(toolId) {
  return read(HISTORY_KEY(toolId), []);
}

export function historyPush(toolId, sample) {
  if (!sample) return; // never remember empty input
  const list = history(toolId).filter((item) => item !== sample);
  list.unshift(sample);
  write(HISTORY_KEY(toolId), list.slice(0, HISTORY_LIMIT));
}

export function historyClear(toolId) {
  write(HISTORY_KEY(toolId), []);
}

// ---- Clear everything (used by the About page's "Reset local data" button) --
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
