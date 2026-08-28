// Bookora seller onboarding profile image reliability fix.
// Ensures the hidden file picker is always reachable, shows a local preview
// immediately, and leaves the existing secure backend upload flow intact.
(() => {
  if (window.__BOOKORA_PROFILE_IMAGE_FIX_V1__) return;
  window.__BOOKORA_PROFILE_IMAGE_FIX_V1__ = true;

  const MAX = 5 * 1024 * 1024;
  let objectUrl = '';
  let boundInput = null;
  let boundBrowse = null;
  let boundDrop = null;

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

  function bind() {
    if (!isSellerApply()) return;
    const input = get('profile-file');
    const browse = get('profile-browse');
    const drop = get('profile-drop');
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
  }

  function onBrowse(event) {
    event.preventDefault();
    event.stopPropagation();
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
    // Preview is deliberately immediate; backend/Drive upload continues through
    // the existing SellerApplyQuickPage change handler.
    preview(file);
    setStatus('Image selected ✓ Uploading securely…');
  }

  function watchRoute() {
    bind();
    const app = get('app') || document.body;
    if (!app.__bookoraProfileFixObserver) {
      const observer = new MutationObserver(() => bind());
      observer.observe(app, { childList: true, subtree: true });
      app.__bookoraProfileFixObserver = observer;
    }
  }

  window.addEventListener('hashchange', () => setTimeout(watchRoute, 50));
  document.addEventListener('DOMContentLoaded', watchRoute, { once: true });
  [100, 500, 1200, 2500].forEach(delay => setTimeout(watchRoute, delay));
})();
