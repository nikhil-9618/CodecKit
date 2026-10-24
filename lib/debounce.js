// lib/debounce.js — delay a callback until the user stops typing.
// Used for every live-transform input field.

export function debounce(fn, wait = 250) {
  let timer = null;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  }
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}
