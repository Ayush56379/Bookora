// Bookora runtime settings bridge.
// Keeps Firestore-backed admin settings visible across the SPA immediately
// and after a full refresh without hard-coding branding in components.
import { state } from './state.js';

const DEFAULTS = {
  general: { website_name: 'Bookora', tagline: 'Discover. Read. Publish.', description: 'Bookora is a modern digital eBook marketplace.' },
  branding: { primary_accent: '#2563EB', secondary_accent: '#1D4ED8' },
  currency: { default_display_currency: 'INR', currency_symbol: '₹', decimal_places: 2 },
  maintenance: { enabled: false, message: 'Bookora is currently undergoing scheduled platform enhancements.' }
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

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

function applyBranding(s) {
  const primary = s.branding.primary_accent || DEFAULTS.branding.primary_accent;
  const secondary = s.branding.secondary_accent || DEFAULTS.branding.secondary_accent;
  document.documentElement.style.setProperty('--accent', primary);
  document.documentElement.style.setProperty('--accent-hover', secondary);
  document.documentElement.style.setProperty('--border-focus', primary);
  document.documentElement.style.setProperty('--accent-light', `${primary}18`);
}

function applyBrandText(s) {
  const name = s.general.website_name || 'Bookora';
  const tagline = s.general.tagline || '';
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
    if (strong && strong.textContent.includes('Discover')) strong.textContent = tagline;
    const yearLine = footer.querySelector('div[style*="border-top"] div');
    if (yearLine && yearLine.textContent.includes('Bookora')) {
      yearLine.innerHTML = `© ${new Date().getFullYear()} ${esc(name)}. All rights reserved. <strong>${esc(tagline)}</strong>`;
    }
  }
  document.title = `${name} — ${tagline || 'Digital eBook Marketplace'}`;
  setMeta('description', s.general.description || DEFAULTS.general.description);
}

function applySettings() {
  const s = merged();
  applyBranding(s);
  applyBrandText(s);
  window.BOOKORA_SETTINGS = s;
  window.BOOKORA_CURRENCY = {
    code: s.currency.default_display_currency || 'INR',
    symbol: s.currency.currency_symbol || (s.currency.default_display_currency === 'USD' ? '$' : '₹'),
    decimals: Number.isFinite(Number(s.currency.decimal_places)) ? Number(s.currency.decimal_places) : 2
  };
}

let refreshPending = false;
state.subscribe((event) => {
  if (event !== 'SETTINGS_UPDATED' && event !== 'DATA_SYNCED') return;
  applySettings();
  if (event === 'SETTINGS_UPDATED' && !refreshPending) {
    refreshPending = true;
    // Re-run the current SPA route so settings-dependent UI is rebuilt from the
    // newly saved Firestore values instead of only changing CSS variables.
    setTimeout(() => {
      refreshPending = false;
      window.dispatchEvent(new Event('hashchange'));
    }, 0);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySettings, { once: true });
} else {
  applySettings();
}
