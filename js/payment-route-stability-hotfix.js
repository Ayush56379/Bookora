// Keep the payment-result screen stable while background state synchronization runs.
// The SPA router normally re-renders on DATA_SYNCED / auth events. During payment
// verification that can replace a completed result with the initial loading card.
import { state } from './state.js';

const originalSubscribe = state.subscribe.bind(state);

state.subscribe = function stablePaymentSubscribe(callback) {
  return originalSubscribe((event) => {
    const path = (window.location.hash || '').split('?')[0];
    if (path === '#/payment/success') return;
    callback(event);
  });
};

console.log('Bookora payment-route stability hotfix installed.');
