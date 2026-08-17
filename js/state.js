// Bookora - Firebase/Firestore Global State
// ------------------------------------------------------------

import { initialCategories } from './data/initialCategories.js';
import { initialUsers } from './data/initialUsers.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';

class BookoraState {

  constructor() {
    this.subscribers = new Set();
    this.init();
  }

  // ----------------------------------------------------------
  // INITIAL STATE
  // ----------------------------------------------------------

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

    // Restore cached profile only for fast UI startup.
    const cachedUser =
      localStorage.getItem('bookora_user_profile');

    if (cachedUser && cachedUser !== 'undefined') {

      try {

        const user = JSON.parse(cachedUser);

        this.currentUser = user;
        this.isAuthenticated = true;

        this.isAdmin =
          user.role === 'admin' ||
          String(user.email || '').toLowerCase() ===
            MASTER_ADMIN_EMAIL;

        this.isSeller =
          this.isAdmin ||
          user.seller_status === 'approved' ||
          user.role === 'creator' ||
          user.role === 'seller';

        this.activeMode =
          this.isAdmin
            ? 'admin'
            : this.isSeller
              ? 'seller'
              : 'buyer';

      } catch (error) {

        console.warn(
          'Cached user could not be restored:',
          error
        );

        this.clearLocalSession();

      }
    }

    // Firebase Auth will perform the real authentication.
    // We intentionally do not use the old Apps Script session.
    this.startFirebaseSession();
  }


  // ----------------------------------------------------------
  // FIREBASE HELPERS
  // ----------------------------------------------------------

  async getFirebase() {

    if (!window.firebase) {
      throw new Error(
        'Firebase SDK is not loaded.'
      );
    }

    // firebase.js initializes the app.
    if (!window.firebase.apps.length) {

      throw new Error(
        'Firebase app has not been initialized yet.'
      );
    }

    const auth =
      window.firebase.auth();

    const db =
      window.firebase.firestore();

    return {
      auth,
      db
    };
  }


  // ----------------------------------------------------------
  // FIREBASE AUTH SESSION
  // ----------------------------------------------------------

  async startFirebaseSession() {

    try {

      const { auth } =
        await this.getFirebase();

      auth.onAuthStateChanged(
        async firebaseUser => {

          if (!firebaseUser) {

            // Do not immediately destroy cached state
            // while the page is loading.
            if (!this.currentUser) {
              this.isAuthenticated = false;
              this.isAdmin = false;
              this.isSeller = false;
            }

            this.notify(
              'AUTH_STATE_CHANGED',
              null
            );

            return;
          }

          try {

            await this.loadAuthenticatedUser(
              firebaseUser
            );

          } catch (error) {

            console.error(
              'Firebase session sync failed:',
              error
            );

          }

        }
      );

    } catch (error) {

      // firebase.js may still be loading.
      // Retry shortly.
      console.warn(
        'Firebase session waiting:',
        error.message
      );

      setTimeout(
        () => this.startFirebaseSession(),
        500
      );
    }
  }


  // ----------------------------------------------------------
  // LOAD USER + FIRESTORE PROFILE
  // ----------------------------------------------------------

  async loadAuthenticatedUser(firebaseUser) {

    if (!firebaseUser) {
      return;
    }

    const { db } =
      await this.getFirebase();

    const userRef =
      db
        .collection('users')
        .doc(firebaseUser.uid);

    const snapshot =
      await userRef.get();

    let profile = {};

    if (snapshot.exists) {
      profile = snapshot.data() || {};
    }

    const email =
      firebaseUser.email || profile.email || '';

    const isMasterAdmin =
      String(email).toLowerCase() ===
      MASTER_ADMIN_EMAIL;

    const user = {

      uid: firebaseUser.uid,

      email,

      name:
        profile.name ||
        firebaseUser.displayName ||
        email.split('@')[0] ||
        'Bookora User',

      photoURL:
        profile.photoURL ||
        firebaseUser.photoURL ||
        '',

      role:
        isMasterAdmin
          ? 'admin'
          : (profile.role || 'buyer'),

      status:
        profile.status || 'active',

      seller_status:
        profile.seller_status || 'none',

      isMasterAdmin,

      createdAt:
        profile.createdAt || null,

      updatedAt:
        profile.updatedAt || null
    };

    this.currentUser = user;
    this.isAuthenticated = true;

    this.isAdmin =
      isMasterAdmin ||
      user.role === 'admin';

    this.isSeller =
      this.isAdmin ||
      user.seller_status === 'approved' ||
      user.role === 'creator' ||
      user.role === 'seller';

    this.activeMode =
      this.isAdmin
        ? 'admin'
        : this.isSeller
          ? 'seller'
          : 'buyer';

    localStorage.setItem(
      'bookora_user_profile',
      JSON.stringify(user)
    );

    localStorage.setItem(
      'bookora_active_mode',
      this.activeMode
    );

    this.notify(
      'USER_LOGGED_IN',
      user
    );

    await this.syncData();
  }


  // ----------------------------------------------------------
  // SET USER
  // ----------------------------------------------------------

  setUser(user) {

    if (!user) {
      return;
    }

    this.currentUser = user;
    this.isAuthenticated = true;

    this.isAdmin =
      user.role === 'admin' ||
      String(user.email || '').toLowerCase() ===
        MASTER_ADMIN_EMAIL ||
      user.isMasterAdmin === true;

    this.isSeller =
      this.isAdmin ||
      user.seller_status === 'approved' ||
      user.role === 'creator' ||
      user.role === 'seller';

    this.activeMode =
      this.isAdmin
        ? 'admin'
        : this.isSeller
          ? 'seller'
          : 'buyer';

    localStorage.setItem(
      'bookora_user_profile',
      JSON.stringify(user)
    );

    localStorage.setItem(
      'bookora_active_mode',
      this.activeMode
    );

    this.notify(
      'USER_LOGGED_IN',
      user
    );

    // Firebase listener will perform the actual sync.
    this.syncData();
  }


  // ----------------------------------------------------------
  // FIRESTORE DATA SYNC
  // ----------------------------------------------------------

  async syncData() {

    try {

      const { db } =
        await this.getFirebase();

      // ------------------------------------------------------
      // PUBLIC BOOKS
      // ------------------------------------------------------

      const booksSnapshot =
        await db
          .collection('books')
          .where('status', '==', 'approved')
          .get();

      this.books =
        booksSnapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );


      // ------------------------------------------------------
      // CATEGORIES
      // ------------------------------------------------------

      try {

        const categorySnapshot =
          await db
            .collection('categories')
            .get();

        if (!categorySnapshot.empty) {

          this.categories =
            categorySnapshot.docs.map(
              doc => ({
                id: doc.id,
                ...doc.data()
              })
            );
        }

      } catch (error) {

        console.warn(
          'Categories sync skipped:',
          error.message
        );
      }


      // ------------------------------------------------------
      // PUBLIC SETTINGS
      // ------------------------------------------------------

      try {

        const publicSettings =
          await db
            .collection('settings')
            .doc('public')
            .get();

        if (publicSettings.exists) {

          this.settings =
            publicSettings.data() || {};
        }

      } catch (error) {

        console.warn(
          'Settings sync skipped:',
          error.message
        );
      }


      // ------------------------------------------------------
      // AUTHENTICATED USER DATA
      // ------------------------------------------------------

      if (
        this.isAuthenticated &&
        this.currentUser?.uid
      ) {

        const uid =
          this.currentUser.uid;


        // ----------------------------------------------------
        // USER PROFILE
        // ----------------------------------------------------

        try {

          const userSnapshot =
            await db
              .collection('users')
              .doc(uid)
              .get();

          if (userSnapshot.exists) {

            const user =
              userSnapshot.data();

            this.currentUser = {
              uid,
              ...user
            };

            this.isAdmin =
              user.role === 'admin' ||
              user.isMasterAdmin === true ||
              String(user.email || '').toLowerCase() ===
                MASTER_ADMIN_EMAIL;

            this.isSeller =
              this.isAdmin ||
              user.seller_status === 'approved' ||
              user.role === 'creator' ||
              user.role === 'seller';

            localStorage.setItem(
              'bookora_user_profile',
              JSON.stringify(this.currentUser)
            );
          }

        } catch (error) {

          console.warn(
            'User profile sync skipped:',
            error.message
          );
        }


        // ----------------------------------------------------
        // LIBRARY
        // ----------------------------------------------------

        try {

          const librarySnapshot =
            await db
              .collection('library')
              .where('userId', '==', uid)
              .get();

          this.library =
            new Set(
              librarySnapshot.docs.map(
                doc =>
                  doc.data().bookId ||
                  doc.id
              )
            );

        } catch (error) {

          console.warn(
            'Library sync skipped:',
            error.message
          );
        }


        // ----------------------------------------------------
        // WISHLIST
        // ----------------------------------------------------

        try {

          const wishlistSnapshot =
            await db
              .collection('wishlists')
              .doc(uid)
              .get();

          if (
            wishlistSnapshot.exists
          ) {

            const data =
              wishlistSnapshot.data() || {};

            const ids =
              Array.isArray(data.bookIds)
                ? data.bookIds
                : [];

            this.wishlist =
              new Set(ids);
          }

        } catch (error) {

          console.warn(
            'Wishlist sync skipped:',
            error.message
          );
        }
      }


      // ------------------------------------------------------
      // ADMIN DATA
      // ------------------------------------------------------

      if (this.isAdmin) {

        await this.syncAdminData(db);
      }


      this.notify(
        'DATA_SYNCED'
      );

    } catch (error) {

      console.error(
        'Firestore sync error:',
        error
      );

      this.notify(
        'DATA_SYNC_ERROR',
        error
      );
    }
  }


  // ----------------------------------------------------------
  // ADMIN DATA
  // ----------------------------------------------------------

  async syncAdminData(db) {

    if (!this.isAdmin) {
      return;
    }

    // Users
    try {

      const snapshot =
        await db
          .collection('users')
          .get();

      this.users =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    } catch (error) {

      console.warn(
        'Admin users sync:',
        error.message
      );

      this.users = [];
    }


    // Books - admin can read pending/rejected too
    try {

      const snapshot =
        await db
          .collection('books')
          .get();

      this.books =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    } catch (error) {

      console.warn(
        'Admin books sync:',
        error.message
      );
    }


    // Sellers
    try {

      const snapshot =
        await db
          .collection('sellers')
          .get();

      this.sellers =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    } catch (error) {

      console.warn(
        'Admin sellers sync:',
        error.message
      );

      this.sellers = [];
    }


    // Orders
    try {

      const snapshot =
        await db
          .collection('orders')
          .get();

      this.orders =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    } catch (error) {

      console.warn(
        'Admin orders sync:',
        error.message
      );

      this.orders = [];
    }


    // Wallets
    try {

      const snapshot =
        await db
          .collection('wallets')
          .get();

      this.wallets =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    } catch (error) {

      console.warn(
        'Admin wallets sync:',
        error.message
      );

      this.wallets = [];
    }


    // Reviews
    try {

      const snapshot =
        await db
          .collection('reviews')
          .get();

      this.reviews =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    } catch (error) {

      console.warn(
        'Admin reviews sync:',
        error.message
      );

      this.reviews = [];
    }
  }


  // ----------------------------------------------------------
  // SUBSCRIBERS
  // ----------------------------------------------------------

  subscribe(callback) {

    this.subscribers.add(callback);

    return () =>
      this.subscribers.delete(callback);
  }


  notify(
    event,
    payload = null
  ) {

    this.subscribers.forEach(
      callback => {

        try {

          callback(
            event,
            payload,
            this
          );

        } catch (error) {

          console.error(
            error
          );
        }
      }
    );
  }


  // ----------------------------------------------------------
  // ACTIVE MODE
  // ----------------------------------------------------------

  setActiveMode(mode) {

    if (
      mode === 'admin' &&
      !this.isAdmin
    ) {
      return;
    }

    if (
      mode === 'seller' &&
      !this.isSeller
    ) {
      return;
    }

    this.activeMode =
      mode;

    localStorage.setItem(
      'bookora_active_mode',
      mode
    );

    this.notify(
      'MODE_CHANGED',
      mode
    );
  }


  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  async logout() {

    try {

      if (window.firebase?.apps?.length) {

        const auth =
          window.firebase.auth();

        // Only sign out if currently signed in.
        if (auth.currentUser) {
          await auth.signOut();
        }
      }

    } catch (error) {

      console.warn(
        'Firebase logout:',
        error
      );
    }

    this.clearLocalSession();

    this.notify(
      'USER_LOGGED_OUT'
    );
  }


  // ----------------------------------------------------------
  // CLEAR LOCAL SESSION
  // ----------------------------------------------------------

  clearLocalSession() {

    this.token = '';

    this.currentUser = null;

    this.isAuthenticated = false;

    this.isAdmin = false;

    this.isSeller = false;

    this.activeMode = 'buyer';

    this.library = new Set();

    this.wishlist = new Set();

    localStorage.removeItem(
      'bookora_auth_token'
    );

    localStorage.removeItem(
      'bookora_user_profile'
    );

    localStorage.removeItem(
      'bookora_active_mode'
    );
  }


  // ----------------------------------------------------------
  // WISHLIST
  // ----------------------------------------------------------

  async toggleWishlist(bookId) {

    if (
      !this.isAuthenticated ||
      !this.currentUser?.uid
    ) {

      throw new Error(
        'Please login first.'
      );
    }

    const { db } =
      await this.getFirebase();

    const uid =
      this.currentUser.uid;

    const wishlistRef =
      db
        .collection('wishlists')
        .doc(uid);

    const snapshot =
      await wishlistRef.get();

    let ids = [];

    if (snapshot.exists) {

      ids =
        Array.isArray(
          snapshot.data().bookIds
        )
          ? [...snapshot.data().bookIds]
          : [];
    }

    let isAdded;

    if (ids.includes(bookId)) {

      ids =
        ids.filter(
          id => id !== bookId
        );

      this.wishlist.delete(
        bookId
      );

      isAdded = false;

    } else {

      ids.push(bookId);

      this.wishlist.add(
        bookId
      );

      isAdded = true;
    }

    await wishlistRef.set(
      {
        userId: uid,
        bookIds: ids,
        updatedAt:
          window.firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        merge: true
      }
    );

    this.notify(
      'WISHLIST_UPDATED',
      {
        bookId,
        isAdded
      }
    );

    return isAdded;
  }


  isInWishlist(bookId) {

    return this.wishlist.has(
      bookId
    );
  }


  hasPurchased(bookId) {

    return this.library.has(
      bookId
    );
  }


  // ----------------------------------------------------------
  // BOOK HELPERS
  // ----------------------------------------------------------

  getApprovedBooks() {

    return this.books.filter(
      book =>
        book.status === 'approved'
    );
  }


  getTrendingBooks() {

    return this.getApprovedBooks()
      .filter(
        book => book.is_trending
      );
  }


  getBestSellers() {

    return this.getApprovedBooks()
      .filter(
        book => book.is_bestseller
      );
  }


  getNewReleases() {

    return this.getApprovedBooks()
      .filter(
        book => book.is_new
      );
  }


  getExternalBooks() {

    return this.getApprovedBooks()
      .filter(
        book =>
          book.source_type === 'external'
      );
  }


  getBookBySlug(slug) {

    return this.books.find(
      book =>
        book.slug === slug ||
        book.id === slug
    );
  }


  getCategoryBySlug(slug) {

    return this.categories.find(
      category =>
        category.slug === slug
    );
  }
}


// ------------------------------------------------------------
// EXPORT SINGLE STATE INSTANCE
// ------------------------------------------------------------

export const state =
  new BookoraState();
