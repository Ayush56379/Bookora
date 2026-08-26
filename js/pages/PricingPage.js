import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const MEMBERSHIP_PLANS = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    duration: '2 Days',
    badge: 'TRY FREE',
    tone: 'green',
    description: 'Try Bookora with any 2 eBooks for 48 hours.',
    features: ['Choose any 2 eBooks', 'Access for 2 days', 'One trial per account', 'Trial expires automatically'],
    cta: 'Start Free Trial'
  },
  {
    id: 'three_month',
    name: '3 Month Pass',
    price: 999,
    duration: '3 Months',
    badge: 'POPULAR',
    tone: 'blue',
    description: 'Unlimited access to the Bookora eBook collection for 3 months.',
    features: ['All eBooks access', 'New eBooks included', 'Read on supported devices', 'Instant access', 'Valid for 3 months'],
    cta: 'Get 3 Months'
  },
  {
    id: 'six_month',
    name: '6 Month Pass',
    price: 1999,
    duration: '6 Months',
    badge: 'BETTER VALUE',
    tone: 'purple',
    description: 'Longer unlimited reading access with better value.',
    features: ['All eBooks access', 'New eBooks included', 'Read on supported devices', 'Instant access', 'Valid for 6 months'],
    cta: 'Get 6 Months'
  },
  {
    id: 'lifetime',
    name: 'Lifetime Access',
    price: 3999,
    duration: 'One-time Payment',
    badge: 'BEST VALUE',
    tone: 'gold',
    description: 'Pay once and keep unlimited Bookora access for life.',
    features: ['All eBooks access', 'Future eligible eBooks included', 'Read on supported devices', 'Lifetime access', 'One-time payment', 'No renewal'],
    cta: 'Get Lifetime Access'
  }
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
}

function toneStyle(tone) {
  const map = {
    green: { accent: '#059669', soft: '#ECFDF5', border: '#A7F3D0' },
    blue: { accent: '#2563EB', soft: '#EFF6FF', border: '#BFDBFE' },
    purple: { accent: '#7C3AED', soft: '#F5F3FF', border: '#DDD6FE' },
    gold: { accent: '#C78A00', soft: '#FFFBEB', border: '#FDE68A' }
  };
  return map[tone] || map.blue;
}

function getActiveMembership() {
  const sub = state.currentSubscription;
  if (!sub || String(sub.status || '').toUpperCase() !== 'ACTIVE') return null;
  if (sub.access_type === 'lifetime' || sub.plan_id === 'lifetime') return sub;
  const expiry = Date.parse(sub.end_date || sub.expiresAt || '');
  return Number.isFinite(expiry) && expiry > Date.now() ? sub : null;
}

function renderPlan(plan) {
  const tone = toneStyle(plan.tone);
  const active = getActiveMembership();
  const isActive = active && active.plan_id === plan.id;
  return `
    <article class="bookora-membership-card" data-plan="${plan.id}" style="--plan-accent:${tone.accent};--plan-soft:${tone.soft};--plan-border:${tone.border};background:#fff;border:1.5px solid ${isActive ? tone.accent : tone.border};border-radius:24px;padding:30px 24px 24px;display:flex;flex-direction:column;position:relative;box-shadow:${plan.id === 'lifetime' ? '0 18px 45px rgba(199,138,0,.14)' : '0 10px 30px rgba(15,23,42,.06)'};min-height:560px;overflow:visible;">
      <div style="position:absolute;top:-13px;left:24px;background:${tone.accent};color:#fff;border-radius:999px;padding:7px 13px;font-size:11px;font-weight:900;letter-spacing:.06em;box-shadow:0 6px 16px rgba(15,23,42,.12);">${escapeHtml(plan.badge)}</div>
      <div style="width:58px;height:58px;border-radius:18px;background:${tone.soft};display:grid;place-items:center;color:${tone.accent};margin:5px auto 18px;font-size:28px;">
        ${plan.id === 'free_trial' ? '⏱' : plan.id === 'three_month' ? '📚' : plan.id === 'six_month' ? '📖' : '♾'}
      </div>
      <h3 style="margin:0;text-align:center;font-size:22px;font-weight:900;color:#0F172A;">${escapeHtml(plan.name)}</h3>
      <p style="min-height:48px;margin:9px 0 18px;text-align:center;color:#64748B;font-size:13px;line-height:1.55;">${escapeHtml(plan.description)}</p>
      <div style="text-align:center;padding:14px 0 18px;border-top:1px solid #EEF2F7;border-bottom:1px solid #EEF2F7;">
        <div style="font-size:42px;line-height:1;font-weight:950;color:#0F172A;">${formatPrice(plan.price, 'INR')}</div>
        <div style="display:inline-block;margin-top:9px;padding:6px 11px;border-radius:999px;background:${tone.soft};color:${tone.accent};font-size:12px;font-weight:800;">${escapeHtml(plan.duration)}</div>
      </div>
      <ul style="list-style:none;padding:0;margin:21px 0 24px;display:flex;flex-direction:column;gap:12px;flex:1;">
        ${plan.features.map(feature => `<li style="display:flex;gap:9px;align-items:flex-start;color:#334155;font-size:13.5px;line-height:1.4;"><span style="width:19px;height:19px;border-radius:50%;background:${tone.soft};color:${tone.accent};display:grid;place-items:center;font-weight:900;flex:none;font-size:12px;">✓</span><span>${escapeHtml(feature)}</span></li>`).join('')}
      </ul>
      ${isActive ? `<button disabled class="btn btn-secondary btn-lg" style="width:100%;font-weight:900;">✓ Active Plan</button>` : `<button class="btn btn-lg bookora-membership-action" data-plan-id="${plan.id}" style="width:100%;font-weight:900;background:${tone.accent};border-color:${tone.accent};color:#fff;">${escapeHtml(plan.cta)}</button>`}
      <div style="text-align:center;color:#94A3B8;font-size:11px;margin-top:10px;">${plan.id === 'free_trial' ? 'No payment required' : plan.id === 'lifetime' ? 'Pay once, use forever' : 'One-time payment · no auto-renewal'}</div>
    </article>`;
}

function renderTrialModal() {
  return `
    <div id="bookora-trial-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.58);backdrop-filter:blur(7px);padding:20px;align-items:center;justify-content:center;">
      <div style="width:min(920px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:26px;box-shadow:0 30px 80px rgba(15,23,42,.28);padding:26px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px;">
          <div><div style="color:#059669;font-weight:900;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Free Trial</div><h2 style="margin:5px 0 4px;font-size:27px;font-weight:950;color:#0F172A;">Choose any 2 eBooks</h2><p style="margin:0;color:#64748B;font-size:14px;">Read your selected books free for 48 hours. One trial per account.</p></div>
          <button id="bookora-trial-close" aria-label="Close" style="border:0;background:#F1F5F9;width:38px;height:38px;border-radius:50%;font-size:20px;cursor:pointer;">×</button>
        </div>
        <div id="bookora-trial-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;padding-top:18px;border-top:1px solid #E2E8F0;flex-wrap:wrap;">
          <strong id="bookora-trial-count" style="color:#0F172A;">0 / 2 selected</strong>
          <button id="bookora-trial-start" class="btn btn-primary btn-lg" disabled>Start 2-Day Trial</button>
        </div>
      </div>
    </div>`;
}

function renderTrialBooks() {
  const grid = document.getElementById('bookora-trial-grid');
  if (!grid) return;
  const books = state.getApprovedBooks().slice(0, 80);
  grid.innerHTML = books.map(book => `
    <button type="button" class="bookora-trial-book" data-book-id="${escapeHtml(book.id)}" aria-pressed="false" style="text-align:left;border:1px solid #E2E8F0;background:#fff;border-radius:16px;padding:9px;cursor:pointer;transition:.15s;">
      <div style="aspect-ratio:3/4;border-radius:11px;overflow:hidden;background:linear-gradient(145deg,#0F172A,#2563EB);margin-bottom:9px;">
        ${book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">` : '<div style="height:100%;display:grid;place-items:center;color:#fff;font-size:26px;">📖</div>'}
      </div>
      <strong style="display:block;color:#0F172A;font-size:12px;line-height:1.3;">${escapeHtml(book.title)}</strong>
      <span style="display:block;color:#64748B;font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(book.author || 'Bookora')}</span>
    </button>`).join('') || '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#64748B;">No eligible eBooks are available right now.</div>';
}

async function loadCashfreeSdk() {
  if (window.Cashfree) return window.Cashfree;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bookora-cashfree-membership]');
    if (existing) { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', () => reject(new Error('Cashfree SDK failed to load')), { once: true }); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.bookoraCashfreeMembership = 'true';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load Cashfree SDK'));
    document.head.appendChild(script);
  });
  if (!window.Cashfree) throw new Error('Cashfree SDK unavailable.');
  return window.Cashfree;
}

async function ensureBackendSession() {
  if (state.token) return true;
  try {
    if (window.BookoraPurchaseAccess?.ensureBackendSession) {
      await window.BookoraPurchaseAccess.ensureBackendSession(false);
      return !!state.token;
    }
  } catch (_) {}
  return false;
}

async function startPaidPlan(planId, button) {
  if (!state.isAuthenticated) {
    Toast.show('Please sign in first to choose a membership.', 'info');
    window.location.hash = '#/login?returnTo=' + encodeURIComponent('/pricing');
    return;
  }
  await ensureBackendSession();
  if (!state.token) throw new Error('Your secure session is not ready. Please sign in again.');
  button.disabled = true;
  const old = button.textContent;
  button.textContent = 'Opening Cashfree...';
  try {
    const created = await apiFetch('/api/membership/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, phone: state.currentUser?.phone || state.currentUser?.phoneNumber || '' })
    });
    if (!created?.payment_session_id || !created?.order_id) throw new Error('Cashfree payment session was not returned.');
    const Cashfree = await loadCashfreeSdk();
    const cf = Cashfree({ mode: String(created.environment || '').toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox' });
    await cf.checkout({ paymentSessionId: created.payment_session_id, redirectTarget: '_self' });
  } catch (error) {
    console.error('[Bookora membership payment]', error);
    button.disabled = false;
    button.textContent = old;
    throw error;
  }
}

async function startFreeTrial() {
  if (!state.isAuthenticated) {
    Toast.show('Please sign in first to start the free trial.', 'info');
    window.location.hash = '#/login?returnTo=' + encodeURIComponent('/pricing');
    return;
  }
  const modal = document.getElementById('bookora-trial-modal');
  const selected = [...document.querySelectorAll('.bookora-trial-book[aria-pressed="true"]')].map(el => el.dataset.bookId);
  if (selected.length !== 2) return;
  const button = document.getElementById('bookora-trial-start');
  button.disabled = true;
  button.textContent = 'Starting...';
  try {
    const result = await apiFetch('/api/membership/trial', { method: 'POST', body: JSON.stringify({ book_ids: selected }) });
    if (!result?.success) throw new Error(result?.error || 'Free Trial could not be started.');
    const ids = new Set(selected.map(String));
    state.getApprovedBooks().forEach(book => { if (ids.has(String(book.id))) state.library.add(String(book.id)); });
    localStorage.setItem('bookora_trial_started_at', result.trial.startedAt);
    localStorage.setItem('bookora_trial_expires_at', result.trial.expiresAt);
    Toast.show('Free Trial started — your 2 selected eBooks are available for 48 hours.', 'success');
    modal.style.display = 'none';
  } catch (error) {
    Toast.show(error.message || 'Free Trial could not be started.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Start 2-Day Trial';
  }
}

async function verifyReturnedMembershipOrder() {
  const hash = window.location.hash || '';
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const orderId = new URLSearchParams(query).get('membership_order_id');
  if (!orderId || !state.isAuthenticated) return;
  await ensureBackendSession();
  if (!state.token) return;
  try {
    const result = await apiFetch('/api/membership/verify-order?order_id=' + encodeURIComponent(orderId));
    if (result?.paid && result.subscription) {
      state.currentSubscription = result.subscription;
      const books = state.getApprovedBooks();
      books.forEach(book => state.library.add(String(book.id)));
      state.notify('MEMBERSHIP_ACTIVATED', result.subscription);
      Toast.show(`${result.subscription.plan_name} activated successfully. All eBooks are now available.`, 'success');
      history.replaceState(null, '', window.location.pathname + window.location.search + '#/pricing');
    } else if (result?.status) {
      Toast.show(`Payment status: ${result.status}. Access will activate after Cashfree confirms payment.`, 'info');
    }
  } catch (error) {
    console.warn('[Bookora membership verification]', error);
    Toast.show(error.message || 'Membership payment verification is still pending.', 'info');
  }
}

export function renderPricingPage() {
  updateSEO({ title: 'Bookora Pricing & Memberships', description: 'Choose a Bookora Free Trial, 3 Month, 6 Month or Lifetime eBook access plan.' });
  return `
    <div class="pricing-page bookora-membership-page animate-fade-in" style="background:#F8FAFC;min-height:85vh;padding:64px 0 76px;">
      <div class="container" style="max-width:1320px;">
        <div style="text-align:center;max-width:850px;margin:0 auto 54px;">
          <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #BFDBFE;background:#EFF6FF;color:#2563EB;border-radius:999px;padding:7px 14px;font-size:12px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;">Transparent Memberships</div>
          <h1 style="font-family:var(--font-display);font-size:clamp(2.2rem,5vw,3.7rem);line-height:1.05;font-weight:950;color:#0F172A;margin:18px 0 15px;">Simple, Accessible Reading Plans</h1>
          <p style="font-size:17px;color:#64748B;line-height:1.65;margin:0;">Try Bookora free, choose a fixed-duration pass, or unlock lifetime access. All paid passes are one-time payments with no automatic renewal.</p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:34px;">
          ${MEMBERSHIP_PLANS.map(renderPlan).join('')}
        </div>

        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:22px;padding:22px 26px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;box-shadow:0 8px 28px rgba(15,23,42,.04);margin-bottom:30px;">
          ${[['🛡','100% Safe & Secure','Secure Cashfree payments'],['📱','Read Anywhere','Mobile, tablet & desktop'],['⚡','Instant Access','Access after verified payment'],['🎧','Support','We are here to help']].map(x => `<div style="display:flex;gap:12px;align-items:center;"><span style="width:42px;height:42px;border-radius:13px;background:#EFF6FF;display:grid;place-items:center;font-size:20px;">${x[0]}</span><div><strong style="display:block;color:#0F172A;font-size:13px;">${x[1]}</strong><span style="display:block;color:#64748B;font-size:11px;margin-top:3px;">${x[2]}</span></div></div>`).join('')}
        </div>

        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:22px;padding:30px 34px;box-shadow:0 8px 28px rgba(15,23,42,.04);">
          <h2 style="margin:0 0 20px;font-size:22px;font-weight:950;color:#0F172A;">Membership FAQs</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div><strong style="display:block;color:#0F172A;margin-bottom:6px;">Is the Free Trial really free?</strong><p style="margin:0;color:#64748B;line-height:1.6;font-size:14px;">Yes. Select any 2 eligible eBooks and get access for 48 hours. Each account can use the trial only once.</p></div>
            <div><strong style="display:block;color:#0F172A;margin-bottom:6px;">Do paid plans auto-renew?</strong><p style="margin:0;color:#64748B;line-height:1.6;font-size:14px;">No. The 3-month, 6-month and Lifetime plans are one-time Cashfree payments. There is no automatic renewal.</p></div>
            <div><strong style="display:block;color:#0F172A;margin-bottom:6px;">What does All eBooks access mean?</strong><p style="margin:0;color:#64748B;line-height:1.6;font-size:14px;">During an active paid pass, eligible Bookora eBooks are available through your Library. Lifetime access remains active permanently.</p></div>
            <div><strong style="display:block;color:#0F172A;margin-bottom:6px;">What happens when a 3/6 month pass expires?</strong><p style="margin:0;color:#64748B;line-height:1.6;font-size:14px;">Membership access ends automatically. Any eBooks you purchased individually with permanent ownership remain in your Library.</p></div>
          </div>
        </div>
      </div>
      ${renderTrialModal()}
    </div>`;
}

export function renderSubscriptionManagePage() {
  updateSEO({ title: 'Manage Membership', description: 'Manage your Bookora membership.' });
  const sub = getActiveMembership();
  return `<div class="subscription-manage-page" style="background:#F8FAFC;min-height:85vh;padding:60px 20px;"><div style="max-width:780px;margin:auto;background:#fff;border:1px solid #E2E8F0;border-radius:24px;padding:34px;box-shadow:0 12px 36px rgba(15,23,42,.06);"><a href="#/pricing" style="color:#2563EB;font-weight:800;font-size:13px;">← Back to Pricing</a><h1 style="font-size:32px;font-weight:950;color:#0F172A;margin:12px 0 24px;">My Membership</h1>${sub ? `<div style="padding:22px;border-radius:18px;background:#EFF6FF;border:1px solid #BFDBFE;"><div style="font-size:12px;font-weight:900;color:#2563EB;text-transform:uppercase;">Active</div><h2 style="margin:5px 0;color:#0F172A;">${escapeHtml(sub.plan_name)}</h2><p style="margin:0;color:#475569;">${sub.access_type === 'lifetime' ? 'Lifetime access' : `Access until ${escapeHtml((sub.end_date || '').split('T')[0])}`}</p></div>` : `<div style="text-align:center;padding:35px;"><h3 style="color:#0F172A;">No active membership</h3><p style="color:#64748B;">Choose a plan to unlock more reading access.</p><a class="btn btn-primary" href="#/pricing">View Plans</a></div>`}</div></div>`;
}

export function initPricingEvents() {
  document.querySelectorAll('.bookora-membership-action').forEach(button => {
    button.addEventListener('click', async () => {
      const planId = button.dataset.planId;
      try {
        if (planId === 'free_trial') {
          const modal = document.getElementById('bookora-trial-modal');
          modal.style.display = 'flex';
          renderTrialBooks();
          return;
        }
        await startPaidPlan(planId, button);
      } catch (error) {
        Toast.show(error.message || 'Unable to start this plan.', 'error');
      }
    });
  });

  const modal = document.getElementById('bookora-trial-modal');
  document.getElementById('bookora-trial-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
  modal?.addEventListener('click', event => { if (event.target === modal) modal.style.display = 'none'; });
  document.getElementById('bookora-trial-start')?.addEventListener('click', startFreeTrial);

  document.getElementById('bookora-trial-grid')?.addEventListener('click', event => {
    const button = event.target.closest('.bookora-trial-book');
    if (!button) return;
    const selected = document.querySelectorAll('.bookora-trial-book[aria-pressed="true"]');
    const isSelected = button.getAttribute('aria-pressed') === 'true';
    if (!isSelected && selected.length >= 2) {
      Toast.show('You can select only 2 eBooks.', 'info');
      return;
    }
    button.setAttribute('aria-pressed', String(!isSelected));
    button.style.borderColor = !isSelected ? '#059669' : '#E2E8F0';
    button.style.boxShadow = !isSelected ? '0 0 0 3px #D1FAE5' : 'none';
    const count = document.querySelectorAll('.bookora-trial-book[aria-pressed="true"]').length;
    const countEl = document.getElementById('bookora-trial-count');
    const start = document.getElementById('bookora-trial-start');
    if (countEl) countEl.textContent = `${count} / 2 selected`;
    if (start) start.disabled = count !== 2;
  });

  verifyReturnedMembershipOrder();
}
