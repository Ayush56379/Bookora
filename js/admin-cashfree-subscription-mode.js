// Bookora Admin — Cashfree Subscription environment control.
// Adds a separate AutoPay environment selector without changing the existing
// one-time payment environment setting. The selected value is persisted by the
// existing Save All Settings flow into Firestore settings.payments.
//
// IMPORTANT: this runtime must stay lightweight. Do not observe the whole DOM:
// the admin settings page and other runtimes perform many DOM updates and a
// global MutationObserver can make the Settings route consume the main thread.
import { state } from './state.js';

const ROUTE = '#/admin/settings';
const FIELD_ID = 'set-cf-subscription-env';
const CARD_ID = 'bookora-cashfree-subscription-mode';
let renderTimer = null;
let lastRouteRender = 0;

const isRoute = () => (window.location.hash || '#/').split('?')[0] === ROUTE;

function svg(kind) {
  const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if (kind === 'sandbox') return `<svg ${common}><path d="M5 9h14M7 6h10M7 18h10M5 15h14"/><path d="M8 9v6M16 9v6"/></svg>`;
  return `<svg ${common}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M8 12l2.5 2.5L16 9"/></svg>`;
}

function ensureField() {
  let field = document.getElementById(FIELD_ID);
  if (!field) {
    field = document.createElement('input');
    field.type = 'hidden';
    field.id = FIELD_ID;
    field.name = FIELD_ID;
    field.value = 'SANDBOX';
    field.setAttribute('data-bookora-autopay-field', 'true');
    document.body.appendChild(field);
  }
  return field;
}

function selectedMode() {
  const value = String(ensureField().value || 'SANDBOX').toUpperCase();
  return value === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
}

function render() {
  if (!isRoute() || !state.isAdmin) return;
  const root = document.querySelector('.admin-settings');
  if (!root) return;

  const field = ensureField();
  const settings = state.settings || {};
  const configured = String(settings.payments?.cashfree_subscription_environment || settings.payments?.cashfree_environment || field.value || 'SANDBOX').toUpperCase();
  if (!field.dataset.userChanged) field.value = configured === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';

  let card = document.getElementById(CARD_ID);
  if (!card) {
    card = document.createElement('section');
    card.id = CARD_ID;
    card.style.cssText = 'margin:18px 0;padding:18px;border:1px solid #E2E8F0;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.05);';
    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <div style="font-size:15px;font-weight:800;color:#0F172A;">Cashfree AutoPay Environment</div>
          <div style="margin-top:5px;font-size:12px;line-height:1.5;color:#64748B;">Controls only the Cashfree environment used by the 3 Month and 6 Month recurring membership flow. Existing one-time payment environment remains separate.</div>
        </div>
        <div id="bookora-cf-sub-mode-status" style="font-size:12px;font-weight:700;color:#475569;white-space:nowrap;"></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">
        <button type="button" data-bookora-cf-sub-mode="SANDBOX" style="display:inline-flex;align-items:center;gap:8px;border:1px solid #CBD5E1;border-radius:12px;padding:10px 14px;background:#fff;color:#334155;font-weight:700;cursor:pointer;">${svg('sandbox')} Sandbox</button>
        <button type="button" data-bookora-cf-sub-mode="PRODUCTION" style="display:inline-flex;align-items:center;gap:8px;border:1px solid #CBD5E1;border-radius:12px;padding:10px 14px;background:#fff;color:#334155;font-weight:700;cursor:pointer;">${svg('production')} Production</button>
      </div>
      <div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#F8FAFC;color:#64748B;font-size:11px;line-height:1.5;">Production mode requires production Cashfree credentials to be configured securely on the backend. Secret keys are never stored in Firestore or exposed in this panel.</div>`;
    const anchor = root.querySelector('[id="set-cf-api-version"]')?.closest('div') || root.firstElementChild;
    if (anchor?.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling);
    else root.prepend(card);
  }

  const mode = selectedMode();
  card.querySelectorAll('[data-bookora-cf-sub-mode]').forEach(button => {
    const active = button.dataset.bookoraCfSubMode === mode;
    button.style.background = active ? '#EEF2FF' : '#fff';
    button.style.borderColor = active ? '#6366F1' : '#CBD5E1';
    button.style.color = active ? '#3730A3' : '#334155';
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const status = card.querySelector('#bookora-cf-sub-mode-status');
  if (status) status.textContent = mode === 'PRODUCTION' ? 'Production selected' : 'Sandbox selected';
  lastRouteRender = Date.now();
}

function scheduleRender(delay = 180) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    renderTimer = null;
    if (!isRoute()) return;
    render();
  }, delay);
}

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('[data-bookora-cf-sub-mode]') : null;
  if (!target || !isRoute() || !state.isAdmin) return;
  const field = ensureField();
  field.value = target.dataset.bookoraCfSubMode === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  field.dataset.userChanged = 'true';
  render();
}, true);

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('#save-all-settings-btn')) {
    setTimeout(() => { const field = ensureField(); delete field.dataset.userChanged; scheduleRender(100); }, 500);
  }
  if (target?.closest('#reload-settings-btn')) {
    const field = ensureField(); delete field.dataset.userChanged; scheduleRender(100);
  }
}, true);

state.subscribe(event => {
  if (['SETTINGS_UPDATED', 'AUTH_STATE_CHANGED', 'USER_LOGGED_IN'].includes(event)) scheduleRender(180);
});

window.addEventListener('hashchange', () => {
  if (isRoute()) {
    // The SPA router needs a moment to replace #main-content before the card is inserted.
    scheduleRender(220);
    setTimeout(() => { if (isRoute() && Date.now() - lastRouteRender > 150) render(); }, 700);
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => scheduleRender(250), { once: true });
} else {
  scheduleRender(250);
}
