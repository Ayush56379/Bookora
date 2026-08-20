// Bookora homepage cleanup
// Keep the homepage focused on one All eBooks catalog.
// The user can switch views from the catalog selector; nothing opens automatically.

let busy = false;

function cleanupHomepage() {
  if (busy) return;
  const homepage = document.querySelector('.homepage');
  if (!homepage) return;
  busy = true;

  try {
    // Remove the old standalone category section. Categories are now available
    // from the closed-by-default catalog selector.
    [...homepage.querySelectorAll('section')].forEach(section => {
      const text = section.textContent || '';
      const heading = section.querySelector('h2');
      const headingText = heading?.textContent || '';
      if (/^Browse by Category$/i.test(headingText.trim())) {
        section.remove();
      }
      if (/^Trending Publications$/i.test(headingText.trim())) {
        section.remove();
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
