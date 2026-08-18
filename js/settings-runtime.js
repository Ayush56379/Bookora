// Bookora runtime settings bridge.
// Firestore-backed branding is applied across every SPA page, including
// dynamically-rendered content, metadata, attributes and footer/header.
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

function applyBranding(s) {
  const primary = s.branding.primary_accent || DEFAULTS.branding.primary_accent;
  const secondary = s.branding.secondary_accent || DEFAULTS.branding.secondary_accent;
  document.documentElement.style.setProperty('--accent', primary);
  document.documentElement.style.setProperty('--accent-hover', secondary);
  document.documentElement.style.setProperty('--border-focus', primary);
  document.documentElement.style.setProperty('--accent-light', `${primary}18`);
}

function replaceTextNodes(root, replacements) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  nodes.forEach(textNode => {
    let text = textNode.nodeValue;
    if (!text || !text.trim()) return;
    let next = text;
    replacements.forEach(([from, to]) => {
      if (from && to && from !== to) next = next.split(from).join(to);
    });
    if (next !== text) textNode.nodeValue = next;
  });
}

function replaceAttributes(root, replacements) {
  if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
  const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
  const all = [root, ...elements];
  const attrs = ['title', 'aria-label', 'placeholder', 'alt', 'content'];

  all.forEach(el => {
    attrs.forEach(attr => {
      if (!el.hasAttribute?.(attr)) return;
      let value = el.getAttribute(attr);
      replacements.forEach(([from, to]) => {
        if (from && to && from !== to) value = value.split(from).join(to);
      });
      el.setAttribute(attr, value);
    });
  });
}

function applyBrandText(s, root = document.getElementById('app')) {
  const name = String(s.general.website_name || DEFAULTS.general.website_name).trim();
  const tagline = String(s.general.tagline || DEFAULTS.general.tagline).trim();
  const description = String(s.general.description || DEFAULTS.general.description).trim();
  const previousName = window.BOOKORA_LAST_SITE_NAME || DEFAULTS.general.website_name;
  const previousTagline = window.BOOKORA_LAST_TAGLINE || DEFAULTS.general.tagline;
  const previousDescription = window.BOOKORA_LAST_DESCRIPTION || DEFAULTS.general.description;

  const replacements = [
    [previousName, name],
    [DEFAULTS.general.website_name, name],
    [previousTagline, tagline],
    [DEFAULTS.general.tagline, tagline],
    [previousDescription, description],
    [DEFAULTS.general.description, description],
    ["The world's premier digital eBook marketplace. Discover hand-crafted publications, read directly in-browser, and publish your own works to a global audience.", description],
    ['Bookora is a premium eBook marketplace where you can discover, buy, read, and publish world-class eBooks.', description],
    ['Bookora is a modern premium digital eBook marketplace. Discover inspiring books, read in-browser, download verified files, and publish your own works.', description]
  ];

  replaceTextNodes(root, replacements);
  replaceAttributes(root, replacements);

  // Explicit dynamic slots can be used by any future page without hard-coded text.
  document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = name; });
  document.querySelectorAll('[data-site-tagline]').forEach(el => { el.textContent = tagline; });
  document.querySelectorAll('[data-site-description]').forEach(el => { el.textContent = description; });
  document.querySelectorAll('[data-site-support-email]').forEach(el => { el.textContent = s.general.support_email || ''; });
  document.querySelectorAll('[data-site-contact-email]').forEach(el => { el.textContent = s.general.contact_email || ''; });

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
    if (strong && (strong.textContent.includes('Discover') || strong.textContent === previousTagline)) strong.textContent = tagline;
    const yearLine = footer.querySelector('div[style*="border-top"] div');
    if (yearLine && /Bookora|All rights reserved/i.test(yearLine.textContent)) {
      yearLine.innerHTML = `© ${new Date().getFullYear()} ${esc(name)}. All rights reserved. <strong>${esc(tagline)}</strong>`;
    }
  }

  document.title = `${name} — ${tagline || 'Digital eBook Marketplace'}`;
  setMeta('description', description);
  setPropertyMeta('og:title', `${name} — ${tagline || 'Digital eBook Marketplace'}`);
  setPropertyMeta('og:description', description);

  window.BOOKORA_LAST_SITE_NAME = name;
  window.BOOKORA_LAST_TAGLINE = tagline;
  window.BOOKORA_LAST_DESCRIPTION = description;
}

function applySettings(root = document.getElementById('app')) {
  const s = merged();
  applyBranding(s);
  applyBrandText(s, root);
  window.BOOKORA_SETTINGS = s;
  window.BOOKORA_CURRENCY = {
    code: s.currency.default_display_currency || 'INR',
    symbol: s.currency.currency_symbol || (s.currency.default_display_currency === 'USD' ? '$' : '₹'),
    decimals: Number.isFinite(Number(s.currency.decimal_places)) ? Number(s.currency.decimal_places) : 2
  };
}

let refreshPending = false;
let observer = null;

function installObserver() {
  if (observer || !document.body) return;
  observer = new MutationObserver(mutations => {
    const hasNewContent = mutations.some(m => m.addedNodes && m.addedNodes.length);
    if (!hasNewContent) return;
    clearTimeout(window.__BOOKORA_SETTINGS_APPLY_TIMER);
    window.__BOOKORA_SETTINGS_APPLY_TIMER = setTimeout(() => applyBrandText(merged()), 0);
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
