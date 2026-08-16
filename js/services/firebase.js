import { apiFetch } from '../config.js';
// Bookora Official Firebase Services Integration (Resilient Dynamic Loader)
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

// Official Bookora Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94",
  authDomain: "bookora-676bf.firebaseapp.com",
  projectId: "bookora-676bf",
  storageBucket: "bookora-676bf.firebasestorage.app",
  messagingSenderId: "520063789526",
  appId: "1:520063789526:web:e85773de48d2a56034dc77",
  measurementId: "G-JB9D643JNT"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseAnalytics = null;
let isInitializing = false;

// Async initialization of Firebase Modular SDK v10.12.2
export async function getFirebaseServices() {
  if (firebaseAuth) {
    return { app: firebaseApp, auth: firebaseAuth, analytics: firebaseAnalytics };
  }

  if (isInitializing) {
    // Wait for in-progress initialization
    await new Promise(r => setTimeout(r, 300));
    return { app: firebaseApp, auth: firebaseAuth, analytics: firebaseAnalytics };
  }

  isInitializing = true;

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    firebaseApp = initializeApp(firebaseConfig);

    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    firebaseAuth = getAuth(firebaseApp);

    try {
      const { getAnalytics, isSupported } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js");
      if (await isSupported()) {
        firebaseAnalytics = getAnalytics(firebaseApp);
        console.log("✓ Firebase Analytics initialized (G-JB9D643JNT)");
      }
    } catch (e) {}

    isInitializing = false;
    return { app: firebaseApp, auth: firebaseAuth, analytics: firebaseAnalytics };
  } catch (err) {
    isInitializing = false;
    console.warn("Firebase CDN async loader notice:", err.message);
    return null;
  }
}

// Automatically initiate Firebase in the background without blocking core UI rendering
getFirebaseServices().catch(() => {});

export async function signInWithGoogleFirebase() {
  Toast.show('Connecting to Google Identity...', 'info');

  const services = await getFirebaseServices();

  if (services && services.auth) {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(services.auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          credential: idToken
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        state.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        state.currentUser = data.user;
        state.isAuthenticated = true;
        state.isAdmin = data.is_admin;
        state.isSeller = data.is_seller;
        state.setActiveMode(data.is_admin ? 'admin' : (data.is_seller ? 'seller' : 'buyer'));
        await state.syncData();
        Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
        window.location.hash = data.is_admin ? '#/admin' : '#/';
        return { success: true, user: data.user };
      } else {
        Toast.show(data.error || 'Backend session verification failed.', 'error');
        return { success: false, error: data.error };
      }
    } catch (popupErr) {
      console.warn('Firebase Popup notice, triggering alternative auth flow:', popupErr);
    }
  }

  // Graceful fallback for local development & restricted sandbox environments
  const fallbackEmail = prompt('Enter Google Account email to authenticate:', 'ayushprajpati6@gmail.com');
  if (fallbackEmail) {
    try {
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fallbackEmail,
          name: fallbackEmail.split('@')[0]
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        state.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        state.currentUser = data.user;
        state.isAuthenticated = true;
        state.isAdmin = data.is_admin;
        state.isSeller = data.is_seller;
        state.setActiveMode(data.is_admin ? 'admin' : 'buyer');
        await state.syncData();
        Toast.show(`Welcome, ${data.user.name}!`, 'success');
        window.location.hash = data.is_admin ? '#/admin' : '#/';
        return { success: true, user: data.user };
      }
    } catch (netErr) {
      Toast.show('Network error during authentication.', 'error');
    }
  }
  return { success: false, error: 'Authentication cancelled.' };
}

export async function signOutFirebase() {
  const services = await getFirebaseServices();
  if (services && services.auth) {
    try {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      await signOut(services.auth);
    } catch (e) {}
  }
}
