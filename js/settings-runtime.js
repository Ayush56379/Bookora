// Bookora runtime settings bridge.
// Firestore-backed branding is applied through explicit branding slots only.
// Never replace arbitrary page text with the site description.
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

  // A number of older components use hard-coded Bookora blue values.
  // Override only known brand UI elements; never touch arbitrary page text/content.
  let style = document.getElementById('bookora-branding-runtime-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'bookora-branding-runtime-style';
    document.head.appendChild(style);
  }

  style.textContent = `
    .btn-primary,
    .as-save,
    .nav-link.active,
    .as-tab.active,
    .badge-bookora,
    .mobile-nav-drawer .btn-primary {
      --brand-current: ${primary};
    }

    .btn-primary,
    .as-save {
      background: ${primary} !important;
      border-color: ${primary} !important;
    }

    .btn-primary:hover,
    .as-save:hover {
      background: ${secondary} !important;
      border-color: ${secondary} !important;
    }

    .nav-link.active,
    .as-tab.active {
      color: ${primary} !important;
    }

    .badge-bookora {
      color: ${primary} !important;
      background: ${primary}18 !important;
      border-color: ${primary}35 !important;
    }

    .header-sticky a[href="#/"] > div:first-child {
      background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%) !important;
      box-shadow: 0 4px 12px ${primary}4D !important;
    }

    .header-sticky a[href="#/"] > div:first-child + div > div:first-child {
      color: ${primary} !important;
    }

    .admin-settings .as-save:focus-visible,
    .admin-settings .as-tab:focus-visible,
    .admin-settings input:focus,
    .admin-settings select:focus,
    .admin-settings textarea:focus {
      outline-color: ${primary} !important;
      border-color: ${primary} !important;
    }
  `;
}

function applyBrandSlots(s) {
  const name = String(s.general.website_name || DEFAULTS.general.website_name).trim();
  const tagline = String(s.general.tagline || DEFAULTS.general.tagline).trim();
  const description = String(s.general.description || DEFAULTS.general.description).trim();
  const supportEmail = String(s.general.support_email || '').trim();
  const contactEmail = String(s.general.contact_email || '').trim();

  // Explicit slots are the safe source of truth for visible branding.
  document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = name; });
  document.querySelectorAll('[data-site-tagline]').forEach(el => { el.textContent = tagline; });
  document.querySelectorAll('[data-site-description]').forEach(el => { el.textContent = description; });
  document.querySelectorAll('[data-site-support-email]').forEach(el => { el.textContent = supportEmail; });
  document.querySelectorAll('[data-site-contact-email]').forEach(el => { el.textContent = contactEmail; });

  // Existing shared header/footer components that do not yet expose data slots.
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
    if (strong && (strong.textContent.includes('Discover') || strong.textContent === 'Discover. Read. Publish.')) {
      strong.textContent = tagline;
    }
  }

  // Metadata is intentionally updated separately; visible page content is never searched/replaced.
  document.title = `${name} — ${tagline || 'Digital eBook Marketplace'}`;
  setMeta('description', description);
  setPropertyMeta('og:title', `${name} — ${tagline || 'Digital eBook Marketplace'}`);
  setPropertyMeta('og:description', description);
}

function applySettings() {
  const s = merged();
  applyBranding(s);
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

state.subscribe((event) => {
  if (event !== 'SETTINGS_UPDATED' && event !== 'DATA_SYNCED') return;
  applySettings();
  if (event === 'SETTINGS_UPDATED' && !refreshPending) {
    refreshPending = true;
    setTimeout(() => {
      refreshPending = false;
      window.dispatchEvent(new Event('hashchange'));
    }, 0);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installObserver, { once: true });
} else {
  installObserver();
}
