// Bookora runtime settings bridge.
// Firestore-backed public settings are applied globally after every route render.
// Secrets remain server-side; marketplace controls here only govern UI/runtime behaviour.
import { state } from './state.js';

const DEFAULTS = {
  general: {
    website_name: 'Bookora',
    tagline: 'Discover. Read. Publish.',
    description: 'Bookora is a modern digital eBook marketplace.',
    support_email: 'support@bookora.com',
    contact_email: 'contact@bookora.com'
  },
  branding: { primary_accent: '#2563EB', secondary_accent: '#1D4ED8' },
  marketplace: {
    seller_commission_pct: 85,
    platform_commission_pct: 15,
    seller_approval_required: true,
    book_approval_required: true,
    reviews_enabled: true,
    wishlist_enabled: true,
    downloads_enabled: true,
    pdf_preview_enabled: true
  },
  currency: { default_display_currency: 'INR', currency_symbol: '₹', decimal_places: 2 },
  maintenance: { enabled: false, message: 'Bookora is currently undergoing scheduled platform enhancements.' }
};

function merged() {
  const s = state.settings || {};
  return {
    ...DEFAULTS,
    ...s,
    general: { ...DEFAULTS.general, ...(s.general || {}) },
    branding: { ...DEFAULTS.branding, ...(s.branding || {}) },
    marketplace: { ...DEFAULTS.marketplace, ...(s.marketplace || {}) },
    currency: { ...DEFAULTS.currency, ...(s.currency || {}) },
    maintenance: { ...DEFAULTS.maintenance, ...(s.maintenance || {}) }
  };
}

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setPropertyMeta(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function normalizeColor(value, fallback) {
  const v = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

function applyBranding(s) {
  const primary = normalizeColor(s.branding.primary_accent, DEFAULTS.branding.primary_accent);
  const secondary = normalizeColor(s.branding.secondary_accent, DEFAULTS.branding.secondary_accent);

  document.documentElement.style.setProperty('--accent', primary);
  document.documentElement.style.setProperty('--accent-hover', secondary);
  document.documentElement.style.setProperty('--brand-primary', primary);
  document.documentElement.style.setProperty('--brand-secondary', secondary);
  document.documentElement.style.setProperty('--border-focus', primary);
  document.documentElement.style.setProperty('--accent-light', `${primary}18`);

  let style = document.getElementById('bookora-branding-runtime-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'bookora-branding-runtime-style';
    document.head.appendChild(style);
  }

  style.textContent = `
    .btn-primary, .as-save { background: ${primary} !important; border-color: ${primary} !important; }
    .btn-primary:hover, .as-save:hover { background: ${secondary} !important; border-color: ${secondary} !important; }
    .nav-link.active, .as-tab.active { color: ${primary} !important; }
    .badge-bookora { color: ${primary} !important; background: ${primary}18 !important; border-color: ${primary}35 !important; }
    .header-sticky a[href="#/"] > div:first-child { background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%) !important; box-shadow: 0 4px 12px ${primary}4D !important; }
    .header-sticky a[href="#/"] > div:first-child + div > div:first-child { color: ${primary} !important; }
    .admin-settings .as-save:focus-visible, .admin-settings .as-tab:focus-visible,
    .admin-settings input:focus, .admin-settings select:focus, .admin-settings textarea:focus {
      outline-color: ${primary} !important; border-color: ${primary} !important;
    }
  `;
}

function applyMarketplace(s) {
  const m = s.marketplace;
  window.BOOKORA_MARKETPLACE = {
    sellerCommissionPct: Number(m.seller_commission_pct),
    platformCommissionPct: Number(m.platform_commission_pct),
    sellerApprovalRequired: m.seller_approval_required !== false,
    bookApprovalRequired: m.book_approval_required !== false,
    reviewsEnabled: m.reviews_enabled !== false,
    wishlistEnabled: m.wishlist_enabled !== false,
    downloadsEnabled: m.downloads_enabled !== false,
    pdfPreviewEnabled: m.pdf_preview_enabled !== false
  };

  // If seller approval is disabled, every authenticated user is allowed to enter
  // creator mode. Admin always keeps admin privileges.
  if (state.isAuthenticated && !state.isAdmin && m.seller_approval_required === false) {
    state.isSeller = true;
    state.activeMode = 'seller';
    localStorage.setItem('bookora_active_mode', 'seller');
  }

  let style = document.getElementById('bookora-marketplace-runtime-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'bookora-marketplace-runtime-style';
    document.head.appendChild(style);
  }

  const wishlistOff = m.wishlist_enabled === false;
  const reviewsOff = m.reviews_enabled === false;
  const downloadsOff = m.downloads_enabled === false;
  const previewOff = m.pdf_preview_enabled === false;

  style.textContent = `
    ${wishlistOff ? `
      #detail-wishlist-btn, .book-wishlist-btn, a[href="#/wishlist"],
      [id*="wishlist"], [class*="wishlist"] { display:none !important; }
    ` : ''}
    ${reviewsOff ? `
      [id*="review"], [class*="review"] { display:none !important; }
    ` : ''}
    ${downloadsOff ? `
      [id*="download"], [class*="download"] { display:none !important; }
    ` : ''}
    ${previewOff ? `
      .book-detail-page #detail-preview-btn, .book-detail-page .quick-preview-btn,
      .explore-page .quick-preview-btn { display:none !important; }
    ` : ''}
  `;

  // Keep the admin Marketplace form itself visible; update its royalty copy dynamically.
  const royaltyLabel = document.querySelector('#set-author-royalty')?.closest('.as-grid')?.querySelector('.as-field label');
  if (royaltyLabel) royaltyLabel.textContent = `Seller / Author Royalty (%)`;

  const price = document.getElementById('pub-price');
  const sale = document.getElementById('pub-saleprice');
  const royalty = document.getElementById('pub-royalty-calc');
  if (price && royalty) {
    const finalPrice = Number(sale?.value || price.value || 0);
    const pct = Number(m.seller_commission_pct);
    royalty.textContent = `${formatMoney(finalPrice * pct / 100)} per sale`;
    const strong = royalty.parentElement?.querySelector('strong');
    if (strong) strong.textContent = `Estimated Author Royalty: ${pct}%`;
  }

  // If book approval is disabled, tell the publish screen that the listing is immediate.
  if (m.book_approval_required === false) {
    const submitInfo = document.querySelector('#step-5 div[style*="background:#eff6ff"]');
    if (submitInfo) {
      submitInfo.innerHTML = 'Your eBook will be uploaded to <strong>Google Drive</strong> and published to the marketplace immediately after successful validation.';
    }
    const submitHeading = document.querySelector('#step-5 h3');
    if (submitHeading) submitHeading.textContent = 'Step 5: Publish eBook';
  }
}

function formatMoney(value) {
  const c = window.BOOKORA_CURRENCY || { symbol: '₹', decimals: 2 };
  const amount = Number(value || 0).toFixed(c.decimals);
  return `${c.symbol}${amount}`;
}

function applyBrandSlots(s) {
  const name = String(s.general.website_name || DEFAULTS.general.website_name).trim();
  const tagline = String(s.general.tagline || DEFAULTS.general.tagline).trim();
  const description = String(s.general.description || DEFAULTS.general.description).trim();
  const supportEmail = String(s.general.support_email || '').trim();
  const contactEmail = String(s.general.contact_email || '').trim();

  document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = name; });
  document.querySelectorAll('[data-site-tagline]').forEach(el => { el.textContent = tagline; });
  document.querySelectorAll('[data-site-description]').forEach(el => { el.textContent = description; });
  document.querySelectorAll('[data-site-support-email]').forEach(el => { el.textContent = supportEmail; });
  document.querySelectorAll('[data-site-contact-email]').forEach(el => { el.textContent = contactEmail; });

  const brand = document.querySelector('.header-sticky a[href="#/"]');
  if (brand) {
    const blocks = brand.querySelectorAll(':scope > div:last-child > div');
    if (blocks[0]) blocks[0].textContent = name;
    if (blocks[1]) blocks[1].textContent = tagline;
  }

  const drawer = document.querySelector('#mobile-nav-drawer > div:first-child > div:first-child');
  if (drawer) drawer.textContent = name;

  const footer = document.querySelector('#footer-container footer');
  if (footer) {
    const footerBrand = footer.querySelector('span[style*="font-family"]');
    if (footerBrand) footerBrand.textContent = name;
    const strong = footer.querySelector('strong');
    if (strong && (strong.textContent.includes('Discover') || strong.textContent === 'Discover. Read. Publish.')) strong.textContent = tagline;
  }

  document.title = `${name} — ${tagline || 'Digital eBook Marketplace'}`;
  setMeta('description', description);
  setPropertyMeta('og:title', `${name} — ${tagline || 'Digital eBook Marketplace'}`);
  setPropertyMeta('og:description', description);
}

function applySettings() {
  const s = merged();
  applyBranding(s);
  applyMarketplace(s);
  applyBrandSlots(s);
  window.BOOKORA_SETTINGS = s;
  window.BOOKORA_CURRENCY = {
    code: s.currency.default_display_currency || 'INR',
    symbol: s.currency.currency_symbol || (s.currency.default_display_currency === 'USD' ? '$' : '₹'),
    decimals: Number.isFinite(Number(s.currency.decimal_places)) ? Number(s.currency.decimal_places) : 2
  };
}

let observer = null;
let refreshPending = false;

function installObserver() {
  if (observer || !document.body) return;
  observer = new MutationObserver(mutations => {
    const hasNewContent = mutations.some(m => m.addedNodes && m.addedNodes.length);
    if (!hasNewContent) return;
    clearTimeout(window.__BOOKORA_SETTINGS_APPLY_TIMER);
    window.__BOOKORA_SETTINGS_APPLY_TIMER = setTimeout(() => applySettings(), 0);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  applySettings();
}

// Guard marketplace actions even when a component is rendered after the route.
document.addEventListener('click', event => {
  const m = merged().marketplace;
  if (m.wishlist_enabled === false && event.target.closest('#detail-wishlist-btn,.book-wishlist-btn,a[href="#/wishlist"]')) {
    event.preventDefault(); event.stopPropagation(); return;
  }
  if (m.pdf_preview_enabled === false && event.target.closest('#detail-preview-btn,.quick-preview-btn')) {
    event.preventDefault(); event.stopPropagation(); return;
  }
  if (m.downloads_enabled === false && event.target.closest('[id*="download"],[class*="download"]')) {
    event.preventDefault(); event.stopPropagation(); return;
  }
  if (m.reviews_enabled === false && event.target.closest('[id*="review"],[class*="review"]')) {
    event.preventDefault(); event.stopPropagation(); return;
  }
});

// Redirect disabled marketplace routes.
window.addEventListener('hashchange', () => {
  const m = merged().marketplace;
  const path = (window.location.hash || '#/').split('?')[0];
  if (m.wishlist_enabled === false && path === '#/wishlist') {
    window.location.hash = '#/explore';
  }
});

// Enforce book-approval setting at the API boundary for the public create-book request.
// The backend remains authoritative; this keeps the frontend payload consistent with admin settings.
if (!window.__BOOKORA_FETCH_MARKETPLACE_PATCHED) {
  window.__BOOKORA_FETCH_MARKETPLACE_PATCHED = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (String(url).includes('/api/books/create') && init?.body && typeof init.body === 'string') {
      try {
        const payload = JSON.parse(init.body);
        if (payload && typeof payload === 'object') {
          const m = merged().marketplace;
          if (m.book_approval_required === false) payload.status = 'approved';
          if (m.book_approval_required !== false) payload.status = 'pending';
          init = { ...init, body: JSON.stringify(payload) };
        }
      } catch (_) {
        // Leave non-JSON requests untouched.
      }
    }
    return nativeFetch(input, init);
  };
}

state.subscribe((event) => {
  if (event !== 'SETTINGS_UPDATED' && event !== 'DATA_SYNCED' && event !== 'USER_LOGGED_IN') return;
  applySettings();
  if (event === 'SETTINGS_UPDATED' && !refreshPending) {
    refreshPending = true;
    setTimeout(() => {
      refreshPending = false;
      window.dispatchEvent(new Event('hashchange'));
    }, 0);
  }
  if (event === 'DATA_SYNCED' && state.isAuthenticated && !state.isAdmin && merged().marketplace.seller_approval_required === false) {
    state.isSeller = true;
    state.activeMode = 'seller';
    localStorage.setItem('bookora_active_mode', 'seller');
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installObserver, { once: true });
} else {
  installObserver();
}
