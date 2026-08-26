// Bookora publish success finalizer.
// Narrow hotfix: if the backend has already created the Firestore book but the
// /api/books/create HTTP response is delayed/lost, do not leave the author on
// "Creating book listing..." forever. Existing upload/create logic is untouched.
import { state } from './state.js';
import { Toast } from './components/Toast.js';

const POLL_MS = 1200;
const MAX_WAIT_MS = 45000;
const RECENT_BOOK_MS = 15 * 60 * 1000;
let watcher = null;

function currentUserId() {
  return String(state.currentUser?.id || state.currentUser?.uid || '').trim();
}

function isCreatingListing() {
  const button = document.getElementById('submit-pub-btn');
  return !!button && /creating book listing/i.test(String(button.textContent || ''));
}

function getPublishInput() {
  return {
    title: String(document.getElementById('pub-title')?.value || '').trim(),
    author: String(document.getElementById('pub-author')?.value || '').trim()
  };
}

async function findRecentlyCreatedBook() {
  const firebase = window.firebase;
  if (!firebase?.firestore) return null;
  const title = getPublishInput().title;
  if (!title) return null;

  const db = firebase.firestore();
  const snapshot = await db.collection('books').where('title', '==', title).limit(10).get();
  const now = Date.now();
  const sellerId = currentUserId();
  const author = getPublishInput().author;

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const createdRaw = data.createdAt || data.created_at;
    const createdMs = createdRaw?.toDate ? createdRaw.toDate().getTime() : Date.parse(String(createdRaw || ''));
    if (!Number.isFinite(createdMs) || now - createdMs < 0 || now - createdMs > RECENT_BOOK_MS) continue;
    if (sellerId && String(data.seller_id || data.sellerId || data.creator_id || data.creatorId || '') !== sellerId) continue;
    if (author && String(data.author || '').trim() && String(data.author || '').trim() !== author) continue;
    return { id: doc.id, ...data };
  }
  return null;
}

function finishSuccess(book) {
  if (watcher) {
    clearInterval(watcher.timer);
    watcher = null;
  }
  const button = document.getElementById('submit-pub-btn');
  if (button) {
    button.disabled = true;
    button.textContent = 'Submitted ✓';
    button.setAttribute('aria-busy', 'false');
  }
  const label = document.getElementById('upload-progress-label');
  const fill = document.getElementById('upload-progress-fill');
  if (label) label.textContent = 'eBook submitted successfully for admin review.';
  if (fill) fill.style.width = '100%';
  Toast.show('eBook submitted successfully for admin review!', 'success');
  window.__BOOKORA_PUBLISH_FINALIZED__ = true;
  setTimeout(() => { window.location.hash = '#/creator/dashboard'; }, 800);
}

function startWatcher() {
  if (watcher || window.__BOOKORA_PUBLISH_FINALIZED__) return;
  const startedAt = Date.now();
  watcher = { timer: null };
  const tick = async () => {
    if (!isCreatingListing()) {
      clearInterval(watcher?.timer);
      watcher = null;
      return;
    }
    if (Date.now() - startedAt > MAX_WAIT_MS) {
      clearInterval(watcher?.timer);
      watcher = null;
      return;
    }
    try {
      const book = await findRecentlyCreatedBook();
      if (book) finishSuccess(book);
    } catch (error) {
      console.debug('[Bookora publish finalizer] Firestore confirmation pending:', error?.message || error);
    }
  };
  watcher.timer = setInterval(tick, POLL_MS);
  tick();
}

const observer = new MutationObserver(() => {
  if (isCreatingListing()) startWatcher();
});
observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
window.addEventListener('hashchange', () => {
  clearInterval(watcher?.timer);
  watcher = null;
});
if (isCreatingListing()) startWatcher();
