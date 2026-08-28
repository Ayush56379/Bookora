// Bookora Admin Sellers — instant post-action UI sync.
// The protected backend remains the source of truth. After a successful seller
// action response, update the visible row immediately instead of waiting for
// the Firestore listener round-trip. Firestore still persists the decision.
(() => {
  if (window.__BOOKORA_ADMIN_SELLER_CLICK_SYNC__) return;
  window.__BOOKORA_ADMIN_SELLER_CLICK_SYNC__ = true;

  const ACTION_PATH = '/api/admin/sellers/action';
  const originalFetch = window.fetch.bind(window);

  const applyStatusToRow = (sellerId, status) => {
    const normalized = String(status || '').toLowerCase();
    if (!sellerId || !normalized) return;
    const list = document.getElementById('admin-sellers-list');
    if (!list) return;

    const button = Array.from(list.querySelectorAll('[data-seller-action]'))
      .find(el => String(el.dataset.id || '') === String(sellerId));
    const row = button?.closest('tr');
    if (!row) return;

    const statusBadge = row.querySelector('.seller-status');
    const access = row.querySelector('[class*="seller-access-"]');
    const actions = row.querySelector('.seller-actions');
    if (!statusBadge || !access || !actions) return;

    statusBadge.className = 'seller-status ' + (
      normalized === 'approved' ? 'seller-status-approved' :
      normalized === 'rejected' ? 'seller-status-rejected' :
      normalized === 'suspended' ? 'seller-status-suspended' :
      'seller-status-pending'
    );
    statusBadge.textContent = normalized.toUpperCase();

    const active = normalized === 'approved';
    access.className = active ? 'seller-access-active' : 'seller-access-inactive';
    access.textContent = active ? 'ACTIVE' : 'INACTIVE';

    const id = String(sellerId).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const view = `<button class="seller-action seller-view" data-seller-action="view" data-id="${id}">View</button>`;
    if (normalized === 'approved') {
      actions.innerHTML = view + `<button class="seller-action seller-suspend" data-seller-action="suspend" data-id="${id}">Suspend</button>`;
    } else if (normalized === 'pending') {
      actions.innerHTML = view + `<button class="seller-action seller-approve" data-seller-action="approve" data-id="${id}">Approve</button><button class="seller-action seller-reject" data-seller-action="reject" data-id="${id}">Reject</button>`;
    } else {
      actions.innerHTML = view + `<button class="seller-action seller-reactivate" data-seller-action="approve" data-id="${id}">Reactivate</button>`;
    }

    const count = selector => list.closest('.admin-sellers-page')?.querySelector(selector);
    const rows = Array.from(list.querySelectorAll('tr'));
    const statuses = rows.map(r => String(r.querySelector('.seller-status')?.textContent || '').toLowerCase());
    count('#sellers-pending')?.replaceChildren(document.createTextNode(String(statuses.filter(x => x === 'pending').length)));
    count('#sellers-approved')?.replaceChildren(document.createTextNode(String(statuses.filter(x => x === 'approved').length)));
    count('#sellers-blocked')?.replaceChildren(document.createTextNode(String(statuses.filter(x => x === 'rejected' || x === 'suspended').length)));
  };

  window.fetch = async (input, init = {}) => {
    const response = await originalFetch(input, init);
    try {
      const raw = typeof input === 'string' ? input : (input?.url || '');
      const url = new URL(raw, location.href);
      if (url.pathname === ACTION_PATH && response.ok) {
        const data = await response.clone().json();
        if (data?.success && data?.status) {
          let body = {};
          try { body = typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (_) {}
          applyStatusToRow(body.sellerId || body.id, data.status);
        }
      }
    } catch (error) {
      console.debug('[Bookora seller click sync] skipped:', error?.message || error);
    }
    return response;
  };

  console.info('[Bookora] Admin seller action UI sync installed.');
})();
