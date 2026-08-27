/* Bookora production backend URL healing.
 * Some already-cached SPA modules can retain the previous Render hostname.
 * Rewrite only the retired Bookora backend hostname to the current service;
 * never alter unrelated requests.
 */
(() => {
  'use strict';
  if (window.__BOOKORA_BACKEND_URL_HEALING_V1__) return;
  window.__BOOKORA_BACKEND_URL_HEALING_V1__ = true;
  const CURRENT = 'https://bookora-backend-x08l.onrender.com';
  const RETIRED = /https:\/\/bookora-backend-x081\.onrender\.com/gi;
  const normalize = input => {
    try {
      if (typeof input === 'string') return input.replace(RETIRED, CURRENT);
      if (input instanceof Request) {
        const next = input.url.replace(RETIRED, CURRENT);
        if (next === input.url) return input;
        return new Request(next, input);
      }
      return input;
    } catch (_) { return input; }
  };
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => nativeFetch(normalize(input), init);
  console.info('[Bookora] stale backend URL healing enabled.');
})();
