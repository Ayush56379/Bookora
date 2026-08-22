// Bookora authentication hardening layer.
// Adds a reliable custom password-reset flow, generic forgot-password handling,
// and Google popup -> redirect fallback without replacing the existing auth UI.

const BOOKORA_API = window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com';
const RESET_CONTINUE_URL = `${window.location.origin}${window.location.pathname}#/reset-password`;

function auth() {
  try { return window.firebase?.auth?.() || null; } catch (_) { return null; }
}

function toast(message, type = 'info') {
  try { window.Toast?.show?.(message, type); } catch (_) {}
}

function actionParams() {
  const out = {};
  try {
    new URLSearchParams(window.location.search || '').forEach((v, k) => { out[k] = v; });
  } catch (_) {}
  try {
    const hash = window.location.hash || '';
    const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
    new URLSearchParams(query).forEach((v, k) => { out[k] = v; });
  } catch (_) {}
  return out;
}

function isResetRoute() {
  const params = actionParams();
  const path = (window.location.hash || '#/').split('?')[0];
  return path === '#/reset-password' || (params.mode === 'resetPassword' && !!params.oobCode);
}

function isForgotRoute() {
  return (window.location.hash || '#/').split('?')[0] === '#/forgot-password';
}

async function waitForFirebase(timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (window.firebase?.auth && window.firebase?.apps?.length) return auth();
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}

function redirect(hash) {
  window.location.hash = hash;
}

async function exchangeFirebaseSession(user) {
  const idToken = await user.getIdToken(true);
  const role = document.querySelector('input[name="auth-role"]:checked')?.value || 'buyer';
  const response = await fetch(`${BOOKORA_API}/api/auth/firebase`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok || !data.success) throw new Error(data.error || `Authentication failed (${response.status})`);
  try {
    const { state } = await import('./state.js');
    state.setUser(data.user, data.token || idToken);
  } catch (_) {}
  return data;
}

async function googlePopupOrRedirect() {
  const a = await waitForFirebase();
  if (!a) throw new Error('Firebase Authentication is still loading. Please try again.');
  const provider = new window.firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await a.signInWithPopup(provider);
    const data = await exchangeFirebaseSession(result.user);
    toast(`Welcome to Bookora, ${data.user?.name || result.user.displayName || 'User'}!`, 'success');
    redirect(data.is_admin ? '#/admin' : data.is_seller ? '#/creator/dashboard' : '#/');
  } catch (error) {
    const fallback = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment'];
    if (fallback.includes(error?.code)) {
      await a.signInWithRedirect(provider);
      return;
    }
    throw error;
  }
}

function installGoogleFallback() {
  document.addEventListener('click', async event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('#google-auth-btn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.authBusy === '1') return;
    button.dataset.authBusy = '1';
    button.disabled = true;
    const label = button.querySelector('span');
    if (label) label.textContent = 'Connecting to Google...';
    try {
      await googlePopupOrRedirect();
    } catch (error) {
      console.error('[Bookora Auth] Google:', error);
      toast(error?.message || 'Google sign-in failed. Please try again.', 'error');
      button.dataset.authBusy = '0';
      button.disabled = false;
      if (label) label.textContent = 'Continue with Google';
    }
  }, true);
}

async function finishGoogleRedirect() {
  const a = await waitForFirebase();
  if (!a) return;
  try {
    const result = await a.getRedirectResult();
    if (!result?.user) return;
    const data = await exchangeFirebaseSession(result.user);
    toast(`Welcome to Bookora, ${data.user?.name || result.user.displayName || 'User'}!`, 'success');
    redirect(data.is_admin ? '#/admin' : data.is_seller ? '#/creator/dashboard' : '#/');
  } catch (error) {
    if (error?.code === 'auth/no-auth-event') return;
    console.error('[Bookora Auth] Google redirect:', error);
    toast(error?.message || 'Google sign-in could not be completed.', 'error');
  }
}

function renderResetPage() {
  const root = document.getElementById('app');
  if (!root) return;
  const params = actionParams();
  const code = String(params.oobCode || '').trim();
  root.innerHTML = `
    <main style="min-height:85vh;background:var(--bg-secondary);display:flex;align-items:center;padding:4rem 1rem;">
      <div class="container" style="max-width:520px;width:100%;">
        <section style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);box-shadow:var(--shadow-md);padding:2rem;">
          <div style="text-align:center;margin-bottom:1.5rem;">
            <div style="width:48px;height:48px;border-radius:14px;background:var(--accent);display:grid;place-items:center;margin:0 auto 1rem;color:#fff;font-weight:800;">B</div>
            <h1 style="margin:0 0 .4rem;font-size:1.6rem;">Create a new password</h1>
            <p id="bookora-reset-status" style="margin:0;color:var(--text-secondary);font-size:.9rem;line-height:1.5;">Checking your reset link...</p>
          </div>
          <form id="bookora-reset-form" style="display:none;">
            <label style="display:block;font-size:.8rem;font-weight:600;margin:.9rem 0 .35rem;">New password</label>
            <input id="bookora-reset-password" type="password" minlength="6" autocomplete="new-password" required placeholder="At least 6 characters" style="width:100%;box-sizing:border-box;padding:.75rem .85rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);font-size:.95rem;">
            <label style="display:block;font-size:.8rem;font-weight:600;margin:.9rem 0 .35rem;">Confirm password</label>
            <input id="bookora-reset-confirm" type="password" minlength="6" autocomplete="new-password" required placeholder="Re-enter password" style="width:100%;box-sizing:border-box;padding:.75rem .85rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);font-size:.95rem;">
            <div id="bookora-reset-error" style="min-height:20px;margin:.7rem 0;color:#b91c1c;font-size:.8rem;"></div>
            <button id="bookora-reset-submit" class="btn btn-primary btn-lg" type="submit" style="width:100%;padding:.85rem;font-weight:700;">Update Password</button>
          </form>
          <div style="text-align:center;margin-top:1rem;"><a href="#/login" style="color:var(--accent);font-weight:700;">Back to Sign In</a></div>
        </section>
      </div>
    </main>`;

  const status = document.getElementById('bookora-reset-status');
  const form = document.getElementById('bookora-reset-form');
  const errorBox = document.getElementById('bookora-reset-error');
  if (!code) {
    status.textContent = 'This password reset link is missing or invalid. Please request a new one.';
    return;
  }

  waitForFirebase().then(async a => {
    if (!a) throw new Error('Firebase Authentication could not be loaded.');
    const email = await a.verifyPasswordResetCode(code);
    status.textContent = `Resetting the password for ${email}.`;
    form.style.display = 'block';
    form.addEventListener('submit', async event => {
      event.preventDefault();
      errorBox.textContent = '';
      const password = document.getElementById('bookora-reset-password').value;
      const confirm = document.getElementById('bookora-reset-confirm').value;
      if (password.length < 6) { errorBox.textContent = 'Password must be at least 6 characters.'; return; }
      if (password !== confirm) { errorBox.textContent = 'Passwords do not match.'; return; }
      const button = document.getElementById('bookora-reset-submit');
      button.disabled = true;
      button.textContent = 'Updating...';
      try {
        await a.confirmPasswordReset(code, password);
        status.textContent = 'Password updated successfully. Redirecting to Sign In...';
        form.style.display = 'none';
        toast('Password updated successfully. Please sign in.', 'success');
        setTimeout(() => redirect('#/login'), 700);
      } catch (error) {
        const messages = {
          'auth/expired-action-code': 'This reset link has expired. Please request a new one.',
          'auth/invalid-action-code': 'This reset link is invalid or has already been used. Please request a new one.',
          'auth/weak-password': 'Choose a stronger password with at least 6 characters.'
        };
        errorBox.textContent = messages[error?.code] || error?.message || 'Password reset failed. Please request a new link.';
        button.disabled = false;
        button.textContent = 'Update Password';
      }
    });
  }).catch(error => {
    console.error('[Bookora Auth] Reset verification:', error);
    status.textContent = error?.code === 'auth/expired-action-code'
      ? 'This reset link has expired. Please request a new one.'
      : 'This password reset link is invalid or has already been used.';
  });
}

function installForgotOverride() {
  document.addEventListener('submit', async event => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form || !isForgotRoute()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const email = String(form.querySelector('#auth-email')?.value || '').trim().toLowerCase();
    const button = form.querySelector('#auth-submit-btn');
    if (!email) { toast('Please enter your email address.', 'error'); return; }
    if (button) { button.disabled = true; button.textContent = 'Sending Reset Link...'; }
    try {
      const a = await waitForFirebase();
      if (!a) throw new Error('Firebase Authentication is still loading. Please try again.');
      await a.sendPasswordResetEmail(email, { url: RESET_CONTINUE_URL, handleCodeInApp: true });
      toast('If an account exists for that email, a password reset link has been sent.', 'success');
      redirect('#/login');
    } catch (error) {
      console.error('[Bookora Auth] Forgot password:', error);
      const message = error?.code === 'auth/invalid-email' ? 'Please enter a valid email address.' : 'Could not send the reset link. Please try again.';
      toast(message, 'error');
      if (button) { button.disabled = false; button.textContent = 'Send Password Reset Link'; }
    }
  }, true);
}

function routeFixes() {
  if (isResetRoute()) setTimeout(renderResetPage, 0);
}

installGoogleFallback();
installForgotOverride();
window.addEventListener('hashchange', routeFixes);
window.addEventListener('load', () => { finishGoogleRedirect(); routeFixes(); });
routeFixes();
