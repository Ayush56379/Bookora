// Bookora Trending Firebase Bridge
// The backend calculates the ranking from real paid orders + reviews + freshness.
// Firebase is the single source of truth for the homepage Trending eBooks list.

const CURRENT_COLLECTION = 'trending_ebooks';
const CURRENT_DOC = 'current';
let unsubscribe = null;
let refreshTimer = null;

function normalizeItems(payload) {
  const list = Array.isArray(payload?.books) ? payload.books : [];
  return list.slice(0, 6).map((item, index) => ({
    ...item,
    rank: Number(item?.rank || index + 1),
    id: String(item?.bookId || item?.id || ''),
    bookId: String(item?.bookId || item?.id || ''),
    status: 'approved',
    coverUrl: String(item?.coverUrl || item?.cover_url || ''),
    cover_url: String(item?.coverUrl || item?.cover_url || ''),
    title: String(item?.title || 'Untitled eBook'),
    author: String(item?.author || 'Bookora Creator'),
    category: String(item?.category || 'Other'),
    price: Number(item?.price || 0),
    sale_price: Number(item?.salePrice ?? item?.sale_price ?? item?.price ?? 0),
    pages: Number(item?.pages || 0),
    rating: Number(item?.rating || 0),
    reviewCount: Number(item?.reviewCount || item?.review_count || 0),
    review_count: Number(item?.reviewCount || item?.review_count || 0),
    purchaseCount: Number(item?.salesCount || item?.purchaseCount || 0),
    purchase_count: Number(item?.salesCount || item?.purchaseCount || 0),
    is_trending: true,
    isTrending: true
  }));
}

function publish(payload) {
  const books = normalizeItems(payload);
  if (!books.length) return;
  window.__BOOKORA_FIREBASE_TRENDING__ = { ...payload, books };
  window.dispatchEvent(new CustomEvent('bookora:firebase-trending-updated', { detail: { books, payload } }));
}

async function refreshBackendSnapshot() {
  try {
    const base = String(window.BOOKORA_API_BASE || window.BOOKORA_BACKEND_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
    await fetch(`${base}/api/trending?limit=6`, { method: 'GET', cache: 'no-store', credentials: 'omit' });
  } catch (error) {
    console.warn('[Bookora Trending] Backend refresh unavailable:', error?.message || error);
  }
}

async function attachFirestore() {
  if (!window.firebase?.apps?.length) return;
  try {
    const db = window.firebase.firestore();
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection(CURRENT_COLLECTION).doc(CURRENT_DOC).onSnapshot(snapshot => {
      if (snapshot.exists) publish(snapshot.data() || {});
    }, error => {
      console.warn('[Bookora Trending] Firestore listener unavailable:', error?.message || error);
    });
  } catch (error) {
    console.warn('[Bookora Trending] Firestore attach failed:', error?.message || error);
  }
}

async function start() {
  await refreshBackendSnapshot();
  await attachFirestore();
  // Recalculate hourly so a new sale/review can reach Firebase without waiting for a page reload.
  refreshTimer = setInterval(refreshBackendSnapshot, 60 * 60 * 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

window.addEventListener('beforeunload', () => {
  if (unsubscribe) unsubscribe();
  if (refreshTimer) clearInterval(refreshTimer);
});
