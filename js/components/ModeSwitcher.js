// Bookora mode switcher compatibility layer.
// Desktop/profile mode controls remain owned by Header.js. This module makes
// the same active mode visible and selectable inside the mobile drawer.

export function renderModeSwitcher() {
  return '';
}

const MODE_META = {
  buyer: { label: 'Buyer Mode', icon: '👤', color: '#2563EB' },
  seller: { label: 'Seller Mode', icon: '✎', color: '#6D28D9' },
  admin: { label: 'Admin Mode', icon: '✓', color: '#0F172A' }
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;'
  }[c]));
}

function injectMobileModePanel(state) {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!drawer || !state?.isAuthenticated) return;

  const canSeller = !!state.isSeller;
  const canAdmin = !!state.isAdmin;
  const modes = ['buyer'];
  if (canSeller) modes.push('seller');
  if (canAdmin) modes.push('admin');

  let panel = drawer.querySelector('#bookora-mobile-mode-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'bookora-mobile-mode-panel';
    panel.style.cssText = 'margin:0 0 1rem;padding:.8rem;border:1px solid var(--border-subtle);border-radius:14px;background:var(--bg-card);box-shadow:0 2px 8px rgba(15,23,42,.04);';
    const firstGroup = drawer.querySelector('.mobile-drawer-link')?.parentElement;
    if (firstGroup) firstGroup.insertBefore(panel, firstGroup.firstChild);
    else drawer.appendChild(panel);
  }

  const active = ['buyer', 'seller', 'admin'].includes(state.activeMode) ? state.activeMode : 'buyer';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.5rem;">
      <span style="font-size:.72rem;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:.05em;">Current Mode</span>
      <span style="font-size:.68rem;font-weight:800;color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:999px;padding:.18rem .45rem;">SAVED</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:.3rem;">
      ${modes.map(mode => {
        const meta = MODE_META[mode];
        const selected = mode === active;
        return `<button type="button" data-mobile-mode="${mode}" aria-pressed="${selected ? 'true' : 'false'}" style="width:100%;display:flex;align-items:center;gap:.65rem;padding:.58rem .65rem;border:1px solid ${selected ? '#BFDBFE' : 'transparent'};border-radius:10px;background:${selected ? '#EFF6FF' : 'transparent'};color:${meta.color};font-size:.82rem;font-weight:800;text-align:left;cursor:pointer;touch-action:manipulation;">
          <span aria-hidden="true" style="width:24px;text-align:center;">${meta.icon}</span><span style="flex:1;">${escapeHtml(meta.label)}</span>${selected ? '<span aria-hidden="true" style="font-size:.9rem;">✓</span>' : ''}
        </button>`;
      }).join('')}
    </div>`;

  panel.querySelectorAll('[data-mobile-mode]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const mode = button.dataset.mobileMode;
      if (!modes.includes(mode) || mode === state.activeMode) return;
      if (typeof state.setActiveMode !== 'function') return;
      if (state.setActiveMode(mode) === false) return;
      const destination = mode === 'admin' ? '#/admin' : mode === 'seller' ? '#/seller/dashboard' : '#/';
      window.location.hash = destination;
    });
  });
}

let installed = false;
let observer = null;

async function syncMobileMode() {
  try {
    const { state } = await import('../state.js');
    injectMobileModePanel(state);
  } catch (error) {
    console.warn('[Bookora mobile mode] sync skipped:', error?.message || error);
  }
}

export function initModeSwitcherEvents() {
  syncMobileMode();
  if (installed) return;
  installed = true;

  window.addEventListener('hashchange', () => setTimeout(syncMobileMode, 30), { passive: true });
  window.addEventListener('bookora:header-rendered', () => setTimeout(syncMobileMode, 0));
  window.addEventListener('bookora:route-changed', () => setTimeout(syncMobileMode, 0));

  // Observe only drawer insertion/replacement, not attributes/text. This avoids
  // the old full-DOM observer loop and does not interfere with animations.
  const startObserver = () => {
    const app = document.getElementById('app');
    if (!app || observer) return;
    observer = new MutationObserver(() => {
      if (document.getElementById('mobile-nav-drawer') && !document.getElementById('bookora-mobile-mode-panel')) syncMobileMode();
    });
    observer.observe(app, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  else startObserver();
}
