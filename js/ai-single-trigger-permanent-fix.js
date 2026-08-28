/* Bookora AI single-trigger guard.
   Keep exactly one visible floating AI trigger on the public homepage.
   This guard is intentionally bounded: it must never continuously scan or
   mutate the whole DOM because AI support should not be able to freeze Home. */
(() => {
  if (window.__BOOKORA_AI_SINGLE_TRIGGER_GUARD_V2__) return;
  window.__BOOKORA_AI_SINGLE_TRIGGER_GUARD_V2__ = true;

  const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  let timer = null;

  function cleanup() {
    const home = document.querySelector('#main-content .bookora-home-clean');
    if (!home) return;
    const canonical = document.getElementById('bookora-ai-trigger-btn');
    const nodes = home.querySelectorAll('button, a, [role="button"], [aria-label], [title]');
    nodes.forEach(node => {
      if (!node || node === canonical || node.closest('#bookora-ai-root') || node.hasAttribute('data-bookora-ai-legacy-hidden')) return;
      const label = normalizeText(`${node.textContent || ''} ${node.getAttribute('aria-label') || ''} ${node.getAttribute('title') || ''}`);
      if (!label || !label.includes('ai bookora support')) return;
      const owner = node.closest('[data-bookora-ai-support], .bookora-ai-support, .ai-support-button, .ai-support, .bookora-support-button') || node;
      if (owner === canonical || owner.closest('#bookora-ai-root')) return;
      owner.setAttribute('data-bookora-ai-legacy-hidden', '1');
      owner.style.setProperty('display', 'none', 'important');
      owner.setAttribute('aria-hidden', 'true');
    });
  }

  function scheduleCleanup() {
    if (timer) return;
    timer = setTimeout(() => { timer = null; cleanup(); }, 80);
  }

  function start() {
    cleanup();
    const observer = new MutationObserver(records => {
      // Observe only newly inserted DOM nodes. Do not observe attributes or
      // characterData: cleanup itself changes attributes and would otherwise
      // create a self-triggering MutationObserver loop.
      if (records.some(record => record.type === 'childList' && record.addedNodes.length)) scheduleCleanup();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__BOOKORA_AI_SINGLE_TRIGGER_GUARD__ = observer;
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
