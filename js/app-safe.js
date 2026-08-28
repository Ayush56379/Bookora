// Bookora Safe SPA Boot Router
import { state } from './state.js';

const safeImport = async (path) => {
  try { return await import(path); }
  catch (error) { console.error('[Bookora route module failed]', path, error); throw error; }
};

const fallbackShell = () => `
  <header style="position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid #e2e8f0">
    <div style="max-width:1240px;height:72px;margin:auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between">
      <a href="#/" style="font:800 24px Inter,system-ui,sans-serif;color:#0f172a">Bookora</a>
      <nav style="display:flex;gap:14px;font:600 14px Inter,system-ui,sans-serif">
        <a href="#/explore" style="color:#475569">Explore</a><a href="#/pricing" style="color:#475569">Pricing</a><a href="#/login" style="color:#475569">Login</a>
      </nav>
    </div>
  </header>`;

class SafeApp {
  constructor() {
    this.root = document.getElementById('app') || document.body;
    this.routeRunning = false;
    this.pendingRoute = null;
    this.lastHash = '';
    this.booted = false;
    window.__BOOKORA_APP_INSTANCE__ = this;
    this.init();
  }

  currentPath() {
    const hash = window.location.hash || '#/';
    return hash.split('?')[0].replace(/^#/, '') || '/';
  }

  async shell() {
    let header = '', footer = '';
    try {
      const h = await safeImport('./components/Header.js');
      header = `<div id="header-container">${typeof h.renderHeader === 'function' ? h.renderHeader() : ''}</div>`;
    } catch (_) { header = fallbackShell(); }
    try {
      const f = await safeImport('./components/Footer.js');
      footer = `<div id="footer-container">${typeof f.renderFooter === 'function' ? f.renderFooter() : ''}</div>`;
    } catch (_) {}
    return { header, footer };
  }

  async loadPage(path, params) {
    if (path === '/' || path === '') { const m = await safeImport('./pages/HomePage.js'); return { html:m.renderHomePage(), init:m.initHomePageEvents }; }
    if (path === '/explore') { const m = await safeImport('./pages/ExplorePage.js?v=20260827-v2'); return { html:m.renderExplorePage(), init:m.initExploreEvents }; }
    if (path === '/search') { const m = await safeImport('./pages/SearchPage.js'); return { html:m.renderSearchPage(params.get('q') || '') }; }
    if (path === '/categories') { const m = await safeImport('./pages/PublicDiscoveryPages.js'); return { html:m.renderCategoriesDirectoryPage() }; }
    if (path.startsWith('/category/')) { const m = await safeImport('./pages/CategoryPage.js'); return { html:m.renderCategoryPage(path.replace('/category/','')) }; }
    if (path.startsWith('/book/')) { const m = await safeImport('./pages/BookDetailPage.js'); const slug=path.replace('/book/',''); return { html:m.renderBookDetailPage(slug), init:()=>m.initBookDetailEvents(slug) }; }
    if (path.startsWith('/sample/')) { const m=await safeImport('./pages/FreeSamplePage.js'); const slug=decodeURIComponent(path.replace('/sample/','')); const book=state.getBookBySlug(slug); if(!book)return{html:`<main class="container" style="padding:80px 20px;text-align:center"><h2>Sample is loading…</h2><p>Please return to the book and open the sample again.</p><a href="#/explore" class="btn btn-primary">Back to Explore</a></main>`}; return{html:m.renderFreeSamplePage(book),init:()=>m.initFreeSamplePage(book)}; }
    if (['/best-sellers','/new-releases','/trending'].includes(path)) { const m=await safeImport('./pages/PublicDiscoveryPages.js'); const type=path==='/best-sellers'?'bestsellers':path==='/new-releases'?'new':'trending'; return{html:m.renderCuratedCatalogPage(type)}; }
    if (path === '/review-support') { const m=await safeImport('./pages/ReviewSupportPage.js'); return{html:m.renderReviewSupportPage(),init:m.initReviewSupportEvents}; }
    if (path === '/pricing' || path === '/subscription') { const m=await safeImport('./pages/PricingPage.js'); return{html:m.renderPricingPage(),init:m.initPricingEvents}; }
    if (path === '/subscription/manage') { const m=await safeImport('./pages/SubscriptionManagePage.js'); return{html:m.renderSubscriptionManagePage(),init:m.initSubscriptionManageEvents}; }
    const staticRoutes=['/about','/how-it-works','/faq','/contact','/help','/terms','/privacy','/refund-policy','/seller-guidelines'];
    if(staticRoutes.includes(path)){const m=await safeImport('./pages/StaticPages.js');return{html:m.renderStaticPage(path.slice(1))};}
    if(['/login','/signup','/register','/forgot-password','/reset-password'].includes(path)){const m=await safeImport('./pages/AuthPages.js');const mode=path==='/login'?'login':['/signup','/register'].includes(path)?'signup':path==='/forgot-password'?'forgot':'reset';return{html:m.renderAuthPage(mode),init:()=>m.initAuthEvents(mode)};}
    if(path==='/profile'){const m=await safeImport('./pages/ProfilePage.js');return{html:m.renderProfilePage()};}
    if(['/settings','/settings/account','/settings/notifications','/settings/privacy'].includes(path)){const m=await safeImport('./pages/UserSettingsPage.js');return{html:m.renderUserSettingsPage(),init:m.initUserSettingsEvents};}
    if(path==='/settings/security'){const m=await safeImport('./pages/AccountSecurityPage.js');return{html:m.renderAccountSecurityPage(),init:m.initAccountSecurityEvents};}
    if(path==='/dashboard'){const m=await safeImport('./pages/DashboardPage.js');return{html:m.renderDashboardPage(),init:m.initDashboardEvents};}
    if(path==='/library'){const m=await safeImport('./pages/LibraryPage.js');return{html:m.renderLibraryPage(),init:m.initLibraryEvents};}
    if(path==='/orders'){const m=await safeImport('./pages/OrdersPage.js');return{html:m.renderOrdersPage()};}
    if(path==='/wishlist'){const m=await safeImport('./pages/WishlistPage.js');return{html:m.renderWishlistPage()};}
    if(path.startsWith('/checkout/')){const m=await safeImport('./pages/CheckoutPage.js');const slug=path.replace('/checkout/','');return{html:m.renderCheckoutPage(slug),init:()=>m.initCheckoutEvents(slug)};}
    if(path==='/payment/success'){const m=await safeImport('./pages/PaymentSuccessPage.js');return{html:m.renderPaymentSuccessPage()};}
    if(path==='/payment/failed'){const m=await safeImport('./pages/PaymentFailedPage.js');return{html:m.renderPaymentFailedPage()};}
    if(['/seller','/seller/dashboard','/creator','/creator/dashboard'].includes(path)){const m=await safeImport('./pages/CreatorDashboardPage.js');return{html:m.renderCreatorDashboardPage(),init:m.initCreatorDashboardEvents};}
    if(path==='/publish'){const m=await safeImport('./pages/PublishInternalPage.js');return{html:m.renderPublishInternalPage(),init:m.initPublishInternalEvents};}
    if(path.startsWith('/publish/external/integration/')){const m=await safeImport('./pages/ExternalIntegrationPage.js');const bookId=decodeURIComponent(path.replace('/publish/external/integration/','').split('/')[0]);return{html:m.renderExternalIntegrationPage(),init:()=>m.initExternalIntegrationPage(bookId)};}
    if(path==='/publish/external'){const m=await safeImport('./pages/PublishExternalPage.js');return{html:m.renderPublishExternalPage(),init:m.initPublishExternalEvents};}
    if(path==='/seller/apply'){const m=await safeImport('./pages/SellerApplyPage.js?v=20260827-3');return{html:m.renderSellerApplyPage(),init:m.initSellerApplyEvents};}
    if(path==='/seller/settings'){const m=await safeImport('./pages/SellerSettingsPage.js');return{html:m.renderSellerSettingsPage(),init:m.initSellerSettingsEvents};}
    if(path==='/admin'||path==='/admin/overview'){const m=await safeImport('./pages/AdminDashboardPage.js');return{html:m.renderAdminDashboardPage(),init:m.initAdminDashboardEvents};}
    if(path==='/admin/users'){const m=await safeImport('./pages/AdminUsersPage.js');return{html:m.renderAdminUsersPage(),init:m.initAdminUsersEvents};}
    if(path==='/admin/sellers'){const m=await safeImport('./pages/AdminSellersPage.js');return{html:m.renderAdminSellersPage(),init:m.initAdminSellersEvents};}
    if(path==='/admin/books'){const m=await safeImport('./pages/AdminBooksBackendPage.js');return{html:m.renderAdminBooksPage(),init:m.initAdminBooksEvents};}
    if(path==='/admin/orders'){const m=await safeImport('./pages/AdminOrdersPage.js');return{html:m.renderAdminOrdersPage(),init:m.initAdminOrdersEvents};}
    if(path==='/admin/subscriptions'||path==='/admin/plans'){const m=await safeImport('./pages/AdminPlansPage.js');return{html:m.renderAdminPlansPage(),init:m.initAdminPlansEvents};}
    if(path==='/admin/settings'){const m=await safeImport('./pages/AdminSettingsPage.js');return{html:m.renderAdminSettingsPage(),init:m.initAdminSettingsEvents};}
    if(path==='/admin/security'){const m=await safeImport('./pages/AdminSecurityPage.js');return{html:m.renderAdminSecurityPage(),init:m.initAdminSecurityEvents};}
    if(path==='/admin/ai-diagnostics'){const m=await safeImport('./pages/AdminAIDiagnosticsPage.js');return{html:m.renderAdminAIDiagnosticsPage(),init:m.initAdminAIDiagnosticsEvents};}
    const m=await safeImport('./pages/NotFoundPage.js');return{html:m.renderNotFoundPage()};
  }

  async route(force=false,navigation=false){
    if(this.routeRunning){this.pendingRoute={force,navigation};return;}
    const hash=window.location.hash||'#/';
    if(!force&&this.lastHash===hash&&document.querySelector('#main-content'))return;
    this.routeRunning=true;
    try{
      const path=this.currentPath();
      const [,queryString]=hash.split('?');
      const params=new URLSearchParams(queryString||'');
      if(navigation)window.scrollTo({top:0,left:0,behavior:'instant'});
      const PUBLIC=['/','/explore','/categories','/best-sellers','/new-releases','/trending','/authors','/pricing','/subscription','/about','/how-it-works','/faq','/contact','/help','/terms','/privacy','/refund-policy','/seller-guidelines','/login','/signup','/register','/forgot-password','/reset-password','/payment/success','/payment/failed','/review-support'];
      const PUBLIC_PREFIX=['/category/','/book/','/author/','/search','/sample/'];
      const isPublic=PUBLIC.includes(path)||PUBLIC_PREFIX.some(p=>path.startsWith(p));
      if(!isPublic&&!state.isAuthenticated){window.location.hash=`#/login?returnTo=${encodeURIComponent(path+(queryString?`?${queryString}`:''))}`;return;}
      if(path.startsWith('/admin')&&!state.isAdmin){window.location.hash='#/login';return;}
      if((path.startsWith('/seller')||path.startsWith('/creator')||path==='/publish'||path.startsWith('/publish/external'))&&path!=='/seller/apply'&&!state.isSeller&&!state.isAdmin){window.location.hash='#/seller/apply';return;}
      const {header,footer}=await this.shell();
      this.root.innerHTML=`${header}<main id="main-content" style="flex:1;min-height:60vh"><div style="padding:60px 20px;text-align:center;color:#64748b">Loading Bookora…</div></main>${footer}`;
      try{
        const page=await this.loadPage(path,params); const main=document.getElementById('main-content'); if(!main)throw new Error('main-content was not created');
        main.innerHTML=page.html||'';
        if(typeof page.init==='function'){try{await page.init();}catch(error){console.warn('[Bookora page events skipped]',error);}}
        try{const h=await safeImport('./components/Header.js');if(typeof h.initHeaderEvents==='function')h.initHeaderEvents();}catch(error){console.warn('[Bookora header events skipped]',error);}
      }catch(error){
        console.error('[Bookora] route failed:',error);
        const main=document.getElementById('main-content');
        if(main)main.innerHTML=`<div style="min-height:60vh;display:grid;place-items:center;padding:40px;text-align:center;font-family:Inter,system-ui,sans-serif"><div><h2 style="color:#0f172a;margin-bottom:8px">This page could not be loaded</h2><p style="color:#64748b;margin-bottom:18px">Bookora is still running. Please try again.</p><button id="bookora-route-retry" type="button" style="padding:10px 18px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer">Retry</button></div></div>`;
        document.getElementById('bookora-route-retry')?.addEventListener('click',()=>this.route(true,false),{once:true});
      }
      this.lastHash=hash;
    }catch(error){
      console.error('[Bookora] core route failed:',error);
      this.root.innerHTML=`${fallbackShell()}<main id="main-content" style="min-height:60vh;display:grid;place-items:center;padding:40px;text-align:center;font-family:Inter,system-ui,sans-serif"><div><h2>Bookora is recovering…</h2><p style="color:#64748b">The page could not be rendered.</p><button id="bookora-core-retry" type="button" style="padding:10px 18px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer">Retry</button></div></main>`;
      document.getElementById('bookora-core-retry')?.addEventListener('click',()=>this.route(true,false),{once:true});
    }finally{
      this.routeRunning=false;
      const pending=this.pendingRoute;this.pendingRoute=null;
      if(pending)queueMicrotask(()=>this.route(pending.force,pending.navigation));
    }
  }

  init(){
    window.addEventListener('hashchange',()=>this.route(true,true));
    // Do not route again on window.load. The initial route is started once here;
    // routing again on load was causing a visible blink/re-render on detail pages.
    this.route(true,false);
  }
}

new SafeApp();
