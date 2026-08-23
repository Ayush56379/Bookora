/* Bookora fast Firebase bootstrap. Initializes Firebase + durable Firestore cache before SPA/state boot. */
(() => {
  try {
    if (!window.firebase?.initializeApp) return;
    if (!window.firebase.apps?.length) {
      window.firebase.initializeApp({
        apiKey: 'AIzaSyDgPa6d8gxRhrJEaPyKuki2hbSfAU-94',
        authDomain: 'bookora-676bf.firebaseapp.com',
        projectId: 'bookora-676bf',
        storageBucket: 'bookora-676bf.firebasestorage.app',
        messagingSenderId: '520063789526',
        appId: '1:520063789526:web:e85773de48d2a56034dc77',
        measurementId: 'G-JB9D643JNT'
      });
    }
    const db = window.firebase.firestore();
    try {
      db.settings({ cacheSizeBytes: window.firebase.firestore.CACHE_SIZE_UNLIMITED });
    } catch (settingsError) {
      // Settings may already be locked after the first Firestore operation.
      console.info('[Bookora Firestore] cache settings already initialized.');
    }
    db.enablePersistence({ synchronizeTabs: true }).catch(error => {
      // Multiple tabs or unsupported persistence must never block the application.
      if (!['failed-precondition', 'unimplemented'].includes(error?.code)) console.warn('[Bookora Firestore] persistence:', error);
    });
  } catch (error) {
    console.warn('[Bookora Firebase bootstrap]', error);
  }
})();
