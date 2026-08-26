/* External Website sales UI.
 * Backend remains authoritative for external sales statistics.
 * The seller dashboard intentionally does not display a platform-commission line.
 */
(() => {
  const API = (window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const money = value => `₹${Number(value || 0).toFixed(2)}`;

  async function post(path) {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    let token = '';
    try {
      if (window.firebase?.auth) {
        const current = window.firebase.auth().currentUser;
        if (current) token = await current.getIdToken(false);
      }
    } catch (_) {}
    if (!token && window.BookoraPurchaseAccess?.ensureBackendSession) {
      try { await window.BookoraPurchaseAccess.ensureBackendSession(false); } catch (_) {}
    }
    if (!token) token = window.__BOOKORA_TOKEN__ || '';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API}${path}`, { method: 'POST', headers, cache: 'no-store' });
    return response.json().catch(() => ({}));
  }

  function benefitBanner() {
    return `<div class="ext-zero-benefit" style="margin:1rem 0 1.5rem;padding:1.1rem 1.25rem;border:1px solid #bbf7d0;border-radius:16px;background:linear-gradient(135deg,#f0fdf4,#eff6ff);">
      <div style="font-weight:900;color:#166534;font-size:1rem;">External Website Sales</div>
      <div style="margin-top:.35rem;color:#334155;font-size:.86rem;line-height:1.55;">Connect your website with Bookora and track verified external sales, payment status and Library fulfillment from one place.</div>
      <div style="margin-top:.65rem;display:flex;flex-wrap:wrap;gap:.5rem;font-size:.76rem;color:#475569;"><span>✓ Cashfree verification</span><span>✓ Automatic Library access</span><span>✓ Page & referral tracking</span><span>✓ One integration code</span></div>
    </div>`;
  }

  function setupPublishPage() {
    const root = document.querySelector('.publish-external-page');
    if (!root || root.querySelector('.ext-zero-benefit')) return;
    const container = root.querySelector('.container');
    const heading = container?.querySelector('h1');
    if (heading) heading.insertAdjacentHTML('afterend', benefitBanner());
  }

  async function setupSellerDashboard() {
    const root = document.querySelector('.creator-dashboard');
    if (!root || root.querySelector('.ext-zero-dashboard-card')) return;
    const card = document.createElement('div');
    card.className = 'ext-zero-dashboard-card';
    card.style.cssText = 'background:#fff;border:1px solid #bbf7d0;border-radius:18px;padding:1.35rem 1.5rem;box-shadow:var(--shadow-sm);margin-bottom:2rem;';
    card.innerHTML = `<div style="font-weight:900;font-size:1.05rem;color:#166534;">External Website Integration</div><div style="margin-top:.7rem;display:flex;gap:.7rem;flex-wrap:wrap;"><a href="#/publish/external" class="btn btn-primary btn-sm">Manage Integration</a><span class="ext-zero-summary" style="font-size:.78rem;color:#64748b;align-self:center;">Loading external sales…</span></div>`;
    const first = root.querySelector('.container');
    const metrics = first?.querySelector('div[style*="grid-template-columns"]');
    if (metrics) metrics.insertAdjacentElement('afterend', card); else first?.appendChild(card);
    try {
      const data = await post('/api/external/commission-summary');
      if (data.success) {
        card.querySelector('.ext-zero-summary').textContent = `${data.successfulOrders || 0} successful external orders • ${money(data.externalWebsiteGMV)} GMV`;
      } else {
        card.querySelector('.ext-zero-summary').textContent = 'Connect your website to start tracking external sales.';
      }
    } catch (_) {}
  }

  async function setupAdminDashboard() {
    const root = document.querySelector('.admin-dashboard');
    if (!root || root.querySelector('.ext-zero-admin-card')) return;
    const card = document.createElement('div');
    card.className = 'ext-zero-admin-card';
    card.style.cssText = 'background:#fff;border:1px solid #bfdbfe;border-radius:18px;padding:1.35rem 1.5rem;box-shadow:var(--shadow-sm);margin-bottom:2rem;';
    card.innerHTML = `<div style="font-weight:900;font-size:1.05rem;color:#1e3a8a;">External Website Sales</div><div class="ext-admin-stats" style="margin-top:.9rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:.8rem;"><div>Orders<br><strong>—</strong></div><div>GMV<br><strong>—</strong></div><div>Bookora Commission<br><strong>₹0.00</strong></div><div>Seller Gross<br><strong>—</strong></div><div>Successful<br><strong>—</strong></div><div>Failed / Pending<br><strong>—</strong></div></div><div style="margin-top:.75rem;font-size:.72rem;color:#64748b;">Gateway/other applicable charges are tracked separately and are not Bookora platform commission.</div>`;
    const first = root.querySelector('.container');
    first?.insertBefore(card, first.firstElementChild?.nextElementSibling || first.firstElementChild);
    try {
      const data = await post('/api/admin/external-sales-stats');
      if (data.success) {
        const values = [data.externalWebsiteOrders, money(data.externalWebsiteGMV), money(data.bookoraCommission), money(data.sellerGrossAmount), data.successfulOrders, `${data.failedOrders} / ${data.pendingOrders}`];
        [...card.querySelectorAll('.ext-admin-stats > div')].forEach((el, i) => { const strong = el.querySelector('strong'); if (strong) strong.textContent = values[i]; });
      }
    } catch (_) {}
  }

  function setupAdminOrders() {
    const root = document.querySelector('.admin-orders-page');
    if (!root || root.querySelector('.ext-zero-order-note')) return;
    const note = document.createElement('div');
    note.className = 'ext-zero-order-note';
    note.style.cssText = 'margin:0 0 1rem;padding:.9rem 1rem;border:1px solid #bbf7d0;border-radius:12px;background:#f0fdf4;color:#166534;font-size:.82rem;';
    note.innerHTML = '<strong>External Website Orders:</strong> External website orders are tracked separately from Bookora marketplace commission rules.';
    const container = root.querySelector('.container') || root;
    container.insertBefore(note, container.firstElementChild);
  }

  function run() {
    setupPublishPage();
    setupSellerDashboard();
    setupAdminDashboard();
    setupAdminOrders();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(run, 50));
})();
