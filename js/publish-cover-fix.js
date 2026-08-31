// Bookora Publish preview cover fix — isolated to /publish
(function () {
  const COVER_ID = 'bp-preview-cover-fix';

  function driveImageUrl(value) {
    try {
      const u = new URL(String(value || '').trim());
      const id = u.pathname.match(/\/file\/d\/([^/]+)/i)?.[1] || u.searchParams.get('id') || '';
      if (id) return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
      return u.href;
    } catch (_) {
      return '';
    }
  }

  function ensureCover() {
    if (!location.hash.split('?')[0].replace(/^#/, '').startsWith('/publish')) return;
    const preview = document.getElementById('bp-preview');
    const input = document.getElementById('bp-cover-url');
    if (!preview || !input) return;

    const url = driveImageUrl(input.value);
    if (!url) return;

    let img = preview.querySelector('.bp-cover');
    if (!img) {
      const grid = preview.querySelector('.bp-preview-grid');
      if (!grid) return;
      const media = document.createElement('div');
      media.innerHTML = `<img class="bp-cover" id="${COVER_ID}" alt="eBook cover preview" loading="eager" referrerpolicy="no-referrer">`;
      grid.insertBefore(media.firstElementChild, grid.firstElementChild);
      img = preview.querySelector('.bp-cover');
    }

    if (img && img.src !== url) img.src = url;
    if (img) {
      img.onerror = () => {
        // Keep the cover area visible without breaking the rest of the preview.
        img.style.visibility = 'hidden';
      };
      img.onload = () => { img.style.visibility = 'visible'; };
    }
  }

  function start() {
    ensureCover();
    const observer = new MutationObserver(ensureCover);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('input', e => {
      if (e.target?.id === 'bp-cover-url') ensureCover();
    }, true);
    window.addEventListener('hashchange', () => setTimeout(ensureCover, 50));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
