// BOOKORA PUBLISH AI PRECHECK REMOVAL - PERMANENT
// The internal eBook publish flow must not run the optional AI safety precheck.
// The normal publish submit handler remains authoritative for validation, upload,
// duplicate/concurrency protection, backend book creation, and Firebase metadata.
// This capture-phase bridge bypasses the enhanced submit listener only; preview
// enhancements and the separate Bookora AI Support remain untouched.
(() => {
  const MARK = '__BOOKORA_PUBLISH_AI_PRECHECK_REMOVED__';
  if (window[MARK]) return;
  window[MARK] = true;

  const isPublish = () => {
    const hash = (window.location.hash || '').split('?')[0];
    return hash === '#/publish' || hash === '#/publish/';
  };

  document.addEventListener('submit', event => {
    if (!isPublish()) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'publish-wizard-form') return;

    // publish-enhancements.js installs a capture listener on this form that runs
    // runAiDetection() before the real upload. Setting this flag makes that listener
    // return immediately, allowing the original PublishInternalPage submit handler
    // to perform the normal upload/create flow without any AI request.
    form.dataset.allowOriginalSubmit = '1';
  }, true);

  // Remove any stale AI-precheck notification left in the DOM by an older cached
  // runtime. Do not touch the AI Support drawer or unrelated AI UI.
  const cleanStaleNotice = () => {
    if (!isPublish()) return;
    document.querySelectorAll('[role="alert"], [role="status"], .toast, .toast-container, [class*="toast"], [class*="notification"]').forEach(el => {
      const text = String(el.textContent || '').toLowerCase();
      if (text.includes('ai precheck') || text.includes('ai checking book')) el.remove();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanStaleNotice, { once: true });
  } else {
    cleanStaleNotice();
  }

  new MutationObserver(cleanStaleNotice).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
