// Bookora Trending Firebase Bridge
// Firebase is the source of truth for the homepage Trending eBooks list.
// IMPORTANT: once a valid Trending snapshot is displayed, this page session
// freezes the list. No background refresh, listener update, reorder or blink.

const CURRENT_COLLECTION = 'trending_ebooks';
const CURRENT_DOC = 'current';
let unsubscribe = null;
let hasPublishedStableSnapshot = false;

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
    purchase_count: Number(item?.salesCount || item?.purchase_count || 0),
    is_trending: true,
    isTrending: true
  }));
}

function publish(payload) {
  if (hasPublishedStableSnapshot) return;
  const books = normalizeItems(payload);
  if (!books.length) return;

  hasPublishedStableSnapshot = true;
  window.__BOOKORA_FIREBASE_TRENDING__ = { ...payload, books };
  window.dispatchEvent(new CustomEvent('bookora:firebase-trending-updated', { detail: { books, payload } }));

  // Freeze the homepage snapshot for the remainder of this page session.
  // Backend/admin changes will appear on the next intentional page load.
  if (unsubscribe) {
    try { unsubscribe(); } catch (_) {}
    unsubscribe = null;
  }
}

async function attachFirestore() {
  if (hasPublishedStableSnapshot || !window.firebase?.apps?.length) return;
  try {
    const db = window.firebase.firestore();
    if (unsubscribe) {
      try { unsubscribe(); } catch (_) {}
      unsubscribe = null;
    }
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
  await attachFirestore();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();

window.addEventListener('beforeunload', () => {
  if (unsubscribe) {
    try { unsubscribe(); } catch (_) {}
    unsubscribe = null;
  }
});