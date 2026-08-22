// Bookora Settings route stability hotfix.
// DATA_SYNCED is useful for catalog pages, but re-rendering account settings after
// background Firestore sync makes the settings screen look like it refreshes and can
// race with regional/i18n DOM work. Suppress only that route; no data is discarded.
import { state } from './state.js';

const originalNotify = state.notify.bind(state);
state.notify = function(event, payload = null) {
  const path = (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
  const isAccountSettings = path === '/settings' || path === '/settings/account' || path === '/settings/notifications' || path === '/settings/privacy';
  if (event === 'DATA_SYNCED' && isAccountSettings) {
    // Keep non-router subscribers alive. DATA_SYNCED is intentionally skipped here
    // because the settings page does not display catalog data.
    return;
  }
  return originalNotify(event, payload);
};
