// CreatorDashboardPage Component (Firebase-backed seller analytics)
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { apiFetch } from '../config.js';
import { getFreshFirebaseIdToken } from '../firebase-authenticated-fetch.js?v=20260823-3';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));

function userIdentityValues(user = {}) {
  return [...new Set([
    user.id,
    user.bookoraUserId,
    user.userId,
    user.uid,
    user.firebaseUid,
    user.firebase_uid
  ].filter(Boolean).map(String))];
}

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase().replace(/[- ]/g, '_');
}

function isSuccessfulOrder(order = {}) {
  const payment = normalizeStatus(order.paymentStatus ?? order.payment_status);
  const status = normalizeStatus(order.orderStatus ?? order.order_status ?? order.status);
  if (['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'REFUNDED'].includes(payment)) return false;
  if (['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'REFUNDED'].includes(status)) return false;
  return payment === 'PAID' || status === 'FULFILLED' || status === 'COMPLETED';
}

function orderQuantity(order = {}) {
  const raw = order.quantity ?? order.qty ?? order.copies ?? order.units ?? 1;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

async function firestore() {
  if (!window.firebase?.firestore) throw new Error('Firebase Firestore is unavailable.');
  return window.firebase.firestore();
}

async function loadSellerBooks(db, user) {
  const identities = userIdentityValues(user);
  const matches = new Map();
  const queries = [];
  for (const identity of identities) {
    queries.push(db.collection('books').where('creator_id', '==', identity).get().catch(() => null));
    queries.push(db.collection('books').where('creatorId', '==', identity).get().catch(() => null));
    queries.push(db.collection('books').where('sellerId', '==', identity).get().catch(() => null));
  }
  const snapshots = await Promise.all(queries);
  snapshots.filter(Boolean).forEach(snapshot => snapshot.docs.forEach(doc => matches.set(doc.id, { id: doc.id, ...doc.data() })));

  state.books.filter(book => identities.includes(String(book.creator_id || book.creatorId || book.sellerId || '')))
    .forEach(book => matches.set(String(book.id), book));

  return [...matches.values()];
}

async function loadSellerOrders(db, user) {
  const identities = userIdentityValues(user);
  const matches = new Map();
  const queries = [];
  for (const identity of identities) {
    queries.push(db.collection('orders').where('sellerId', '==', identity).get().catch(() => null));
    queries.push(db.collection('orders').where('seller_id', '==', identity).get().catch(() => null));
  }
  const snapshots = await Promise.all(queries);
  snapshots.filter(Boolean).forEach(snapshot => snapshot.docs.forEach(doc => matches.set(doc.id, { id: doc.id, ...doc.data() })));

  return [...matches.values()];
}

async function loadWallet(db, user) {
  const identities = userIdentityValues(user);
  for (const identity of [user.uid, ...identities].filter(Boolean)) {
    try {
      const snap = await db.collection('wallets').doc(String(identity)).get();
      if (snap.exists) return { id: snap.id, ...snap.data() };
    } catch (_) {}
  }
  return {};
}

async function loadPaymentSettings() {
  let settings = state.settings || {};
  try {
    const response = await apiFetch('/api/settings/public', { cache: 'no-store' });
    if (response.ok) {
      const remote = await response.json();
      settings = {
        ...settings,
        ...remote,
        payments: { ...(settings.payments || {}), ...(remote.payments || {}) },
        payouts: { ...(settings.payouts || {}), ...(remote.payouts || {}) }
      };
      if (remote.payment_environment) settings.payments.cashfree_environment = remote.payment_environment;
    }
  } catch (_) {}
  const environment = String(settings.payments?.cashfree_environment || settings.payment_environment || 'SANDBOX').toUpperCase();
  return environment === 'PRODUCTION' ? 'Cashfree Production' : 'Cashfree Sandbox';
}

async function loadExternalSales() {
  try {
    const token = await getFreshFirebaseIdToken(true).catch(() => null);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiFetch('/api/external/commission-summary', { headers, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) return { orders: 0, gmv: 0 };
    return {
      orders: Number(data.successfulOrders || 0),
      gmv: Number(data.externalWebsiteGMV || 0)
    };
  } catch (_) {
    return { orders: 0, gmv: 0 };
  }
}

function updateMetric(root, selector, value) {
  const node = root.querySelector(selector);
  if (node) node.textContent = value;
}

export function renderCreatorDashboardPage() {
  updateSEO({
    title: 'Creator Studio & Analytics',
    description: 'Manage your eBook publications, track royalties, and request Cashfree payouts.'
  });

  const user = state.currentUser || {};
  const fallbackBooks = state.books.filter(book => String(book.creator_id || book.creatorId || book.sellerId || '') === String(user.id || user.bookoraUserId || ''));
  const pendingFallback = fallbackBooks.filter(book => normalizeStatus(book.status) === 'PENDING').length;
  const approvedFallback = fallbackBooks.filter(book => normalizeStatus(book.status) === 'APPROVED').length;

  return `
    <div class="creator-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
          <div>
            <div class="badge badge-external" style="margin-bottom: 0.5rem;">Creator Hub</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">Welcome, ${esc(user.name || 'Creator')}</h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">Track real-time royalties, sales velocity, and publication statuses.</p>
          </div>
          <div style="display: flex; gap: 0.75rem;">
            <a href="#/publish" class="btn btn-primary btn-sm">+ Publish Bookora eBook</a>
            <a href="#/publish/external" class="btn btn-secondary btn-sm">+ Add External Sales Page</a>
          </div>
        </div>

        <div class="creator-dashboard-metrics" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Available Balance</div>
            <div data-dashboard-balance style="font-size: 1.8rem; font-weight: 800; color: #059669; font-family: var(--font-display); margin: 0.4rem 0;">Loading…</div>
            <div data-dashboard-balance-sub style="font-size: 0.75rem; color: var(--text-muted);">Loading verified wallet balance</div>
          </div>
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Sales</div>
            <div data-dashboard-sales style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display); margin: 0.4rem 0;">Loading…</div>
            <div data-dashboard-sales-sub style="font-size: 0.75rem; color: var(--text-muted);">Loading verified completed purchases</div>
          </div>
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Published eBooks</div>
            <div data-dashboard-books style="font-size: 1.8rem; font-weight: 800; color: var(--accent); font-family: var(--font-display); margin: 0.4rem 0;">${approvedFallback} Active</div>
            <div data-dashboard-books-sub style="font-size: 0.75rem; color: var(--text-muted);">${pendingFallback} under review</div>
          </div>
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Payment Environment</div>
            <div data-dashboard-environment style="font-size: 1.3rem; font-weight: 800; color: #1E3A8A; font-family: var(--font-display); margin: 0.4rem 0;">Loading…</div>
            <div data-dashboard-environment-sub style="font-size: 0.75rem; color: var(--text-muted);">Loading Admin payment configuration</div>
          </div>
        </div>

        <div class="ext-zero-dashboard-card" style="background:#fff;border:1px solid #bbf7d0;border-radius:18px;padding:1.35rem 1.5rem;box-shadow:var(--shadow-sm);margin-bottom:2.5rem;">
          <div style="font-weight:900;font-size:1.05rem;color:#166534;">External Website Integration</div>
          <div style="margin-top:.7rem;display:flex;gap:.7rem;flex-wrap:wrap;align-items:center;">
            <a href="#/publish/external" class="btn btn-primary btn-sm">Manage Integration</a>
            <span data-dashboard-external-summary style="font-size:.78rem;color:#64748b;">Loading external sales…</span>
          </div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: 2.5rem;">
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">My Publications</h3>
            <span data-dashboard-title-count style="font-size: 0.8rem; color: var(--text-muted);">${fallbackBooks.length} Titles</span>
          </div>
          <div data-dashboard-publications>
            ${fallbackBooks.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead><tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">
                    <th style="padding: 1rem 1.25rem;">eBook</th><th style="padding: 1rem 1.25rem;">Type</th><th style="padding: 1rem 1.25rem;">Category</th><th style="padding: 1rem 1.25rem;">Price</th><th style="padding: 1rem 1.25rem;">Status</th><th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                  </tr></thead>
                  <tbody>${fallbackBooks.map(book => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;"><div style="width: 38px; height: 50px; border-radius: 4px; background: ${esc(book.cover_gradient || 'linear-gradient(135deg,#dbeafe,#e0e7ff)')}; flex-shrink: 0;"></div><div><strong style="color: var(--text-primary); display: block;">${esc(book.title)}</strong><span style="font-size: 0.75rem; color: var(--text-muted);">${book.pages ? `${book.pages} pages` : esc(book.source_domain || '')}</span></div></td>
                      <td style="padding: 1rem 1.25rem;"><span class="badge ${book.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">${book.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}</span></td>
                      <td style="padding: 1rem 1.25rem; color: var(--text-secondary);">${esc(book.category || '')}</td>
                      <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--text-primary);">${formatPrice(book.sale_price || book.price)}</td>
                      <td style="padding: 1rem 1.25rem;"><span class="badge ${normalizeStatus(book.status) === 'APPROVED' ? 'badge-featured' : normalizeStatus(book.status) === 'PENDING' ? 'badge-new' : ''}" style="font-size: 0.65rem;">${esc(book.status || '')}</span></td>
                      <td style="padding: 1rem 1.25rem; text-align: right;"><a href="#/book/${encodeURIComponent(book.slug || book.id)}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;">View</a></td>
                    </tr>`).join('')}</tbody>
                </table>
              </div>` : `<div style="padding: 3rem 2rem; text-align: center; color: var(--text-secondary);"><p style="margin-bottom: 1rem;">You have not published or submitted any eBooks yet.</p><a href="#/publish" class="btn btn-primary btn-sm">Publish Your First eBook</a></div>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPublications(root, books) {
  const host = root.querySelector('[data-dashboard-publications]');
  if (!host) return;
  if (!books.length) {
    host.innerHTML = `<div style="padding: 3rem 2rem; text-align: center; color: var(--text-secondary);"><p style="margin-bottom: 1rem;">You have not published or submitted any eBooks yet.</p><a href="#/publish" class="btn btn-primary btn-sm">Publish Your First eBook</a></div>`;
    return;
  }
  host.innerHTML = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:.875rem"><thead><tr style="background:var(--bg-secondary);border-bottom:1px solid var(--border-subtle);color:var(--text-muted);font-size:.75rem;text-transform:uppercase;font-weight:700"><th style="padding:1rem 1.25rem">eBook</th><th style="padding:1rem 1.25rem">Type</th><th style="padding:1rem 1.25rem">Category</th><th style="padding:1rem 1.25rem">Price</th><th style="padding:1rem 1.25rem">Status</th><th style="padding:1rem 1.25rem;text-align:right">Action</th></tr></thead><tbody>${books.map(book => `<tr style="border-bottom:1px solid var(--border-subtle)"><td style="padding:1rem 1.25rem;display:flex;align-items:center;gap:.75rem"><div style="width:38px;height:50px;border-radius:4px;background:${esc(book.cover_gradient || 'linear-gradient(135deg,#dbeafe,#e0e7ff)')};flex-shrink:0"></div><div><strong style="color:var(--text-primary);display:block">${esc(book.title)}</strong><span style="font-size:.75rem;color:var(--text-muted)">${book.pages ? `${book.pages} pages` : esc(book.source_domain || '')}</span></div></td><td style="padding:1rem 1.25rem"><span class="badge ${book.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size:.65rem">${book.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}</span></td><td style="padding:1rem 1.25rem;color:var(--text-secondary)">${esc(book.category || '')}</td><td style="padding:1rem 1.25rem;font-weight:700;color:var(--text-primary)">${formatPrice(book.sale_price || book.price)}</td><td style="padding:1rem 1.25rem"><span class="badge ${normalizeStatus(book.status)==='APPROVED'?'badge-featured':normalizeStatus(book.status)==='PENDING'?'badge-new':''}" style="font-size:.65rem">${esc(book.status || '')}</span></td><td style="padding:1rem 1.25rem;text-align:right"><a href="#/book/${encodeURIComponent(book.slug || book.id)}" class="btn btn-secondary btn-sm" style="font-size:.75rem;padding:4px 8px">View</a></td></tr>`).join('')}</tbody></table></div>`;
}

export function initCreatorDashboardEvents() {
  const root = document.querySelector('.creator-dashboard');
  if (!root || root.dataset.dashboardHydrated === '1') return;
  root.dataset.dashboardHydrated = '1';

  const refresh = async () => {
    const user = state.currentUser;
    if (!user) return;
    try {
      const db = await firestore();
      const [books, orders, wallet, environment, external] = await Promise.all([
        loadSellerBooks(db, user),
        loadSellerOrders(db, user),
        loadWallet(db, user),
        loadPaymentSettings(),
        loadExternalSales()
      ]);

      const successfulOrders = orders.filter(isSuccessfulOrder);
      const totalCopies = successfulOrders.reduce((sum, order) => sum + orderQuantity(order), 0);
      const availableBalance = Number(wallet.availableBalance ?? wallet.available ?? wallet.balance ?? 0);
      const approvedBooks = books.filter(book => ['APPROVED', 'PUBLISHED', 'ACTIVE'].includes(normalizeStatus(book.status)));
      const pendingBooks = books.filter(book => ['PENDING', 'UNDER_REVIEW', 'REVIEW'].includes(normalizeStatus(book.status)));

      updateMetric(root, '[data-dashboard-balance]', money(availableBalance));
      updateMetric(root, '[data-dashboard-balance-sub]', 'Firebase wallet balance');
      updateMetric(root, '[data-dashboard-sales]', `${totalCopies} ${totalCopies === 1 ? 'copy' : 'copies'}`);
      updateMetric(root, '[data-dashboard-sales-sub]', `${successfulOrders.length} verified paid order${successfulOrders.length === 1 ? '' : 's'}`);
      updateMetric(root, '[data-dashboard-books]', `${approvedBooks.length} Active`);
      updateMetric(root, '[data-dashboard-books-sub]', `${pendingBooks.length} under review`);
      updateMetric(root, '[data-dashboard-environment]', environment);
      updateMetric(root, '[data-dashboard-environment-sub]', environment.endsWith('Production') ? 'Live payment mode from Admin Settings' : 'Sandbox payment mode from Admin Settings');
      updateMetric(root, '[data-dashboard-external-summary]', `${external.orders} successful external orders • ${money(external.gmv)} GMV`);
      updateMetric(root, '[data-dashboard-title-count]', `${books.length} Titles`);
      renderPublications(root, books);
    } catch (error) {
      console.error('[Seller Dashboard] Firebase data load failed:', error);
      updateMetric(root, '[data-dashboard-balance]', 'Unable to load');
      updateMetric(root, '[data-dashboard-sales]', 'Unable to load');
      updateMetric(root, '[data-dashboard-environment]', 'Unable to load');
      updateMetric(root, '[data-dashboard-external-summary]', 'Sales data unavailable');
    }
  };

  refresh();
  const unsubscribe = state.subscribe(event => {
    if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED') refresh();
  });
  window.addEventListener('hashchange', () => {
    if (!String(window.location.hash || '').includes('/creator/dashboard') && !String(window.location.hash || '').includes('/seller/dashboard')) unsubscribe();
  }, { once: true });
}
