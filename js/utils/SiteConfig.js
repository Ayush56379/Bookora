import { state } from '../state.js';

const DEFAULT_SITE = {
  name: 'Bookora',
  tagline: 'Discover. Read. Publish.',
  description: 'Bookora is a modern digital eBook marketplace.',
  supportEmail: 'support@bookora.com',
  contactEmail: 'contact@bookora.com'
};

export function getSiteConfig() {
  const general = state.settings?.general || {};
  return {
    name: String(general.website_name || DEFAULT_SITE.name).trim() || DEFAULT_SITE.name,
    tagline: String(general.tagline || DEFAULT_SITE.tagline).trim() || DEFAULT_SITE.tagline,
    description: String(general.description || DEFAULT_SITE.description).trim() || DEFAULT_SITE.description,
    supportEmail: String(general.support_email || DEFAULT_SITE.supportEmail).trim() || DEFAULT_SITE.supportEmail,
    contactEmail: String(general.contact_email || DEFAULT_SITE.contactEmail).trim() || DEFAULT_SITE.contactEmail
  };
}

function replaceText(root, replacements) {
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

export function applySiteConfig(root = document.getElementById('app')) {
  const site = getSiteConfig();
  const oldName = window.__BOOKORA_LAST_SITE_NAME__ || DEFAULT_SITE.name;
  const oldTagline = window.__BOOKORA_LAST_TAGLINE__ || DEFAULT_SITE.tagline;

  replaceText(root, [
    [DEFAULT_SITE.name, site.name],
    [oldName, site.name],
    [DEFAULT_SITE.tagline, site.tagline],
    [oldTagline, site.tagline],
    [DEFAULT_SITE.description, site.description],
    ['The world\'s premier digital eBook marketplace. Discover hand-crafted publications, read directly in-browser, and publish your own works to a global audience.', site.description]
  ]);

  // Keep common accessibility/metadata labels in sync as well.
  document.querySelectorAll('[data-site-name]').forEach(el => { el.textContent = site.name; });
  document.querySelectorAll('[data-site-tagline]').forEach(el => { el.textContent = site.tagline; });
  document.querySelectorAll('[data-site-description]').forEach(el => { el.textContent = site.description; });

  const currentTitle = document.title || '';
  document.title = currentTitle
    ? currentTitle.replaceAll(oldName, site.name).replaceAll(DEFAULT_SITE.name, site.name)
    : `${site.name} — ${site.tagline}`;

  const meta = document.querySelector('meta[name="description"]');
  if (meta && (!meta.content || meta.content.includes(DEFAULT_SITE.name))) {
    meta.content = site.description;
  }

  window.__BOOKORA_LAST_SITE_NAME__ = site.name;
  window.__BOOKORA_LAST_TAGLINE__ = site.tagline;
}

export function getSiteName() { return getSiteConfig().name; }
export function getSiteTagline() { return getSiteConfig().tagline; }
export function getSiteDescription() { return getSiteConfig().description; }
