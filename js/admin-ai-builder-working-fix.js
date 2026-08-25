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

// ADMIN_BOOKS_SESSION_RECOVERY_V1
// Recover the durable Bookora server session before the existing Admin Books
// loader runs. This does not bypass Firebase or server-side admin checks.
(() => {
  if (window.__BOOKORA_ADMIN_BOOKS_SESSION_RECOVERY_V1__) return;
  window.__BOOKORA_ADMIN_BOOKS_SESSION_RECOVERY_V1__ = true;

  const API = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const TOKEN_KEY = 'bookora_auth_token';
  let running = false;
  let lastRoute = '';

  const isAdminBooks = () => (location.hash || '').split('?')[0] === '#/admin/books';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function waitForFirebaseUser(timeoutMs = 20000) {
    const auth = window.firebase?.auth?.();
    if (!auth) return null;
    if (auth.currentUser) return auth.currentUser;
    return new Promise(resolve => {
      let settled = false;
      let unsubscribe = null;
      const finish = user => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { unsubscribe?.(); } catch (_) {}
        resolve(user || null);
      };
      const timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
      try { unsubscribe = auth.onAuthStateChanged(user => finish(user)); }
      catch (_) { finish(auth.currentUser || null); }
    });
  }

  async function validServerToken(token) {
    if (!String(token || '').startsWith('tok_')) return false;
    try {
      const response = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      return response.ok && data?.authenticated === true && (data?.is_admin === true || String(data?.user?.email || '').toLowerCase() === 'ayushprajpati6@gmail.com');
    } catch (_) { return false; }
  }

  async function ensureServerAdminSession() {
    const { state } = await import('./state.js');
    const cached = localStorage.getItem(TOKEN_KEY) || '';
    if (await validServerToken(cached)) {
      state.token = cached;
      state.isAuthenticated = true;
      state.isAdmin = true;
      return cached;
    }
    if (cached) localStorage.removeItem(TOKEN_KEY);

    const firebaseUser = await waitForFirebaseUser(20000);
    if (!firebaseUser) throw new Error('Firebase administrator session is not available. Please sign in again.');
    const firebaseToken = await firebaseUser.getIdToken(true);
    if (!firebaseToken) throw new Error('Firebase administrator token is unavailable. Please sign in again.');

    const response = await fetch(`${API}/api/auth/firebase`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${firebaseToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success || !data?.token || data?.is_admin !== true) {
      throw new Error(data?.error || 'Server could not verify the administrator session. Please sign in again.');
    }

    state.token = data.token;
    state.currentUser = data.user || state.currentUser;
    state.isAuthenticated = true;
    state.isAdmin = true;
    try { localStorage.setItem(TOKEN_KEY, data.token); } catch (_) {}
    return data.token;
  }

  async function recover() {
    if (!isAdminBooks() || running) return;
    running = true;
    try {
      const token = await ensureServerAdminSession();
      if (!isAdminBooks()) return;
      const { state } = await import('./state.js');
      state.token = token;
      await sleep(150);
      const refresh = document.getElementById('admin-books-refresh');
      if (refresh) refresh.click();
    } catch (error) {
      console.warn('[Bookora Admin Books session recovery]', error?.message || error);
    } finally {
      running = false;
    }
  }

  const schedule = () => {
    const route = location.hash || '';
    if (route === lastRoute && !isAdminBooks()) return;
    lastRoute = route;
    if (isAdminBooks()) setTimeout(recover, 50);
  };

  window.addEventListener('hashchange', schedule, { passive: true });
  const observer = new MutationObserver(() => {
    if (isAdminBooks() && document.getElementById('admin-books-refresh')) setTimeout(recover, 50);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();