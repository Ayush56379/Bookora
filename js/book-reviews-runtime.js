// Bookora Reviews Runtime
// Keeps the existing Book Detail UI intact while making review reads/writes realtime,
// duplicate-safe and Firebase-backed. No route re-render is used for review updates.
import { state } from './state.js';
import { Toast } from './components/Toast.js';

const watched = new Map();
let booted = false;

const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const stars = rating => {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({length:5}, (_,i) => `<span aria-hidden="true" style="font-size:16px;line-height:1;color:${i + 1 <= Math.round(r) ? '#f59e0b' : '#cbd5e1'}">★</span>`).join('');
};
const getBook = () => {
  const hash = window.location.hash || '';
  const match = hash.match(/^#\/book\/([^?]+)/);
  return match ? state.getBookBySlug(decodeURIComponent(match[1])) : null;
};
const getDb = () => {
  if (!window.firebase?.apps?.length) return null;
  return window.firebase.firestore();
};

function renderReviews(bookId, reviews) {
  if (!String(window.location.hash || '').startsWith('#/book/')) return;
  const list = document.getElementById('review-list');
  const summary = document.querySelector('[data-panel="reviews"] .bd-review-summary');
  const tab = document.querySelector('.bd-tab[data-tab="reviews"]');
  if (!list || !summary) return;

  const sorted = [...reviews].sort((a,b) => {
    const ta = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at || a.date || 0).getTime();
    const tb = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at || b.date || 0).getTime();
    return tb - ta;
  });
  const total = sorted.length;
  const average = total ? sorted.reduce((sum,r) => sum + Number(r.rating || 0), 0) / total : 0;
  const score = summary.querySelector('.bd-score');
  if (score) score.innerHTML = `<div class="bd-score-number">${total ? average.toFixed(1) : '—'}</div><div class="bd-rating-stars">${stars(average)}</div><small>${total} verified reader ${total === 1 ? 'review' : 'reviews'}</small>`;
  if (tab) tab.textContent = `Reviews (${total})`;

  list.innerHTML = total ? sorted.map(review => {
    const date = review.created_at?.toDate ? review.created_at.toDate() : (review.date || review.createdAt || '');
    const dateText = date ? new Date(date).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}) : '';
    const name = review.user_name || review.userName || 'Bookora Reader';
    return `<article class="bd-review" data-review-id="${esc(review.id || '')}">
      <div class="bd-review-top"><div><div class="bd-rating-stars">${stars(review.rating)}</div><div class="bd-review-title">${esc(review.title || 'Reader review')}</div></div><span class="bd-review-meta">${esc(dateText)}</span></div>
      <p class="bd-review-comment">${esc(review.comment || '')}</p>
      <div class="bd-review-meta">${esc(name)} ${review.verified_purchase ? '<span class="bd-verified">• ✓ Verified Purchase</span>' : ''}</div>
    </article>`;
  }).join('') : '<div class="bd-empty">No customer reviews yet. Be the first verified reader to share your feedback.</div>';
}

async function watchBook(book) {
  const db = getDb();
  if (!db || !book?.id) return;
  const key = String(book.id);
  if (watched.has(key)) return;
  try {
    const query = db.collection('reviews').where('book_id','==',key);
    const unsubscribe = query.onSnapshot(snapshot => {
      const reviews = snapshot.docs.map(doc => ({id:doc.id,...doc.data()}));
      state.reviews = [...(Array.isArray(state.reviews) ? state.reviews.filter(r => String(r.book_id || r.bookId) !== key) : []), ...reviews];
      renderReviews(key, reviews);
    }, error => console.warn('[Reviews] realtime listener unavailable:', error.message));
    watched.set(key, unsubscribe);
  } catch (error) {
    console.warn('[Reviews] listener setup failed:', error.message);
  }
}

async function submitVerifiedReview(book, form) {
  if (!state.isAuthenticated || !state.currentUser?.uid) {
    Toast.show('Please sign in before submitting a review.', 'info');
    const returnTo = window.location.hash || `#/book/${book.slug || book.id}`;
    window.location.hash = `#/login?returnTo=${encodeURIComponent(returnTo)}`;
    return;
  }
  if (!state.hasPurchased(book.id)) {
    Toast.show('Only verified purchasers can review this eBook.', 'warning');
    return;
  }
  const rating = Math.max(1, Math.min(5, Number(form.querySelector('#review-rating-input')?.value || 5)));
  const title = String(form.querySelector('#review-title-input')?.value || '').trim();
  const comment = String(form.querySelector('#review-comment-input')?.value || '').trim();
  if (!title || !comment) { Toast.show('Please complete the review before submitting.', 'warning'); return; }

  const db = getDb();
  if (!db) { Toast.show('Review service is not ready. Please try again.', 'error'); return; }
  const submit = form.querySelector('button[type="submit"]');
  if (submit) { submit.disabled = true; submit.textContent = 'Publishing…'; }
  try {
    const snapshot = await db.collection('reviews').where('book_id','==',String(book.id)).get();
    const duplicate = snapshot.docs.some(doc => String(doc.data()?.user_id || '') === String(state.currentUser.uid));
    if (duplicate) throw new Error('You have already reviewed this eBook.');

    const now = window.firebase.firestore.FieldValue.serverTimestamp();
    const review = {
      book_id: String(book.id),
      user_id: String(state.currentUser.uid),
      user_name: state.currentUser.name || state.currentUser.displayName || state.currentUser.email?.split('@')[0] || 'Reader',
      user_email: state.currentUser.email || '',
      rating, title, comment,
      verified_purchase: true,
      created_at: now,
      date: now
    };
    await db.collection('reviews').add(review);
    form.reset();
    document.getElementById('review-form-container')?.classList.remove('open');
    Toast.show('Your verified review has been published.', 'success');
    // onSnapshot updates the list and rating without reloading the entire route.
  } catch (error) {
    console.error('[Reviews] submit failed:', error);
    Toast.show(error?.message || 'Could not publish your review.', 'error');
  } finally {
    if (submit) { submit.disabled = false; submit.textContent = 'Submit Review'; }
  }
}

function enhanceReviewForm(book) {
  const form = document.getElementById('submit-review-form');
  if (!form || form.dataset.firebaseReviewsBound === '1') return;
  form.dataset.firebaseReviewsBound = '1';
  form.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    submitVerifiedReview(book, form);
  }, true);
}

function refresh() {
  const book = getBook();
  if (!book) return;
  enhanceReviewForm(book);
  watchBook(book);
}

function boot() {
  if (booted) return;
  booted = true;
  const run = () => setTimeout(refresh, 80);
  window.addEventListener('hashchange', run);
  state.subscribe(event => { if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED') run(); });
  run();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
else boot();
