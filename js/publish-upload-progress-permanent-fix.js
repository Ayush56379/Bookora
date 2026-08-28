// Bookora publish UI cleanup.
// Publishing uploads continue to run normally in the background; no upload-progress
// panel or byte counter is shown to the seller. The publish button reports only the
// final submitting/success state.
(() => {
  if (window.__BOOKORA_PUBLISH_NO_PROGRESS_UI__) return;
  window.__BOOKORA_PUBLISH_NO_PROGRESS_UI__ = true;

  const isPublish = () => ['#/publish', '#/publish/'].includes((location.hash || '').split('?')[0]);

  function clean() {
    if (!isPublish()) return;
    const box = document.getElementById('upload-progress-box');
    if (box) box.style.display = 'none';
    const details = document.getElementById('upload-live-details');
    if (details) details.remove();
    const live = document.getElementById('bookora-live-upload-progress');
    if (live) live.style.display = 'none';
  }

  const observe = () => {
    clean();
    new MutationObserver(clean).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    setInterval(clean, 500);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();