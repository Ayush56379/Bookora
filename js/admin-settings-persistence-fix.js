// Bookora Admin Settings persistence fix.
// Route Admin settings saves through the authenticated backend so the backend
// writes Firestore settings/public and the payment runtime sees the same value.
import { state } from './state.js';
import { Toast } from './components/Toast.js';
import { API_BASE_URL } from './config.js';

const num = (id, fallback = 0) => Number(document.getElementById(id)?.value ?? fallback);
const value = (id, fallback = '') => document.getElementById(id)?.value ?? fallback;
const checked = id => !!document.getElementById(id)?.checked;

function buildSettings() {
  const old = state.settings || {};
  const oldGeneral = old.general || {};
  const oldBranding = old.branding || {};
  const oldMarketplace = old.marketplace || {};
  const oldPayments = old.payments || {};
  const oldCurrency = old.currency || {};
  const oldMaintenance = old.maintenance || {};
  const oldBooks = old.books_config || {};
  const oldExternal = old.external_config || {};
  const oldAI = old.ai_config || {};
  const subscriptionEnv = String(value('set-cf-subscription-env', oldPayments.cashfree_subscription_environment || oldPayments.cashfree_environment || 'SANDBOX')).toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';

  return {
    general: { website_name: value('set-website-name', oldGeneral.website_name || 'Bookora'), tagline: value('set-tagline', oldGeneral.tagline || 'Discover. Read. Publish.'), description: value('set-desc', oldGeneral.description || ''), support_email: value('set-support-email', oldGeneral.support_email || ''), contact_email: value('set-contact-email', oldGeneral.contact_email || '') },
    branding: { primary_accent: value('set-primary-accent', oldBranding.primary_accent || '#2563EB'), secondary_accent: value('set-secondary-accent', oldBranding.secondary_accent || '#1D4ED8') },
    marketplace: { seller_commission_pct: num('set-author-royalty', oldMarketplace.seller_commission_pct ?? 85), platform_commission_pct: num('set-platform-fee', oldMarketplace.platform_commission_pct ?? 15), seller_approval_required: checked('set-seller-approval-req'), book_approval_required: checked('set-book-approval-req'), reviews_enabled: checked('set-reviews-enabled'), wishlist_enabled: checked('set-wishlist-enabled'), downloads_enabled: checked('set-downloads-enabled'), pdf_preview_enabled: checked('set-preview-enabled') },
    payments: { cashfree_environment: value('set-cf-env', oldPayments.cashfree_environment || 'SANDBOX'), cashfree_subscription_environment: subscriptionEnv, cashfree_app_id: value('set-cf-appid', oldPayments.cashfree_app_id || ''), api_version: value('set-cf-api-version', oldPayments.api_version || '2023-08-01') },
    currency: { default_display_currency: value('set-display-curr', oldCurrency.default_display_currency || 'INR'), currency_symbol: value('set-display-curr', oldCurrency.default_display_currency || 'INR') === 'INR' ? '₹' : '$', decimal_places: num('set-decimal-places', oldCurrency.decimal_places ?? 2), payment_currency: 'INR' },
    maintenance: { enabled: checked('set-maint-enabled'), message: value('set-maint-msg', oldMaintenance.message || '') },
    books_config: { max_pdf_size_mb: num('set-max-pdf-size', oldBooks.max_pdf_size_mb ?? 100), preview_page_limit: num('set-preview-limit', oldBooks.preview_page_limit ?? 5), allowed_file_types: ['PDF', 'EPUB'] },
    external_config: { external_listings_enabled: checked('set-ext-enabled'), require_redirect_confirmation: checked('set-ext-redirect-confirm'), allowed_protocols: ['https:'] },
    ai_config: { groq_model: value('set-groq-model', oldAI.groq_model || 'llama-3.1-8b-instant'), enabled: checked('set-groq-enabled') }
  };
}

async function persistSettings(event) {
  const button = event.target instanceof Element ? event.target.closest('#save-all-settings-btn') : null;
  if (!button) return;
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  if (!state.isAdmin) { Toast.show('Admin authorization required.', 'error'); return; }
  const next = buildSettings();
  const seller = Number(next.marketplace.seller_commission_pct); const platform = Number(next.marketplace.platform_commission_pct);
  if (!Number.isFinite(seller) || !Number.isFinite(platform) || seller < 0 || seller > 100 || platform < 0 || platform > 100) { Toast.show('Commission percentages must be between 0 and 100.', 'error'); return; }
  if (Math.abs((seller + platform) - 100) > 0.001) { Toast.show('Seller/Author Royalty and Platform Commission must total 100%.', 'error'); return; }
  const env = String(next.payments.cashfree_environment || '').toUpperCase();
  const subscriptionEnv = String(next.payments.cashfree_subscription_environment || '').toUpperCase();
  if (!['SANDBOX', 'PRODUCTION'].includes(env) || !['SANDBOX', 'PRODUCTION'].includes(subscriptionEnv)) { Toast.show('Invalid Cashfree environment.', 'error'); return; }
  const authUser = window.firebase?.auth?.().currentUser;
  if (!authUser) { Toast.show('Please sign in again before saving Admin settings.', 'error'); return; }
  try {
    button.disabled = true; button.textContent = 'Saving...';
    const token = await authUser.getIdToken(true);
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ settings: next }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.error || `Settings save failed (HTTP ${response.status})`);
    state.settings = result.settings || next; state.notify('SETTINGS_UPDATED', state.settings);
    document.documentElement.style.setProperty('--accent', state.settings.branding?.primary_accent || '#2563EB'); document.documentElement.style.setProperty('--accent-hover', state.settings.branding?.secondary_accent || '#1D4ED8');
    Toast.show(`Settings saved permanently. Cashfree payments: ${env}; AutoPay: ${subscriptionEnv}.`, 'success');
  } catch (error) { console.error('[Bookora Admin Settings] persistence failed:', error); Toast.show(error?.message || 'Settings could not be saved.', 'error'); }
  finally { button.disabled = false; button.textContent = 'Save All Settings'; }
}

document.addEventListener('click', persistSettings, true);

const MODE_KEY = 'bookora_active_mode';
const VALID_MODES = new Set(['admin', 'seller', 'buyer']);
let restoringMode = false;
function canUseMode(mode) { if (mode === 'admin') return !!state.isAdmin; if (mode === 'seller') return !!state.isSeller; return true; }
function restoreAdminMode() {
  if (restoringMode || !state.isAuthenticated) return;
  let saved = '';
  try { saved = localStorage.getItem(MODE_KEY) || ''; } catch (_) {}
  if (!VALID_MODES.has(saved) || !canUseMode(saved) || state.activeMode === saved) return;
  restoringMode = true;
  try { state.setActiveMode(saved); } finally { restoringMode = false; }
}
restoreAdminMode();
state.subscribe((event) => {
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED') setTimeout(restoreAdminMode, 0);
  if (event === 'MODE_CHANGED') { try { if (VALID_MODES.has(state.activeMode) && canUseMode(state.activeMode)) localStorage.setItem(MODE_KEY, state.activeMode); } catch (_) {} }
});
window.addEventListener('hashchange', () => setTimeout(restoreAdminMode, 0));
window.addEventListener('pageshow', () => setTimeout(restoreAdminMode, 0));
