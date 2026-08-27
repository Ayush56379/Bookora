// Bookora catalog integrity runtime.
// Canonicalizes public books so duplicate Firestore/backend records never render twice.
// Also keeps category counts derived from the same canonical catalog.
import { state } from './state.js';

if (!state.__CATALOG_DEDUPE_RUNTIME__) {
  state.__CATALOG_DEDUPE_RUNTIME__ = true;

  const text = value => String(value ?? '').trim();
  const norm = value => text(value).toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const dateMs = value => {
    if (value?.toDate instanceof Function) { try { return value.toDate().getTime(); } catch (_) {} }
    const n = Date.parse(value || '');
    return Number.isFinite(n) ? n : 0;
  };
  const identity = book => {
    const strong = [book?.bookoraLibraryId, book?.bookora_library_id, book?.libraryId, book?.library_id, book?.canonicalBookId, book?.canonical_book_id, book?.isbn, book?.isbn13].map(text).find(Boolean);
    if (strong) return `strong:${norm(strong)}`;
    const sourceId = [book?.bookId, book?.book_id, book?.id].map(text).find(Boolean);
    if (sourceId) return `id:${norm(sourceId)}`;
    return `title-author:${norm(book?.title)}|${norm(book?.author || book?.seller_name || book?.sellerName)}`;
  };
  const quality = book => {
    let score = 0;
    if (text(book?.cover_url || book?.coverUrl || book?.cover_image_url || book?.coverImageUrl)) score += 4;
    if (text(book?.pdf_url || book?.pdfUrl || book?.file_url || book?.fileUrl || book?.download_url || book?.downloadUrl)) score += 4;
    if (text(book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId)) score += 2;
    if (text(book?.description)) score += 1;
    if (Number(book?.price || book?.sale_price || book?.salePrice || 0) > 0) score += 1;
    return score;
  };
  const dedupe = input => {
    const groups = new Map();
    for (const raw of Array.isArray(input) ? input : []) {
      if (!raw || typeof raw !== 'object') continue;
      const book = typeof state.normalizeBook === 'function' ? state.normalizeBook(raw) : { ...raw };
      if (!book) continue;
      const key = identity(book);
      const previous = groups.get(key);
      if (!previous) { groups.set(key, book); continue; }
      const currentScore = quality(book);
      const previousScore = quality(previous);
      if (currentScore > previousScore || (currentScore === previousScore && dateMs(book.created_at || book.createdAt) > dateMs(previous.created_at || previous.createdAt))) groups.set(key, { ...previous, ...book });
    }
    return Array.from(groups.values());
  };

  const originalGetApprovedBooks = state.getApprovedBooks.bind(state);
  state.getApprovedBooks = function() { return dedupe(originalGetApprovedBooks()); };

  state.getTrendingBooks = function() {
    const books = this.getApprovedBooks();
    const flagged = books.filter(book => book.is_trending);
    return (flagged.length ? flagged : [...books].sort((a,b) => dateMs(b.created_at) - dateMs(a.created_at))).slice(0,24);
  };
  state.getBestSellers = function() {
    const books = this.getApprovedBooks();
    const flagged = books.filter(book => book.is_bestseller);
    return (flagged.length ? flagged : [...books].sort((a,b) => dateMs(b.created_at) - dateMs(a.created_at))).slice(0,24);
  };
  state.getNewReleases = function() {
    const books = this.getApprovedBooks();
    const flagged = books.filter(book => book.is_new);
    return flagged.length ? flagged : [...books].sort((a,b) => dateMs(b.created_at) - dateMs(a.created_at));
  };

  const rebuild = () => {
    const canonical = dedupe(state.books);
    state.books = canonical;
    const counts = new Map();
    for (const book of canonical) {
      if (String(book.status || '').toLowerCase() !== 'approved') continue;
      const category = text(book.category) || 'Other';
      counts.set(category, (counts.get(category) || 0) + 1);
    }
    const existing = Array.isArray(state.categories) ? state.categories : [];
    const byName = new Map(existing.filter(Boolean).map(c => [norm(c.name), { ...c }]));
    for (const [name, count] of counts) {
      const key = norm(name);
      if (!byName.has(key)) byName.set(key, { id: `derived-${key.replace(/\s+/g,'-')}`, name, slug: key.replace(/\s+/g,'-'), count });
      byName.get(key).count = count;
    }
    state.categories = Array.from(byName.values()).filter(c => text(c.name));
    try { state.persistCatalogCache?.(canonical); } catch (_) {}
  };

  rebuild();
  const notify = () => {
    rebuild();
    window.dispatchEvent(new CustomEvent('bookora:catalog-integrity-fixed', { detail: { count: state.getApprovedBooks().length } }));
    window.dispatchEvent(new CustomEvent('bookora:catalog-updated'));
  };
  if (typeof state.subscribe === 'function') state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED' || event === 'USER_LOGGED_IN') setTimeout(notify, 0);
  });
  window.addEventListener('bookora:fast-catalog', notify);
}
