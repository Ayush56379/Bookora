// Bookora AI global single-trigger runtime.
// This runs early and on every SPA route: remove the legacy
// "AI Bookora Support" control and keep exactly one canonical
// "Ask Bookora AI" assistant. It intentionally observes only added nodes
// so it cannot create a MutationObserver feedback/freeze loop.
(() => {
  'use strict';
  if (window.__BOOKORA_AI_GLOBAL_SINGLE_TRIGGER_V1__) return;
  window.__BOOKORA_AI_GLOBAL_SINGLE_TRIGGER_V1__ = true;

  const LEGACY_CLASSES = '[data-bookora-ai-support],.bookora-ai-support,.ai-support-button,.ai-support,.bookora-support-button';
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  const isLegacy = el => {
    if (!(el instanceof Element)) return false;
    if (el.id === 'bookora-ai-root' || el.closest('#bookora-ai-root')) return false;
    const text = normalize(`${el.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`);
    return text.includes('ai bookora support');
  };

  const removeLegacy = root => {
    if (!(root instanceof Element) && !(root instanceof DocumentFragment)) return;
    const found = new Set();
    if (root instanceof Element && isLegacy(root)) found.add(root);
    if (root.querySelectorAll) {
      root.querySelectorAll(`${LEGACY_CLASSES},button,a,[role="button"]`).forEach(el => {
        if (!isLegacy(el)) return;
        const owner = el.closest(LEGACY_CLASSES) || el;
        if (owner.id !== 'bookora-ai-root' && !owner.closest('#bookora-ai-root')) found.add(owner);
      });
    }
    found.forEach(el => {
      if (el !== document.body && !el.closest('#bookora-ai-root')) {
        el.remove();
      }
    });
  };

  const ensureCanonical = async () => {
    if (document.getElementById('bookora-ai-root')) return;
    try {
      const { BookoraAI } = await import('./components/BookoraAIEnhanced.js?v=20260830-global-ai-1');
      if (!document.getElementById('bookora-ai-root')) BookoraAI.init();
    } catch (error) {
      console.warn('[Bookora AI] canonical assistant skipped:', error);
    }
  };

  const start = () => {
    removeLegacy(document.body);
    ensureCanonical();

    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes || []) removeLegacy(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__BOOKORA_AI_GLOBAL_SINGLE_TRIGGER_OBSERVER__ = observer;
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
