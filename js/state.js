import { apiFetch } from './config.js';
// Reactive Global State Manager (Real Data & Server-Verified Authorization)
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

    // Auth State
    this.isAuthenticated = Boolean(this.token);
    this.isAdmin = false;
    this.isSeller = false;
    this.sellerStatus = 'none';
    this.activeMode = localStorage.getItem('bookora_active_mode') || 'buyer'; // 'buyer', 'seller', 'admin'

    // Default Current User
    this.currentUser = null;
    this.library = new Set();
    this.wishlist = new Set();
    this.readingProgress = {};

    // Verify session with backend
    this.verifySession();
  }

  async verifySession() {
    if (!this.token) {
      // Default to guest / first account
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.isSeller = false;
      this.activeMode = 'buyer';
      this.syncData();
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.isAuthenticated = data.authenticated;
        this.currentUser = data.user;
        this.isAdmin = data.is_admin;
        this.isSeller = data.is_seller;
        this.sellerStatus = data.seller_status;
        
        // Ensure activeMode is valid for current permissions
        if (this.activeMode === 'admin' && !this.isAdmin) {
          this.activeMode = 'buyer';
        } else if (this.activeMode === 'seller' && !this.isSeller) {
          this.activeMode = 'buyer';
        }
      } else {
        this.logout();
      }
    } catch (e) {
      console.warn('Session verification fallback:', e);
    }

    this.syncData();
  }

  async syncData() {
    try {
      // 1. Fetch public settings
      const setRes = await apiFetch('/api/settings/public');
      if (setRes.ok) this.settings = await setRes.json();

      // 2. Fetch approved books
      const booksRes = await apiFetch('/api/books');
      if (booksRes.ok) this.books = await booksRes.json();

      // 3. Fetch categories
      const catRes = await apiFetch('/api/categories');
      if (catRes.ok) this.categories = await catRes.json();

      // 4. Fetch user library if authenticated
      if (this.isAuthenticated) {
        const libRes = await apiFetch(`/api/library`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (libRes.ok) {
          const libBooks = await libRes.json();
          this.library = new Set(libBooks.map(b => b.id));
        }

        // 5. Fetch wishlist
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
      console.warn('Backend sync fallback:', e);
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

  async login(email, password) {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        this.currentUser = data.user;
        this.isAuthenticated = true;
        this.isAdmin = data.is_admin;
        this.isSeller = data.is_seller;
        this.sellerStatus = data.seller_status;

        // Auto-switch mode
        if (this.isAdmin) {
          this.setActiveMode('admin');
        } else if (this.isSeller) {
          this.setActiveMode('seller');
        } else {
          this.setActiveMode('buyer');
        }

        await this.syncData();
        return { success: true, user: data.user, is_admin: data.is_admin };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  }

  async register(name, email, roleChoice, bio = '') {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role: roleChoice, bio })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        this.currentUser = data.user;
        this.isAuthenticated = true;
        this.isAdmin = data.is_admin;
        this.isSeller = data.is_seller;
        this.sellerStatus = data.seller_status;
        this.setActiveMode(this.isAdmin ? 'admin' : 'buyer');
        await this.syncData();
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
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
    localStorage.removeItem('bookora_auth_token');
    localStorage.removeItem('bookora_active_mode');
    this.isAuthenticated = false;
    this.isAdmin = false;
    this.isSeller = false;
    this.activeMode = 'buyer';
    this.library = new Set();
    this.wishlist = new Set();
    this.currentUser = null;
    this.notify('USER_LOGGED_OUT');
  }

  async saveAdminSettings(updatedSettings) {
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ settings: updatedSettings })
      });
      const data = await res.json();
      if (res.ok) {
        this.settings = updatedSettings;
        this.notify('SETTINGS_UPDATED', this.settings);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to save settings.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
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
