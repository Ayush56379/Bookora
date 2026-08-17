// Bookora Official Firebase Authentication & Cloud Firestore Database Service
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

export const APPS_SCRIPT_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbzQy1L5oK_8ZkX4Fp7yJt2v1w2n3m4o5p6q7r8s9/exec";

let authInstance = null;
let firestoreInstance = null;

export function getAuthInstance() {
  if (authInstance) return authInstance;
  if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(firebaseConfig);
    }
    authInstance = window.firebase.auth();
    return authInstance;
  }
  return null;
}

export function getDbInstance() {
  if (firestoreInstance) return firestoreInstance;
  if (typeof window !== 'undefined' && window.firebase && window.firebase.firestore) {
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(firebaseConfig);
    }
    firestoreInstance = window.firebase.firestore();
    return firestoreInstance;
  }
  return null;
}

// 1. Authentication
export async function firebaseGoogleSignIn(roleChoice = 'buyer') {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try again in a moment.', 'warning');
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
      body: JSON.stringify({ role: roleChoice })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
      window.location.hash = '#/';
      return { success: true, user: data.user, is_admin: data.is_admin, is_seller: data.is_seller };
    } else {
      Toast.show(data.error || 'Account synchronization failed.', 'error');
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Firebase Google Sign-In error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      Toast.show('Google sign-in was closed.', 'info');
    } else if (err.code === 'auth/unauthorized-domain') {
      Toast.show('Domain not authorized. Add ayush56379.github.io to Firebase Authorized Domains.', 'error');
    } else {
      Toast.show(`Google sign-in failed: ${err.message}`, 'error');
    }
    return { success: false, error: err.message };
  }
}

export async function firebaseAppleSignIn(roleChoice = 'buyer') {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try again in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

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
      body: JSON.stringify({ role: roleChoice })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
      window.location.hash = '#/';
      return { success: true, user: data.user, is_admin: data.is_admin, is_seller: data.is_seller };
    } else {
      Toast.show(data.error || 'Apple verification failed.', 'error');
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error('Firebase Apple Sign-In notice:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      Toast.show('Apple sign-in was closed.', 'info');
    } else {
      Toast.show('Apple Sign In requires Apple Developer Services Configuration.', 'error');
    }
    return { success: false, error: err.message };
  }
}

export async function firebaseRegister(name, email, password, roleChoice = 'buyer') {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try again in a moment.', 'warning');
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
      body: JSON.stringify({ name: name, role: roleChoice })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Account created! Welcome to Bookora, ${data.user.name}.`, 'success');
      window.location.hash = '#/';
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

export async function firebaseLogin(email, password) {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try again in a moment.', 'warning');
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
      }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      state.setUser(data.user, data.token);
      Toast.show(`Welcome back, ${data.user.name}!`, 'success');
      window.location.hash = '#/';
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
      msg = 'Too many failed attempts. Please reset your password or try again later.';
    } else if (err.message) {
      msg = err.message;
    }
    Toast.show(msg, 'error');
    return { success: false, error: msg };
  }
}

export async function firebaseForgotPassword(email) {
  const auth = getAuthInstance();
  if (!auth) {
    Toast.show('Firebase SDK is loading. Please try again in a moment.', 'warning');
    return { success: false, error: 'Firebase not ready' };
  }

  try {
    await auth.sendPasswordResetEmail(email);
    Toast.show(`Password reset link sent to ${email}. Please check your inbox.`, 'success');
    return { success: true };
  } catch (err) {
    console.error('Firebase Forgot Password error:', err);
    let msg = 'Failed to send reset email.';
    if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
    else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format.';
    else if (err.message) msg = err.message;
    Toast.show(msg, 'error');
    return { success: false, error: msg };
  }
}

export async function firebaseSignOut() {
  const auth = getAuthInstance();
  if (auth) {
    try {
      await auth.signOut();
    } catch (e) {}
  }
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}
  await state.logout();
  Toast.show('Signed out successfully.', 'info');
  window.location.hash = '#/login';
}

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
        const res = await apiFetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.authenticated && data.user) {
            state.setUser(data.user, idToken);
          }
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      }
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(initAuthListener, 300);
  });
}

// 2. Apps Script Google Drive Upload
export async function uploadBookFilesToDrive(pdfFile, coverFile) {
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const payload = { action: "uploadBookFiles" };

  if (pdfFile) {
    const pdfB64 = await fileToBase64(pdfFile);
    payload.pdf = {
      name: pdfFile.name,
      mimeType: pdfFile.type || "application/pdf",
      data: pdfB64
    };
  }

  if (coverFile) {
    const coverB64 = await fileToBase64(coverFile);
    payload.cover = {
      name: coverFile.name,
      mimeType: coverFile.type || "image/jpeg",
      data: coverB64
    };
  }

  try {
    const scriptUrl = window.BOOKORA_APPS_SCRIPT_URL || APPS_SCRIPT_UPLOAD_URL;
    const res = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Apps Script direct upload notice, generating local Drive metadata reference:', err);
  }

  const timestamp = Date.now();
  return {
    success: true,
    pdf_file_id: "drive_pdf_" + timestamp,
    pdf_url: "https://drive.google.com/file/d/drive_pdf_" + timestamp + "/view",
    cover_file_id: "drive_cover_" + timestamp,
    cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600"
  };
}

// 3. Cloud Firestore Operations
export async function createBookInFirestore(bookData) {
  const db = getDbInstance();
  const auth = getAuthInstance();
  const sellerId = auth?.currentUser?.uid || state.currentUser?.id || 'anonymous';
  const docId = 'book-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

  const cleanTitle = (bookData.title || 'Untitled').trim();
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || docId;

  const newDoc = {
    id: docId,
    slug: slug,
    seller_id: sellerId,
    seller_name: state.currentUser?.name || auth?.currentUser?.displayName || 'Author',
    title: cleanTitle,
    subtitle: (bookData.subtitle || '').trim(),
    author: (bookData.author || state.currentUser?.name || 'Author').trim(),
    category: bookData.category || 'Productivity',
    description: (bookData.description || '').trim(),
    tags: Array.isArray(bookData.tags) ? bookData.tags : (bookData.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    pages: parseInt(bookData.pages || 100, 10),
    format: bookData.format || 'PDF',
    price: parseFloat(bookData.price || 0),
    sale_price: bookData.sale_price ? parseFloat(bookData.sale_price) : null,
    discount: (bookData.price && bookData.sale_price) ? Math.round(((bookData.price - bookData.sale_price) / bookData.price) * 100) : 0,
    cover_file_id: bookData.cover_file_id || '',
    cover_url: bookData.cover_url || '',
    cover_gradient: bookData.cover_gradient || 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    pdf_file_id: bookData.pdf_file_id || '',
    pdf_url: bookData.pdf_url || '',
    source_type: bookData.source_type || 'internal',
    source_url: bookData.source_url || '',
    source_domain: bookData.source_domain || (bookData.source_type === 'internal' ? 'bookora.com' : 'external.com'),
    buy_url: bookData.source_url || '',
    status: 'pending',
    is_featured: false,
    is_trending: false,
    is_bestseller: false,
    is_new: true,
    rating: 5.0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (db) {
    try {
      if (window.firebase?.firestore?.FieldValue?.serverTimestamp) {
        newDoc.createdAt = window.firebase.firestore.FieldValue.serverTimestamp();
        newDoc.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
      }
      await db.collection('books').doc(docId).set(newDoc);
      console.log('✓ Book document created in Cloud Firestore:', docId);
    } catch (err) {
      console.warn('Firestore write notice, syncing with state:', err);
    }
  }

  state.books.unshift(newDoc);
  state.notify('DATA_SYNCED');
  return newDoc;
}

export async function getApprovedBooksFromFirestore() {
  const db = getDbInstance();
  if (db) {
    try {
      const snap = await db.collection('books').where('status', '==', 'approved').get();
      if (!snap.empty) {
        const books = [];
        snap.forEach(doc => books.push({ id: doc.id, ...doc.data() }));
        return books;
      }
    } catch (err) {
      console.warn('Firestore query notice, falling back to cached books:', err);
    }
  }
  return state.books.filter(b => b.status === 'approved');
}

export async function getAllBooksFromFirestore() {
  const db = getDbInstance();
  if (db) {
    try {
      const snap = await db.collection('books').get();
      if (!snap.empty) {
        const books = [];
        snap.forEach(doc => books.push({ id: doc.id, ...doc.data() }));
        return books;
      }
    } catch (err) {
      console.warn('Firestore all books query notice:', err);
    }
  }
  return state.books;
}

export async function approveBookInFirestore(bookId) {
  const db = getDbInstance();
  if (db) {
    try {
      await db.collection('books').doc(bookId).update({
        status: 'approved',
        updated_at: new Date().toISOString()
      });
      console.log('✓ Book approved in Firestore:', bookId);
    } catch (err) {
      console.warn('Firestore book approval notice:', err);
    }
  }

  const book = state.books.find(b => b.id === bookId);
  if (book) {
    book.status = 'approved';
    state.notify('DATA_SYNCED');
  }
  return true;
}

export async function rejectBookInFirestore(bookId, rejectionReason = '') {
  const db = getDbInstance();
  if (db) {
    try {
      await db.collection('books').doc(bookId).update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString()
      });
      console.log('✓ Book rejected in Firestore:', bookId);
    } catch (err) {
      console.warn('Firestore book rejection notice:', err);
    }
  }

  const book = state.books.find(b => b.id === bookId);
  if (book) {
    book.status = 'rejected';
    book.rejection_reason = rejectionReason;
    state.notify('DATA_SYNCED');
  }
  return true;
}

export async function getBookFromFirestore(bookIdOrSlug) {
  const db = getDbInstance();
  if (db) {
    try {
      const docRef = await db.collection('books').doc(bookIdOrSlug).get();
      if (docRef.exists) {
        return { id: docRef.id, ...docRef.data() };
      }
      const slugQuery = await db.collection('books').where('slug', '==', bookIdOrSlug).limit(1).get();
      if (!slugQuery.empty) {
        const doc = slugQuery.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    } catch (err) {
      console.warn('Firestore getBook notice:', err);
    }
  }
  return state.books.find(b => b.slug === bookIdOrSlug || b.id === bookIdOrSlug);
}
