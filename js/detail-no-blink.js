/* Book detail no-blink guard.
 * BookDetailPage uses a synthetic hashchange after async review loading.
 * That must never re-run the whole SPA route, otherwise the detail page flashes
 * and reloads repeatedly. Real browser hash navigation remains untouched.
 */
(() => {
  if (window.__BOOKORA_DETAIL_NO_BLINK__) return;
  window.__BOOKORA_DETAIL_NO_BLINK__ = true;
  const originalAddEventListener = window.addEventListener.bind(window);
  window.addEventListener = function(type, listener, options) {
    if (type === 'hashchange' && typeof listener === 'function') {
      const wrapped = function(event) {
        const hash = window.location.hash || '';
        if (!event?.isTrusted && /^#\/book\//.test(hash)) return;
        return listener.call(this, event);
      };
      return originalAddEventListener(type, wrapped, options);
    }
    return originalAddEventListener(type, listener, options);
  };
})();
