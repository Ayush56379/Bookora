// Bookora seller onboarding profile image + Continue reliability fix.
// Keeps the existing secure upload pipeline, but makes preview, upload state,
// and Save & Continue deterministic even when the user clicks during upload.
(() => {
  if (window.__BOOKORA_PROFILE_IMAGE_FIX_V2__) return;
  window.__BOOKORA_PROFILE_IMAGE_FIX_V2__ = true;

  const MAX = 5 * 1024 * 1024;
  let objectUrl = '';
  let boundInput = null;
  let boundBrowse = null;
  let boundDrop = null;
  let pendingContinue = false;

  const isSellerApply = () => /#\/seller\/apply(?:$|[?#])/.test(location.hash || '');
  const get = id => document.getElementById(id);

  function setStatus(text, error = false) {
    const el = get('profile-status');
    if (!el) return;
    el.textContent = text;
    el.style.color = error ? '#dc2626' : '';
  }

  function preview(file) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    const box = get('profile-preview');
    if (!box) return;
    box.innerHTML = '';
    const img = document.createElement('img');
    img.src = objectUrl;
    img.alt = 'Profile image preview';
    img.loading = 'eager';
    box.appendChild(img);
  }

  function uploadFinished() {
    const text = String(get('profile-status')?.textContent || '').toLowerCase();
    return text.includes('uploaded') && !text.includes('uploading');
  }

  function maybeContinue() {
    if (!pendingContinue || !uploadFinished()) return;
    pendingContinue = false;
    const next = get('next-step');
    if (next && !next.disabled) setTimeout(() => next.click(), 0);
  }

  function onNextCapture(event) {
    if (!isSellerApply()) return;
    const status = String(get('profile-status')?.textContent || '').toLowerCase();
    if (status.includes('uploading') || status.includes('selected') && !status.includes('uploaded')) {
      pendingContinue = true;
      const next = get('next-step');
      if (next) {
        next.disabled = true;
        next.dataset.profileWaiting = '1';
      }
      setStatus('Please wait — finishing profile image upload…');
      // Do not allow the page's normal handler to reject the click because
      // profileUpload.busy is true. We resume automatically when upload ends.
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function bind() {
    if (!isSellerApply()) return;
    const input = get('profile-file');
    const browse = get('profile-browse');
    const drop = get('profile-drop');
    const next = get('next-step');
    if (!input || !browse || !drop) return;

    if (boundInput !== input) {
      boundInput?.removeEventListener('change', onChange, true);
      boundInput = input;
      input.addEventListener('change', onChange, true);
    }
    if (boundBrowse !== browse) {
      boundBrowse?.removeEventListener('click', onBrowse, true);
      boundBrowse = browse;
      browse.addEventListener('click', onBrowse, true);
    }
    if (boundDrop !== drop) {
      boundDrop?.removeEventListener('click', onDropClick, true);
      boundDrop = drop;
      drop.addEventListener('click', onDropClick, true);
    }
    if (next && next.dataset.profileCapture !== '1') {
      next.addEventListener('click', onNextCapture, true);
      next.dataset.profileCapture = '1';
    }
  }

  function onBrowse(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const input = get('profile-file');
    if (input) input.click();
  }

  function onDropClick(event) {
    if (event.target.closest('#profile-browse')) return;
    const input = get('profile-file');
    if (input) input.click();
  }

  function onChange() {
    const input = get('profile-file');
    const file = input?.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('Please select JPG, PNG or WebP.', true);
      input.value = '';
      return;
    }
    if (file.size > MAX) {
      setStatus('Image must be 5 MB or smaller.', true);
      input.value = '';
      return;
    }
    // Only preview here. The original SellerApplyQuickPage change handler is
    // responsible for the actual authenticated Drive upload and final status.
    preview(file);
    setStatus('Image selected ✓');
    setTimeout(maybeContinue, 100);
  }

  function watchUploadStatus() {
    if (!isSellerApply()) return;
    maybeContinue();
    const next = get('next-step');
    if (next?.dataset.profileWaiting === '1' && uploadFinished()) {
      next.disabled = false;
      delete next.dataset.profileWaiting;
      setStatus('Profile image uploaded ✓');
      maybeContinue();
    }
  }

  function watchRoute() {
    bind();
    watchUploadStatus();
    const app = get('app') || document.body;
    if (!app.__bookoraProfileFixObserver) {
      const observer = new MutationObserver(() => { bind(); watchUploadStatus(); });
      observer.observe(app, { childList: true, subtree: true, characterData: true });
      app.__bookoraProfileFixObserver = observer;
    }
  }

  window.addEventListener('hashchange', () => setTimeout(watchRoute, 50));
  document.addEventListener('DOMContentLoaded', watchRoute, { once: true });
  [100, 500, 1200, 2500].forEach(delay => setTimeout(watchRoute, delay));
  setInterval(watchUploadStatus, 300);
})();
