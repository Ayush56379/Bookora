// Bookora real Cashfree + server-settings bridge.
// Cashfree credentials stay on Render; the browser only receives a payment session.
import { state } from './state.js';
import { Toast } from './components/Toast.js';

const API = (window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');

async function backend(path, options = {}) {
  if (!state.token && window.BookoraPurchaseAccess?.ensureBackendSession) {
    await window.BookoraPurchaseAccess.ensureBackendSession(false);
  }
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  let res = await fetch(`${API}${path}`, { ...options, headers, cache: 'no-store' });
  if (res.status === 401 && window.BookoraPurchaseAccess?.ensureBackendSession) {
    await window.BookoraPurchaseAccess.ensureBackendSession(true);
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    res = await fetch(`${API}${path}`, { ...options, headers, cache: 'no-store' });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Backend request failed');
  return data;
}

function loadCashfreeSdk() {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve(window.Cashfree);
    const existing = document.querySelector('script[data-cashfree-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree));
      existing.addEventListener('error', () => reject(new Error('Cashfree SDK failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.cashfreeSdk = 'true';
    script.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error('Cashfree SDK unavailable'));
    script.onerror = () => reject(new Error('Unable to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

function collectAdminSettings() {
  const $ = id => document.getElementById(id);
  const value = id => $(id)?.value ?? '';
  const number = id => Number($(id)?.value ?? 0);
  const checked = id => !!$(id)?.checked;
  const old = state.settings || {};
  return {
    general: {
      website_name: value('set-website-name') || old.general?.website_name || 'Bookora',
      tagline: value('set-tagline') || old.general?.tagline || 'Discover. Read. Publish.',
      description: value('set-desc') || old.general?.description || '',
      support_email: value('set-support-email') || old.general?.support_email || '',
      contact_email: value('set-contact-email') || old.general?.contact_email || ''
    },
    branding: {
      primary_accent: value('set-primary-accent') || old.branding?.primary_accent || '#2563EB',
      secondary_accent: value('set-secondary-accent') || old.branding?.secondary_accent || '#1D4ED8'
    },
    marketplace: {
      seller_commission_pct: number('set-author-royalty'),
      platform_commission_pct: number('set-platform-fee'),
      seller_approval_required: checked('set-seller-approval-req'),
      book_approval_required: checked('set-book-approval-req'),
      reviews_enabled: checked('set-reviews-enabled'),
      wishlist_enabled: checked('set-wishlist-enabled'),
      downloads_enabled: checked('set-downloads-enabled'),
      pdf_preview_enabled: checked('set-preview-enabled')
    },
    payments: {
      cashfree_environment: value('set-cf-env') || 'SANDBOX',
      cashfree_app_id: value('set-cf-appid') || old.payments?.cashfree_app_id || '',
      api_version: value('set-cf-api-version') || '2025-01-01'
    },
    currency: {
      default_display_currency: value('set-display-curr') || 'INR',
      currency_symbol: (value('set-display-curr') || 'INR') === 'INR' ? '₹' : '$',
      decimal_places: number('set-decimal-places'),
      payment_currency: 'INR'
    },
    maintenance: {
      enabled: checked('set-maint-enabled'),
      message: value('set-maint-msg') || old.maintenance?.message || ''
    },
    books_config: {
      max_pdf_size_mb: number('set-max-pdf-size'),
      preview_page_limit: number('set-preview-limit'),
      allowed_file_types: ['PDF', 'EPUB']
    },
    external_config: {
      external_listings_enabled: checked('set-ext-enabled'),
      require_redirect_confirmation: checked('set-ext-redirect-confirm'),
      allowed_protocols: ['https:']
    },
    ai_config: {
      groq_model: value('set-groq-model') || old.ai_config?.groq_model || 'llama-3.3-70b-versatile',
      enabled: checked('set-groq-enabled')
    }
  };
}

async function saveAdminSettings(button) {
  const next = collectAdminSettings();
  const seller = Number(next.marketplace.seller_commission_pct);
  const platform = Number(next.marketplace.platform_commission_pct);
  if (!Number.isFinite(seller) || !Number.isFinite(platform) || seller < 0 || platform < 0 || seller > 100 || platform > 100) {
    Toast.show('Commission values must be between 0 and 100%.', 'error');
    return;
  }
  if (Math.abs(seller + platform - 100) > 0.001) {
    Toast.show('Seller + Platform commission must equal 100%.', 'error');
    return;
  }
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = 'Saving...';
  try {
    const result = await backend('/api/admin/settings', { method: 'POST', body: JSON.stringify({ settings: next }) });
    state.settings = result.settings || next;
    state.notify('SETTINGS_UPDATED', state.settings);
    document.documentElement.style.setProperty('--accent', next.branding.primary_accent);
    document.documentElement.style.setProperty('--accent-hover', next.branding.secondary_accent);
    Toast.show('Settings saved successfully.', 'success');
  } catch (error) {
    console.error(error);
    Toast.show(error.message || 'Unable to save settings.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = oldText;
  }
}

function resolveCheckoutBook() {
  const hash = window.location.hash || '';
  const match = hash.match(/#\/checkout\/([^?]+)/);
  if (match) return state.getBookBySlug(decodeURIComponent(match[1]));
  return window.__bookoraCheckoutBook || null;
}

async function startRealCashfree(button) {
  const currentBook = resolveCheckoutBook();
  if (!currentBook) {
    Toast.show('Book information could not be found. Please reopen checkout.', 'error');
    return;
  }

  window.__bookoraCheckoutBook = currentBook;
  button.disabled = true;
  const oldText = button.textContent;
  button.textContent = 'Creating secure payment...';

  try {
    const couponCode = (document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
    const created = await backend('/api/cashfree/create-order', {
      method: 'POST',
      body: JSON.stringify({
        book_id: currentBook.id,
        coupon_code: couponCode,
        phone: state.currentUser?.phone || state.currentUser?.phoneNumber || ''
      })
    });
    if (!created.payment_session_id) throw new Error('Cashfree payment session was not returned.');

    // Render/backend chooses SANDBOX vs PRODUCTION from the admin payment setting.
    // Never hardcode the environment in the browser.
    const Cashfree = await loadCashfreeSdk();
    const environment = String(created.environment || '').toUpperCase();
    const cashfree = Cashfree({ mode: environment === 'PRODUCTION' ? 'production' : 'sandbox' });
    await cashfree.checkout({ paymentSessionId: created.payment_session_id, redirectTarget: '_self' });
  } catch (error) {
    console.error('Cashfree checkout:', error);
    Toast.show(error.message || 'Cashfree payment could not be started.', 'error');
    button.disabled = false;
    button.textContent = oldText || 'Proceed to Cashfree Pay';
  }
}

document.addEventListener('click', event => {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;

  const settingsButton = element.closest('#save-all-settings-btn');
  if (settingsButton && state.isAdmin) {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveAdminSettings(settingsButton);
    return;
  }

  const checkoutButton = element.closest('#trigger-cashfree-btn');
  if (checkoutButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    startRealCashfree(checkoutButton);
    return;
  }

  const legacyButton = element.closest('#cf-pay-btn');
  if (legacyButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    startRealCashfree(legacyButton);
  }
}, true);
