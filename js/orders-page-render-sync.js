/* Re-render Order History after the asynchronous Firestore loader fills state.orders. */
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
  if (event === 'ORDERS_SYNCED') refreshIfOrdersPage();
});

window.addEventListener('bookora-orders-updated', refreshIfOrdersPage);
