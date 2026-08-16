// Bookora Application Orchestrator & Router (Complete Production Suite)
import { state } from './state.js';
import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { ReaderModal } from './components/ReaderModal.js';
import { Toast } from './components/Toast.js';
import { BookoraAI } from './components/BookoraAI.js';

// Public Pages
import { renderHomePage, initHomePageEvents } from './pages/HomePage.js';
import { renderExplorePage, initExploreEvents } from './pages/ExplorePage.js';
import { renderCategoryPage } from './pages/CategoryPage.js';
import { renderSearchPage } from './pages/SearchPage.js';
import { renderBookDetailPage, initBookDetailEvents } from './pages/BookDetailPage.js';
import { renderPricingPage, renderSubscriptionManagePage, initPricingEvents } from './pages/PricingPage.js';
import { renderCategoriesDirectoryPage, renderCuratedCatalogPage, renderAuthorsDirectoryPage } from './pages/PublicDiscoveryPages.js';
import { renderStaticPage } from './pages/StaticPages.js';

// Buyer Pages
import { renderCartPage, renderOrderDetailPage } from './pages/BuyerPages.js';
import { renderLibraryPage, initLibraryEvents } from './pages/LibraryPage.js';
import { renderOrdersPage } from './pages/OrdersPage.js';
import { renderWishlistPage } from './pages/WishlistPage.js';
import { renderCheckoutPage, initCheckoutEvents } from './pages/CheckoutPage.js';
import { renderPaymentSuccessPage, initPaymentSuccessEvents } from './pages/PaymentSuccessPage.js';
import { renderPaymentFailedPage } from './pages/PaymentFailedPage.js';
import { renderDashboardPage, initDashboardEvents } from './pages/DashboardPage.js';

// Seller Pages
import { renderCreatorDashboardPage, initCreatorDashboardEvents } from './pages/CreatorDashboardPage.js';
import { renderPublishInternalPage, initPublishInternalEvents } from './pages/PublishInternalPage.js';
import { renderPublishExternalPage, initPublishExternalEvents } from './pages/PublishExternalPage.js';
import { renderSellerSettingsPage, initSellerSettingsEvents } from './pages/SellerSettingsPage.js';
import { renderSellerApplyPage, initSellerApplyEvents } from './pages/SellerApplyPage.js';
import { renderSellerWalletPage, initSellerWalletEvents } from './pages/SellerPages.js';

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

    state.subscribe(() => {
      this.updateHeader();
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
      // 1. Authentication Check for Protected Routes
      if (!state.isAuthenticated) {
        Toast.show('Please sign in to access your ' + (path.replace('/', '') || 'account') + '.', 'info');
        const returnUrl = encodeURIComponent(path + (queryString ? `?${queryString}` : ''));
        window.location.hash = `#/login?returnTo=${returnUrl}`;
        return;
      }

      // 2. Admin Role Guard
      if (path.startsWith('/admin')) {
        if (!state.isAdmin) {
          Toast.show('Access restricted: Server-verified Admin authorization required.', 'error');
          window.location.hash = '#/login';
          return;
        }
      }

      // 3. Seller Role Guard (except seller application)
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
    // 1. Public Discovery
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
      pageHtml = renderCuratedCatalogPage('newreleases');
    } else if (path === '/trending') {
      pageHtml = renderCuratedCatalogPage('trending');
    } else if (path === '/authors') {
      pageHtml = renderAuthorsDirectoryPage();
    } else if (path.startsWith('/author/')) {
      const authorSlug = path.replace('/author/', '');
      pageHtml = renderSearchPage(authorSlug.replace(/-/g, ' '));
    } else if (path === '/pricing') {
      pageHtml = renderPricingPage();
      initCallback = () => initPricingEvents();
    } else if (['/about', '/how-it-works', '/faq', '/contact', '/help', '/terms', '/privacy', '/refund-policy', '/seller-guidelines'].includes(path)) {
      const staticName = path.replace('/', '').replace('-policy', '').replace('-guidelines', '');
      pageHtml = renderStaticPage(staticName);
    }

    // 2. Auth & Settings
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
    } else if (path === '/library' || path === '/reading') {
      pageHtml = renderLibraryPage();
      initCallback = () => initLibraryEvents();
    } else if (path === '/orders') {
      pageHtml = renderOrdersPage();
    } else if (path.startsWith('/order/')) {
      const orderId = path.replace('/order/', '');
      pageHtml = renderOrderDetailPage(orderId);
    } else if (path === '/wishlist') {
      pageHtml = renderWishlistPage();
    } else if (path === '/cart') {
      pageHtml = renderCartPage();
    } else if (path === '/subscription' || path === '/subscription/manage') {
      pageHtml = renderSubscriptionManagePage();
      initCallback = () => initPricingEvents();
    } else if (path.startsWith('/checkout')) {
      const slug = path.replace('/checkout/', '').replace('/checkout', '') || (state.books[0] ? state.books[0].slug : 'checkout');
      pageHtml = renderCheckoutPage(slug);
      initCallback = () => initCheckoutEvents(slug);
    } else if (path === '/payment/success') {
      pageHtml = renderPaymentSuccessPage();
      initCallback = () => initPaymentSuccessEvents();
    } else if (path === '/payment/failed' || path === '/payment/pending') {
      pageHtml = renderPaymentFailedPage();
    }

    // 4. Seller
    else if (path === '/seller' || path === '/seller/dashboard' || path === '/creator' || path === '/creator/dashboard' || path === '/seller/books' || path === '/seller/orders' || path === '/seller/analytics') {
      pageHtml = renderCreatorDashboardPage();
      initCallback = () => initCreatorDashboardEvents();
    } else if (path === '/seller/books/new' || path === '/publish') {
      pageHtml = renderPublishInternalPage();
      initCallback = () => initPublishInternalEvents();
    } else if (path === '/seller/external' || path === '/publish/external') {
      pageHtml = renderPublishExternalPage();
      initCallback = () => initPublishExternalEvents();
    } else if (path === '/seller/wallet' || path === '/seller/earnings') {
      pageHtml = renderSellerWalletPage();
      initCallback = () => initSellerWalletEvents();
    } else if (path === '/seller/settings' || path === '/creator/settings') {
      pageHtml = renderSellerSettingsPage();
      initCallback = () => initSellerSettingsEvents();
    } else if (path === '/seller/apply') {
      pageHtml = renderSellerApplyPage();
      initCallback = () => initSellerApplyEvents();
    }

    // 5. Admin
    else if (path === '/admin/settings') {
      pageHtml = renderAdminSettingsPage();
      initCallback = () => initAdminSettingsEvents();
    } else if (path === '/admin/ai-diagnostics') {
      pageHtml = renderAdminAIDiagnosticsPage();
      initCallback = () => initAdminAIDiagnosticsEvents();
    }
    else if (path === '/admin/security' || path === '/admin/logs') {
      pageHtml = renderAdminSecurityPage();
      initCallback = () => initAdminSecurityEvents();
    } else if (path.startsWith('/admin')) {
      const tab = path.replace('/admin/', '').replace('/admin', '') || 'overview';
      pageHtml = renderAdminDashboardPage(tab);
      initCallback = () => initAdminDashboardEvents();
    }

    // 6. 404 Fallback
    else {
      pageHtml = renderNotFoundPage();
    }

    this.root.innerHTML = `
      <div id="header-container">${renderHeader()}</div>
      <main id="main-content" style="flex: 1;">${pageHtml}</main>
      <div id="footer-container">${renderFooter()}</div>
    `;

    initHeaderEvents();
    if (initCallback) {
      setTimeout(() => initCallback(), 10);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
