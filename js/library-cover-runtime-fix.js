// Bookora Library — cover display bridge only.
// Reads the same Firestore/catalog book data already used by BookCard and
// applies its canonical cover URL resolver to Library cards. No purchase,
// auth, library, reader, or download logic is changed.
import { state } from './state.js';
import { getCoverUrl } from './components/BookCard.js';

let patchTimer = null;
let patchInFlight = false;

function isLibraryRoute() {
  return (window.location.hash || '').split('?')[0] === '#/library';
}

function normalizeBook(book) {
  try { return state.normalizeBook(book) || book; } catch (_) { return book; }
}

function applyCover(card, book) {
  if (!card || !book) return false;
  const normalized = normalizeBook(book);
  const url = getCoverUrl(normalized);
  if (!url) return false;

  const fallback = card.querySelector('.library-cover-fallback');
  let image = card.querySelector('img.library-cover');
  if (!image) {
    image = document.createElement('img');
    image.className = 'library-cover';
    image.loading = 'lazy';
    image.decoding = 'async';
    if (fallback?.parentNode) fallback.parentNode.insertBefore(image, fallback);
    else return false;
  }

  image.alt = `${String(normalized.title || 'eBook')} cover`;
  image.src = url;
  image.style.display = 'block';
  image.onerror = () => {
    image.style.display = 'none';
    if (fallback) fallback.style.display = 'flex';
  };
  if (fallback) fallback.style.display = 'none';
  return true;
}

async function patchLibraryCovers() {
  if (patchInFlight || !isLibraryRoute()) return;
  const cards = [...document.querySelectorAll('.library-card')];
  if (!cards.length) return;
  patchInFlight = true;
  try {
    const catalog = Array.isArray(state.books) ? state.books.map(normalizeBook).filter(Boolean) : [];
    const missingIds = new Set();

    for (const card of cards) {
      const id = String(card.querySelector('.lib-read-btn')?.dataset.id || card.querySelector('.lib-download-btn')?.dataset.id || '').trim();
      if (!id) continue;
      const book = catalog.find(item => String(item.id) === id);
      if (book && applyCover(card, book)) continue;
      missingIds.add(id);
    }

    if (missingIds.size) {
      try {
        const { db } = await state.getFirebase();
        await Promise.all([...missingIds].map(async id => {
          try {
            const doc = await db.collection('books').doc(id).get();
            if (!doc.exists) return;
            const book = normalizeBook({ id: doc.id, ...doc.data() });
            const card = cards.find(item => String(item.querySelector('.lib-read-btn')?.dataset.id || item.querySelector('.lib-download-btn')?.dataset.id || '') === id);
            if (card) applyCover(card, book);
          } catch (error) {
            console.warn('[Library Cover] Book lookup skipped:', id, error?.message || error);
          }
        }));
      } catch (error) {
        console.warn('[Library Cover] Firebase lookup skipped:', error?.message || error);
      }
    }
  } finally {
    patchInFlight = false;
  }
}

function schedulePatch() {
  if (patchTimer) clearTimeout(patchTimer);
  patchTimer = setTimeout(() => { patchTimer = null; void patchLibraryCovers(); }, 80);
}

window.addEventListener('hashchange', schedulePatch);
const observer = new MutationObserver(() => { if (isLibraryRoute()) schedulePatch(); });
observer.observe(document.body, { childList: true, subtree: true });
state.subscribe(event => {
  if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED') schedulePatch();
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedulePatch, { once: true });
else schedulePatch();
