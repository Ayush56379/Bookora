/* Bookora fast Firebase bootstrap. Runs before the SPA so Firestore/Auth are ready on first state initialization. */
(() => {
  try {
    if (!window.firebase?.initializeApp) return;
    if (window.firebase.apps?.length) return;
    window.firebase.initializeApp({
      apiKey: 'AIzaSyDgPa6d8gxRhrJEaPyKuki2hbSfAU-94',
      authDomain: 'bookora-676bf.firebaseapp.com',
      projectId: 'bookora-676bf',
      storageBucket: 'bookora-676bf.firebasestorage.app',
      messagingSenderId: '520063789526',
      appId: '1:520063789526:web:e85773de48d2a56034dc77',
      measurementId: 'G-JB9D643JNT'
    });
  } catch (error) {
    console.warn('[Bookora Firebase bootstrap]', error);
  }
})();
