// Bookora — Firebase-only wishlist persistence + live UI synchronization.
// The authenticated Firebase UID is the owner of the wishlist document.
// No localStorage fallback is used: Firebase is the source of truth.
import { state } from './state.js';

const rerenderWishlist = () => {
  try {
    const path = String(window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
    if (path === '/wishlist') {
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (app?.route) setTimeout(() => app.route(true, false), 0);
    }
  } catch (error) {
    console.warn('[Bookora Wishlist] UI refresh skipped:', error?.message || error);
  }
};

async function persistWishlistRecord(bookId, isAdded) {
  if (!state.isAuthenticated || !state.currentUser?.uid) throw new Error('Please login first.');
  const { db } = await state.getFirebase();
  const uid = String(state.currentUser.uid);
  const normalizedId = String(bookId);
  const book = state.getApprovedBooks().find(item => String(item.id) === normalizedId) || {};
  const wishlistRef = db.collection('wishlists').doc(uid);

  // One document per authenticated Firebase user = complete account-level record.
  await wishlistRef.set({
    userId: uid,
    firebaseUid: uid,
    email: state.currentUser.email || '',
    userName: state.currentUser.name || state.currentUser.displayName || '',
    bookIds: Array.from(state.wishlist).map(String),
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    lastAction: isAdded ? 'added' : 'removed',
    lastBookId: normalizedId
  }, { merge: true });

  // Also keep an auditable per-book record for this user.
  const itemRef = wishlistRef.collection('items').doc(normalizedId);
  if (isAdded) {
    await itemRef.set({
      userId: uid,
      firebaseUid: uid,
      email: state.currentUser.email || '',
      userName: state.currentUser.name || state.currentUser.displayName || '',
      bookId: normalizedId,
      bookTitle: book.title || '',
      bookAuthor: book.author || '',
      addedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } else {
    await itemRef.delete();
  }
}

const originalToggle = state.toggleWishlist.bind(state);

state.toggleWishlist = async function(bookId) {
  const normalizedId = String(bookId || '').trim();
  if (!normalizedId) throw new Error('BOOK_ID_MISSING');
  if (!this.isAuthenticated || !this.currentUser?.uid) throw new Error('Please login first.');

  // Existing state method performs the atomic source-of-truth update in Firebase.
  const result = await originalToggle(normalizedId);
  try {
    await persistWishlistRecord(normalizedId, result);
  } catch (error) {
    // Do not silently switch to localStorage. Firebase must remain authoritative.
    console.error('[Bookora Wishlist] Firebase record enrichment failed:', error);
    throw error;
  }

  this.notify('WISHLIST_UPDATED', {
    bookId: normalizedId,
    isAdded: result,
    persistence: 'firebase'
  });
  rerenderWishlist();
  return result;
};

state.subscribe(event => {
  // Firebase sync populates state.wishlist after authentication. Re-render the
  // already-open Wishlist route so it never stays stuck on "Wishlist (0)".
  if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN' || event === 'WISHLIST_UPDATED') {
    rerenderWishlist();
  }
});

// If this runtime loads after the initial sync, immediately reconcile the route.
rerenderWishlist();
