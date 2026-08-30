// Bookora AI single-trigger cleanup.
// Keep the canonical "Ask Bookora AI" assistant and permanently remove
// the legacy "AI Bookora Support" floating control on every route.
// IMPORTANT: this cleanup initializes only the canonical assistant and never
// creates a second AI trigger. It observes only added nodes to avoid loops.
(() => {
  'use strict';
  if (window.__BOOKORA_AI_GLOBAL_CLEANUP_V3__) return;
  window.__BOOKORA_AI_GLOBAL_CLEANUP_V3__ = true;

  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const legacySelector = '[data-bookora-ai-support],.bookora-ai-support,.ai-support-button,.ai-support,.bookora-support-button';
  const isLegacy = el => {
    if (!(el instanceof Element)) return false;
    if (el.id === 'bookora-ai-root' || el.closest('#bookora-ai-root')) return false;
    const label = normalize(`${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`);
    return label.includes('ai bookora support');
  };

  const removeLegacyFrom = root => {
    if (!(root instanceof Element) && !(root instanceof DocumentFragment)) return;
    const candidates = new Set();
    if (root instanceof Element && isLegacy(root)) candidates.add(root);
    if (root.querySelectorAll) {
      root.querySelectorAll(`${legacySelector},button,a,[role="button"]`).forEach(el => {
        if (!isLegacy(el)) return;
        const owner = el.closest(legacySelector) || el;
        if (owner.id !== 'bookora-ai-root' && !owner.closest('#bookora-ai-root')) candidates.add(owner);
      });
    }
    candidates.forEach(el => {
      if (el !== document.body && !el.closest('#bookora-ai-root')) {
        el.setAttribute('data-bookora-ai-legacy-removed', '1');
        el.remove();
      }
    });
  };

  const ensureCanonicalAI = async () => {
    if (document.getElementById('bookora-ai-root')) return;
    try {
      const { BookoraAI } = await import('./components/BookoraAIEnhanced.js?v=20260830-global-ai-2');
      if (!document.getElementById('bookora-ai-root')) BookoraAI.init();
    } catch (error) {
      console.warn('[Bookora AI] canonical assistant skipped:', error);
    }
  };

  const start = () => {
    removeLegacyFrom(document.body);
    ensureCanonicalAI();
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
