// External listing auth guard.
// The external publish form checks state.token before uploading. Restore the
// existing Bookora session first so a normal signed-in seller is not asked to
// sign in again merely because the SPA reloaded.
import { state } from './state.js';

function restoreExistingSession() {
  try {
    const token = String(localStorage.getItem('bookora_auth_token') || '').trim();
    if (token) {
      state.token = token;
      state.isAuthenticated = true;
      return true;
    }
  } catch (_) {}
  return false;
}

document.addEventListener('submit', event => {
  const form = event.target instanceof Element ? event.target : null;
  if (!form || form.id !== 'ext-submit-form') return;
  restoreExistingSession();
}, true);

restoreExistingSession();
