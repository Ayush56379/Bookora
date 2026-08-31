/* Bookora — wishlist save reliability fix only.
   Keeps the existing Firebase wishlist schema/UI intact.
   Handles the short auth/Firebase hydration race and retries transient writes. */
import { state } from './state.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function resolveFirebaseUser() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      if (!window.firebase?.apps?.length) {
        await sleep(250);
        continue;
      }
      const auth = window.firebase.auth();
      const firebaseUser = auth.currentUser;
      if (firebaseUser?.uid) return { auth, firebaseUser };
    } catch (_) {}
    await sleep(250);
  }
  return null;
}

if (!window.__BOOKORA_WISHLIST_RELIABILITY_FIX__) {
  window.__BOOKORA_WISHLIST_RELIABILITY_FIX__ = true;
  const original = state.toggleWishlist.bind(state);
  const locks = new Map();

  state.toggleWishlist = async function reliableToggleWishlist(bookId) {
    const normalizedId = String(bookId ?? '').trim();
    if (!normalizedId) throw new Error('Invalid book ID.');

    // Prevent two rapid clicks/events from reading the same old wishlist and
    // overwriting each other's update.
    if (locks.has(normalizedId)) return locks.get(normalizedId);

    const operation = (async () => {
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const resolved = await resolveFirebaseUser();
          if (!resolved) throw new Error('Please login first.');

          const { auth, firebaseUser } = resolved;
          // Keep the singleton identity aligned with the actual Firebase
          // session even if the route rendered before auth hydration finished.
          if (!state.currentUser || state.currentUser.uid !== firebaseUser.uid) {
            state.currentUser = {
              ...(state.currentUser || {}),
              uid: firebaseUser.uid,
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email || state.currentUser?.email || ''
            };
          }
          state.isAuthenticated = true;
          if (attempt > 0) {
            try { await firebaseUser.getIdToken(true); } catch (_) {}
          }

          const db = window.firebase.firestore();
          const wishlistRef = db.collection('wishlists').doc(firebaseUser.uid);
          const snapshot = await wishlistRef.get();
          let ids = snapshot.exists && Array.isArray(snapshot.data()?.bookIds)
            ? snapshot.data().bookIds.map(id => String(id))
            : [];

          const isAdded = !ids.includes(normalizedId);
          ids = isAdded
            ? [...ids, normalizedId]
            : ids.filter(id => id !== normalizedId);

          await wishlistRef.set({
            userId: firebaseUser.uid,
            bookIds: ids,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          state.wishlist = new Set(ids);
          state.notify('WISHLIST_UPDATED', { bookId: normalizedId, isAdded });
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
