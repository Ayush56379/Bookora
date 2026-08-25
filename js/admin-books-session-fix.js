// Bookora Admin Books session recovery hotfix.
// Keeps the existing server-verified admin architecture intact while making
// the Firebase -> Bookora session exchange resilient to auth initialization races.
(() => {
  const TOKEN_KEY = 'bookora_auth_token';
  const API = window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com';
  let running = false;
  let lastHash = '';

  const isBooksRoute = () => {
    const hash = window.location.hash || '';
    return hash.split('?')[0] === '#/admin/books';
  };

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
      try {
        unsubscribe = auth.onAuthStateChanged(user => finish(user));
      } catch (_) {
        finish(auth.currentUser || null);
      }
    });
  }

  async function validateServerSession(token) {
    if (!token || !String(token).startsWith('tok_')) return false;
    try {
      const response = await fetch(`${API}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) return false;
      const data = await response.json().catch(() => ({}));
      return data?.authenticated === true && (data?.is_admin === true || String(data?.user?.email || '').toLowerCase() === 'ayushprajpati6@gmail.com');
    } catch (_) {
      return false;
    }
  }

  async function ensureServerSession() {
    const { state } = await import('./state.js');

    const cachedToken = localStorage.getItem(TOKEN_KEY) || '';
    if (await validateServerSession(cachedToken)) {
      state.token = cachedToken;
      state.isAuthenticated = true;
      state.isAdmin = true;
      return cachedToken;
    }
    if (cachedToken) localStorage.removeItem(TOKEN_KEY);

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

  async function recoverBooksPage() {
    if (running || !isBooksRoute()) return;
    running = true;
    try {
      const token = await ensureServerSession();
      if (!isBooksRoute()) return;
      const { state } = await import('./state.js');
      state.token = token;
      await sleep(150);
      // The page's existing loader remains authoritative. Trigger its existing
      // Refresh action after the server session is ready, so approve/reject/
      // remove actions continue using the same verified API architecture.
      const refresh = document.getElementById('admin-books-refresh');
      if (refresh) refresh.click();
    } catch (error) {
      console.warn('[Bookora Admin Books session fix]', error?.message || error);
    } finally {
      running = false;
    }
  }

  function schedule() {
    const hash = window.location.hash || '';
    if (hash === lastHash && !isBooksRoute()) return;
    lastHash = hash;
    if (isBooksRoute()) void recoverBooksPage();
  }

  window.addEventListener('hashchange', schedule, { passive: true });

  const observer = new MutationObserver(() => {
    if (isBooksRoute() && document.getElementById('admin-books-refresh')) void recoverBooksPage();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.__BOOKORA_ADMIN_BOOKS_SESSION_FIX__ = { recover: recoverBooksPage };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();
