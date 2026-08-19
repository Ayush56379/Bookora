// Bookora - Firebase/Firestore Global State
// ------------------------------------------------------------

import { initialCategories } from './data/initialCategories.js';
import { initialUsers } from './data/initialUsers.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';

class BookoraState {
  constructor() { this.subscribers = new Set(); this.init(); }

  init() {
    this.token = '';
    this.books = [];
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
        this.activeMode = this.isAdmin ? 'admin' : this.isSeller ? 'seller' : 'buyer';
      } catch (error) {
        console.warn('Cached user could not be restored:', error);
        this.clearLocalSession();
      }
    }
    this.startFirebaseSession();
  }

  async getFirebase() {
    if (!window.firebase) throw new Error('Firebase SDK is not loaded.');
    if (!window.firebase.apps.length) throw new Error('Firebase app has not been initialized yet.');
    return { auth: window.firebase.auth(), db: window.firebase.firestore() };
  }

  async startFirebaseSession() {
    try {
      const { auth } = await this.getFirebase();
      auth.onAuthStateChanged(async firebaseUser => {
        if (!firebaseUser) {
          if (!this.currentUser) { this.isAuthenticated = false; this.isAdmin = false; this.isSeller = false; }
          this.notify('AUTH_STATE_CHANGED', null);
          return;
        }
        try { await this.loadAuthenticatedUser(firebaseUser); }
        catch (error) { console.error('Firebase session sync failed:', error); }
      });
    } catch (error) {
      console.warn('Firebase session waiting:', error.message);
      setTimeout(() => this.startFirebaseSession(), 500);
    }
  }

  async loadAuthenticatedUser(firebaseUser) {
    if (!firebaseUser) return;
    const { db } = await this.getFirebase();
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const snapshot = await userRef.get();
    const profile = snapshot.exists ? (snapshot.data() || {}) : {};
    const email = firebaseUser.email || profile.email || '';
    const isMasterAdmin = String(email).toLowerCase() === MASTER_ADMIN_EMAIL;
    const user = {
      uid: firebaseUser.uid,
      email,
      name: profile.name || firebaseUser.displayName || email.split('@')[0] || 'Bookora User',
      photoURL: profile.photoURL || firebaseUser.photoURL || '',
      role: isMasterAdmin ? 'admin' : (profile.role || 'buyer'),
      status: profile.status || 'active',
      seller_status: profile.seller_status || 'none',
      isMasterAdmin,
      createdAt: profile.createdAt || null,
      updatedAt: profile.updatedAt || null
    };
    this.currentUser = user;
    this.isAuthenticated = true;
    this.isAdmin = isMasterAdmin || user.role === 'admin';
    this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
    this.activeMode = this.isAdmin ? 'admin' : this.isSeller ? 'seller' : 'buyer';
    localStorage.setItem('bookora_user_profile', JSON.stringify(user));
    localStorage.setItem('bookora_active_mode', this.activeMode);
    this.notify('USER_LOGGED_IN', user);
    await this.syncData();
  }

  setUser(user) {
    if (!user) return;
    this.currentUser = user;
    this.isAuthenticated = true;
    this.isAdmin = user.role === 'admin' || String(user.email || '').toLowerCase() === MASTER_ADMIN_EMAIL || user.isMasterAdmin === true;
    this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
    this.activeMode = this.isAdmin ? 'admin' : this.isSeller ? 'seller' : 'buyer';
    localStorage.setItem('bookora_user_profile', JSON.stringify(user));
    localStorage.setItem('bookora_active_mode', this.activeMode);
    this.notify('USER_LOGGED_IN', user);
    this.syncData();
  }

  async syncData() {
    try {
      const { db } = await this.getFirebase();
      const booksSnapshot = await db.collection('books').where('status', '==', 'approved').get();
      this.books = booksSnapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));

      try {
        const categorySnapshot = await db.collection('categories').get();
        if (!categorySnapshot.empty) this.categories = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) { console.warn('Categories sync skipped:', error.message); }

      try {
        const publicSettings = await db.collection('settings').doc('public').get();
        if (publicSettings.exists) this.settings = publicSettings.data() || {};
      } catch (error) { console.warn('Settings sync skipped:', error.message); }

      if (this.isAuthenticated && this.currentUser?.uid) {
        const uid = this.currentUser.uid;
        try {
          const userSnapshot = await db.collection('users').doc(uid).get();
          if (userSnapshot.exists) {
            const user = userSnapshot.data();
            this.currentUser = { uid, ...user };
            this.isAdmin = user.role === 'admin' || user.isMasterAdmin === true || String(user.email || '').toLowerCase() === MASTER_ADMIN_EMAIL;
            this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
            localStorage.setItem('bookora_user_profile', JSON.stringify(this.currentUser));
          }
        } catch (error) { console.warn('User profile sync skipped:', error.message); }

        try {
          const librarySnapshot = await db.collection('library').where('userId', '==', uid).get();
          this.library = new Set(librarySnapshot.docs.map(doc => String(doc.data().bookId || doc.id)));
        } catch (error) { console.warn('Library sync skipped:', error.message); }

        try {
          const wishlistSnapshot = await db.collection('wishlists').doc(uid).get();
          const ids = wishlistSnapshot.exists && Array.isArray(wishlistSnapshot.data()?.bookIds) ? wishlistSnapshot.data().bookIds : [];
          this.wishlist = new Set(ids.map(id => String(id)));
        } catch (error) { console.warn('Wishlist sync skipped:', error.message); }
      }

      if (this.isAdmin) await this.syncAdminData(db);
      this.notify('DATA_SYNCED');
    } catch (error) {
      console.error('Firestore sync error:', error);
      this.notify('DATA_SYNC_ERROR', error);
    }
  }

  async syncAdminData(db) {
    if (!this.isAdmin) return;
    try { const s = await db.collection('users').get(); this.users = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin users sync:', e.message); this.users = []; }
    try { const s = await db.collection('books').get(); this.books = s.docs.map(doc => ({ id: String(doc.id), ...doc.data() })); } catch (e) { console.warn('Admin books sync:', e.message); }
    try { const s = await db.collection('sellers').get(); this.sellers = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin sellers sync:', e.message); this.sellers = []; }
    try { const s = await db.collection('orders').get(); this.orders = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin orders sync:', e.message); this.orders = []; }
    try { const s = await db.collection('wallets').get(); this.wallets = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin wallets sync:', e.message); this.wallets = []; }
    try { const s = await db.collection('reviews').get(); this.reviews = s.docs.map(doc => ({ id: doc.id, ...doc.data() })); } catch (e) { console.warn('Admin reviews sync:', e.message); this.reviews = []; }
  }

  subscribe(callback) { this.subscribers.add(callback); return () => this.subscribers.delete(callback); }

  notify(event, payload = null) {
    this.subscribers.forEach(callback => { try { callback(event, payload, this); } catch (error) { console.error(error); } });
  }

  setActiveMode(mode) {
    if (mode === 'admin' && !this.isAdmin) return;
    if (mode === 'seller' && !this.isSeller) return;
    this.activeMode = mode;
    localStorage.setItem('bookora_active_mode', mode);
    this.notify('MODE_CHANGED', mode);
  }

  async logout() {
    try {
      if (window.firebase?.apps?.length) {
        const auth = window.firebase.auth();
        if (auth.currentUser) await auth.signOut();
      }
    } catch (error) { console.warn('Firebase logout:', error); }
    this.clearLocalSession();
    this.notify('USER_LOGGED_OUT');
  }

  clearLocalSession() {
    this.token = '';
    this.currentUser = null;
    this.isAuthenticated = false;
    this.isAdmin = false;
    this.isSeller = false;
    this.activeMode = 'buyer';
    this.library = new Set();
    this.wishlist = new Set();
    localStorage.removeItem('bookora_auth_token');
    localStorage.removeItem('bookora_user_profile');
    localStorage.removeItem('bookora_active_mode');
  }

  async toggleWishlist(bookId) {
    if (!this.isAuthenticated || !this.currentUser?.uid) throw new Error('Please login first.');
    const { db } = await this.getFirebase();
    const uid = this.currentUser.uid;
    const normalizedId = String(bookId);
    const wishlistRef = db.collection('wishlists').doc(uid);
    const snapshot = await wishlistRef.get();
    let ids = snapshot.exists && Array.isArray(snapshot.data()?.bookIds) ? snapshot.data().bookIds.map(id => String(id)) : [];
    let isAdded;
    if (ids.includes(normalizedId)) {
      ids = ids.filter(id => id !== normalizedId);
      this.wishlist.delete(normalizedId);
      isAdded = false;
    } else {
      ids.push(normalizedId);
      this.wishlist.add(normalizedId);
      isAdded = true;
    }
    await wishlistRef.set({ userId: uid, bookIds: ids, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    this.notify('WISHLIST_UPDATED', { bookId: normalizedId, isAdded });
    return isAdded;
  }

  isInWishlist(bookId) { return this.wishlist.has(String(bookId)); }
  hasPurchased(bookId) { return this.library.has(String(bookId)); }

  // ----------------------------------------------------------
  // PUBLIC BOOK HELPERS — normalized so every approved eBook is visible.
  // ----------------------------------------------------------
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
    b.cover_url = b.cover_url || b.coverUrl || b.cover_image_url || b.coverImageUrl || '';
    b.cover_file_id = b.cover_file_id || b.coverFileId || '';
    b.created_at = b.created_at || b.createdAt || b.updated_at || b.updatedAt || '';
    b.is_new = Boolean(b.is_new ?? b.isNew);
    b.is_trending = Boolean(b.is_trending ?? b.isTrending);
    b.is_bestseller = Boolean(b.is_bestseller ?? b.isBestseller);
    b.price = Number(b.price || 0);
    return b;
  }

  getApprovedBooks() {
    return (Array.isArray(this.books) ? this.books : []).map(book => this.normalizeBook(book)).filter(Boolean).filter(book => book.status === 'approved');
  }

  getTrendingBooks() {
    const books = this.getApprovedBooks();
    const flagged = books.filter(book => book.is_trending);
    return (flagged.length ? flagged : [...books].sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))).slice(0, 24);
  }

  getBestSellers() {
    const books = this.getApprovedBooks();
    const flagged = books.filter(book => book.is_bestseller);
    return (flagged.length ? flagged : [...books].sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0))).slice(0, 24);
  }

  getNewReleases() {
    const books = this.getApprovedBooks();
    const flagged = books.filter(book => book.is_new);
    return (flagged.length ? flagged : [...books].sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0)));
  }

  getExternalBooks() { return this.getApprovedBooks().filter(book => book.source_type === 'external'); }

  getBookBySlug(slug) {
    const wanted = String(slug || '');
    return this.getApprovedBooks().find(book => String(book.slug || '') === wanted || String(book.id) === wanted) || null;
  }

  getCategoryBySlug(slug) { return this.categories.find(category => category.slug === slug); }
}

export const state = new BookoraState();
