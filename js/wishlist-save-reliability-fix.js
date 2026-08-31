/* Bookora — wishlist save reliability fix only.
   Existing Firebase wishlist schema/UI is preserved.
   Presentation, catalog, checkout, library and routing are untouched. */
import { state } from './state.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function resolveFirebaseUser() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      if (!window.firebase?.apps?.length) {
        await sleep(150);
        continue;
      }
      const auth = window.firebase.auth();
      if (auth.currentUser?.uid) return auth.currentUser;
    } catch (_) {}
    await sleep(150);
  }
  return null;
}

if (!window.__BOOKORA_WISHLIST_RELIABILITY_FIX__) {
  window.__BOOKORA_WISHLIST_RELIABILITY_FIX__ = true;
  const locks = new Map();

  state.toggleWishlist = async function reliableToggleWishlist(bookId) {
    const normalizedId = String(bookId ?? '').trim();
    if (!normalizedId) throw new Error('Invalid book ID.');
    if (locks.has(normalizedId)) return locks.get(normalizedId);

    const operation = (async () => {
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const firebaseUser = await resolveFirebaseUser();
          if (!firebaseUser) throw new Error('Please login first.');

          state.currentUser = {
            ...(state.currentUser || {}),
            uid: firebaseUser.uid,
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || state.currentUser?.email || ''
          };
          state.isAuthenticated = true;

          const db = window.firebase.firestore();
          const wishlistRef = db.collection('wishlists').doc(firebaseUser.uid);
          const snapshot = await wishlistRef.get();
          const currentIds = snapshot.exists && Array.isArray(snapshot.data()?.bookIds)
            ? snapshot.data().bookIds.map(id => String(id))
            : [];

          const isAdded = !currentIds.includes(normalizedId);
          const nextIds = isAdded
            ? [...currentIds, normalizedId]
            : currentIds.filter(id => id !== normalizedId);

          // Firestore persistence is already enabled by the existing fast
          // Firebase bootstrap. Update canonical local state immediately so
          // the heart and Wishlist page respond without waiting for a server
          // round trip; Firestore remains the source of truth.
          state.wishlist = new Set(nextIds);
          state.notify('WISHLIST_UPDATED', { bookId: normalizedId, isAdded, pending: true });

          try {
            await wishlistRef.set({
              userId: firebaseUser.uid,
              bookIds: nextIds,
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          } catch (writeError) {
            state.wishlist = new Set(currentIds);
            state.notify('WISHLIST_UPDATED', { bookId: normalizedId, isAdded: false, pending: false, error: true });
            throw writeError;
          }

          state.wishlist = new Set(nextIds);
          state.notify('WISHLIST_UPDATED', { bookId: normalizedId, isAdded, pending: false });
          return isAdded;
        } catch (error) {
          lastError = error;
          if (attempt < 2) await sleep(300 * (attempt + 1));
        }
      }
      throw lastError || new Error('Wishlist save failed. Please try again.');
    })();

    locks.set(normalizedId, operation);
    try { return await operation; }
    finally { locks.delete(normalizedId); }
  };
}
