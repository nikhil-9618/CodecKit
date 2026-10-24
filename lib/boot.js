// lib/boot.js — runs as a plain (non-module) script in <head>, BEFORE first
// paint. Not inline because our CSP allows script-src 'self' only.
// Reads the theme preference saved by lib/storage.js ("ck:prefs" JSON).
(function () {
  var theme = 'dark';
  try {
    var raw = localStorage.getItem('ck:prefs');
    if (raw && raw.indexOf('"theme":"light"') !== -1) theme = 'light';
  } catch (e) { /* private mode — stay dark */ }
  document.documentElement.dataset.theme = theme;
})();
