// Bookora Official Firebase Authentication Service
import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

export const firebaseConfig = {
  apiKey: "AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94",
  authDomain: "bookora-676bf.firebaseapp.com",
  projectId: "bookora-676bf",
  storageBucket: "bookora-676bf.firebasestorage.app",
  messagingSenderId: "520063789526",
  appId: "1:520063789526:web:e85773de48d2a56034dc77",
  measurementId: "G-JB9D643JNT"
};

let authInstance = null;

export function getAuthInstance() {
  if (authInstance) return authInstance;

  if (window.firebase && window.firebase.auth) {
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(firebaseConfig);
    }
    authInstance = window.firebase.auth();
    return authInstance;
  }
  return null;
}

// 1. Google Sign-In via Firebase
export async function firebaseGoogleSignIn() {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

  Toast.show('Connecting to Google...', 'info');

  try {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const userCredential = await auth.signInWithPopup(provider);
    const user = userCredential.user;
    const idToken = await user.getIdToken(true);

    const res = await apiFetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        role: 'buyer'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
      return { success: true, user: data.user, is_admin: data.is_admin, is_seller: data.is_seller };
    } else {
      Toast.show(data.error || 'Backend verification failed.', 'error');
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Firebase Google Sign-In error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      Toast.show('Google sign-in was closed.', 'info');
    } else if (err.code === 'auth/unauthorized-domain') {
      Toast.show('Domain not authorized. Add ayush56379.github.io to Firebase Authorized Domains.', 'error');
    } else {
      Toast.show(err.message || 'Google sign-in failed.', 'error');
    }
    return { success: false, error: err.message };
  }
}

// 2. Apple Sign-In via Firebase
export async function firebaseAppleSignIn() {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

  Toast.show('Connecting to Apple...', 'info');

  try {
    const provider = new window.firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    const userCredential = await auth.signInWithPopup(provider);
    const user = userCredential.user;
    const idToken = await user.getIdToken(true);

    const res = await apiFetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        role: 'buyer'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
      return { success: true, user: data.user, is_admin: data.is_admin, is_seller: data.is_seller };
    } else {
      Toast.show(data.error || 'Apple verification failed.', 'error');
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Firebase Apple Sign-In error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      Toast.show('Apple sign-in was closed.', 'info');
    } else {
      Toast.show(err.message || 'Apple sign-in requires Apple Services Configuration.', 'error');
    }
    return { success: false, error: err.message };
  }
}

// 3. Email + Password Registration
export async function firebaseRegister(name, email, password, roleChoice = 'buyer') {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (name && user.updateProfile) {
      await user.updateProfile({ displayName: name });
    }

    const idToken = await user.getIdToken(true);

    const res = await apiFetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        role: roleChoice
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Account created! Welcome to Bookora, ${data.user.name}.`, 'success');
      return { success: true, user: data.user, is_admin: data.is_admin, is_seller: data.is_seller };
    } else {
      Toast.show(data.error || 'Server registration failed.', 'error');
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Firebase Register error:', err);
    let msg = 'Registration failed.';
    if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists. Please Sign In.';
    else if (err.code === 'auth/weak-password') msg = 'Password is too weak. Must be at least 6 characters.';
    else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format.';
    else if (err.message) msg = err.message;
    Toast.show(msg, 'error');
    return { success: false, error: msg };
  }
}

// 4. Email + Password Sign-In
export async function firebaseLogin(email, password) {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken(true);

    const res = await apiFetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Welcome back, ${data.user.name}!`, 'success');
      return { success: true, user: data.user, is_admin: data.is_admin, is_seller: data.is_seller };
    } else {
      Toast.show(data.error || 'Server authentication failed.', 'error');
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Firebase Login error:', err);
    let msg = 'Invalid email or password.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Invalid email or password. Please check your credentials or Sign Up.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many failed login attempts. Please reset your password or try again later.';
    } else if (err.message) {
      msg = err.message;
    }
    Toast.show(msg, 'error');
    return { success: false, error: msg };
  }
}

// 5. Send Password Reset Email
export async function firebaseForgotPassword(email) {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

  try {
    await auth.sendPasswordResetEmail(email);
    Toast.show(`Password reset link sent to ${email}. Please check your inbox.`, 'success');
    return { success: true };
  } catch (err) {
    console.error('Firebase Forgot Password error:', err);
    let msg = 'Failed to dispatch reset email.';
    if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
    else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format.';
    else if (err.message) msg = err.message;
    Toast.show(msg, 'error');
    return { success: false, error: msg };
  }
}

// 6. Sign Out
export async function firebaseSignOut() {
  const auth = getAuthInstance();
  if (auth) {
    try {
      await auth.signOut();
    } catch (e) {}
  }
  await state.logout();
  Toast.show('You have been signed out.', 'info');
}

// 7. Auto Auth State Sync Listener
export function initAuthListener() {
  const auth = getAuthInstance();
  if (!auth) {
    setTimeout(initAuthListener, 500);
    return;
  }

  auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await apiFetch('/api/auth/firebase', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          state.setUser(data.user, data.token);
        }
      } catch (err) {
        console.warn('Background Firebase token verification notice:', err);
      }
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(initAuthListener, 300);
  });
}
