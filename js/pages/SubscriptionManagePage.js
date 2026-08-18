import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
}

function dateValue(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return esc(value).split('T')[0];
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(value) {
  if (!value) return null;
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

function statusMeta(sub) {
  const status = String(sub?.status || '').toUpperCase();
  if (status === 'ACTIVE') return { label: 'Active', cls: 'sm-status-active', icon: '✓' };
  if (status === 'CANCELLED') return { label: 'Cancelled', cls: 'sm-status-cancelled', icon: '×' };
  if (status === 'PENDING') return { label: 'Payment pending', cls: 'sm-status-pending', icon: '•' };
  return { label: status || 'Inactive', cls: 'sm-status-neutral', icon: '•' };
}

export function renderSubscriptionManagePage() {
  updateSEO({
    title: 'Manage Subscription',
    description: 'View and manage your Bookora subscription, expiry, renewal and billing details.'
  });

  const sub = state.currentSubscription && typeof state.currentSubscription === 'object'
    ? state.currentSubscription
    : null;
  const meta = statusMeta(sub);
  const remaining = daysLeft(sub?.end_date || sub?.endDate || sub?.expires_at || sub?.expiresAt);
  const user = state.currentUser || {};

  return `
    <section class="subscription-manage-page">
      <div class="sm-shell">
        <div class="sm-breadcrumb">
          <a href="#/dashboard">← Dashboard</a>
          <span>/</span>
          <span>Subscription</span>
        </div>

        <div class="sm-hero">
          <div>
            <span class="sm-eyebrow">BOOKORA MEMBERSHIP</span>
            <h1>Manage your subscription</h1>
            <p>Keep your reading membership, billing status and access period in one place.</p>
          </div>
          <div class="sm-user-chip">
            <span class="sm-avatar">${esc((user.name || user.email || 'B').slice(0, 1).toUpperCase())}</span>
            <span>${esc(user.name || 'Bookora Reader')}</span>
          </div>
        </div>

        ${sub && String(sub.status || '').toUpperCase() === 'ACTIVE' ? `
          <div class="sm-grid">
            <div class="sm-main-card">
              <div class="sm-card-top">
                <div>
                  <span class="sm-pill ${meta.cls}"><b>${meta.icon}</b> ${meta.label}</span>
                  <h2>${esc(sub.plan_name || sub.planName || 'Bookora Membership')}</h2>
                  <p>${esc(sub.description || 'Unlimited access to eligible Bookora publications.')}</p>
                </div>
                <div class="sm-price">
                  <strong>${formatPrice(Number(sub.amount || sub.price || 0), sub.currency || 'INR')}</strong>
                  <span>${sub.interval ? `/${esc(sub.interval)}` : 'membership'}</span>
                </div>
              </div>

              <div class="sm-progress-wrap">
                <div class="sm-progress-label"><span>Membership period</span><strong>${remaining === null ? 'Active' : `${remaining} day${remaining === 1 ? '' : 's'} remaining`}</strong></div>
                <div class="sm-progress"><span style="width:${remaining === null ? 100 : Math.min(100, Math.max(5, remaining > 365 ? 100 : (remaining / 365) * 100))}%"></span></div>
              </div>

              <div class="sm-info-grid">
                <div class="sm-info"><span>Started</span><strong>${dateValue(sub.start_date || sub.startDate || sub.created_at)}</strong></div>
                <div class="sm-info"><span>Expires</span><strong>${dateValue(sub.end_date || sub.endDate || sub.expires_at || sub.expiresAt)}</strong></div>
                <div class="sm-info"><span>Payment status</span><strong>${esc(sub.payment_status || sub.paymentStatus || 'Verified')}</strong></div>
                <div class="sm-info"><span>Order ID</span><strong class="sm-mono">${esc(sub.order_id || sub.orderId || '—')}</strong></div>
              </div>

              <div class="sm-actions">
                <a class="sm-btn sm-btn-primary" href="#/pricing">Change plan</a>
                <button class="sm-btn sm-btn-danger" id="sm-cancel-btn" type="button">Cancel renewal</button>
              </div>
              <p class="sm-note">Cancellation stops future renewal. Your verified access remains available until the current subscription period ends.</p>
            </div>

            <aside class="sm-side-card">
              <div class="sm-side-icon">✓</div>
              <h3>Access is active</h3>
              <p>Your subscription controls reading access for eligible eBooks. Individual purchases remain separate from membership access.</p>
              <a href="#/library" class="sm-side-link">Open my library →</a>
            </aside>
          </div>
        ` : `
          <div class="sm-empty-card">
            <div class="sm-empty-icon">⌁</div>
            <span class="sm-eyebrow">NO ACTIVE MEMBERSHIP</span>
            <h2>Choose a reading plan</h2>
            <p>You don't currently have an active verified subscription. Explore the available plans and choose the one that fits your reading needs.</p>
            <div class="sm-empty-actions">
              <a class="sm-btn sm-btn-primary" href="#/pricing">View plans</a>
              <a class="sm-btn sm-btn-secondary" href="#/explore">Explore eBooks</a>
            </div>
          </div>
        `}

        <div class="sm-trust-row">
          <div><b>🔒</b><span>Secure payment processing</span></div>
          <div><b>✓</b><span>Verified membership status</span></div>
          <div><b>↻</b><span>Access updates automatically</span></div>
        </div>
      </div>
    </section>
  `;
}

async function refreshSubscriptionFromBackend() {
  if (!state.isAuthenticated) return null;
  const token = state.token || localStorage.getItem('bookora_backend_token') || '';
  if (!token) return null;
  try {
    const res = await apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.subscription !== undefined) {
      state.currentSubscription = data.subscription || null;
      return state.currentSubscription;
    }
  } catch (error) {
    console.warn('Subscription refresh skipped:', error.message);
  }
  return null;
}

export async function initSubscriptionManageEvents() {
  const page = document.querySelector('.subscription-manage-page');
  if (!page) return;

  await refreshSubscriptionFromBackend();

  const current = state.currentSubscription;
  const status = String(current?.status || '').toUpperCase();
  if (current && status === 'ACTIVE') {
    const token = state.token || localStorage.getItem('bookora_backend_token') || '';
    const cancelBtn = document.getElementById('sm-cancel-btn');
    cancelBtn?.addEventListener('click', async () => {
      if (!token) {
        Toast.show('Your secure session is not ready. Please sign in again.', 'warning');
        return;
      }
      const ok = window.confirm('Cancel future renewal for this subscription?');
      if (!ok) return;

      cancelBtn.disabled = true;
      cancelBtn.textContent = 'Cancelling…';
      try {
        const res = await apiFetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.error || 'Unable to cancel subscription.');
        if (data.subscription) state.currentSubscription = data.subscription;
        Toast.show('Subscription renewal cancelled.', 'success');
        window.dispatchEvent(new Event('hashchange'));
      } catch (error) {
        cancelBtn.disabled = false;
        cancelBtn.textContent = 'Cancel renewal';
        Toast.show(error.message || 'Unable to cancel subscription.', 'error');
      }
    });
  }
}
