/* Bookora Seller Apply V6 — never leave the application submit UI stuck. */
(() => {
  'use strict';
  const ROUTE = '/seller/apply';
  const BUTTON_ID = 'seller-apply-submit';
  const MAX_WAIT_MS = 30000;
  const FLAG = '__BOOKORA_SELLER_APPLY_RESILIENCE_V6__';

  const isApplyRoute = () => String(location.hash || '').split('?')[0].replace(/^#/, '') === ROUTE;
  const button = () => document.getElementById(BUTTON_ID);

  function resetButton(message) {
    const btn = button();
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.textContent = 'Submit Seller Application for Review';
    if (message) {
      let note = document.getElementById('seller-apply-runtime-error-v6');
      if (!note) {
        note = document.createElement('div');
        note.id = 'seller-apply-runtime-error-v6';
        note.setAttribute('role', 'alert');
        note.style.cssText = 'margin-top:12px;padding:12px 14px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#991b1b;font:600 13px/1.45 Inter,system-ui,sans-serif;text-align:center;';
        btn.insertAdjacentElement('afterend', note);
      }
      note.textContent = message;
    }
  }

  function watchSubmit() {
    if (!isApplyRoute() || window[FLAG]) return;
    window[FLAG] = true;

    const observer = new MutationObserver(() => {
      if (!isApplyRoute()) return;
      const btn = button();
      if (!btn) return;
      if (btn.dataset.v6WatchStarted === '1') return;
      if (!/Submitting application/i.test(btn.textContent || '')) return;
      btn.dataset.v6WatchStarted = '1';
      btn.setAttribute('aria-busy', 'true');
      const started = Date.now();
      const timer = setInterval(() => {
        const current = button();
        if (!current || !isApplyRoute()) { clearInterval(timer); return; }
        if (!/Submitting application/i.test(current.textContent || '')) { clearInterval(timer); return; }
        if (Date.now() - started >= MAX_WAIT_MS) {
          clearInterval(timer);
          resetButton('The seller application request did not finish within 30 seconds. Nothing was silently left pending in the UI. Please try Submit again.');
        }
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', () => {
      window[FLAG] = false;
      setTimeout(watchSubmit, 0);
    });
  }

  function boot() {
    if (document.body) watchSubmit();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
