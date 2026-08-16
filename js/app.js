// Bookora Core Single Page Application Router & Lifecycle Controller
import { state } from './state.js';
import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { BookoraAI } from './components/BookoraAI.js';
import { Toast } from './components/Toast.js';
import { ReaderModal } from './components/ReaderModal.js';

// Pages
import { renderHomePage, initHomePageEvents } from './pages/HomePage.js';
import { renderExplorePage, initExploreEvents } from './pages/ExplorePage.js';
import { renderCategoryPage } from './pages/CategoryPage.js';
import { renderCategoriesDirectoryPage } from './pages/PublicDiscoveryPages.js';
import { renderSearchPage } from './pages/SearchPage.js';
import { renderBookDetailPage, initBookDetailEvents } from './pages/BookDetailPage.js';
import { renderCuratedCatalogPage } from './pages/PublicDiscoveryPages.js';
import { renderPricingPage, initPricingEvents } from './pages/PricingPage.js';
import { renderStaticPage } from './pages/StaticPages.js';

// Buyer Pages
import { renderDashboardPage, initDashboardEvents } from './pages/DashboardPage.js';
import { renderLibraryPage, initLibraryEvents } from './pages/LibraryPage.js';
import { renderOrdersPage } from './pages/OrdersPage.js';
import { renderWishlistPage } from './pages/WishlistPage.js';
import { renderCheckoutPage, initCheckoutEvents } from './pages/CheckoutPage.js';
import { renderPaymentSuccessPage } from './pages/PaymentSuccessPage.js';
import { renderPaymentFailedPage } from './pages/PaymentFailedPage.js';

// Seller / Creator Pages
import { renderCreatorDashboardPage, initCreatorDashboardEvents } from './pages/CreatorDashboardPage.js';
import { renderPublishInternalPage, initPublishInternalEvents } from './pages/PublishInternalPage.js';
import { renderPublishExternalPage, initPublishExternalEvents } from './pages/PublishExternalPage.js';
import { renderSellerApplyPage, initSellerApplyEvents } from './pages/SellerApplyPage.js';
import { renderSellerSettingsPage, initSellerSettingsEvents } from './pages/SellerSettingsPage.js';

// Admin Pages
import { renderAdminDashboardPage, initAdminDashboardEvents } from './pages/AdminDashboardPage.js';
import { renderAdminSettingsPage, initAdminSettingsEvents } from './pages/AdminSettingsPage.js';
import { renderAdminSecurityPage, initAdminSecurityEvents } from './pages/AdminSecurityPage.js';
import { renderAdminAIDiagnosticsPage, initAdminAIDiagnosticsEvents } from './pages/AdminAIDiagnosticsPage.js';

// Auth Pages
import { renderAuthPage, initAuthEvents } from './pages/AuthPages.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderUserSettingsPage, initUserSettingsEvents } from './pages/UserSettingsPage.js';
import { renderAccountSecurityPage, initAccountSecurityEvents } from './pages/AccountSecurityPage.js';
import { renderNotFoundPage } from './pages/NotFoundPage.js';

class App {
  constructor() {
    this.root = document.getElementById('app') || document.body;
    this.init();
    try {
      BookoraAI.init();
    } catch (aiErr) {
      console.warn('BookoraAI background init notice:', aiErr);
    }
  }

  init() {
    window.addEventListener('hashchange', () => this.route());
    window.addEventListener('load', () => this.route());

    state.subscribe((event) => {
      this.updateHeader();
      if (event === 'USER_LOGGED_IN' || event === 'USER_LOGGED_OUT' || event === 'MODE_CHANGED') {
        this.route();
      }
    });

    document.addEventListener('click', (e) => {
      const wishBtn = e.target.closest('.book-wishlist-btn');
      if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = wishBtn.dataset.id;
        state.toggleWishlist(bookId).then(isAdded => {
          wishBtn.classList.toggle('active', isAdded);
          const iconSvg = wishBtn.querySelector('svg');
          if (iconSvg) iconSvg.setAttribute('fill', isAdded ? '#E11D48' : 'none');
          Toast.show(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist', isAdded ? 'success' : 'info');
        });
        return;
      }

      const previewBtn = e.target.closest('.quick-preview-btn');
      if (previewBtn) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = previewBtn.dataset.id;
        const book = state.books.find(b => b.id === bookId);
        if (book) {
          ReaderModal.open(book, true);
        }
        return;
      }

      const cartRemoveBtn = e.target.closest('.cart-remove-btn');
      if (cartRemoveBtn) {
        e.preventDefault();
        const bookId = cartRemoveBtn.dataset.id;
        state.cart = (state.cart || []).filter(i => i.id !== bookId);
        Toast.show('Item removed from cart.', 'info');
        window.dispatchEvent(new Event('hashchange'));
        return;
      }
    });
  }

  updateHeader() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = renderHeader();
      initHeaderEvents();
    }
  }

  route() {
    window.scrollTo(0, 0);
    if (!this.root || !this.root.innerHTML) {
      this.root = document.getElementById('app') || document.body;
    }

    const hash = window.location.hash || '#/';
    const [pathWithSlash, queryString] = hash.split('?');
    const path = pathWithSlash.replace(/^#/, '') || '/';
    const params = new URLSearchParams(queryString || '');

    // Maintenance Mode Guard
    if (state.settings?.maintenance?.enabled && !state.isAdmin && !path.startsWith('/admin') && path !== '/login') {
      this.root.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #F8FAFC; padding: 2rem; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem;">Bookora Maintenance</h1>
          <p style="font-size: 1rem; color: #475569; max-width: 520px; line-height: 1.6; margin-bottom: 2rem;">
            ${state.settings?.maintenance?.message || 'Bookora is currently undergoing scheduled platform enhancements.'}
          </p>
          <a href="#/login" style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">Admin Sign In →</a>
        </div>
      `;
      return;
    }

    // ================= STRICT PUBLIC VS PROTECTED ROUTE GUARDS =================
    const PUBLIC_ROUTES = [
      '/',
      '/explore',
      '/categories',
      '/best-sellers',
      '/new-releases',
      '/trending',
      '/authors',
      '/pricing',
      '/about',
      '/how-it-works',
      '/faq',
      '/contact',
      '/help',
      '/terms',
      '/privacy',
      '/refund-policy',
      '/seller-guidelines',
      '/login',
      '/signup',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/payment/success',
      '/payment/failed'
    ];

    const PUBLIC_PREFIX_MATCHES = [
      '/category/',
      '/book/',
      '/author/',
      '/search'
    ];

    const isPublic = path === '/' || path === '' || 
      PUBLIC_ROUTES.includes(path) || 
      PUBLIC_PREFIX_MATCHES.some(prefix => path.startsWith(prefix));

    if (!isPublic) {
      if (!state.isAuthenticated) {
        Toast.show('Please sign in to access your ' + (path.replace('/', '') || 'account') + '.', 'info');
        const returnUrl = encodeURIComponent(path + (queryString ? `?${queryString}` : ''));
        window.location.hash = `#/login?returnTo=${returnUrl}`;
        return;
      }

      if (path.startsWith('/admin')) {
        if (!state.isAdmin) {
          Toast.show('Access restricted: Server-verified Admin authorization required.', 'error');
          window.location.hash = '#/login';
          return;
        }
      }

      if ((path.startsWith('/seller') || path.startsWith('/creator') || path === '/publish' || path === '/publish/external') && path !== '/seller/apply') {
        if (!state.isSeller && !state.isAdmin) {
          Toast.show('Author authorization required to access Creator Studio.', 'warning');
          window.location.hash = '#/seller/apply';
          return;
        }
      }
    }

    let pageHtml = '';
    let initCallback = null;

    // ================= ROUTE MAP =================
    if (path === '/' || path === '') {
      pageHtml = renderHomePage();
      initCallback = () => initHomePageEvents();
    } else if (path === '/explore') {
      pageHtml = renderExplorePage();
      initCallback = () => initExploreEvents();
    } else if (path === '/search') {
      const q = params.get('q') || '';
      pageHtml = renderSearchPage(q);
    } else if (path === '/categories') {
      pageHtml = renderCategoriesDirectoryPage();
    } else if (path.startsWith('/category/')) {
      const slug = path.replace('/category/', '');
      pageHtml = renderCategoryPage(slug);
    } else if (path.startsWith('/book/')) {
      const slug = path.replace('/book/', '');
      pageHtml = renderBookDetailPage(slug);
      initCallback = () => initBookDetailEvents(slug);
    } else if (path === '/best-sellers') {
      pageHtml = renderCuratedCatalogPage('bestsellers');
    } else if (path === '/new-releases') {
      pageHtml = renderCuratedCatalogPage('new');
    } else if (path === '/trending') {
      pageHtml = renderCuratedCatalogPage('trending');
    } else if (path === '/pricing' || path === '/subscription') {
      pageHtml = renderPricingPage();
      initCallback = () => initPricingEvents();
    } else if (path === '/about') {
      pageHtml = renderStaticPage('about');
    } else if (path === '/how-it-works') {
      pageHtml = renderStaticPage('how-it-works');
    } else if (path === '/faq') {
      pageHtml = renderStaticPage('faq');
    } else if (path === '/contact') {
      pageHtml = renderStaticPage('contact');
    } else if (path === '/help') {
      pageHtml = renderStaticPage('help');
    } else if (path === '/terms') {
      pageHtml = renderStaticPage('terms');
    } else if (path === '/privacy') {
      pageHtml = renderStaticPage('privacy');
    } else if (path === '/refund-policy') {
      pageHtml = renderStaticPage('refund-policy');
    } else if (path === '/seller-guidelines') {
      pageHtml = renderStaticPage('seller-guidelines');
    }

    // 2. Auth & User Profile
    else if (path === '/login') {
      pageHtml = renderAuthPage('login');
      initCallback = () => initAuthEvents('login');
    } else if (path === '/signup' || path === '/register') {
      pageHtml = renderAuthPage('signup');
      initCallback = () => initAuthEvents('signup');
    } else if (path === '/forgot-password') {
      pageHtml = renderAuthPage('forgot');
      initCallback = () => initAuthEvents('forgot');
    } else if (path === '/reset-password') {
      pageHtml = renderAuthPage('reset');
      initCallback = () => initAuthEvents('reset');
    } else if (path === '/profile') {
      pageHtml = renderProfilePage();
    } else if (path === '/settings' || path === '/settings/account' || path === '/settings/notifications' || path === '/settings/privacy') {
      pageHtml = renderUserSettingsPage();
      initCallback = () => initUserSettingsEvents();
    } else if (path === '/settings/security') {
      pageHtml = renderAccountSecurityPage();
      initCallback = () => initAccountSecurityEvents();
    }

    // 3. Buyer
    else if (path === '/dashboard') {
      pageHtml = renderDashboardPage();
      initCallback = () => initDashboardEvents();
    } else if (path === '/library') {
      pageHtml = renderLibraryPage();
      initCallback = () => initLibraryEvents();
    } else if (path === '/orders') {
      pageHtml = renderOrdersPage();
    } else if (path === '/wishlist') {
      pageHtml = renderWishlistPage();
    } else if (path.startsWith('/checkout/')) {
      const bookSlug = path.replace('/checkout/', '');
      pageHtml = renderCheckoutPage(bookSlug);
      initCallback = () => initCheckoutEvents(bookSlug);
    } else if (path === '/payment/success') {
      pageHtml = renderPaymentSuccessPage();
    } else if (path === '/payment/failed') {
      pageHtml = renderPaymentFailedPage();
    }

    // 4. Seller / Creator Studio
    else if (path === '/seller' || path === '/seller/dashboard' || path === '/creator' || path === '/creator/dashboard') {
      pageHtml = renderCreatorDashboardPage();
      initCallback = () => initCreatorDashboardEvents();
    } else if (path === '/publish') {
      pageHtml = renderPublishInternalPage();
      initCallback = () => initPublishInternalEvents();
    } else if (path === '/publish/external') {
      pageHtml = renderPublishExternalPage();
      initCallback = () => initPublishExternalEvents();
    } else if (path === '/seller/apply') {
      pageHtml = renderSellerApplyPage();
      initCallback = () => initSellerApplyEvents();
    } else if (path === '/seller/settings') {
      pageHtml = renderSellerSettingsPage();
      initCallback = () => initSellerSettingsEvents();
    }

    // 5. Admin Center
    else if (path === '/admin' || path === '/admin/overview') {
      pageHtml = renderAdminDashboardPage();
      initCallback = () => initAdminDashboardEvents();
    } else if (path === '/admin/settings') {
      pageHtml = renderAdminSettingsPage();
      initCallback = () => initAdminSettingsEvents();
    } else if (path === '/admin/security') {
      pageHtml = renderAdminSecurityPage();
      initCallback = () => initAdminSecurityEvents();
    } else if (path === '/admin/ai-diagnostics') {
      pageHtml = renderAdminAIDiagnosticsPage();
      initCallback = () => initAdminAIDiagnosticsEvents();
    }

    // 6. 404 Catch-All
    else {
      pageHtml = renderNotFoundPage();
    }

    // Render Full Page Layout
    this.root.innerHTML = `
      <div id="header-container">${renderHeader()}</div>
      <main id="main-content" style="flex: 1;">${pageHtml}</main>
      <div id="footer-container">${renderFooter()}</div>
    `;

    // Initialize Header & Page Interactive Events
    initHeaderEvents();
    if (typeof initCallback === 'function') {
      try {
        initCallback();
      } catch (err) {
        console.error('Page event initialization error:', err);
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
