// Mode-specific navigation drawer for Buyer / Seller / Admin.
// Keeps the mobile menu aligned with the currently selected mode.
import './admin-mode-persistence-hotfix.js';
import { state } from './state.js';

const ICON = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  explore:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8Z"/>',
  categories:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4 2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  new:'<path d="M4 5h16v14H4z"/><path d="M8 3v4M16 3v4M4 9h16"/>',
  plans:'<path d="M4 5h16v14H4z"/><path d="M8 3v4M16 3v4M4 9h16"/>',
  heart:'<path d="M20.8 8.6c0 5.2-8.8 10.1-8.8 10.1S3.2 13.8 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/>',
  library:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22Z"/><path d="M4 5.5V22M8 7h8M8 11h8"/>',
  orders:'<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  admin:'<path d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  seller:'<path d="m4 17 3.2-.7L17.8 5.7a2 2 0 0 1 2.8 2.8L10 19l-6 1Z"/><path d="m15.8 7.7 2.5 2.5"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 9h18M16 14h3"/>',
  publish:'<path d="M12 5v14M5 12h14"/>',
  external:'<path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  marketplace:'<path d="M4 10h16l-1 10H5L4 10Z"/><path d="M3 10 5 4h14l2 6M9 10a3 3 0 0 0 6 0"/>',
  settings:'<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19 12h2M3 12h2M12 3v2M12 19v2"/>',
  profile:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'
};

function icon(name){return `<span class="bookora-menu-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[name]||ICON.profile}</svg></span>`;}
function item(href, name, label, style=''){return `<a href="${href}" class="nav-link mobile-drawer-link bookora-mobile-icon-item" style="${style}">${icon(name)}<span>${label}</span></a>`;}

function renderModeMenu(mode){
  const wishlist = state.wishlist?.size || 0;
  if(mode === 'admin') return `
    <div class="bookora-mode-menu-title">ADMIN CENTER</div>
    ${item('#/admin','admin','Overview')}
    ${item('#/admin/books','library','Books')}
    ${item('#/admin/users','profile','Users')}
    ${item('#/admin/sellers','seller','Sellers')}
    ${item('#/admin/orders','orders','Orders')}
    ${item('#/admin/subscriptions','plans','Plans')}
    ${item('#/admin/settings','settings','Settings')}
    <div class="bookora-menu-divider"></div>
    ${item('#/profile','profile','Profile')}`;

  if(mode === 'seller') return `
    <div class="bookora-mode-menu-title seller">SELLER STUDIO</div>
    ${item('#/seller/dashboard','seller','Studio')}
    ${item('#/publish','publish','Publish eBook')}
    ${item('#/publish/external','external','External Importer')}
    ${item('#/seller/wallet','wallet','Wallet')}
    ${item('#/explore','marketplace','Marketplace')}
    <div class="bookora-menu-divider"></div>
    ${item('#/library','library','My Library')}
    ${item('#/orders','orders','Order History')}
    ${item('#/profile','profile','Profile')}`;

  return `
    <div class="bookora-mode-menu-title">BOOKORA</div>
    ${item('#/','home','Home')}
    ${item('#/explore','explore','Explore Catalog')}
    ${item('#/categories','categories','Categories')}
    ${item('#/best-sellers','star','Best Sellers')}
    ${item('#/new-releases','new','New Releases')}
    ${item('#/pricing','plans','Reading Plans')}
    ${item('#/wishlist','heart',`Wishlist (${wishlist})`)}
    <div class="bookora-menu-divider"></div>
    ${item('#/library','library','My Library')}
    ${item('#/orders','orders','Order History')}
    ${item('#/profile','profile','Profile')}`;
}

function apply(){
  const drawer = document.getElementById('mobile-nav-drawer');
  if(!drawer) return;
  const container = drawer.querySelector('.bookora-mode-menu-content');
  if(!container) return;
  container.innerHTML = renderModeMenu(state.activeMode || 'buyer');
  container.querySelectorAll('.mobile-drawer-link').forEach(link=>link.addEventListener('click',()=>{
    drawer.classList.remove('open');
    document.getElementById('mobile-drawer-backdrop')?.classList.remove('open');
  }));
}

function inject(){
  const drawer=document.getElementById('mobile-nav-drawer');
  if(!drawer) return false;
  let content=drawer.querySelector('.bookora-mode-menu-content');
  if(!content){
    content=document.createElement('div');
    content.className='bookora-mode-menu-content';
    content.style.cssText='display:flex;flex-direction:column;gap:.35rem;flex:1;overflow:auto;padding-bottom:1rem;';
    const old=drawer.querySelector('div[style*="flex-direction: column"]');
    if(old) old.replaceWith(content); else drawer.appendChild(content);
  }
  apply();
  return true;
}

function boot(){
  if(!inject()) setTimeout(boot,50);
}
boot();
state.subscribe((event)=>{
  if(['MODE_CHANGED','USER_LOGGED_IN','DATA_SYNCED','AUTH_STATE_CHANGED'].includes(event)) setTimeout(()=>{inject();apply();},0);
});
window.addEventListener('hashchange',()=>setTimeout(()=>{inject();apply();},0));
