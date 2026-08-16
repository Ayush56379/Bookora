// Header Component with Responsive Mobile Slide-In Drawer Navigation
import { state } from '../state.js';
import { renderModeSwitcher, initModeSwitcherEvents } from './ModeSwitcher.js';
import { Toast } from './Toast.js';

export function renderHeader() {
  const user = state.currentUser || { name: 'Guest', email: '', avatar: '', role: 'buyer' };
  const isAuth = state.isAuthenticated;
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;
  const activeMode = state.activeMode; // 'buyer', 'seller', 'admin'
  const wishlistCount = state.wishlist.size;
  const hash = window.location.hash || '#/';

  return `
    <header id="main-header" class="header-sticky">
      <div class="container" style="display: flex; align-items: center; justify-content: space-between; height: 72px;">
        
        <!-- Brand Logo -->
        <a href="#/" class="flex items-center gap-3 group" style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.45rem; letter-spacing: -0.03em; color: #0F172A; line-height: 1;">
              Bookora
            </div>
            <div style="font-size: 0.68rem; font-weight: 600; color: #64748B; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px;">
              Discover. Read. Publish.
            </div>
          </div>
        </a>

        <!-- Desktop Navigation (Mode-Specific) -->
        <nav class="desktop-nav" style="display: flex; align-items: center; gap: 0.35rem;">
          ${activeMode === 'admin' ? `
            <a href="#/admin" class="nav-link ${hash === '#/admin' ? 'active' : ''}">Overview</a>
            <a href="#/admin/books" class="nav-link ${hash.startsWith('#/admin/books') ? 'active' : ''}">Books</a>
            <a href="#/admin/users" class="nav-link ${hash.startsWith('#/admin/users') ? 'active' : ''}">Users</a>
            <a href="#/admin/sellers" class="nav-link ${hash.startsWith('#/admin/sellers') ? 'active' : ''}">Sellers</a>
            <a href="#/admin/orders" class="nav-link ${hash.startsWith('#/admin/orders') ? 'active' : ''}">Orders</a>
            <a href="#/admin/subscriptions" class="nav-link ${hash.startsWith('#/admin/subscriptions') ? 'active' : ''}">Plans</a>
            <a href="#/admin/settings" class="nav-link ${hash.startsWith('#/admin/settings') ? 'active' : ''}">Settings</a>
          ` : activeMode === 'seller' ? `
            <a href="#/seller/dashboard" class="nav-link ${hash === '#/seller/dashboard' || hash === '#/seller' ? 'active' : ''}">Studio</a>
            <a href="#/publish" class="nav-link ${hash === '#/publish' ? 'active' : ''}">Publish eBook</a>
            <a href="#/publish/external" class="nav-link ${hash === '#/publish/external' ? 'active' : ''}">External Importer</a>
            <a href="#/seller/wallet" class="nav-link ${hash.startsWith('#/seller/wallet') ? 'active' : ''}">Wallet</a>
            <a href="#/explore" class="nav-link">Marketplace</a>
          ` : `
            <a href="#/" class="nav-link ${hash === '#/' ? 'active' : ''}">Home</a>
            <a href="#/explore" class="nav-link ${hash.startsWith('#/explore') ? 'active' : ''}">Explore</a>
            <a href="#/categories" class="nav-link ${hash.startsWith('#/categories') ? 'active' : ''}">Categories</a>
            <a href="#/best-sellers" class="nav-link">Best Sellers</a>
            <a href="#/new-releases" class="nav-link">New Releases</a>
            <a href="#/pricing" class="nav-link">Pricing</a>
          `}
        </nav>

        <!-- Right Side Actions & User Menu -->
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          
          <!-- Mode Switcher -->
          <div id="header-mode-switcher">${renderModeSwitcher()}</div>

          <!-- Wishlist (Buyer Mode) -->
          ${activeMode === 'buyer' ? `
            <a href="#/wishlist" class="btn btn-ghost btn-sm" style="position: relative; width: 38px; height: 38px; padding: 0; border-radius: var(--radius-full);" title="Wishlist">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              ${wishlistCount > 0 ? `
                <span style="position: absolute; top: 2px; right: 2px; background: #E11D48; color: #FFFFFF; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 99px; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF;">
                  ${wishlistCount}
                </span>
              ` : ''}
            </a>
          ` : ''}

          <!-- User Menu / Sign In Trigger -->
          ${isAuth ? `
            <div class="relative" style="position: relative;">
              <button id="user-menu-btn" style="display: flex; align-items: center; gap: 0.5rem; padding: 4px 8px; border-radius: var(--radius-full); border: 1px solid var(--border-subtle); background: var(--bg-card);">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="${user.name}" style="width: 28px; height: 28px; border-radius: 99px; object-fit: cover;" />
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${user.name ? user.name.split(' ')[0] : 'User'}</span>
                <span class="badge ${isAdmin ? 'badge-bookora' : isSeller ? 'badge-external' : 'badge-new'}" style="font-size: 0.65rem; padding: 1px 6px;">
                  ${isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}
                </span>
              </button>

              <!-- Dropdown Menu -->
              <div id="user-menu-dropdown" style="display: none; position: absolute; top: calc(100% + 8px); right: 0; width: 260px; background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); padding: 0.6rem; z-index: 60;">
                <div style="padding: 0.6rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 0.4rem;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${user.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                </div>

                ${isAdmin ? `
                  <a href="#/admin" class="dropdown-item" style="font-weight: 700; color: #0F172A;">🛡️ Admin Control Center</a>
                  <a href="#/admin/settings" class="dropdown-item" style="color: var(--accent);">⚙️ Platform Settings</a>
                ` : ''}

                ${isSeller ? `
                  <a href="#/seller/dashboard" class="dropdown-item" style="font-weight: 700; color: #6D28D9;">✍️ Seller Studio</a>
                  <a href="#/seller/wallet" class="dropdown-item">💰 Earnings & Payouts</a>
                ` : `
                  <a href="#/seller/apply" class="dropdown-item" style="font-weight: 600; color: var(--accent);">+ Become a Creator</a>
                `}

                <a href="#/library" class="dropdown-item">📚 My Library</a>
                <a href="#/orders" class="dropdown-item">🧾 Orders & Invoices</a>
                <a href="#/subscription/manage" class="dropdown-item">⭐ Subscription</a>
                <a href="#/profile" class="dropdown-item">👤 Profile</a>
                <a href="#/settings" class="dropdown-item">⚙️ Settings</a>

                <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.4rem; padding-top: 0.4rem;">
                  <button id="header-logout-btn" style="width: 100%; text-align: left; padding: 0.55rem 0.65rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 0.5rem;">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <a href="#/login" class="btn btn-primary btn-sm" style="font-weight: 700;">
              Sign In
            </a>
          `}

          <!-- Mobile Hamburger Toggle Button -->
          <button id="mobile-nav-toggle-btn" class="mobile-nav-toggle" aria-label="Open Navigation Drawer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>

        </div>
      </div>

      <!-- Mobile Navigation Drawer Backdrop & Slider -->
      <div id="mobile-drawer-backdrop" class="drawer-backdrop"></div>
      <div id="mobile-nav-drawer" class="mobile-nav-drawer">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: #0F172A;">
            Bookora
          </div>
          <button id="mobile-drawer-close-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px;">
            ✕
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          <a href="#/" class="nav-link mobile-drawer-link">Home</a>
          <a href="#/explore" class="nav-link mobile-drawer-link">Explore Catalog</a>
          <a href="#/categories" class="nav-link mobile-drawer-link">Categories</a>
          <a href="#/best-sellers" class="nav-link mobile-drawer-link">Best Sellers</a>
          <a href="#/new-releases" class="nav-link mobile-drawer-link">New Releases</a>
          <a href="#/pricing" class="nav-link mobile-drawer-link">Reading Plans</a>
          <a href="#/wishlist" class="nav-link mobile-drawer-link">Wishlist (${wishlistCount})</a>

          ${isAuth ? `
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 1rem; padding-top: 1rem;">
              <a href="#/library" class="nav-link mobile-drawer-link">📚 My Library</a>
              <a href="#/orders" class="nav-link mobile-drawer-link">🧾 Order History</a>
              ${isAdmin ? `<a href="#/admin" class="nav-link mobile-drawer-link" style="color: #0F172A; font-weight: 700;">🛡️ Admin Center</a>` : ''}
              ${isSeller ? `<a href="#/seller/dashboard" class="nav-link mobile-drawer-link" style="color: #6D28D9; font-weight: 700;">✍️ Seller Studio</a>` : ''}
              <a href="#/profile" class="nav-link mobile-drawer-link">👤 Profile</a>
            </div>
          ` : `
            <div style="margin-top: 1.5rem;">
              <a href="#/login" class="btn btn-primary btn-lg" style="width: 100%; text-align: center;">Sign In</a>
            </div>
          `}
        </div>
      </div>

    </header>
  `;
}

export function initHeaderEvents() {
  initModeSwitcherEvents();

  // Desktop User Dropdown Toggle
  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
    });
  }

  // Mobile Drawer Toggle
  const toggleBtn = document.getElementById('mobile-nav-toggle-btn');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const drawer = document.getElementById('mobile-nav-drawer');

  const openDrawer = () => {
    drawer?.classList.add('open');
    backdrop?.classList.add('open');
  };

  const closeDrawer = () => {
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
  };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Logout
  document.getElementById('header-logout-btn')?.addEventListener('click', () => {
    state.logout();
    Toast.show('Signed out successfully.', 'info');
    window.location.hash = '#/login';
  });
}
