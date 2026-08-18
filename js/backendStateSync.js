// Live public data bridge: Render backend -> Bookora state
import { API_BASE_URL } from './config.js';
import { state } from './state.js';

let started = false;

export async function syncLiveBackendData() {
  if (started) return;
  started = true;
  try {
    const [booksRes, categoriesRes, settingsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/books`, { headers: { Accept: 'application/json' } }),
      fetch(`${API_BASE_URL}/api/categories`, { headers: { Accept: 'application/json' } }),
      fetch(`${API_BASE_URL}/api/settings/public`, { headers: { Accept: 'application/json' } })
    ]);
    if (booksRes.ok) {
      const books = await booksRes.json();
      if (Array.isArray(books)) state.books = books;
    }
    if (categoriesRes.ok) {
      const categories = await categoriesRes.json();
      if (Array.isArray(categories) && categories.length) state.categories = categories;
    }
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings && typeof settings === 'object') state.settings = settings;
    }
    state.notify('DATA_SYNCED');
  } catch (error) {
    console.warn('Live backend public sync unavailable:', error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => syncLiveBackendData(), 0);
});
