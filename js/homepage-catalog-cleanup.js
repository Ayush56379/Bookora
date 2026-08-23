// Bookora homepage cleanup
// Buyer-first homepage cleanup without a DOM-wide MutationObserver.
// The SPA router is responsible for rendering; this helper only performs a
// small post-render cleanup on explicit route/render events. Removing the
// observer prevents cleanup <-> catalog/i18n feedback loops.

let busy = false;
let scheduled = false;

function cleanupHomepage() {
  if (busy) return;
  const homepage = document.querySelector('.homepage');
  if (!homepage) return;
  busy = true;
  try {
    const title = 'Bookora — Discover & Read eBooks';
    if (document.title !== title) document.title = title;
    const description = document.querySelector('meta[name="description"]');
    const descriptionText = 'Discover inspiring eBooks, browse categories, preview books, and find your next great read on Bookora.';
    if (description && description.getAttribute('content') !== descriptionText) description.setAttribute('content', descriptionText);

    [...homepage.querySelectorAll('section')].forEach(section => {
      const headingText = (section.querySelector('h2')?.textContent || '').trim();
      if (/^Browse by Category$/i.test(headingText) || /^Trending Publications$/i.test(headingText)) section.remove();
    });

    homepage.querySelectorAll('.badge-bookora').forEach(badge => {
      if (/Discover\.\s*Read\.\s*Publish/i.test(badge.textContent || '')) badge.textContent = 'Discover • Read • Enjoy';
    });

    homepage.querySelectorAll('a, button').forEach(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const href = el.getAttribute('href') || '';
      const publishAction = /#\/publish(?:$|[?#])/.test(href);
      const uploadAction = /publish\s+your\s+ebook|upload\s+(?:an?\s+)?ebook|upload\s+book|start\s+publishing|publish\s+ebook/i.test(text);
      if (!publishAction && !uploadAction) return;
      const replacement = document.createElement('a');
      replacement.href = '#/categories';
      replacement.className = el.className || 'btn btn-primary btn-lg';
      replacement.innerHTML = `Browse Categories <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;
      replacement.removeAttribute('onclick');
      el.replaceWith(replacement);
    });

    homepage.querySelectorAll('p').forEach(p => {
      const text = (p.textContent || '').trim();
      if (/Be the first creator to publish/i.test(text) || /Be the first author to publish/i.test(text)) {
        p.textContent = 'New books are added regularly. Explore the catalog to discover available reads.';
      }
    });

    const select = document.getElementById('bookora-home-catalog-filter');
    if (select) { select.removeAttribute('autofocus'); if (document.activeElement === select) select.blur(); }
  } finally { busy = false; }
}

function scheduleCleanup(delay = 0) {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => { scheduled = false; cleanupHomepage(); }, delay);
}

window.BookoraHomepageCleanup = cleanupHomepage;
window.addEventListener('hashchange', () => scheduleCleanup(50));
window.addEventListener('bookora:route-rendered', () => scheduleCleanup(0));
scheduleCleanup(100);
scheduleCleanup(800);
