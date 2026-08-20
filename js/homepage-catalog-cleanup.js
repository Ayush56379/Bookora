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
    const badge = homepage.querySelector('.badge-bookora');
    if (badge && /Discover\.\s*Read\.\s*Publish/i.test(badge.textContent || '')) {
      badge.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path>
        </svg>
        Discover • Read • Enjoy
      `;
    }

    // Replace the homepage publishing CTA with a buyer action.
    homepage.querySelectorAll('a[href="#/publish"]').forEach(link => {
      const text = (link.textContent || '').trim();
      // Any public-home publish CTA is converted to category browsing.
      if (/publish|upload|creator/i.test(text) || link.closest('.homepage')) {
        link.setAttribute('href', '#/categories');
        link.innerHTML = `
          Browse Categories
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        `;
        link.classList.remove('btn-secondary');
        link.classList.add('btn-primary');
      }
    });

    // If the catalog is empty, never advertise publishing from the homepage.
    homepage.querySelectorAll('p').forEach(p => {
      const text = (p.textContent || '').trim();
      if (/Be the first creator to publish/i.test(text)) {
        p.textContent = 'New books are added regularly. Check back soon or explore the catalog to discover available reads.';
      }
    });

    homepage.querySelectorAll('h1').forEach(h1 => {
      if (/Discover Your Next/i.test(h1.textContent || '')) {
        h1.setAttribute('aria-label', 'Discover Your Next Great eBook');
      }
    });

    // Improve mobile hero CTA wrapping without changing the existing design system.
    const hero = homepage.querySelector('.hero-search-box')?.parentElement;
    const ctaRow = hero?.querySelector('div[style*="justify-content: center"]');
    if (ctaRow) ctaRow.classList.add('bookora-home-buyer-ctas');
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
