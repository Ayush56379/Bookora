// Bookora homepage: permanently remove the old Featured catalog UI.
// The existing Trending catalog/ranking remains the source of truth.
(() => {
  if (window.__BOOKORA_FEATURED_REMOVAL_PERMANENT__) return;
  window.__BOOKORA_FEATURED_REMOVAL_PERMANENT__ = true;

  const apply = () => {
    if (!/^#\/$/.test(window.location.hash || '#/')) return;

    const headings = document.querySelectorAll('.kdp-section-head h2');
    let changed = false;
    headings.forEach((heading) => {
      const text = String(heading.textContent || '').trim().toLowerCase();
      if (text !== 'featured ebooks' && text !== 'discover ebooks') return;
      heading.textContent = 'Trending eBooks';
      changed = true;
    });

    const section = document.querySelector('.kdp-catalog-section');
    if (!section) return;

    const tabs = section.querySelector('.kdp-tabs');
    if (tabs) {
      tabs.remove();
      changed = true;
    }

    const description = section.querySelector('.kdp-section-head p');
    if (description && /browse books from verified bookora creators/i.test(description.textContent || '')) {
      description.textContent = "Updated automatically from Bookora's daily trending ranking.";
      changed = true;
    }

    if (changed) section.dataset.trendingCatalog = 'true';
  };

  let observer = null;
  const observeCurrentPage = () => {
    observer?.disconnect();
    observer = new MutationObserver(() => {
      if (!/^#\/$/.test(window.location.hash || '#/')) return;
      observer.disconnect();
      apply();
      observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
    });
    observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
    apply();
  };

  window.addEventListener('hashchange', () => {
    if ((window.location.hash || '#/') === '#/') setTimeout(observeCurrentPage, 0);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeCurrentPage, { once: true });
  } else {
    observeCurrentPage();
  }
})();
