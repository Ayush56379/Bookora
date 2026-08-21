import { state } from './state.js';
import { apiFetch } from './config.js';
import { Toast } from './components/Toast.js';

let installed = false;
let submitBusy = false;

function clean(value = '') { return String(value || '').trim(); }
function getToken() { return clean(state.token); }

async function ensureBookoraSession(forceRefresh = false) {
  try {
    if (window.BookoraBackendSession?.ensureBackendSession) {
      const token = clean(await window.BookoraBackendSession.ensureBackendSession(forceRefresh));
      if (token) return token;
    }
  } catch (error) {
    console.warn('[External Listing] Backend session restore failed:', error?.message || error);
  }
  if (!forceRefresh) return getToken();
  return '';
}

function hideOldFulfillmentUI(form) {
  form?.querySelectorAll('#bookora-external-fulfillment-box, .bookora-ext-fulfillment').forEach(el => el.remove());
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function showIntegration(result) {
  const form = document.getElementById('ext-submit-form');
  if (!form) return;
  const integration = result?.integration || {};
  document.getElementById('bookora-external-integration-box')?.remove();
  const secret = clean(integration.webhook_secret);
  const siteKey = clean(integration.site_key);
  const webhookUrl = clean(integration.webhook_url);
  const headerCode = clean(integration.header_code);
  if (!siteKey || !webhookUrl) return;

  const box = document.createElement('div');
  box.id = 'bookora-external-integration-box';
  box.style.cssText = 'margin-top:1.5rem;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:16px;padding:1.25rem;';
  box.innerHTML = `
    <div style="font-weight:800;color:#1E3A8A;margin-bottom:.45rem;">External payment integration is ready</div>
    <div style="font-size:.84rem;color:#334155;line-height:1.55;margin-bottom:1rem;">Bookora unlocks the buyer's Library <strong>only after your external payment server confirms a real successful payment</strong>. A browser redirect or URL parameter can never unlock access.</div>
    <div style="display:grid;gap:.65rem;">
      <label style="font-size:.78rem;font-weight:700;color:#334155;">Site key</label>
      <input readonly value="${escapeHtml(siteKey)}" style="width:100%;padding:.65rem .75rem;border:1px solid #CBD5E1;border-radius:9px;background:#fff;">
      <label style="font-size:.78rem;font-weight:700;color:#334155;">Private webhook secret — save it now</label>
      <input readonly value="${escapeHtml(secret || 'Secret is not returned again. Regenerate it from integration settings if unavailable.')}" style="width:100%;padding:.65rem .75rem;border:1px solid #CBD5E1;border-radius:9px;background:#fff;font-family:monospace;">
      <label style="font-size:.78rem;font-weight:700;color:#334155;">Bookora confirmation endpoint</label>
      <input readonly value="${escapeHtml(webhookUrl)}" style="width:100%;padding:.65rem .75rem;border:1px solid #CBD5E1;border-radius:9px;background:#fff;font-family:monospace;">
      <label style="font-size:.78rem;font-weight:700;color:#334155;">Optional Bookora bridge script</label>
      <textarea readonly rows="2" style="width:100%;padding:.65rem .75rem;border:1px solid #CBD5E1;border-radius:9px;background:#fff;font-family:monospace;resize:vertical;">${escapeHtml(headerCode)}</textarea>
    </div>
    <div style="margin-top:.9rem;font-size:.76rem;color:#7C2D12;background:#FFF7ED;border:1px solid #FED7AA;border-radius:9px;padding:.7rem;">Never put the webhook secret in public frontend JavaScript. Your server must verify the payment with your actual payment provider first, then call the Bookora confirmation endpoint over HTTPS.</div>`;
  form.insertAdjacentElement('afterend', box);
  form.style.display = 'none';
}

function timeoutMessage(error) {
  if (!error) return 'External listing failed. Please try again.';
  const message = String(error.message || error);
  if (error.name === 'AbortError' || /timed out|timeout/i.test(message)) return 'The Bookora server took too long to respond. Please try again.';
  if (/ERR_NAME_NOT_RESOLVED|network|failed to fetch|load failed/i.test(message)) return 'Unable to connect to the Bookora server. Please try again.';
  return message;
}

async function requestWithTimeout(input, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...options, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse(response) {
  let data = null;
  try { data = await response.json(); } catch (_) {}
  return data;
}

async function submitExternalForm(form) {
  if (submitBusy) return;
  const checkbox = document.getElementById('ext-confirm-checkbox');
  const submit = document.getElementById('ext-submit-btn');
  const url = clean(document.getElementById('ext-url-input')?.value);

  if (!checkbox?.checked) { Toast.show('Please confirm that you have permission to list and promote this eBook.', 'warning'); return; }
  if (!url) { Toast.show('Original sales-page URL is required.', 'warning'); return; }
  if (!/^https?:\/\//i.test(url)) { Toast.show('Please enter a valid public HTTP/HTTPS sales-page URL.', 'warning'); return; }

  submitBusy = true;
  if (submit) { submit.disabled = true; submit.textContent = 'Checking secure sign-in…'; }

  try {
    let token = await ensureBookoraSession(false);
    if (!token) throw new Error('Please sign in to Bookora before submitting the external listing.');

    if (submit) submit.textContent = 'Submitting external listing…';

    const price = Number(document.getElementById('ext-price')?.value || 0);
    const payload = {
      title: clean(document.getElementById('ext-title')?.value),
      subtitle: clean(document.getElementById('ext-subtitle')?.value),
      author: clean(document.getElementById('ext-author')?.value),
      publisher: clean(document.getElementById('ext-publisher')?.value),
      category: document.getElementById('ext-category')?.value || 'Other',
      language: clean(document.getElementById('ext-language')?.value) || 'English',
      pages: Number(document.getElementById('ext-pages')?.value || 0),
      format: clean(document.getElementById('ext-format')?.value) || 'Digital eBook',
      isbn: clean(document.getElementById('ext-isbn')?.value),
      price, original_price: price,
      original_currency: clean(document.getElementById('ext-currency')?.value) || 'INR',
      source_currency: clean(document.getElementById('ext-currency')?.value) || 'INR',
      cover_url: clean(document.getElementById('ext-cover-url')?.value),
      description: clean(document.getElementById('ext-description')?.value),
      source_url: url, canonical_url: url, rights_confirmed: true
    };

    let res = await requestWithTimeout(`${window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com'}/api/publish/external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }, 30000);

    if (res.status === 401 || res.status === 403) {
      try {
        localStorage.removeItem('bookora_auth_token');
        state.token = '';
      } catch (_) {}
      token = await ensureBookoraSession(true);
      if (!token) throw new Error(res.status === 403 ? 'You are signed in, but your account is not authorized for this action.' : 'Your Bookora login session has expired. Please sign in again.');
      res = await requestWithTimeout(`${window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com'}/api/publish/external`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }, 30000);
    }

    const result = await parseResponse(res);
    if (!res.ok || !result?.success) {
      if (res.status === 400) throw new Error(result?.error || 'Bookora rejected the submission. Please check the form and try again.');
      if (res.status === 401) throw new Error('Your Bookora login session has expired. Please sign in again.');
      if (res.status === 403) throw new Error('You are signed in, but your account is not authorized for this action.');
      if (res.status >= 500) throw new Error('Bookora server error. Please try again.');
      throw new Error(result?.error || `External listing failed (HTTP ${res.status}).`);
    }

    Toast.show(result.book?.status === 'approved' ? 'External eBook is now live on Bookora.' : 'External eBook submitted for admin moderation.', 'success');
    if (result.integration) { showIntegration(result); return; }
    window.location.hash = result.book?.status === 'approved' ? `#/book/${encodeURIComponent(result.book.slug)}` : '#/creator/dashboard';
  } catch (error) {
    console.error('Bookora external listing failed:', error);
    Toast.show(timeoutMessage(error), 'error');
  } finally {
    submitBusy = false;
    if (submit && submit.isConnected && submit.closest('#ext-submit-form') && document.getElementById('ext-submit-form')?.style.display !== 'none') {
      submit.disabled = false;
      submit.textContent = 'Upload PDF & Submit External Listing';
    }
  }
}

function interceptExternalSubmit(event) {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || form.id !== 'ext-submit-form') return;
  event.preventDefault(); event.stopImmediatePropagation();
  hideOldFulfillmentUI(form);
  void submitExternalForm(form);
}

function observe() {
  const form = document.getElementById('ext-submit-form');
  if (form) hideOldFulfillmentUI(form);
}

if (!installed) {
  installed = true;
  document.addEventListener('submit', interceptExternalSubmit, true);
  const observer = new MutationObserver(observe);
  observer.observe(document.documentElement, { subtree: true, childList: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
}
