// Bookora homepage cleanup
// Public homepage is buyer-first. Publishing/uploading remains available only
// through the authenticated seller/creator flow.

let busy = false;

function cleanupHomepage() {
  if (busy) return;
  const homepage = document.querySelector('.homepage');
  if (!homepage) return;
  busy = true;

  try {
    document.title = 'Bookora — Discover & Read eBooks';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', 'Discover inspiring eBooks, browse categories, preview books, and find your next great read on Bookora.');

    // Remove duplicate standalone discovery sections. The All eBooks selector
    // is the only homepage category/trending control.
    [...homepage.querySelectorAll('section')].forEach(section => {
      const headingText = (section.querySelector('h2')?.textContent || '').trim();
      if (/^Browse by Category$/i.test(headingText)) section.remove();
      if (/^Trending Publications$/i.test(headingText)) section.remove();
    });

    // Buyer-first hero badge.
    homepage.querySelectorAll('.badge-bookora').forEach(badge => {
      if (/Discover\.\s*Read\.\s*Publish/i.test(badge.textContent || '')) {
        badge.textContent = 'Discover • Read • Enjoy';
      }
    });

    // NEVER expose a publishing/upload CTA on the public homepage.
    homepage.querySelectorAll('a, button').forEach(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const href = el.getAttribute('href') || '';
      const publishAction = /#\/publish(?:$|[?#])/.test(href);
      const uploadAction = /publish\s+your\s+ebook|upload\s+(?:an?\s+)?ebook|upload\s+book|start\s+publishing|publish\s+ebook/i.test(text);

      if (!publishAction && !uploadAction) return;

      const replacement = document.createElement('a');
      replacement.href = '#/categories';
      replacement.className = el.className || 'btn btn-primary btn-lg';
      replacement.innerHTML = `
        Browse Categories
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="m9 18 6-6-6-6"></path>
        </svg>
      `;
      replacement.removeAttribute('onclick');
      el.replaceWith(replacement);
    });

    // Empty-state copy must never invite visitors to publish/upload.
    homepage.querySelectorAll('p').forEach(p => {
      const text = (p.textContent || '').trim();
      if (/Be the first creator to publish/i.test(text) || /Be the first author to publish/i.test(text)) {
        p.textContent = 'New books are added regularly. Explore the catalog to discover available reads.';
      }
    });

    // Keep the catalog selector closed until the user explicitly clicks it.
    const select = document.getElementById('bookora-home-catalog-filter');
    if (select) {
      select.removeAttribute('autofocus');
      select.blur();
    }
  } finally {
    busy = false;
  }
}

const app = document.getElementById('app');
if (app) {
  const observer = new MutationObserver(() => requestAnimationFrame(cleanupHomepage));
  observer.observe(app, { childList: true, subtree: true });
}

window.addEventListener('hashchange', () => setTimeout(cleanupHomepage, 50));
setTimeout(cleanupHomepage, 100);
setTimeout(cleanupHomepage, 500);
setTimeout(cleanupHomepage, 1200);
setTimeout(cleanupHomepage, 2500);
