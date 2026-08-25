// Bookora Trending Firebase Recorder
// Persists the automatically calculated top-6 trending eBooks in Firestore.
// Existing books/reviews/order data remain the source of truth; this only records the ranking snapshot.
import { state } from './state.js';

const DAILY_COLLECTION = 'trending_ebooks_daily';
const CURRENT_COLLECTION = 'trending_ebooks';
const CURRENT_DOC = 'current';
let lastSignature = '';
let running = false;

function dayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getStats(book) {
  let rating = 0;
  let reviewCount = 0;
  let sales = 0;
  try {
    const reviews = typeof state._bookReviewStats === 'function' ? state._bookReviewStats(book) : null;
    rating = safeNumber(reviews?.rating);
    reviewCount = Math.max(0, safeNumber(reviews?.count));
  } catch (_) {}
  try {
    sales = typeof state._bookPurchaseCount === 'function' ? Math.max(0, safeNumber(state._bookPurchaseCount(book))) : 0;
  } catch (_) {}
  return { sales, rating, reviewCount };
}

async function getDb() {
  if (!window.firebase?.apps?.length) return null;
  try { return window.firebase.firestore(); } catch (_) { return null; }
}

async function persist() {
  if (running) return;
  running = true;
  try {
    if (!state.booksLoaded) return;
    const books = typeof state.getFeaturedTrendingBooks === 'function'
      ? state.getFeaturedTrendingBooks(6)
      : state.getTrendingBooks?.().slice(0, 6) || [];
    if (!books.length) return;

    const items = books.slice(0, 6).map((book, index) => {
      const stats = getStats(book);
      return {
        rank: index + 1,
        bookId: String(book.id || book.bookId || ''),
        title: String(book.title || 'Untitled eBook'),
        slug: String(book.slug || ''),
        coverUrl: String(book.coverUrl || book.cover_url || book.front_cover_url || book.frontCover || ''),
        category: String(book.category || ''),
        price: safeNumber(book.price),
        salesCount: stats.sales,
        rating: stats.rating,
        reviewCount: stats.reviewCount,
        score: safeNumber(book.__bookoraTrendingScore),
        isApproved: String(book.status || '').toLowerCase() === 'approved'
      };
    });

    const signature = JSON.stringify(items.map(item => [item.bookId, item.salesCount, item.rating, item.reviewCount, item.score]));
    if (signature === lastSignature) return;
    lastSignature = signature;

    const db = await getDb();
    if (!db) return;
    const timestamp = window.firebase.firestore.FieldValue.serverTimestamp();
    const payload = {
      date: dayKey(),
      generatedAt: timestamp,
      updatedAt: timestamp,
      algorithm: 'sales + rating + reviews + freshness + existing trending/bestseller signals',
      limit: 6,
      books: items
    };

    // One immutable daily snapshot plus one current snapshot.
    await db.collection(DAILY_COLLECTION).doc(dayKey()).set(payload, { merge: true });
    await db.collection(CURRENT_COLLECTION).doc(CURRENT_DOC).set(payload, { merge: true });
  } catch (error) {
    // Ranking must never break the storefront if Firestore rules/network reject analytics writes.
    console.warn('[Bookora Trending] Firebase snapshot skipped:', error?.message || error);
  } finally {
    running = false;
  }
}

function start() {
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'CATALOG_UPDATED') setTimeout(persist, 150);
  });
  setTimeout(persist, 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
