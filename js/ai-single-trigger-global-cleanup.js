// Bookora AI single-trigger cleanup.
// Keep the canonical "Ask Bookora AI" assistant and permanently remove
// the legacy "AI Bookora Support" floating control on every route.
// IMPORTANT: this cleanup must NEVER initialize/recreate another AI trigger.
(() => {
  'use strict';
  if (window.__BOOKORA_AI_GLOBAL_CLEANUP_V2__) return;
  window.__BOOKORA_AI_GLOBAL_CLEANUP_V2__ = true;

  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const isLegacy = el => {
    if (!(el instanceof Element)) return false;
    if (el.closest('#bookora-ai-root')) return false;
    const label = normalize(`${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`);
    return label.includes('ai bookora support');
  };

  const removeLegacyFrom = root => {
    if (!(root instanceof Element) && !(root instanceof DocumentFragment)) return;
    const candidates = [];
    if (root instanceof Element && isLegacy(root)) candidates.push(root);
    if (root.querySelectorAll) {
      root.querySelectorAll('[data-bookora-ai-support],.bookora-ai-support,.ai-support-button,.ai-support,.bookora-support-button,button,a,[role="button"]').forEach(el => {
        if (isLegacy(el)) candidates.push(el.closest('[data-bookora-ai-support],.bookora-ai-support,.ai-support-button,.ai-support,.bookora-support-button') || el);
      });
    }
    [...new Set(candidates)].forEach(el => {
      if (el !== document.body && !el.closest('#bookora-ai-root')) {
        el.setAttribute('data-bookora-ai-legacy-removed','1');
        el.style.setProperty('display','none','important');
        el.setAttribute('aria-hidden','true');
      }
    });
  };

  const start = () => {
    removeLegacyFrom(document.body);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes || []) removeLegacyFrom(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__BOOKORA_AI_GLOBAL_CLEANUP_OBSERVER__ = observer;
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
