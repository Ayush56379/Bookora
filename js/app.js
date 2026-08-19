// Bookora Core Single Page Application Router & Lifecycle Controller
import { state } from './state.js';
import { renderHeader, initHeaderEvents } from './components/Header.js';
import { renderFooter } from './components/Footer.js';
import { BookoraAI } from './components/BookoraAIEnhanced.js';
import { Toast } from './components/Toast.js';
import { ReaderModal } from './components/ReaderModal.js';
import { renderHomePage, initHomePageEvents } from './pages/HomePage.js';
import { renderExplorePage, initExploreEvents } from './pages/ExplorePage.js';
import { renderCategoryPage } from './pages/CategoryPage.js';
import { renderCategoriesDirectoryPage, renderCuratedCatalogPage } from './pages/PublicDiscoveryPages.js';
import { renderSearchPage } from './pages/SearchPage.js';
import { renderBookDetailPage, initBookDetailEvents } from './pages/BookDetailPage.js';
import { renderPricingPage, initPricingEvents } from './pages/PricingPage.js';
import { renderSubscriptionManagePage, initSubscriptionManageEvents } from './pages/SubscriptionManagePage.js';
import { renderStaticPage } from './pages/StaticPages.js';
import { renderDashboardPage, initDashboardEvents } from './pages/DashboardPage.js';
import { renderLibraryPage, initLibraryEvents } from './pages/LibraryPage.js';
import { renderOrdersPage } from './pages/OrdersPage.js';
import { renderWishlistPage } from './pages/WishlistPage.js';
import { renderCheckoutPage, initCheckoutEvents } from './pages/CheckoutPage.js';
import { renderPaymentSuccessPage } from './pages/PaymentSuccessPage.js';
import { renderPaymentFailedPage } from './pages/PaymentFailedPage.js';
import { renderCreatorDashboardPage, initCreatorDashboardEvents } from './pages/CreatorDashboardPage.js';
import { renderPublishInternalPage, initPublishInternalEvents } from './pages/PublishInternalPage.js';
import { renderPublishExternalPage, initPublishExternalEvents } from './pages/PublishExternalPage.js';
import { renderSellerApplyPage, initSellerApplyEvents } from './pages/SellerApplyPage.js';
import { renderSellerSettingsPage, initSellerSettingsEvents } from './pages/SellerSettingsPage.js';
import { renderAdminDashboardPage, initAdminDashboardEvents } from './pages/AdminDashboardPage.js';
import { renderAdminUsersPage, initAdminUsersEvents } from './pages/AdminUsersPage.js';
import { renderAdminSellersPage, initAdminSellersEvents } from './pages/AdminSellersPage.js';
import { renderAdminBooksPage, initAdminBooksEvents } from './pages/AdminBooksBackendPage.js';
import { renderAdminOrdersPage, initAdminOrdersEvents } from './pages/AdminOrdersPage.js';
import { renderAdminPlansPage, initAdminPlansEvents } from './pages/AdminPlansPage.js';
import { renderAdminSettingsPage, initAdminSettingsEvents } from './pages/AdminSettingsPage.js';
import { renderAdminSecurityPage, initAdminSecurityEvents } from './pages/AdminSecurityPage.js';
import { renderAdminAIDiagnosticsPage, initAdminAIDiagnosticsEvents } from './pages/AdminAIDiagnosticsPage.js';
import { renderAuthPage, initAuthEvents } from './pages/AuthPages.js';
import { renderProfilePage } from './pages/ProfilePage.js';
import { renderUserSettingsPage, initUserSettingsEvents } from './pages/UserSettingsPage.js';
import { renderAccountSecurityPage, initAccountSecurityEvents } from './pages/AccountSecurityPage.js';
import { renderNotFoundPage } from './pages/NotFoundPage.js';
import { renderFreeSamplePage, initFreeSamplePage } from './pages/FreeSamplePage.js';

class App {
  constructor() {
    this.root = document.getElementById('app') || document.body;
    this.lastRenderedHash = '';
    this.lastRenderedPath = '';
    this.routeRunning = false;
    this.init();
    try { BookoraAI.init(); } catch (e) { console.warn('BookoraAI init notice:', e); }
  }

  init() {
    window.addEventListener('hashchange', () => this.route(true, true));
    window.addEventListener('load', () => this.route(false, false));

    state.subscribe((event) => {
      const path = this.currentPath();
      if (path.startsWith('/book/')) {
        if (event === 'DATA_SYNCED') window.dispatchEvent(new CustomEvent('bookora:catalog-updated'));
        return;
      }
      this.updateHeader();
      if (event === 'DATA_SYNCED') { this.route(true, false); return; }
      if (['USER_LOGGED_IN', 'USER_LOGGED_OUT', 'MODE_CHANGED'].includes(event)) this.route(true, false);
    });

    document.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const link = target?.closest('a[href^="#/"]');
      if (!link || e.defaultPrevented) return;
      const href = link.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      if (window.location.hash === href) window.dispatchEvent(new Event('hashchange'));
      else window.location.hash = href;
    });

    document.addEventListener('click', async (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const wishBtn = target?.closest('.book-wishlist-btn');
      if (!wishBtn) return;
      e.preventDefault(); e.stopPropagation();
      const bookId = String(wishBtn.dataset.id || '');
      if (!bookId) return;
      if (!state.isAuthenticated) {
        Toast.show('Please sign in to save eBooks to your Wishlist.', 'info');
        window.location.hash = `#/login?returnTo=${encodeURIComponent(window.location.hash || '#/explore')}`;
        return;
      }
      wishBtn.disabled = true;
      try {
        const isAdded = await state.toggleWishlist(bookId);
        wishBtn.classList.toggle('active', isAdded);
        wishBtn.title = isAdded ? 'Remove from Wishlist' : 'Add to Wishlist';
        wishBtn.setAttribute('aria-label', isAdded ? 'Remove from Wishlist' : 'Add to Wishlist');
        const iconSvg = wishBtn.querySelector('svg');
        if (iconSvg) iconSvg.setAttribute('fill', isAdded ? '#E11D48' : 'none');
        Toast.show(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist', isAdded ? 'success' : 'info');
      } catch (err) {
        console.error('Wishlist update failed:', err);
        Toast.show('Wishlist could not be updated. Please try again.', 'error');
      } finally { wishBtn.disabled = false; }
    });

    document.addEventListener('click', (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const previewBtn = target?.closest('.quick-preview-btn');
      if (previewBtn) {
        e.preventDefault(); e.stopPropagation();
        const book = state.getApprovedBooks().find(b => String(b.id) === String(previewBtn.dataset.id));
        if (book) ReaderModal.open(book, true);
        return;
      }
      const cartRemoveBtn = target?.closest('.cart-remove-btn');
      if (cartRemoveBtn) {
        e.preventDefault();
        state.cart = (state.cart || []).filter(i => String(i.id) !== String(cartRemoveBtn.dataset.id));
        Toast.show('Item removed from cart.', 'info');
        window.dispatchEvent(new Event('hashchange'));
      }
    });
  }

  currentPath() {
    const hash = window.location.hash || '#/';
    return (hash.split('?')[0].replace(/^#/, '') || '/');
  }

  updateHeader() {
    const c = document.getElementById('header-container');
    if (c) { c.innerHTML = renderHeader(); initHeaderEvents(); }
  }

  route(force = false, navigation = false) {
    if (this.routeRunning) return;
    const hash = window.location.hash || '#/';
    const path = this.currentPath();
    if (path.startsWith('/book/') && this.lastRenderedHash === hash && document.querySelector('#main-content')) return;
    if (!force && this.lastRenderedHash === hash && document.querySelector('#main-content')) return;

    this.routeRunning = true;
    try {
      const drawer = document.getElementById('mobile-nav-drawer');
      const backdrop = document.getElementById('mobile-drawer-backdrop');
      drawer?.classList.remove('open'); backdrop?.classList.remove('open');
      document.documentElement.classList.remove('bookora-menu-open');
      document.body.classList.remove('bookora-menu-open');
      if (navigation) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      this.root = document.getElementById('app') || document.body;
      const [, queryString] = hash.split('?');
      const params = new URLSearchParams(queryString || '');

      if (state.settings?.maintenance?.enabled && !state.isAdmin && !path.startsWith('/admin') && path !== '/login') {
        this.root.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#F8FAFC;padding:2rem;text-align:center;"><h1 style="font-size:2.2rem;font-weight:800;color:#0F172A;">Bookora Maintenance</h1><p style="font-size:1rem;color:#475569;max-width:520px;line-height:1.6;">${state.settings?.maintenance?.message || 'Bookora is currently undergoing scheduled platform enhancements.'}</p><a href="#/login" style="color:var(--accent);font-weight:600;">Admin Sign In →</a></div>`;
        this.lastRenderedHash = hash; this.lastRenderedPath = path; return;
      }

      const PUBLIC_ROUTES = ['/','/explore','/categories','/best-sellers','/new-releases','/trending','/authors','/pricing','/subscription','/about','/how-it-works','/faq','/contact','/help','/terms','/privacy','/refund-policy','/seller-guidelines','/login','/signup','/register','/forgot-password','/reset-password','/payment/success','/payment/failed'];
      const PUBLIC_PREFIX_MATCHES = ['/category/','/book/','/author/','/search','/sample/'];
      const isPublic = path === '/' || path === '' || PUBLIC_ROUTES.includes(path) || PUBLIC_PREFIX_MATCHES.some(p => path.startsWith(p));

      if (!isPublic) {
        if (!state.isAuthenticated) {
          Toast.show('Please sign in to access your ' + (path.replace('/','') || 'account') + '.', 'info');
          window.location.hash = `#/login?returnTo=${encodeURIComponent(path + (queryString ? `?${queryString}` : ''))}`;
          return;
        }
        if (path.startsWith('/admin') && !state.isAdmin) {
          Toast.show('Access restricted: Admin authorization required.', 'error');
          window.location.hash = '#/login'; return;
        }
        if ((path.startsWith('/seller') || path.startsWith('/creator') || path === '/publish' || path === '/publish/external') && path !== '/seller/apply' && !state.isSeller && !state.isAdmin) {
          Toast.show('Author authorization required to access Creator Studio.', 'warning');
          window.location.hash = '#/seller/apply'; return;
        }
      }

      let pageHtml = ''; let initCallback = null;
      if (path === '/' || path === '') { pageHtml = renderHomePage(); initCallback = () => initHomePageEvents(); }
      else if (path === '/explore') { pageHtml = renderExplorePage(); initCallback = () => initExploreEvents(); }
      else if (path === '/search') pageHtml = renderSearchPage(params.get('q') || '');
      else if (path === '/categories') pageHtml = renderCategoriesDirectoryPage();
      else if (path.startsWith('/category/')) pageHtml = renderCategoryPage(path.replace('/category/',''));
      else if (path.startsWith('/sample/')) {
        const slug = decodeURIComponent(path.replace('/sample/',''));
        const book = state.getBookBySlug(slug);
        pageHtml = book ? renderFreeSamplePage(book) : `<main style="min-height:60vh;display:grid;place-items:center;padding:40px"><div style="text-align:center"><h2>Sample is loading…</h2><p>Please go back to the book and open the sample again.</p><a class="btn btn-primary" href="#/explore">Back to Explore</a></div></main>`;
        if (book) initCallback = () => initFreeSamplePage(book);
      }
      else if (path.startsWith('/book/')) { const slug = path.replace('/book/',''); pageHtml = renderBookDetailPage(slug); initCallback = () => initBookDetailEvents(slug); }
      else if (path === '/best-sellers') pageHtml = renderCuratedCatalogPage('bestsellers');
      else if (path === '/new-releases') pageHtml = renderCuratedCatalogPage('new');
      else if (path === '/trending') pageHtml = renderCuratedCatalogPage('trending');
      else if (path === '/pricing' || path === '/subscription') { pageHtml = renderPricingPage(); initCallback = () => initPricingEvents(); }
      else if (path === '/subscription/manage') { pageHtml = renderSubscriptionManagePage(); initCallback = () => initSubscriptionManageEvents(); }
      else if (['/about','/how-it-works','/faq','/contact','/help','/terms','/privacy','/refund-policy','/seller-guidelines'].includes(path)) pageHtml = renderStaticPage(path.slice(1));
      else if (path === '/login') { pageHtml = renderAuthPage('login'); initCallback = () => initAuthEvents('login'); }
      else if (path === '/signup' || path === '/register') { pageHtml = renderAuthPage('signup'); initCallback = () => initAuthEvents('signup'); }
      else if (path === '/forgot-password') { pageHtml = renderAuthPage('forgot'); initCallback = () => initAuthEvents('forgot'); }
      else if (path === '/reset-password') { pageHtml = renderAuthPage('reset'); initCallback = () => initAuthEvents('reset'); }
      else if (path === '/profile') pageHtml = renderProfilePage();
      else if (['/settings','/settings/account','/settings/notifications','/settings/privacy'].includes(path)) { pageHtml = renderUserSettingsPage(); initCallback = () => initUserSettingsEvents(); }
      else if (path === '/settings/security') { pageHtml = renderAccountSecurityPage(); initCallback = () => initAccountSecurityEvents(); }
      else if (path === '/dashboard') { pageHtml = renderDashboardPage(); initCallback = () => initDashboardEvents(); }
      else if (path === '/library') { pageHtml = renderLibraryPage(); initCallback = () => initLibraryEvents(); }
      else if (path === '/orders') pageHtml = renderOrdersPage();
      else if (path === '/wishlist') pageHtml = renderWishlistPage();
      else if (path.startsWith('/checkout/')) { const slug = path.replace('/checkout/',''); pageHtml = renderCheckoutPage(slug); initCallback = () => initCheckoutEvents(slug); }
      else if (path === '/payment/success') pageHtml = renderPaymentSuccessPage();
      else if (path === '/payment/failed') pageHtml = renderPaymentFailedPage();
      else if (path === '/seller' || path === '/seller/dashboard' || path === '/creator' || path === '/creator/dashboard') { pageHtml = renderCreatorDashboardPage(); initCallback = () => initCreatorDashboardEvents(); }
      else if (path === '/publish') { pageHtml = renderPublishInternalPage(); initCallback = () => initPublishInternalEvents(); }
      else if (path === '/publish/external') { pageHtml = renderPublishExternalPage(); initCallback = () => initPublishExternalEvents(); }
      else if (path === '/seller/apply') { pageHtml = renderSellerApplyPage(); initCallback = () => initSellerApplyEvents(); }
      else if (path === '/seller/settings') { pageHtml = renderSellerSettingsPage(); initCallback = () => initSellerSettingsEvents(); }
      else if (path === '/admin' || path === '/admin/overview') { pageHtml = renderAdminDashboardPage(); initCallback = () => initAdminDashboardEvents(); }
      else if (path === '/admin/users') { pageHtml = renderAdminUsersPage(); initCallback = () => initAdminUsersEvents(); }
      else if (path === '/admin/sellers') { pageHtml = renderAdminSellersPage(); initCallback = () => initAdminSellersEvents(); }
      else if (path === '/admin/books') { pageHtml = renderAdminBooksPage(); initCallback = () => initAdminBooksEvents(); }
      else if (path === '/admin/orders') { pageHtml = renderAdminOrdersPage(); initCallback = () => initAdminOrdersEvents(); }
      else if (path === '/admin/subscriptions' || path === '/admin/plans') { pageHtml = renderAdminPlansPage(); initCallback = () => initAdminPlansEvents(); }
      else if (path === '/admin/settings') { pageHtml = renderAdminSettingsPage(); initCallback = () => initAdminSettingsEvents(); }
      else if (path === '/admin/security') { pageHtml = renderAdminSecurityPage(); initCallback = () => initAdminSecurityEvents(); }
      else if (path === '/admin/ai-diagnostics') { pageHtml = renderAdminAIDiagnosticsPage(); initCallback = () => initAdminAIDiagnosticsEvents(); }
      else pageHtml = renderNotFoundPage();

      this.root.innerHTML = `<div id="header-container">${renderHeader()}</div><main id="main-content" style="flex:1;">${pageHtml}</main><div id="footer-container">${renderFooter()}</div>`;
      initHeaderEvents();
      if (typeof initCallback === 'function') { try { initCallback(); } catch (err) { console.error('Page event initialization error:', err); } }
      this.lastRenderedHash = hash;
      this.lastRenderedPath = path;
    } finally { this.routeRunning = false; }
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new App());
else new App();