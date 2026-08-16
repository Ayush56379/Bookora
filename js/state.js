// Reactive Global State Manager (Robust Persistent State)
import { apiFetch } from './config.js';
import { initialCategories } from './data/initialCategories.js';
import { initialUsers } from './data/initialUsers.js';

class BookoraState {
  constructor() {
    this.subscribers = new Set();
    this.init();
  }

  init() {
    this.token = localStorage.getItem('bookora_auth_token') || '';
    this.books = [];
    this.categories = initialCategories;
    this.users = initialUsers;
    this.orders = [];
    this.reviews = [];
    this.settings = {};

    // Restore cached user session safely
    const cachedUser = localStorage.getItem('bookora_user_profile');
    if (cachedUser && cachedUser !== 'undefined') {
      try {
        this.currentUser = JSON.parse(cachedUser);
        this.isAuthenticated = true;
        this.isAdmin = this.currentUser.role === 'admin' || this.currentUser.email === 'ayushprajpati6@gmail.com';
        this.isSeller = this.isAdmin || this.currentUser.seller_status === 'approved' || this.currentUser.role === 'creator';
      } catch(e) {
        this.currentUser = null;
        this.isAuthenticated = Boolean(this.token);
        this.isAdmin = false;
        this.isSeller = false;
      }
    } else {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.isSeller = false;
    }

    this.activeMode = localStorage.getItem('bookora_active_mode') || (this.isAdmin ? 'admin' : (this.isSeller ? 'seller' : 'buyer'));
    this.library = new Set();
    this.wishlist = new Set();

    this.verifySession();
  }

  setUser(user, token = '') {
    if (!user) return;
    this.currentUser = user;
    this.isAuthenticated = true;
    this.isAdmin = user.role === 'admin' || user.email === 'ayushprajpati6@gmail.com';
    this.isSeller = this.isAdmin || user.seller_status === 'approved' || user.role === 'creator';
    
    if (token) {
      this.token = token;
      localStorage.setItem('bookora_auth_token', token);
    }
    
    localStorage.setItem('bookora_user_profile', JSON.stringify(user));
    this.activeMode = this.isAdmin ? 'admin' : (this.isSeller ? 'seller' : 'buyer');
    localStorage.setItem('bookora_active_mode', this.activeMode);

    this.notify('USER_LOGGED_IN', user);
    this.syncData();
  }

  async verifySession() {
    if (!this.token) {
      this.syncData();
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated && data.user) {
          this.currentUser = data.user;
          this.isAuthenticated = true;
          this.isAdmin = data.is_admin;
          this.isSeller = data.is_seller;
          localStorage.setItem('bookora_user_profile', JSON.stringify(data.user));
          this.notify('SESSION_VERIFIED', data.user);
        }
      }
    } catch (e) {
      console.warn('Background session check notice:', e);
    }

    this.syncData();
  }

  async syncData() {
    try {
      const setRes = await apiFetch('/api/settings/public');
      if (setRes.ok) this.settings = await setRes.json();

      const booksRes = await apiFetch('/api/books');
      if (booksRes.ok) this.books = await booksRes.json();

      const catRes = await apiFetch('/api/categories');
      if (catRes.ok) this.categories = await catRes.json();

      if (this.isAuthenticated && this.token) {
        const libRes = await apiFetch(`/api/library`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (libRes.ok) {
          const libBooks = await libRes.json();
          this.library = new Set(libBooks.map(b => b.id));
        }

        const wishRes = await apiFetch(`/api/wishlist`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (wishRes.ok) {
          const wishIds = await wishRes.json();
          this.wishlist = new Set(wishIds);
        }
      }

      this.notify('DATA_SYNCED');
    } catch (e) {
      console.warn('Backend sync notice:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event, payload = null) {
    this.subscribers.forEach(cb => {
      try { cb(event, payload, this); } catch (err) { console.error(err); }
    });
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
      if (this.token) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      }
    } catch (e) {}

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

    this.notify('USER_LOGGED_OUT');
  }

  async toggleWishlist(bookId) {
    let isAdded = false;
    if (this.wishlist.has(bookId)) {
      this.wishlist.delete(bookId);
      isAdded = false;
    } else {
      this.wishlist.add(bookId);
      isAdded = true;
    }

    try {
      await apiFetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ book_id: bookId })
      });
    } catch (e) {}

    this.notify('WISHLIST_UPDATED', { bookId, isAdded });
    return isAdded;
  }

  isInWishlist(bookId) {
    return this.wishlist.has(bookId);
  }

  hasPurchased(bookId) {
    return this.library.has(bookId);
  }

  getApprovedBooks() {
    return this.books.filter(b => b.status === 'approved');
  }

  getTrendingBooks() {
    return this.getApprovedBooks().filter(b => b.is_trending);
  }

  getBestSellers() {
    return this.getApprovedBooks().filter(b => b.is_bestseller);
  }

  getNewReleases() {
    return this.getApprovedBooks().filter(b => b.is_new);
  }

  getExternalBooks() {
    return this.getApprovedBooks().filter(b => b.source_type === 'external');
  }

  getBookBySlug(slug) {
    return this.books.find(b => b.slug === slug || b.id === slug);
  }

  getCategoryBySlug(slug) {
    return this.categories.find(c => c.slug === slug);
  }
}

export const state = new BookoraState();
