// Review buyer authentication hotfix.
// The legacy BookDetailPage review handler used purchase-only/state timing checks.
// This capture-phase bridge makes Firebase Auth the immediate source of truth for
// signed-in readers, while preserving the existing server-side /api/reviews flow.
import { state } from './state.js';
import { Toast } from './components/Toast.js';
import { apiFetch } from './config.js';

const firebaseUser = () => window.firebase?.apps?.length ? window.firebase.auth().currentUser : null;
const isSignedIn = () => Boolean(firebaseUser()?.uid || (state.isAuthenticated && state.currentUser?.uid));
const currentBook = () => {
  const hash = window.location.hash || '';
  const match = hash.match(/^#\/book\/([^?]+)/);
  return match ? state.getBookBySlug(decodeURIComponent(match[1])) : null;
};
const login = () => {
  const returnTo = window.location.hash || '#/explore';
  window.location.hash = `#/login?returnTo=${encodeURIComponent(returnTo)}`;
};

function openForm(book) {
  const box = document.getElementById('review-form-container');
  if (!box) return false;
  box.classList.add('open');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
}

async function submit(form, book) {
  const authUser = firebaseUser();
  if (!authUser && !(state.isAuthenticated && state.currentUser?.uid)) { Toast.show('Please sign in before submitting a review.', 'info'); login(); return; }
  const rating = Math.max(1, Math.min(5, Number(form.querySelector('#review-rating-input')?.value || 5)));
  const title = String(form.querySelector('#review-title-input')?.value || '').trim();
  const comment = String(form.querySelector('#review-comment-input')?.value || '').trim();
  if (!title || !comment) { Toast.show('Please complete the review before submitting.', 'warning'); return; }
  const button = form.querySelector('button[type="submit"]');
  if (button) { button.disabled = true; button.textContent = 'Publishing…'; }
  try {
    const response = await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ book_id: String(book.id), rating, title, comment }) });
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok || !payload.success) {
      if (response.status === 409) throw new Error(payload.error || 'You have already reviewed this eBook.');
      throw new Error(payload.error || `Review service returned HTTP ${response.status}.`);
    }
    if (payload.review) {
      state.reviews = [...(Array.isArray(state.reviews) ? state.reviews : []), payload.review];
      document.getElementById('review-form-container')?.classList.remove('open');
      form.reset();
      window.dispatchEvent(new CustomEvent('bookora:review-created', { detail: payload.review }));
    }
    Toast.show(payload.review?.verified_purchase ? 'Your verified review has been published.' : 'Your review and rating have been published.', 'success');
  } catch (error) {
    console.error('[Review buyer hotfix] submit failed:', error);
    Toast.show(error?.message || 'Could not publish your review.', 'error');
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Submit Review'; }
  }
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  const button = target?.closest('[data-panel="reviews"] button, [data-panel="reviews"] .bd-btn');
  if (!button || !/review/i.test(button.textContent || '') || /submit|cancel/i.test(button.textContent || '')) return;
  const book = currentBook();
  if (!book) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!isSignedIn()) { Toast.show('Please sign in to write a review.', 'info'); login(); return; }
  openForm(book);
}, true);

document.addEventListener('submit', event => {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || form.id !== 'submit-review-form') return;
  const book = currentBook();
  if (!book) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  submit(form, book);
}, true);

window.addEventListener('bookora:review-created', () => window.dispatchEvent(new Event('hashchange')));
