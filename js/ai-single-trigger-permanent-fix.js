/* Bookora AI single-trigger guard.
   Keep exactly one visible floating AI trigger on the public homepage.
   Prefer the canonical #bookora-ai-root trigger and remove only legacy
   support buttons that explicitly expose the old "AI Bookora Support" label. */
(() => {
  const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function cleanup() {
    const home = document.querySelector('#main-content .bookora-home-clean');
    if (!home) return;

    const canonical = document.getElementById('bookora-ai-trigger-btn');
    const nodes = document.querySelectorAll('button, a, [role="button"], [aria-label], [title]');

    nodes.forEach(node => {
      if (!node || node === canonical || node.closest('#bookora-ai-root')) return;
      const label = normalizeText(
        `${node.textContent || ''} ${node.getAttribute('aria-label') || ''} ${node.getAttribute('title') || ''}`
      );
      if (!label) return;

      // Remove only the legacy duplicate shown as "AI Bookora Support".
      if (label === 'ai bookora support' || label.includes('ai bookora support')) {
        const owner = node.closest('[data-bookora-ai-support], .bookora-ai-support, .ai-support-button, .ai-support, .bookora-support-button') || node;
        if (owner !== canonical && !owner.closest('#bookora-ai-root')) {
          owner.setAttribute('data-bookora-ai-legacy-hidden', '1');
          owner.style.setProperty('display', 'none', 'important');
          owner.setAttribute('aria-hidden', 'true');
        }
      }
    });
  }

  function start() {
    cleanup();
    const observer = new MutationObserver(() => cleanup());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    window.__BOOKORA_AI_SINGLE_TRIGGER_GUARD__ = observer;
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
