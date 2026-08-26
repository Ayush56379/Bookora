import { state } from './state.js';
import { apiFetch } from './config.js';
import { Toast } from './components/Toast.js';

let installed = false;
let cashfreePromise = null;

function loadCashfree() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (cashfreePromise) return cashfreePromise;
  cashfreePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bookora-cashfree-subscriptions]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree), { once: true });
      existing.addEventListener('error', () => reject(new Error('Cashfree checkout could not load.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.bookoraCashfreeSubscriptions = 'true';
    script.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error('Cashfree checkout SDK is unavailable.'));
    script.onerror = () => reject(new Error('Cashfree checkout could not load.'));
    document.head.appendChild(script);
  });
  return cashfreePromise;
}

async function beginSubscription(button, planId) {
  if (!state.isAuthenticated) {
    Toast.show('Please sign in first to start a membership.', 'info');
    window.location.hash = '#/login?returnTo=' + encodeURIComponent('/pricing');
    return;
  }
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = 'Opening secure checkout…';
  try {
    const result = await apiFetch('/api/membership/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId })
    });
    if (!result?.success || !result?.subscription) throw new Error(result?.error || 'AutoPay subscription could not be created.');
    const sub = result.subscription;
    if (sub.status === 'ACTIVE') {
      Toast.show('This membership is already active.', 'success');
      return;
    }
    if (!sub.subscription_session_id) throw new Error('Cashfree did not return a subscription checkout session.');
    const Cashfree = await loadCashfree();
    const mode = String(result.environment || 'SANDBOX').toLowerCase() === 'production' ? 'production' : 'sandbox';
    const cashfree = Cashfree({ mode });
    const checkout = await cashfree.subscriptionsCheckout({
      subsSessionId: sub.subscription_session_id,
      redirectTarget: '_self'
    });
    if (checkout?.error) throw new Error(checkout.error.message || 'Cashfree subscription checkout failed.');
  } catch (error) {
    console.error('[Bookora AutoPay]', error);
    Toast.show(error?.message || 'AutoPay checkout could not be opened.', 'error');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

function install() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('.bookora-membership-action[data-plan-id="three_month"], .bookora-membership-action[data-plan-id="six_month"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    beginSubscription(button, button.dataset.planId);
  }, true);

  const refreshStatus = async () => {
    if (!location.hash.startsWith('#/pricing') || !state.isAuthenticated) return;
    try {
      const result = await apiFetch('/api/membership/subscription/status');
      const active = (result?.subscriptions || []).find(x => ['ACTIVE', 'ON_HOLD', 'BANK_APPROVAL_PENDING', 'INITIALIZED'].includes(String(x.status || '').toUpperCase()));
      if (active) state.currentSubscription = active;
    } catch (_) {}
  };
  state.subscribe(event => {
    if (['USER_LOGGED_IN', 'DATA_SYNCED', 'MEMBERSHIP_ACTIVATED'].includes(event)) refreshStatus();
  });
  window.addEventListener('hashchange', refreshStatus);
  setTimeout(refreshStatus, 1500);
}

install();
window.BookoraMembershipAutopay = { beginSubscription, loadCashfree };
