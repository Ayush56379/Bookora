// Bookora homepage cleanup
// Keep the homepage focused on discovering and buying eBooks.
// Creator publishing routes remain available; they are simply not promoted on the public homepage.

let busy = false;

function cleanupHomepage() {
  if (busy) return;
  const homepage = document.querySelector('.homepage');
  if (!homepage) return;
  busy = true;

  try {
    // Buyer-first SEO copy for the public homepage.
    document.title = 'Bookora — Discover & Read eBooks';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', 'Discover inspiring eBooks, browse categories, preview books, and find your next great read on Bookora.');
    }

    // Remove the old standalone category section. Categories are available
    // from the catalog selector / Categories page instead.
    [...homepage.querySelectorAll('section')].forEach(section => {
      const heading = section.querySelector('h2');
      const headingText = heading?.textContent || '';
      if (/^Browse by Category$/i.test(headingText.trim())) section.remove();
      if (/^Trending Publications$/i.test(headingText.trim())) section.remove();
    });

    // Keep the catalog selector closed until the user explicitly clicks it.
    const select = document.getElementById('bookora-home-catalog-filter');
    if (select) {
      select.removeAttribute('autofocus');
      select.blur();
    }

    // Make the hero completely buyer-focused.
    homepage.querySelectorAll('.badge-bookora').forEach(badge => {
      if (/Discover\.\s*Read\.\s*Publish/i.test(badge.textContent || '')) {
        badge.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path>
          </svg>
          Discover • Read • Enjoy
        `;
      }
    });

    // Replace every public-home publishing CTA with category browsing.
    homepage.querySelectorAll('a[href="#/publish"]').forEach(link => {
      link.setAttribute('href', '#/categories');
      link.innerHTML = `
        Browse Categories
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="m9 18 6-6-6-6"></path>
        </svg>
      `;
      link.classList.remove('btn-secondary');
      link.classList.add('btn-primary');
    });

    // If the catalog is empty, never advertise publishing from the homepage.
    homepage.querySelectorAll('p').forEach(p => {
      const text = (p.textContent || '').trim();
      if (/Be the first creator to publish/i.test(text)) {
        p.textContent = 'New books are added regularly. Check back soon or explore the catalog to discover available reads.';
      }
    });

    // Ensure the hero search and buyer CTAs remain comfortable on small screens.
    const ctaRow = homepage.querySelector('.hero-search-box')?.parentElement?.querySelector('div[style*="justify-content: center"]');
    if (ctaRow) {
      ctaRow.style.width = '100%';
      ctaRow.style.boxSizing = 'border-box';
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
