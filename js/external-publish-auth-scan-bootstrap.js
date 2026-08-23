/*
 * External publish bootstrap.
 *
 * This file intentionally has zero module dependencies. It runs before the SPA,
 * waits for Firebase Auth restoration, exchanges the Firebase ID token for the
 * Bookora backend session token, persists that session, and owns the external
 * website scan click in capture phase. This prevents the publish page from
 * racing the SPA/auth modules and showing a false "Seller authentication
 * required" message.
 */
(() => {
  if (window.__BOOKORA_EXTERNAL_PUBLISH_BOOTSTRAP__) return;
  window.__BOOKORA_EXTERNAL_PUBLISH_BOOTSTRAP__ = true;

  const API = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const TOKEN_KEY = 'bookora_auth_token';
  const UID_KEY = 'bookora_auth_session_uid';
  let exchangePromise = null;

  const firebaseAuth = () => {
    try { return window.firebase?.auth?.() || null; } catch (_) { return null; }
  };

  const currentUser = () => firebaseAuth()?.currentUser || null;

  const waitForUser = (timeout = 15000) => {
    const auth = firebaseAuth();
    if (!auth) return Promise.resolve(null);
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise(resolve => {
      let done = false;
      let timer;
      let unsubscribe;
      const finish = user => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { unsubscribe?.(); } catch (_) {}
        resolve(user || null);
      };
      try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(null); return; }
      timer = setTimeout(() => finish(auth.currentUser || null), timeout);
    });
  };

  const isJwt = value => String(value || '').trim().split('.').length === 3 && String(value || '').length > 200;

  const storedBackendToken = () => {
    try {
      const token = String(localStorage.getItem(TOKEN_KEY) || '').trim();
      if (!token || isJwt(token)) return '';
      const storedUid = String(localStorage.getItem(UID_KEY) || '').trim();
      const uid = String(currentUser()?.uid || '').trim();
      if (uid && storedUid && uid !== storedUid) return '';
      return token;
    } catch (_) { return ''; }
  };

  const persist = (token, uid = '') => {
    if (!token || isJwt(token)) return '';
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (uid) localStorage.setItem(UID_KEY, uid);
    } catch (_) {}
    return token;
  };

  async function ensureBackendSession(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = storedBackendToken();
      if (cached) return cached;
    }
    if (exchangePromise && !forceRefresh) return exchangePromise;

    exchangePromise = (async () => {
      const user = currentUser() || await waitForUser();
      if (!user) throw new Error('Your Bookora sign-in session is still restoring. Please wait a moment and try again.');
      const firebaseToken = await user.getIdToken(Boolean(forceRefresh));
      if (!firebaseToken) throw new Error('Bookora sign-in token is unavailable. Please sign in again.');

      const response = await fetch(`${API}/api/auth/firebase`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${firebaseToken}` },
        body: JSON.stringify({ role: 'seller' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !data?.token) {
        throw new Error(data?.error || `Bookora seller session could not be established (${response.status}).`);
      }
      return persist(String(data.token), String(user.uid || data.user?.uid || ''));
    })();

    try { return await exchangePromise; }
    finally { exchangePromise = null; }
  }

  const authHeaders = async () => ({
    Accept: 'application/json',
    Authorization: `Bearer ${await ensureBackendSession()}`,
    'Content-Type': 'application/json'
  });

  const toast = (message, type = 'error') => {
    try { window.Toast?.show?.(message, type); return; } catch (_) {}
    const existing = document.getElementById('external-publish-bootstrap-message');
    if (existing) existing.remove();
    const box = document.createElement('div');
    box.id = 'external-publish-bootstrap-message';
    box.textContent = message;
    box.style.cssText = `position:fixed;right:24px;top:90px;z-index:99999;max-width:480px;padding:14px 18px;border-radius:12px;background:${type === 'success' ? '#dcfce7' : '#fee2e2'};color:${type === 'success' ? '#166534' : '#991b1b'};font:600 14px Inter,system-ui,sans-serif;box-shadow:0 12px 30px rgba(15,23,42,.15)`;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 5000);
  };

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
  const setValue = (id, value) => { const el = document.getElementById(id); if (el && value !== undefined && value !== null) el.value = String(value); };

  async function scan(button) {
    const input = document.getElementById('ext-url-input');
    const name = document.getElementById('ext-website-name');
    const url = String(input?.value || '').trim();
    if (!url) { toast('Please enter the external website URL.', 'warning'); input?.focus(); return; }
    let parsed;
    try { parsed = new URL(url); } catch (_) { toast('Please enter a valid website URL.', 'warning'); return; }
    if (parsed.protocol !== 'https:') { toast('HTTPS website URL is required.', 'warning'); return; }

    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparing secure session…';
    const progress = document.getElementById('ext-progress');
    const label = document.getElementById('ext-progress-label');
    const steps = document.getElementById('ext-progress-steps');
    if (progress) progress.style.display = 'block';

    const status = (title, detail) => {
      if (label) label.textContent = title;
      if (steps) steps.innerHTML = detail;
    };

    try {
      status('Restoring secure Bookora session…', '• Waiting for Firebase sign-in<br>• Creating server-side Bookora session');
      const token = await ensureBackendSession(false);
      status('Fetching public book information…', '✓ Authenticated seller session<br>✓ Website URL validated<br>• Fetching public metadata');
      const headers = { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const metaRes = await fetch(`${API}/api/external/import`, { method: 'POST', headers, body: JSON.stringify({ url }) });
      const meta = await metaRes.json().catch(() => ({}));
      if (!metaRes.ok || !meta?.success) throw new Error(meta?.error || `Metadata fetch failed (${metaRes.status}).`);
      const imported = meta.data || meta.book || meta.metadata || {};

      status('Registering external website…', '✓ Seller session ready<br>✓ Public metadata fetched<br>• Creating website integration');
      const intRes = await fetch(`${API}/api/external/integrations`, {
        method: 'POST', headers,
        body: JSON.stringify({ websiteUrl: url, websiteName: String(name?.value || '').trim() || parsed.hostname })
      });
      const intData = await intRes.json().catch(() => ({}));
      if (!intRes.ok || !intData?.success || !intData?.integration?.integrationId) {
        throw new Error(intData?.error || `Integration creation failed (${intRes.status}).`);
      }

      status('Scanning public pages…', '✓ Seller session ready<br>✓ Website registered<br>• Scanning public pages');
      const scanRes = await fetch(`${API}/api/external/integrations/${encodeURIComponent(intData.integration.integrationId)}/scan`, {
        method: 'POST', headers, body: '{}'
      });
      const scanData = await scanRes.json().catch(() => ({}));
      if (!scanRes.ok || !scanData?.success) throw new Error(scanData?.error || `Website scan failed (${scanRes.status}).`);

      setValue('ext-title', imported.title || imported.name || '');
      setValue('ext-subtitle', imported.subtitle || '');
      setValue('ext-author', imported.author || imported.authorName || '');
      setValue('ext-publisher', imported.publisher || '');
      setValue('ext-price', imported.price || imported.amount || '');
      setValue('ext-currency', imported.currency || 'INR');
      setValue('ext-pages', imported.pages || imported.pageCount || imported.page_count || '');
      setValue('ext-language', imported.language || '');
      setValue('ext-format', imported.format || 'PDF');
      setValue('ext-isbn', imported.isbn || '');
      setValue('ext-cover-url', imported.coverUrl || imported.cover_url || imported.image || imported.cover || '');
      setValue('ext-description', imported.description || imported.summary || '');

      const pages = Array.isArray(scanData.pages) ? scanData.pages : [];
      const panel = document.getElementById('ext-pages-panel');
      if (panel) {
        panel.style.display = 'block';
        panel.innerHTML = `<div style="padding:1rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff"><strong>Website scan completed</strong><div style="margin:.35rem 0 .7rem;color:#64748b;font-size:.82rem">${pages.length} public page${pages.length === 1 ? '' : 's'} discovered.</div>${pages.slice(0,30).map(page => { const u = typeof page === 'string' ? page : (page.url || page.href || ''); const t = typeof page === 'string' ? page : (page.title || u || 'Public page'); return `<div style="padding:.45rem .6rem;border:1px solid #e2e8f0;border-radius:8px;margin:.35rem 0;font-size:.78rem;overflow-wrap:anywhere"><strong>${esc(t)}</strong><br><span style="color:#64748b">${esc(u)}</span></div>`; }).join('')}${pages.length > 30 ? `<div style="font-size:.78rem;color:#64748b">+ ${pages.length - 30} more pages</div>` : ''}</div>`;
      }

      const form = document.getElementById('ext-submit-form');
      if (form) { form.style.display = 'block'; form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      status('Scan completed successfully.', `✓ Authenticated seller session<br>✓ Public metadata fetched<br>✓ Website integration created<br>✓ ${pages.length} public pages scanned`);
      button.textContent = 'Website Scanned ✓';
      toast('Website scanned successfully. Review the imported book information below.', 'success');
    } catch (error) {
      status('Scan could not be completed.', `<span style="color:#b91c1c">${esc(error?.message || 'Unexpected error. Please try again.')}</span>`);
      toast(error?.message || 'Website scan failed. Please try again.', 'error');
    } finally {
      button.disabled = false;
      if (button.textContent !== 'Website Scanned ✓') button.textContent = old || 'Scan Website & Fetch Book Information';
    }
  }

  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('#ext-fetch-btn') : null;
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void scan(button);
  }, true);

  // Warm the backend session as soon as the user is authenticated. This also
  // makes the existing PublishExternalPage submit handler compatible with the
  // same durable session token after the scan completes.
  void waitForUser(15000).then(user => { if (user) void ensureBackendSession(false); });

  window.BookoraExternalPublishBootstrap = { ensureBackendSession };
})();
