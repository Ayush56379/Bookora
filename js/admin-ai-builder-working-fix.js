/* Bookora AI Website Builder — runtime reliability fix.
   Keeps the existing builder architecture intact, but makes its protected
   API calls deterministic and retries initialization when the SPA renders
   the Admin Settings DOM after deferred scripts have already executed. */
(() => {
  if (window.__BOOKORA_AI_BUILDER_WORKING_FIX__) return;
  window.__BOOKORA_AI_BUILDER_WORKING_FIX__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const originalFetch = window.fetch.bind(window);

  const isBuilderRequest = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    try {
      const url = new URL(raw, location.href);
      return /\/api\/(admin\/ai-builder|ai\/active-patches)(?:\/|$)/.test(url.pathname);
    } catch (_) {
      return String(raw).includes('/api/admin/ai-builder') || String(raw).includes('/api/ai/active-patches');
    }
  };

  // The existing auth bridge remains responsible for attaching the durable
  // Bookora backend session. We only normalize relative API URLs here.
  window.fetch = async (input, init = {}) => {
    if (!isBuilderRequest(input)) return originalFetch(input, init);
    let target = input;
    try {
      const raw = typeof input === 'string' ? input : (input?.url || '');
      const url = new URL(raw, location.href);
      if (url.pathname.startsWith('/api/')) {
        target = `${API_ROOT}${url.pathname}${url.search}`;
      }
    } catch (_) {}
    return originalFetch(target, init);
  };

  const builderVisible = () => !!document.querySelector('#as-ai-builder, #aib-run, #aib-save');
  const settingsReady = () => !!document.querySelector('.as-side') && !!document.querySelector('.as-card');

  // admin-ai-builder.js can execute before the SPA has rendered Admin Settings.
  // Trigger a harmless hashchange/init retry so the existing builder can attach.
  let attempts = 0;
  const retryInit = () => {
    if (!location.hash.split('?')[0].endsWith('/admin/settings')) return;
    if (builderVisible()) return;
    if (!settingsReady()) {
      if (attempts++ < 40) setTimeout(retryInit, 250);
      return;
    }
    try {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (_) {
      window.dispatchEvent(new Event('hashchange'));
    }
    if (attempts++ < 40) setTimeout(() => {
      if (!builderVisible()) retryInit();
    }, 250);
  };

  const observer = new MutationObserver(() => {
    if (location.hash.split('?')[0].endsWith('/admin/settings') && settingsReady() && !builderVisible()) retryInit();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(retryInit, 50));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retryInit, { once: true });
  else retryInit();
})();
