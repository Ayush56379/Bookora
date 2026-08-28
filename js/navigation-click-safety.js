// Bookora global SPA click safety.
// Guarantees same-document hash links still navigate when another UI listener
// accidentally calls preventDefault(). Does not hijack external/modifier clicks.
(() => {
  if (window.__BOOKORA_GLOBAL_CLICK_SAFETY__) return;
  window.__BOOKORA_GLOBAL_CLICK_SAFETY__ = true;
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const el = event.target?.closest?.('a[href^="#/"]');
    if (!el || el.target === '_blank' || el.hasAttribute('download')) return;
    const href = el.getAttribute('href');
    if (!href || href === '#') return;
    if (window.location.hash !== href) window.location.hash = href;
  }, true);
})();
