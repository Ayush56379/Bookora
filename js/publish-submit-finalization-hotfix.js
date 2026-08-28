// Bookora publish finalization hotfix.
// The binary files can already be fully uploaded while the final listing request
// or optional Firebase metadata write is still resolving. Keep the user-facing
// state truthful and immediately acknowledge a confirmed /api/books/create success.
(() => {
  const isPublish = () => {
    const hash = (window.location.hash || '').split('?')[0];
    return hash === '#/publish' || hash === '#/publish/';
  };

  const showFinalSuccess = () => {
    if (!isPublish()) return;
    const button = document.getElementById('submit-pub-btn');
    const label = document.getElementById('upload-progress-label');
    const fill = document.getElementById('upload-progress-fill');
    const box = document.getElementById('upload-progress-box');
    const liveBox = document.getElementById('bookora-live-upload-progress');
    const liveTitle = document.getElementById('bookora-upload-progress-title');
    const livePercent = document.getElementById('bookora-upload-progress-percent');
    const liveFill = document.getElementById('bookora-upload-progress-fill');
    const liveBytes = document.getElementById('bookora-upload-progress-bytes');

    if (box) box.style.display = 'block';
    if (label) label.textContent = 'eBook upload successful ✓';
    if (fill) fill.style.width = '100%';
    if (liveBox) liveBox.style.display = 'block';
    if (liveTitle) liveTitle.textContent = 'eBook uploaded successfully ✓';
    if (livePercent) livePercent.textContent = '100%';
    if (liveFill) liveFill.style.width = '100%';
    if (liveBytes) liveBytes.textContent = 'PDF and cover uploaded successfully';
    if (button) {
      button.disabled = true;
      button.textContent = 'Upload Successful ✓';
      button.style.background = '#059669';
      button.style.borderColor = '#059669';
    }
  };

  const showFinalizing = () => {
    if (!isPublish()) return;
    const button = document.getElementById('submit-pub-btn');
    const label = document.getElementById('upload-progress-label');
    if (button && /Creating book listing|Creating listing/i.test(button.textContent || '')) {
      button.textContent = 'Finalizing eBook listing…';
    }
    if (label) label.textContent = 'Files uploaded ✓ — finalizing book listing…';
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    let path = url;
    try { path = new URL(url, location.href).pathname; } catch (_) {}
    const result = await originalFetch(input, init);

    if (isPublish() && path.endsWith('/api/books/create')) {
      try {
        const data = await result.clone().json().catch(() => ({}));
        if (result.ok && data?.success && data?.book) {
          showFinalSuccess();
          // The main publish flow may still be persisting optional Firebase metadata.
          // Do not wait on that client-side step before telling the user the backend
          // has successfully created the listing.
          setTimeout(() => {
            if (isPublish()) window.location.hash = '#/creator/dashboard';
          }, 1200);
        }
      } catch (_) {}
    }
    return result;
  };

  const observe = () => {
    if (!isPublish()) return;
    const observer = new MutationObserver(() => {
      const button = document.getElementById('submit-pub-btn');
      if (button && /Creating book listing|Creating listing/i.test(button.textContent || '')) showFinalizing();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
