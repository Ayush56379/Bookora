/*
 * Permanent fix for the External Seller "Scan Website & Fetch Book Information" action.
 *
 * Root cause fixed here: PublishExternalPage.js previously awaited authentication
 * before installing the scan click handler. If Firebase restoration/session exchange
 * was slow, the button existed but had no listener yet, so clicking it appeared to do
 * nothing. This runtime installs a capture-phase handler immediately after the SPA
 * boots and performs the complete scan flow itself.
 *
 * Capture phase intentionally owns this button so a late/original page listener cannot
 * duplicate the API calls. The server remains authoritative for SSRF validation and
 * authentication.
 */
import { apiFetch } from './config.js';
import { getFreshFirebaseIdToken } from './firebase-authenticated-fetch.js?v=20260823-3';
import { Toast } from './components/Toast.js';

const MARK = '__BOOKORA_EXTERNAL_SCAN_PERMANENT_FIX__';
if (!window[MARK]) {
  window[MARK] = true;

  const esc = (v = '') => String(v).replace(/[&<>\"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;'
  }[c]));

  const waitForElement = (selector, timeout = 15000) => new Promise(resolve => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);
    const started = Date.now();
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { observer.disconnect(); resolve(el); }
      else if (Date.now() - started >= timeout) { observer.disconnect(); resolve(null); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(document.querySelector(selector)); }, timeout);
  });

  async function getAuthHeader() {
    const firebaseToken = await getFreshFirebaseIdToken(true).catch(() => '');
    if (firebaseToken) return `Bearer ${firebaseToken}`;

    try {
      const stored = String(localStorage.getItem('bookora_auth_token') || '').trim();
      if (stored && stored.split('.').length !== 3) return `Bearer ${stored}`;
    } catch (_) {}

    throw new Error('Your Bookora session is not ready. Please sign in again and try the scan.');
  }

  function setProgress(message, steps = '') {
    const box = document.getElementById('ext-progress');
    const label = document.getElementById('ext-progress-label');
    const stepBox = document.getElementById('ext-progress-steps');
    if (box) box.style.display = 'block';
    if (label) label.textContent = message;
    if (stepBox) stepBox.innerHTML = steps;
  }

  function showPages(scan) {
    const panel = document.getElementById('ext-pages-panel');
    if (!panel) return;
    const pages = Array.isArray(scan?.pages) ? scan.pages : [];
    panel.style.display = 'block';
    panel.innerHTML = `
      <div style="padding:1rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff">
        <div style="font-weight:800;color:#0f172a">Website scan completed</div>
        <div style="margin-top:.35rem;font-size:.82rem;color:#64748b">${pages.length} public page${pages.length === 1 ? '' : 's'} discovered.</div>
        ${pages.length ? `<div style="margin-top:.75rem;display:grid;gap:.45rem">${pages.slice(0,25).map(p => {
          const url = typeof p === 'string' ? p : (p.url || p.href || '');
          const title = typeof p === 'string' ? p : (p.title || p.url || p.href || 'Public page');
          return `<div style="padding:.55rem .7rem;border:1px solid #e2e8f0;border-radius:8px;font-size:.78rem;overflow-wrap:anywhere"><strong>${esc(title)}</strong><br><span style="color:#64748b">${esc(url)}</span></div>`;
        }).join('')}</div>` : ''}
      </div>`;
  }

  function populateMetadata(data) {
    const value = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = String(val); };
    value('ext-title', data.title || data.name || '');
    value('ext-subtitle', data.subtitle || '');
    value('ext-author', data.author || data.authorName || '');
    value('ext-publisher', data.publisher || '');
    value('ext-price', data.price || data.amount || '');
    value('ext-currency', data.currency || 'INR');
    value('ext-pages', data.pages || data.pageCount || data.page_count || '');
    value('ext-language', data.language || '');
    value('ext-format', data.format || 'PDF');
    value('ext-isbn', data.isbn || '');
    value('ext-cover-url', data.coverUrl || data.cover_url || data.image || data.cover || '');
    value('ext-description', data.description || data.summary || '');
  }

  function revealForm() {
    const form = document.getElementById('ext-submit-form');
    if (form) form.style.display = 'block';
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function runScan(button) {
    const urlInput = document.getElementById('ext-url-input');
    const nameInput = document.getElementById('ext-website-name');
    const url = String(urlInput?.value || '').trim();
    if (!url) {
      Toast.show('Please enter the external website URL.', 'warning');
      urlInput?.focus();
      return;
    }

    let parsed;
    try { parsed = new URL(url); } catch (_) {
      Toast.show('Please enter a valid website URL.', 'warning');
      urlInput?.focus();
      return;
    }
    if (parsed.protocol !== 'https:') {
      Toast.show('HTTPS website URL is required.', 'warning');
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Scanning website…';
    setProgress('Connecting securely…', 'Preparing authenticated Bookora session');

    try {
      const authorization = await getAuthHeader();
      const authHeaders = { Accept: 'application/json', Authorization: authorization };

      setProgress('Fetching public book information…', '✓ Authentication ready<br>✓ Website URL validated<br>• Fetching public metadata');
      const metaRes = await apiFetch('/api/external/import', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const meta = await metaRes.json().catch(() => ({}));
      if (!metaRes.ok || !meta?.success) throw new Error(meta?.error || `Metadata fetch failed (${metaRes.status}).`);

      setProgress('Registering external website…', '✓ Authentication ready<br>✓ Website validated<br>✓ Public metadata fetched<br>• Creating integration');
      const intRes = await apiFetch('/api/external/integrations', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: url,
          websiteName: String(nameInput?.value || '').trim() || parsed.hostname
        })
      });
      const intData = await intRes.json().catch(() => ({}));
      if (!intRes.ok || !intData?.success || !intData?.integration?.integrationId) {
        throw new Error(intData?.error || `Integration creation failed (${intRes.status}).`);
      }

      const integrationId = intData.integration.integrationId;
      setProgress('Scanning public pages…', '✓ Authentication ready<br>✓ Public metadata fetched<br>✓ Integration registered<br>• Scanning public pages');
      const scanRes = await apiFetch(`/api/external/integrations/${encodeURIComponent(integrationId)}/scan`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: '{}'
      });
      const scan = await scanRes.json().catch(() => ({}));
      if (!scanRes.ok || !scan?.success) throw new Error(scan?.error || `Website scan failed (${scanRes.status}).`);

      const imported = meta.data || meta.book || meta.metadata || {};
      populateMetadata(imported);
      showPages(scan);
      revealForm();
      setProgress('Scan completed successfully.', `✓ Secure seller session<br>✓ Public metadata fetched<br>✓ Website registered<br>✓ ${Array.isArray(scan.pages) ? scan.pages.length : 0} public pages scanned`);
      Toast.show('Website scanned successfully. Review the imported book information below.', 'success');
    } catch (error) {
      console.error('[External Scan Permanent Fix]', error);
      setProgress('Scan could not be completed.', `<span style="color:#b91c1c">${esc(error?.message || 'Unexpected error. Please try again.')}</span>`);
      Toast.show(error?.message || 'Website scan failed. Please try again.', 'error');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = originalText || 'Scan Website & Fetch Book Information';
    }
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#ext-fetch-btn') : null;
    if (!target) return;

    // Own this action in capture phase so a late listener in PublishExternalPage
    // cannot run a duplicate request after Firebase restoration.
    event.preventDefault();
    event.stopImmediatePropagation();
    void runScan(target);
  }, true);

  void waitForElement('#ext-fetch-btn').then(button => {
    if (button) button.dataset.externalScanPermanentFix = '1';
  });
}
