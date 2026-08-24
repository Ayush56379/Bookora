// Bookora Admin Settings — Firestore-authoritative UI hydration.
// The Admin Settings screen must display the current settings/public document from
// Firestore after every refresh. The backend public-settings mirror is not used for
// rendering this admin screen because it can lag behind the authoritative document.
import { state } from './state.js';

const ROUTE = '#/admin/settings';
let loading = false;
let dirty = false;
let observer = null;
let lastHydratedSignature = '';

const path = () => (window.location.hash || '#/').split('?')[0];
const isAdminSettingsRoute = () => path() === ROUTE;

function mergeSettings(next) {
  const current = state.settings || {};
  return {
    ...current,
    ...next,
    general: { ...(current.general || {}), ...(next.general || {}) },
    branding: { ...(current.branding || {}), ...(next.branding || {}) },
    marketplace: { ...(current.marketplace || {}), ...(next.marketplace || {}) },
    payments: { ...(current.payments || {}), ...(next.payments || {}) },
    payouts: { ...(current.payouts || {}), ...(next.payouts || {}) },
    currency: { ...(current.currency || {}), ...(next.currency || {}) },
    maintenance: { ...(current.maintenance || {}), ...(next.maintenance || {}) },
    books_config: { ...(current.books_config || {}), ...(next.books_config || {}) },
    external_config: { ...(current.external_config || {}), ...(next.external_config || {}) },
    ai_config: { ...(current.ai_config || {}), ...(next.ai_config || {}) }
  };
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el || dirty) return;
  if (document.activeElement === el) return;
  const next = value == null ? '' : String(value);
  if (el.value !== next) el.value = next;
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (!el || dirty || document.activeElement === el) return;
  el.checked = value === true;
}

function setMode(prefix, mode) {
  if (dirty) return;
  const normalized = String(mode || 'SANDBOX').toUpperCase();
  document.querySelectorAll(`[data-mode-target="${prefix}"]`).forEach(btn => {
    const active = String(btn.dataset.mode || '').toUpperCase() === normalized;
    btn.classList.toggle('active', active && normalized !== 'PRODUCTION');
    btn.classList.toggle('production', active && normalized === 'PRODUCTION');
  });
  const status = document.getElementById(`${prefix}-mode-status`);
  if (status) status.textContent = normalized === 'PRODUCTION' ? '🔴 Production selected' : '🧪 Sandbox selected';
}

function ensureGroqOption(value) {
  const select = document.getElementById('set-groq-model');
  if (!select || !value || dirty) return;
  if (![...select.options].some(option => option.value === String(value))) {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(value);
    select.appendChild(option);
  }
}

function hydrateForm(settings) {
  if (!isAdminSettingsRoute() || dirty) return;
  const g = settings.general || {};
  const b = settings.branding || {};
  const m = settings.marketplace || {};
  const p = settings.payments || {};
  const po = settings.payouts || {};
  const cu = settings.currency || {};
  const ma = settings.maintenance || {};
  const bo = settings.books_config || {};
  const ex = settings.external_config || {};
  const ai = settings.ai_config || {};

  setValue('set-website-name', g.website_name);
  setValue('set-tagline', g.tagline);
  setValue('set-desc', g.description);
  setValue('set-support-email', g.support_email);
  setValue('set-contact-email', g.contact_email);
  setValue('set-primary-accent', b.primary_accent);
  setValue('set-secondary-accent', b.secondary_accent);
  setValue('set-author-royalty', m.seller_commission_pct);
  setValue('set-platform-fee', m.platform_commission_pct);
  setChecked('set-seller-approval-req', m.seller_approval_required);
  setChecked('set-book-approval-req', m.book_approval_required);
  setChecked('set-reviews-enabled', m.reviews_enabled);
  setChecked('set-wishlist-enabled', m.wishlist_enabled);
  setChecked('set-downloads-enabled', m.downloads_enabled);
  setChecked('set-preview-enabled', m.pdf_preview_enabled);
  setMode('buy', p.cashfree_environment);
  setValue('set-cf-appid', p.cashfree_app_id);
  setValue('set-cf-api-version', p.api_version);
  setMode('wallet', po.cashfree_environment || p.cashfree_environment);
  setValue('set-display-curr', cu.default_display_currency);
  setValue('set-decimal-places', cu.decimal_places);
  setChecked('set-maint-enabled', ma.enabled);
  setValue('set-maint-msg', ma.message);
  setValue('set-max-pdf-size', bo.max_pdf_size_mb);
  setValue('set-preview-limit', bo.preview_page_limit);
  setChecked('set-ext-enabled', ex.external_listings_enabled);
  setChecked('set-ext-redirect-confirm', ex.require_redirect_confirmation);
  ensureGroqOption(ai.groq_model);
  setValue('set-groq-model', ai.groq_model);
  setChecked('set-groq-enabled', ai.enabled !== false);
}

async function readFirestoreSettings() {
  if (!isAdminSettingsRoute() || !state.isAdmin || loading) return false;
  const firebase = window.firebase;
  if (!firebase?.auth || !firebase?.firestore) return false;
  const user = firebase.auth().currentUser;
  if (!user) return false;

  loading = true;
  try {
    const db = firebase.firestore();
    const snap = await db.collection('settings').doc('public').get({ source: 'server' });
    if (!snap.exists) return false;
    const fresh = snap.data() || {};
    state.settings = mergeSettings(fresh);
    const signature = JSON.stringify(state.settings);
    if (signature !== lastHydratedSignature) {
      lastHydratedSignature = signature;
      hydrateForm(state.settings);
    }
    const status = document.getElementById('as-db-status');
    if (status) status.textContent = 'Live Firestore data loaded.';
    return true;
  } catch (error) {
    console.warn('[Bookora Admin Settings] Firestore hydration failed:', error);
    const status = document.getElementById('as-db-status');
    if (status && isAdminSettingsRoute()) status.textContent = 'Could not read live Firestore settings. Existing values were kept.';
    return false;
  } finally {
    loading = false;
  }
}

function markDirty(event) {
  if (!isAdminSettingsRoute()) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest('.admin-settings input, .admin-settings textarea, .admin-settings select')) dirty = true;
}

document.addEventListener('input', markDirty, true);
document.addEventListener('change', markDirty, true);
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (target.closest('#save-all-settings-btn')) {
    dirty = false;
    setTimeout(() => readFirestoreSettings(), 500);
    return;
  }
  if (target.closest('#reload-settings-btn')) {
    dirty = false;
    setTimeout(() => readFirestoreSettings(), 0);
  }
}, true);

state.subscribe(event => {
  if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED') {
    dirty = false;
    setTimeout(() => readFirestoreSettings(), 150);
  }
  if (event === 'SETTINGS_UPDATED') {
    dirty = false;
    setTimeout(() => readFirestoreSettings(), 300);
  }
});

function startObserver() {
  if (observer || !document.body) return;
  observer = new MutationObserver(mutations => {
    if (!isAdminSettingsRoute()) return;
    const added = mutations.some(m => [...(m.addedNodes || [])].some(n => n.nodeType === Node.ELEMENT_NODE));
    if (!added) return;
    clearTimeout(window.__BOOKORA_ADMIN_SETTINGS_FIRESTORE_TIMER);
    window.__BOOKORA_ADMIN_SETTINGS_FIRESTORE_TIMER = setTimeout(() => {
      if (!dirty) readFirestoreSettings();
    }, 120);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => readFirestoreSettings(), 200);
}

window.addEventListener('hashchange', () => {
  dirty = false;
  if (isAdminSettingsRoute()) setTimeout(() => readFirestoreSettings(), 120);
});
window.addEventListener('pageshow', () => {
  if (isAdminSettingsRoute()) {
    dirty = false;
    setTimeout(() => readFirestoreSettings(), 120);
  }
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
else startObserver();
