// Bookora homepage metadata helper.
// This module intentionally does NOT remove or replace homepage content.
// Earlier cleanup logic was destructive: it removed homepage sections and
// replaced publish/upload actions with category links. That broke working
// homepage interactions and could also interfere with catalog rendering.

let scheduled = false;

function cleanupHomepage() {
  const homepage = document.querySelector('.homepage');
  if (!homepage) return;

  const title = 'Bookora — Discover & Read eBooks';
  if (document.title !== title) document.title = title;

  const description = document.querySelector('meta[name="description"]');
  const descriptionText = 'Discover inspiring eBooks, browse categories, preview books, and find your next great read on Bookora.';
  if (description && description.getAttribute('content') !== descriptionText) {
    description.setAttribute('content', descriptionText);
  }
}

function scheduleCleanup(delay = 0) {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    cleanupHomepage();
  }, delay);
}

window.BookoraHomepageCleanup = cleanupHomepage;
window.addEventListener('hashchange', () => scheduleCleanup(50));
window.addEventListener('bookora:route-rendered', () => scheduleCleanup(0));
scheduleCleanup(100);
