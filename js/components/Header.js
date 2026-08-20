// Header Component with Responsive Mobile Slide-In Drawer Navigation
import { state } from '../state.js';
import { renderModeSwitcher, initModeSwitcherEvents } from './ModeSwitcher.js';
import { Toast } from './Toast.js';

const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8Z"/>',
  categories: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  best: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  new: '<path d="M4 5h16v14H4z"/><path d="M8 3v4M16 3v4M4 9h16"/><path d="M8 13h3M8 16h5"/>',
  plans: '<path d="M4 5h16v14H4z"/><path d="M8 3v4M16 3v4M4 9h16"/><path d="M8 13h8M8 16h5"/>',
  wishlist: '<path d="M20.8 8.6c0 5.2-8.8 10.1-8.8 10.1S3.2 13.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/>',
  library: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22Z"/><path d="M4 5.5V22M8 7h8M8 11h8"/>',
  orders: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  admin: '<path d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  seller: '<path d="m4 17 3.2-.7L17.8 5.7a2 2 0 0 1 2.8 2.8L10 19l-6 1Z"/><path d="m15.8 7.7 2.5 2.5"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 9h18M16 14h3"/>',
  subscription: '<path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7Z"/>',
  profile: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  settings: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1 1.3 1.3-2.1 2.1-1.3-1.3-.1-.1a7.8 7.8 0 0 1-1.7.7V20h-3v-2.2a7.8 7.8 0 0 1-1.7-.7l-.1.1-1.3 1.3-2.1-2.1L6.7 15l.1-.1a7.8 7.8 0 0 1-.7-1.7H4v-3h2.1a7.8 7.8 0 0 1 .7-1.7l-.1-.1-1.3-1.3 2.1-2.1 1.3 1.3.1.1a7.8 7.8 0 0 1 1.7-.7V3h3v2.2a7.8 7.8 0 0 1 1.7.7l.1-.1 1.3-1.3 2.1 2.1-1.3 1.3-.1.1a7.8 7.8 0 0 1 .7 1.7H20v3h-2.1a7.8 7.8 0 0 1-.7 1.7Z"/>',
  signout: '<path d="M9 5H5v14h4M14 8l4 4-4 4M18 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};

function svgIcon(name, size = 20) {
  return `<span class="bookora-menu-icon" aria-hidden="true"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.profile}</svg></span>`;
}

function profileIcon(user, size = 20) {
  const avatar = String(user?.avatar || user?.photoURL || '').trim();
  if (!avatar) return svgIcon('profile', size);
  return `<span class="bookora-menu-icon bookora-profile-icon" aria-hidden="true"><img src="${avatar}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block;" /></span>`;
}

function menuItem(href, icon, label, extraStyle = '') {
  return `<a href="${href}" class="dropdown-item bookora-icon-item" style="${extraStyle}">${svgIcon(icon)}<span>${label}</span></a>`;
}

function mobileItem(href, icon, label, extraStyle = '') {
  return `<a href="${href}" class="nav-link mobile-drawer-link bookora-mobile-icon-item" style="${extraStyle}">${svgIcon(icon)}<span>${label}</span></a>`;
}

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
        <a href="#/" class="flex items-center gap-3 group" style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.45rem; letter-spacing: -0.03em; color: #0F172A; line-height: 1;">Bookora</div>
            <div style="font-size: 0.68rem; font-weight: 600; color: #64748B; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px;">Discover. Read. Publish.</div>
          </div>
        </a>

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

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div id="header-mode-switcher">${renderModeSwitcher()}</div>

          ${activeMode === 'buyer' ? `
            <a href="#/wishlist" class="btn btn-ghost btn-sm" style="position: relative; width: 38px; height: 38px; padding: 0; border-radius: var(--radius-full);" title="Wishlist">
              ${svgIcon('wishlist', 19)}
              ${wishlistCount > 0 ? `<span style="position: absolute; top: 2px; right: 2px; background: #E11D48; color: #FFFFFF; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 99px; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF;">${wishlistCount}</span>` : ''}
            </a>
          ` : ''}

          ${isAuth ? `
            <div class="relative" style="position: relative;">
              <button id="user-menu-btn" style="display: flex; align-items: center; gap: 0.5rem; padding: 4px 8px; border-radius: var(--radius-full); border: 1px solid var(--border-subtle); background: var(--bg-card);">
                <img src="${user.avatar || user.photoURL || ''}" alt="${user.name}" onerror="this.style.display='none';this.nextElementSibling?.classList.add('fallback-visible');" style="width: 28px; height: 28px; border-radius: 99px; object-fit: cover; ${user.avatar || user.photoURL ? '' : 'display:none;'}" />
                <span class="header-avatar-fallback" style="${user.avatar || user.photoURL ? 'display:none;' : ''}">${svgIcon('profile', 18)}</span>
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${user.name ? user.name.split(' ')[0] : 'User'}</span>
                <span class="badge ${isAdmin ? 'badge-bookora' : isSeller ? 'badge-external' : 'badge-new'}" style="font-size: 0.65rem; padding: 1px 6px;">${isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}</span>
              </button>

              <div id="user-menu-dropdown" style="display: none; position: absolute; top: calc(100% + 8px); right: 0; width: 260px; background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); padding: 0.6rem; z-index: 60;">
                <div style="padding: 0.6rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 0.4rem;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${user.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                </div>

                ${isAdmin ? `
                  ${menuItem('#/admin', 'admin', 'Admin Control Center', 'font-weight:700;color:#0F172A;')}
                  ${menuItem('#/admin/settings', 'settings', 'Platform Settings', 'color:var(--accent);')}
                ` : ''}

                ${isSeller ? `
                  ${menuItem('#/seller/dashboard', 'seller', 'Seller Studio', 'font-weight:700;color:#6D28D9;')}
                  ${menuItem('#/seller/wallet', 'wallet', 'Earnings & Payouts')}
                ` : `
                  ${menuItem('#/seller/apply', 'plus', 'Become a Creator', 'font-weight:600;color:var(--accent);')}
                `}

                ${menuItem('#/library', 'library', 'My Library')}
                ${menuItem('#/orders', 'orders', 'Orders & Invoices')}
                ${menuItem('#/subscription/manage', 'subscription', 'Subscription')}
                <a href="#/profile" class="dropdown-item bookora-icon-item">${profileIcon(user)}<span>Profile</span></a>
                ${menuItem('#/settings', 'settings', 'Settings')}

                <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.4rem; padding-top: 0.4rem;">
                  <button id="header-logout-btn" style="width: 100%; text-align: left; padding: 0.55rem 0.65rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 0.5rem;">
                    ${svgIcon('signout', 18)}<span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <a href="#/login" class="btn btn-primary btn-sm" style="font-weight: 700;">Sign In</a>
          `}

          <button id="mobile-nav-toggle-btn" class="mobile-nav-toggle" aria-label="Open Navigation Drawer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div id="mobile-drawer-backdrop" class="drawer-backdrop"></div>
      <div id="mobile-nav-drawer" class="mobile-nav-drawer">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: #0F172A;">Bookora</div>
          <button id="mobile-drawer-close-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px;" aria-label="Close menu">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          ${mobileItem('#/', 'home', 'Home')}
          ${mobileItem('#/explore', 'explore', 'Explore Catalog')}
          ${mobileItem('#/categories', 'categories', 'Categories')}
          ${mobileItem('#/best-sellers', 'best', 'Best Sellers')}
          ${mobileItem('#/new-releases', 'new', 'New Releases')}
          ${mobileItem('#/pricing', 'plans', 'Reading Plans')}
          ${mobileItem('#/wishlist', 'wishlist', `Wishlist (${wishlistCount})`)}

          ${isAuth ? `
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 1rem; padding-top: 1rem;">
              ${mobileItem('#/library', 'library', 'My Library')}
              ${mobileItem('#/orders', 'orders', 'Order History')}
              ${isAdmin ? mobileItem('#/admin', 'admin', 'Admin Center', 'color:#0F172A;font-weight:700;') : ''}
              ${isSeller ? mobileItem('#/seller/dashboard', 'seller', 'Seller Studio', 'color:#6D28D9;font-weight:700;') : ''}
              <a href="#/profile" class="nav-link mobile-drawer-link bookora-mobile-icon-item">${profileIcon(user)}<span>Profile</span></a>
            </div>
          ` : `
            <div style="margin-top: 1.5rem;">${mobileItem('#/login', 'profile', 'Sign In', 'width:100%;justify-content:center;')}</div>
          `}
        </div>
      </div>
    </header>
  `;
}

export function initHeaderEvents() {
  initModeSwitcherEvents();

  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => { userDropdown.style.display = 'none'; });
  }

  const toggleBtn = document.getElementById('mobile-nav-toggle-btn');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const drawer = document.getElementById('mobile-nav-drawer');

  const openDrawer = () => { drawer?.classList.add('open'); backdrop?.classList.add('open'); };
  const closeDrawer = () => { drawer?.classList.remove('open'); backdrop?.classList.remove('open'); };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.querySelectorAll('.mobile-drawer-link').forEach(link => link.addEventListener('click', closeDrawer));

  document.getElementById('header-logout-btn')?.addEventListener('click', () => {
    state.logout();
    Toast.show('Signed out successfully.', 'info');
    window.location.hash = '#/login';
  });
}
