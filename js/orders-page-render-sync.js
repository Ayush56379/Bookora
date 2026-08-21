/* Order History render synchronization and retry control. */
import { state } from './state.js';

let scheduled = false;
function refreshIfOrdersPage() {
  if (scheduled) return;
  const path = (window.location.hash || '#/').split('?')[0];
  if (path !== '#/orders') return;
  scheduled = true;
  window.setTimeout(() => {
    scheduled = false;
    window.dispatchEvent(new Event('hashchange'));
  }, 0);
}

state.subscribe(event => {
  if (event === 'ORDERS_SYNCED' || event === 'ORDERS_LOAD_ERROR') refreshIfOrdersPage();
});

window.addEventListener('bookora-orders-updated', refreshIfOrdersPage);
window.addEventListener('bookora-orders-error', refreshIfOrdersPage);

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('.orders-retry-btn') : null;
  if (!target) return;
  event.preventDefault();
  if (window.BookoraOrders?.refresh) window.BookoraOrders.refresh();
});
