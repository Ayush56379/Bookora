// Reliable Bookora login-security notifier.
// Sends a server-verified security email whenever Firebase authentication
// transitions into a signed-in state. This is intentionally independent of
// the login form handler so redirects or UI bridges cannot skip the alert.
(() => {
  if (window.__BOOKORA_LOGIN_SECURITY_RUNTIME__) return;
  window.__BOOKORA_LOGIN_SECURITY_RUNTIME__ = true;

  const API_ROOT = 'https://bookora-backend-x08l.onrender.com';
  const STORAGE_KEY = 'bookora_login_security_notified_uid';
  let lastUid = '';
  let authListenerInstalled = false;

  const clearMarker = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
  };

  const wasNotified = uid => {
    try { return sessionStorage.getItem(STORAGE_KEY) === String(uid || ''); } catch (_) { return false; }
  };

  const markNotified = uid => {
    try { sessionStorage.setItem(STORAGE_KEY, String(uid || '')); } catch (_) {}
  };

  const notify = async user => {
    if (!user?.uid || wasNotified(user.uid)) return;
    try {
      const token = await user.getIdToken(true);
      if (!token) return;
      const response = await fetch(`${API_ROOT}/api/auth/security-event`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          event: 'login',
          email: user.email || '',
          details: { provider: 'firebase' }
        })
      });
      if (response.ok) {
        markNotified(user.uid);
        console.info('[Bookora Security] Login notification accepted by backend.');
      } else {
        console.warn('[Bookora Security] Login notification failed:', response.status);
      }
    } catch (error) {
      console.warn('[Bookora Security] Login notification request failed:', error?.message || error);
    }
  };

  const install = () => {
    if (authListenerInstalled) return true;
    const auth = window.firebase?.auth?.();
    if (!auth?.onAuthStateChanged) return false;
    authListenerInstalled = true;
    auth.onAuthStateChanged(user => {
      const uid = String(user?.uid || '');
      if (!uid) {
        lastUid = '';
        clearMarker();
        return;
      }
      if (uid !== lastUid) {
        lastUid = uid;
        void notify(user);
      }
    });
    return true;
  };

  if (!install()) {
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 300);
    setTimeout(() => clearInterval(timer), 15000);
  }
})();
