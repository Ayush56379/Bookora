// Live public data bridge: Render backend -> Bookora state
// Public catalog is sourced from the production backend so uploaded/approved
// books are consistent across homepage, explore, search and curated pages.
import { API_BASE_URL } from './config.js';
import { state } from './state.js';

let syncInFlight = null;

function isPublicCatalogRoute() {
  const hash = window.location.hash || '#/';
  const path = (hash.split('?')[0] || '#/').replace(/^#/, '') || '/';
  return path === '/' || path === '' ||
    ['/explore', '/categories', '/best-sellers', '/new-releases', '/trending', '/authors', '/search'].includes(path) ||
    path.startsWith('/category/') || path.startsWith('/book/') || path.startsWith('/author/');
}

export async function syncLiveBackendData() {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const [booksRes, categoriesRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/books?sort=newest`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        }),
        fetch(`${API_BASE_URL}/api/categories`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        }),
        fetch(`${API_BASE_URL}/api/settings/public`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        })
      ]);

      // The backend is the source of truth for the public catalog. Even an
      // admin visiting the public homepage must see approved backend books.
      // Keep the admin-only pending/rejected list untouched while on admin UI.
      if (booksRes.ok && (!state.isAdmin || isPublicCatalogRoute())) {
        const books = await booksRes.json();
        if (Array.isArray(books)) state.books = books;
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        if (Array.isArray(categories) && categories.length) {
          state.categories = categories;
        }
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings && typeof settings === 'object') state.settings = settings;
      }

      state.notify('DATA_SYNCED');
      return true;
    } catch (error) {
      console.warn('Live backend public sync unavailable:', error);
      return false;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => syncLiveBackendData(), 0);
});

// Firebase login currently triggers a Firestore sync as well. Re-sync the
// public catalog afterwards so Firestore can never overwrite the production
// backend catalog with stale/empty book data.
state.subscribe(event => {
  if (event === 'USER_LOGGED_IN') {
    setTimeout(() => syncLiveBackendData(), 50);
  }
});

// When an admin approves a book and then returns to the public homepage,
// refresh the backend catalog immediately instead of relying on a full reload.
window.addEventListener('hashchange', () => {
  if (isPublicCatalogRoute()) {
    setTimeout(() => syncLiveBackendData(), 0);
  }
});
