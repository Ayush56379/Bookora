// Bookora - Firebase/Firestore Global State
// ------------------------------------------------------------

import { initialCategories } from './data/initialCategories.js';
import { initialUsers } from './data/initialUsers.js';
import { apiUrl } from './config.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
const PUBLIC_CATALOG_CACHE_KEY = 'bookora_public_catalog_v2';
const PUBLIC_CATALOG_CACHE_TTL = 30 * 60 * 1000;

class BookoraState {
  constructor() { this.subscribers = new Set(); this.init(); }

  init() {
    this.token = '';
    this.books = [];
    this.booksLoaded = false;
    this.booksLoading = false;
    this.categories = initialCategories || [];
    this.users = [];
    this.orders = [];
    this.reviews = [];
    this.settings = {};
    this.sellers = [];
    this.wallets = [];
    this.library = new Set();
    this.wishlist = new Set();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.isAdmin = false;
    this.isSeller = false;
    this.activeMode = 'buyer';
    const cachedUser = localStorage.getItem('bookora_user_profile');
    if (cachedUser && cachedUser !== 'undefined') {
      try {
        const user = JSON.parse(cachedUser);
        this.currentUser = user;
        this.isAuthenticated = true;
        this.isAdmin = user.role === 'admin' || String(user.email || '').toLowerCase() === MASTER_ADMIN_EMAIL;
        this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
        this.activeMode = this.resolvePersistedMode(user);
      } catch (error) {
        console.warn('Cached user could not be restored:', error);
        this.clearLocalSession();
      }
    }
    this.hydrateCatalogCache();
    this.syncData();
    this.startFirebaseSession();
  }

  resolvePersistedMode(user = this.currentUser) {
    const saved = String(localStorage.getItem('bookora_active_mode') || '').toLowerCase();
    if (saved === 'admin' && this.isAdmin) return 'admin';
    if (saved === 'seller' && this.isSeller) return 'seller';
    if (saved === 'buyer' && !!user) return 'buyer';
    // Only use a role-based default when no valid mode has ever been chosen.
    // Once the user explicitly switches mode, that selection is authoritative
    // across refreshes, route changes and Firebase session hydration.
    if (!saved) return this.isAdmin ? 'admin' : this.isSeller ? 'seller' : 'buyer';
    return 'buyer';
  }

  hydrateCatalogCache() {
    try {
      const raw = localStorage.getItem(PUBLIC_CATALOG_CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || !Array.isArray(cached.books)) return;
      if (Date.now() - Number(cached.savedAt || 0) > PUBLIC_CATALOG_CACHE_TTL) return;
      const books = cached.books.map(book => this.normalizeBook(book)).filter(Boolean);
      if (books.length) { this.books = books; this.booksLoaded = true; }
    } catch (error) {
      console.warn('Public catalog cache could not be restored:', error);
      localStorage.removeItem(PUBLIC_CATALOG_CACHE_KEY);
    }
  }

  persistCatalogCache(books) {
    const safeBooks = Array.isArray(books) ? books.map(book => this.normalizeBook(book)).filter(Boolean) : [];
    if (!safeBooks.length) return;
    try { localStorage.setItem(PUBLIC_CATALOG_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), books: safeBooks })); }
    catch (error) { console.warn('Public catalog cache could not be saved:', error); }
  }

  async getFirebase() {
    if (!window.firebase) throw new Error('Firebase SDK is not loaded.');
    if (!window.firebase.apps.length) throw new Error('Firebase app has not been initialized yet.');
    return { auth: window.firebase.auth(), db: window.firebase.firestore() };
  }

  async resolveBookoraUser(firebaseUser, db) {
    if (!firebaseUser) return null;
    const email = String(firebaseUser.email || '').trim();
    const normalizedEmail = email.toLowerCase();
    let profile = {};
    let source = '';
    try {
      const cached = this.currentUser || JSON.parse(localStorage.getItem('bookora_user_profile') || '{}');
      if (cached && String(cached.firebaseUid || cached.uid || '') === String(firebaseUser.uid) && cached.bookoraUserId) {
        profile = { ...cached };
        source = 'cached-profile';
      }
    } catch (_) {}
    if (!profile.bookoraUserId) {
      try {
        const snapshot = await db.collection('users').doc(firebaseUser.uid).get();
        if (snapshot.exists) {
          profile = { ...(snapshot.data() || {}), id: snapshot.id };
          source = 'users/firebase-uid';
        }
      } catch (error) { console.warn('[Auth] UID user lookup failed:', error.message); }
    }
    if (!profile.bookoraUserId) {
      for (const field of ['firebaseUid', 'firebase_uid', 'uid', 'auth_uid', 'authUid']) {
        try {
          const snapshot = await db.collection('users').where(field, '==', firebaseUser.uid).limit(3).get();
          if (!snapshot.empty) {
            profile = { ...(snapshot.docs[0].data() || {}), id: snapshot.docs[0].id };
            source = `users/${field}`;
            break;
          }
        } catch (error) { console.warn(`[Auth] ${field} user lookup failed:`, error.message); }
      }
    }
    if (!profile.bookoraUserId && email) {
      try {
        const snapshot = await db.collection('users').where('email', '==', email).limit(5).get();
        const match = snapshot.docs.find(doc => String(doc.data()?.email || '').trim().toLowerCase() === normalizedEmail);
        if (match) {
          profile = { ...(match.data() || {}), id: match.id };
          source = 'users/email';
        }
      } catch (error) { console.warn('[Auth] Email user lookup failed:', error.message); }
    }
    if (!profile.bookoraUserId) {
      try {
        const candidates = [profile.id, firebaseUser.uid].filter(Boolean).map(String);
        for (const candidate of candidates) {
          const snapshot = await db.collection('library').where('userId', '==', candidate).limit(10).get();
          const active = snapshot.docs.find(doc => String(doc.data()?.accessStatus || 'active').toLowerCase() === 'active');
          if (active) {
            profile.bookoraUserId = candidate;
            source = 'library-entitlement';
            break;
          }
        }
      } catch (error) { console.warn('[Auth] Library identity bridge skipped:', error.message); }
    }
    const bookoraUserId = String(profile.bookoraUserId || profile.userId || profile.user_id || profile.id || profile.bookora_user_id || '').trim();
    console.log('[Auth] Bookora identity source:', source || '(not found)');
    console.log('[Auth] Firebase UID:', firebaseUser.uid);
    console.log('[Auth] Resolved Bookora user ID:', bookoraUserId || '(missing)');
    return { ...profile, uid: firebaseUser.uid, email: firebaseUser.email || profile.email || '', bookoraUserId: bookoraUserId || null, firebaseUid: firebaseUser.uid };
  }

  async startFirebaseSession() {
    try {
      const { auth } = await this.getFirebase();
      auth.onAuthStateChanged(async firebaseUser => {
        if (!firebaseUser) {
          this.token = '';
          if (!this.currentUser) { this.isAuthenticated = false; this.isAdmin = false; this.isSeller = false; }
          this.notify('AUTH_STATE_CHANGED', null);
          if (!this.booksLoaded) this.syncData();
          return;
        }
        try {
          this.token = await firebaseUser.getIdToken(false);
          await this.loadAuthenticatedUser(firebaseUser);
        } catch (error) { console.error('Firebase session sync failed:', error); }
      });
    } catch (error) {
      console.warn('Firebase session waiting:', error.message);
      setTimeout(() => this.startFirebaseSession(), 500);
    }
  }

  async loadAuthenticatedUser(firebaseUser) {
    if (!firebaseUser) return;
    const { db } = await this.getFirebase();
    const profile = await this.resolveBookoraUser(firebaseUser, db) || {};
    const email = firebaseUser.email || profile.email || '';
    const isMasterAdmin = String(email).toLowerCase() === MASTER_ADMIN_EMAIL;
    const user = {
      ...profile,
      uid: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      bookoraUserId: profile.bookoraUserId || null,
      email,
      name: profile.name || firebaseUser.displayName || email.split('@')[0] || 'Bookora User',
      photoURL: profile.photoURL || firebaseUser.photoURL || '',
      role: isMasterAdmin ? 'admin' : (profile.role || 'buyer'),
      status: profile.status || 'active',
      seller_status: profile.seller_status || 'none',
      isMasterAdmin,
      createdAt: profile.createdAt || profile.created_at || null,
      updatedAt: profile.updatedAt || profile.updated_at || null
    };
    this.currentUser = user;
    this.isAuthenticated = true;
    this.isAdmin = isMasterAdmin || user.role === 'admin';
    this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
    // IMPORTANT: Firebase hydration must never silently change the selected UI
    // mode. Keep the explicit persisted mode until the user changes it.
    this.activeMode = this.resolvePersistedMode(user);
    localStorage.setItem('bookora_user_profile', JSON.stringify(user));
    localStorage.setItem('bookora_active_mode', this.activeMode);
    this.notify('USER_LOGGED_IN', user);
    await this.syncData();
  }

  setUser(user, token = '') {
    if (!user) return;
    this.currentUser = user;
    this.token = token || this.token || '';
    this.isAuthenticated = true;
    this.isAdmin = user.role === 'admin' || String(user.email || '').toLowerCase() === MASTER_ADMIN_EMAIL || user.isMasterAdmin === true;
    this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
    this.activeMode = this.resolvePersistedMode(user);
    localStorage.setItem('bookora_user_profile', JSON.stringify(user));
    localStorage.setItem('bookora_active_mode', this.activeMode);
    this.notify('USER_LOGGED_IN', user);
    this.syncData();
  }

  async fetchBooksFromBackend() {
    try {
      const response = await fetch(apiUrl('/api/books'), { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error(`Backend catalog HTTP ${response.status}`);
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.books) ? payload.books : []);
      return list.map(book => this.normalizeBook(book)).filter(Boolean).filter(book => book.status === 'approved');
    } catch (error) {
      console.warn('Backend catalog fallback failed:', error.message);
      return [];
    }
  }

  async syncData() {
    if (this.booksLoading) return;
    this.booksLoading = true;
    let publicSyncSucceeded = false;
    try {
      const { db } = await this.getFirebase();
      const booksSnapshot = await db.collection('books').where('status', '==', 'approved').get();
      const firestoreBooks = booksSnapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() })).map(book => this.normalizeBook(book)).filter(Boolean).filter(book => book.status === 'approved');
      if (firestoreBooks.length) { this.books = firestoreBooks; this.persistCatalogCache(this.books); publicSyncSucceeded = true; }
      try {
        const categorySnapshot = await db.collection('categories').get();
        if (!categorySnapshot.empty) this.categories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) { console.warn('Categories sync skipped:', error.message); }
      try {
        const publicSettings = await db.collection('settings').doc('public').get();
        if (publicSettings.exists) this.settings = publicSettings.data() || {};
      } catch (error) { console.warn('Settings sync skipped:', error.message); }
      if (this.isAuthenticated && this.currentUser?.uid) {
        try {
          const profile = await this.resolveBookoraUser({ uid: this.currentUser.uid, email: this.currentUser.email }, db);
          if (profile) {
            this.currentUser = { ...this.currentUser, ...profile, bookoraUserId: profile.bookoraUserId || this.currentUser.bookoraUserId || null };
            this.isAdmin = this.currentUser.role === 'admin' || this.currentUser.isMasterAdmin === true || String(this.currentUser.email || '').toLowerCase() === MASTER_ADMIN_EMAIL;
            this.isSeller = this.isAdmin || this.currentUser.seller_status === 'approved' || this.currentUser.role === 'creator' || this.currentUser.role === 'seller';
            localStorage.setItem('bookora_user_profile', JSON.stringify(this.currentUser));
          }
        } catch (error) { console.warn('User profile sync skipped:', error.message); }
      }
      try {
        const resolvedUserId = String(this.currentUser?.bookoraUserId || this.currentUser?.userId || this.currentUser?.id || '').trim();
        let librarySnapshot = { docs: [] };
        if (resolvedUserId) librarySnapshot = await db.collection('library').where('userId', '==', resolvedUserId).get();
        const wishlistSnapshot = await db.collection('wishlists').doc(this.currentUser?.uid || '__anonymous__').get();
        const activeLibraryDocs = librarySnapshot.docs.filter(doc => String(doc.data()?.accessStatus || 'active').toLowerCase() === 'active');
        this.library = new Set(activeLibraryDocs.map(doc => String(doc.data()?.bookId || doc.data()?.book_id || '')).filter(Boolean));
        const wishlistIds = wishlistSnapshot.exists && Array.isArray(wishlistSnapshot.data()?.bookIds) ? wishlistSnapshot.data().bookIds : [];
        this.wishlist = new Set(wishlistIds.map(id => String(id)));
      } catch (error) { console.warn('Library/wishlist sync skipped:', error.message); }
      try {
        const reviewSnapshot = await db.collection('reviews').get();
        this.reviews = reviewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) { console.warn('Reviews sync skipped:', error.message); }
    } catch (error) {
      console.warn('Firestore sync failed, trying backend catalog:', error.message);
    }
    if (!publicSyncSucceeded) {
      try {
        const backendBooks = await this.fetchBooksFromBackend();
        if (backendBooks.length) {
          this.books = backendBooks;
          this.persistCatalogCache(this.books);
          publicSyncSucceeded = true;
        }
      } catch (error) { console.warn('Backend sync failed:', error.message); }
    }
    this.booksLoaded = this.booksLoaded || publicSyncSucceeded;
    this.booksLoading = false;
    this.notify('DATA_SYNCED');
  }

  async syncAdminData() {
    if (!this.isAdmin) throw new Error('Admin access required.');
    const { db } = await this.getFirebase();
    try { const s = await db.collection('users').get(); this.users = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin users sync:', e.message); this.users = []; }
    try { const s = await db.collection('books').get(); this.books = s.docs.map(doc => ({ id: String(doc.id), ...doc.data() })); } catch (e) { console.warn('Admin books sync:', e.message); this.books = []; }
    try { const s = await db.collection('sellers').get(); this.sellers = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin sellers sync:', e.message); this.sellers = []; }
    try { const s = await db.collection('orders').get(); this.orders = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin orders sync:', e.message); this.orders = []; }
    try { const s = await db.collection('wallets').get(); this.wallets = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin wallets sync:', e.message); this.wallets = []; }
    try { const s = await db.collection('reviews').get(); this.reviews = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin reviews sync:', e.message); this.reviews = []; }
    if (this.books.length) this.persistCatalogCache(this.books.filter(book => String(book.status || '').toLowerCase() === 'approved'));
  }

  subscribe(callback) { this.subscribers.add(callback); return () => this.subscribers.delete(callback); }
  notify(event, payload = null) { this.subscribers.forEach(callback => { try { callback(event, payload, this); } catch (error) { console.error(error); } }); }
  setActiveMode(mode) {
    if (!['buyer', 'seller', 'admin'].includes(mode)) return false;
    if (mode === 'admin' && !this.isAdmin) return false;
    if (mode === 'seller' && !this.isSeller) return false;
    if (mode === this.activeMode) return true;
    this.activeMode = mode;
    localStorage.setItem('bookora_active_mode', mode);
    this.notify('MODE_CHANGED', mode);
    return true;
  }
  async logout() { try { if (window.firebase?.apps?.length) { const auth = window.firebase.auth(); if (auth.currentUser) await auth.signOut(); } } catch (error) { console.warn('Firebase logout:', error); } this.clearLocalSession(); this.notify('USER_LOGGED_OUT'); }
  clearLocalSession() { this.token = ''; this.currentUser = null; this.isAuthenticated = false; this.isAdmin = false; this.isSeller = false; this.activeMode = 'buyer'; this.library = new Set(); this.wishlist = new Set(); localStorage.removeItem('bookora_auth_token'); localStorage.removeItem('bookora_user_profile'); localStorage.removeItem('bookora_active_mode'); }
  async toggleWishlist(bookId) { if (!this.isAuthenticated || !this.currentUser?.uid) throw new Error('Please login first.'); const { db } = await this.getFirebase(); const uid = this.currentUser.uid; const normalizedId = String(bookId); const wishlistRef = db.collection('wishlists').doc(uid); const snapshot = await wishlistRef.get(); let ids = snapshot.exists && Array.isArray(snapshot.data()?.bookIds) ? snapshot.data().bookIds.map(id => String(id)) : []; let isAdded; if (ids.includes(normalizedId)) { ids = ids.filter(id => id !== normalizedId); this.wishlist.delete(normalizedId); isAdded = false; } else { ids.push(normalizedId); this.wishlist.add(normalizedId); isAdded = true; } await wishlistRef.set({ userId: uid, bookIds: ids, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); this.notify('WISHLIST_UPDATED', { bookId: normalizedId, isAdded }); return isAdded; }
  isInWishlist(bookId) { return this.wishlist.has(String(bookId)); }
  hasPurchased(bookId) { return this.library.has(String(bookId)); }

  normalizeBook(book) {
    if (!book || typeof book !== 'object') return null;
    const b = { ...book };
    b.id = String(b.id ?? b.bookId ?? '');
    b.status = String(b.status ?? '').toLowerCase();
    b.source_type = b.source_type || b.sourceType || 'internal';
    b.category = b.category || 'Other';
    b.title = b.title || 'Untitled eBook';
    b.author = b.author || b.seller_name || b.sellerName || 'Bookora Creator';
    b.description = b.description || '';
    b.slug = b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    b.cover_url = b.cover_url || b.coverUrl || b.cover_image_url || b.coverImageUrl || '';
    b.cover_file_id = b.cover_file_id || b.coverFileId || '';
    b.pdf_file_id = b.pdf_file_id || b.pdfFileId || b.file_id || b.fileId || '';
    b.pdf_url = b.pdf_url || b.pdfUrl || b.file_url || b.fileUrl || b.download_url || b.downloadUrl || '';
    b.sample_pdf_url = b.sample_pdf_url || b.samplePdfUrl || b.preview_pdf_url || b.previewPdfUrl || '';
    b.created_at = b.created_at || b.createdAt || b.updated_at || b.updatedAt || '';
    b.is_new = Boolean(b.is_new ?? b.isNew);
    b.is_trending = Boolean(b.is_trending ?? b.isTrending);
    b.is_bestseller = Boolean(b.is_bestseller ?? b.isBestseller);
    b.price = Number(b.price || 0);
    return b;
  }

  getApprovedBooks() { return (Array.isArray(this.books) ? this.books : []).map(book => this.normalizeBook(book)).filter(Boolean).filter(book => book.status === 'approved'); }
  getTrendingBooks() { const books = this.getApprovedBooks(); const flagged = books.filter(book => book.is_trending); return (flagged.length ? flagged : [...books].sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))).slice(0, 24); }
  getBestSellers() { const books = this.getApprovedBooks(); const flagged = books.filter(book => book.is_bestseller); return (flagged.length ? flagged : [...books].sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))).slice(0, 24); }
  getNewReleases() { const books = this.getApprovedBooks(); const flagged = books.filter(book => book.is_new); return (flagged.length ? flagged : [...books].sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))); }
  getExternalBooks() { return this.getApprovedBooks().filter(book => book.source_type === 'external'); }
  getBookBySlug(slug) { const wanted = decodeURIComponent(String(slug || '')).trim().replace(/^\/+|\/+$/g, '').toLowerCase(); if (!wanted) return null; return this.getApprovedBooks().find(book => { const bookSlug = String(book.slug || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase(); const bookId = String(book.id || '').trim().toLowerCase(); const titleSlug = String(book.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); return bookSlug === wanted || bookId === wanted || titleSlug === wanted; }) || null; }
  getCategoryBySlug(slug) { return this.categories.find(category => category.slug === slug); }
  hasUser() { return !!this.currentUser; }
  getUserId() { return this.currentUser?.bookoraUserId || this.currentUser?.userId || this.currentUser?.id || this.currentUser?.uid || null; }
}

export const state = new BookoraState();
