
function getPostLoginRedirect(isAdmin, isSeller) {
  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const returnTo = searchParams.get('returnTo');
  if (returnTo && returnTo.startsWith('/')) {
    return `#${returnTo}`;
  }
  if (isAdmin) return '#/admin';
  if (isSeller) return '#/creator/dashboard';
  return '#/';
}

import { apiFetch } from '../config.js';
// AuthPages Component (Google Identity Services, Firebase Auth, Apple ID, Email+Password)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';
import { signInWithGoogleFirebase } from '../services/firebase.js';

const GOOGLE_CLIENT_ID = "1099320965452-bo5180hlnqiglopa1gohp30netaf0cbm.apps.googleusercontent.com";

function setupGoogleIdentity() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleAuthCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const btnContainer = document.getElementById('google-btn-slot');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: btnContainer.offsetWidth || 340
        });
      }
    } catch (err) {
      console.warn('Google Identity initialization notice:', err);
    }
  }
}

async function handleGoogleAuthCallback(response) {
  if (!response || !response.credential) {
    Toast.show('Google authentication was cancelled.', 'warning');
    return;
  }

  Toast.show('Authenticating with Google...', 'info');

  try {
    const res = await apiFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      state.token = data.token;
      localStorage.setItem('bookora_auth_token', data.token);
      state.currentUser = data.user;
      state.isAuthenticated = true;
      state.isAdmin = data.is_admin;
      state.isSeller = data.is_seller;
      state.setActiveMode(data.is_admin ? 'admin' : (data.is_seller ? 'seller' : 'buyer'));
      await state.syncData();
      Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
      window.location.hash = getPostLoginRedirect(data.is_admin, data.is_seller);
    } else {
      Toast.show(data.error || 'Google sign-in failed.', 'error');
    }
  } catch (err) {
    Toast.show('Network error during Google authentication.', 'error');
  }
}

export function renderAuthPage(type = 'login') {
  updateSEO({
    title: type === 'signup' || type === 'register' ? 'Create Account' : type === 'forgot' ? 'Reset Password' : type === 'reset' ? 'Set New Password' : type === 'verify' ? 'Email Verification' : 'Sign In',
    description: 'Secure authentication on Bookora.'
  });

  return `
    <div class="auth-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0; display: flex; align-items: center;">
      <div class="container" style="max-width: 920px;">
        
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; display: grid; grid-template-columns: 1fr 1.2fr;" class="auth-split-grid">
          
          <!-- LEFT: Brand Showcase Banner -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFFFFF; padding: 3rem 2.5rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.4rem;">Bookora</span>
              </div>

              <h2 style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 800; line-height: 1.25; margin-bottom: 1rem;">
                ${type === 'signup' || type === 'register' ? 'Join the Future of Digital Reading & Publishing' : 'Welcome Back to Your Knowledge Library'}
              </h2>
              <p style="font-size: 0.95rem; opacity: 0.85; line-height: 1.6;">
                Discover inspiring books, read in-browser across themes, and publish your own works directly with 85% royalties.
              </p>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 1.5rem; font-size: 0.8rem; opacity: 0.75; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>256-bit Encrypted Session Security</span>
            </div>
          </div>

          <!-- RIGHT: Interactive Auth Form -->
          <div style="padding: 3rem 2.5rem;">
            
            <h1 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
              ${type === 'signup' || type === 'register' ? 'Create Your Account' : type === 'forgot' ? 'Reset Password' : type === 'verify' ? 'Email Verification' : 'Sign In to Bookora'}
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.75rem;">
              ${type === 'signup' || type === 'register' ? 'Sign up in seconds to start reading or selling.' : type === 'forgot' ? 'Enter your email to receive recovery instructions.' : 'Enter your credentials to access your library.'}
            </p>

            ${type === 'login' || type === 'signup' || type === 'register' ? `
              <!-- Social Authentication Buttons -->
              <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
                
                <!-- Google Sign In (Official Google Identity Services) -->
                <div id="google-btn-slot" style="min-height: 40px; display: flex; justify-content: center;">
                  <button type="button" id="google-auth-btn" class="btn btn-secondary" style="width: 100%; padding: 0.65rem; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.75rem; border-color: var(--border-medium);">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <!-- Apple Sign In -->
                <button type="button" id="apple-auth-btn" class="btn btn-secondary" style="width: 100%; padding: 0.65rem; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.75rem; border-color: var(--border-medium);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.14 1.86-1 2.98 1.07.08 2.17-.51 2.83-1.33z"/></svg>
                  <span>Continue with Apple</span>
                </button>

              </div>

              <!-- Divider -->
              <div style="position: relative; margin: 1.5rem 0; text-align: center;">
                <div style="position: absolute; inset: 0; display: flex; align-items: center;"><div style="width: 100%; border-top: 1px solid var(--border-subtle);"></div></div>
                <span style="position: relative; background: #FFFFFF; padding: 0 10px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Or with Email</span>
              </div>
            ` : ''}

            <!-- Form -->
            <form id="auth-form">
              
              ${type === 'signup' || type === 'register' ? `
                <!-- Account Role Selection (Only Buyer vs Creator - NEVER Admin) -->
                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem;">I want to join as:</label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <label style="border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 0.65rem; display: flex; flex-direction: column; cursor: pointer; background: var(--accent-light);">
                      <input type="radio" name="auth-role" value="buyer" checked style="margin-bottom: 4px; accent-color: var(--accent);" />
                      <strong style="font-size: 0.85rem; color: var(--text-primary);">👤 Reader / Buyer</strong>
                      <span style="font-size: 0.7rem; color: var(--text-muted);">Buy & read eBooks</span>
                    </label>
                    <label style="border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 0.65rem; display: flex; flex-direction: column; cursor: pointer; background: #FFFFFF;">
                      <input type="radio" name="auth-role" value="creator" style="margin-bottom: 4px; accent-color: var(--accent);" />
                      <strong style="font-size: 0.85rem; color: var(--text-primary);">✍️ Author / Seller</strong>
                      <span style="font-size: 0.7rem; color: var(--text-muted);">Publish & earn 85%</span>
                    </label>
                  </div>
                </div>

                <div style="margin-bottom: 1rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Full Name *</label>
                  <input type="text" id="auth-name" placeholder="Ayush Prajapati" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              ` : ''}

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Email Address *</label>
                <input type="email" id="auth-email" placeholder="name@example.com" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              ${type !== 'forgot' && type !== 'verify' ? `
                <div style="margin-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <label style="font-size: 0.8rem; font-weight: 600;">Password *</label>
                    ${type === 'login' ? `<a href="#/forgot-password" style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">Forgot?</a>` : ''}
                  </div>
                  <input type="password" id="auth-password" placeholder="At least 8 characters" required minlength="8" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              ` : ''}

              ${type === 'reset' ? `
                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Confirm New Password *</label>
                  <input type="password" id="auth-password-confirm" placeholder="Re-enter new password" required minlength="8" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              ` : ''}

              <button type="submit" id="auth-submit-btn" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 700; font-size: 0.95rem;">
                ${type === 'signup' || type === 'register' ? 'Create Account' : type === 'forgot' ? 'Send Password Reset Link' : type === 'reset' ? 'Update Password' : 'Sign In'}
              </button>
            </form>

            <!-- Links -->
            <div style="margin-top: 1.5rem; font-size: 0.825rem; color: var(--text-secondary); text-align: center;">
              ${type === 'login' ? `
                Don't have an account? <a href="#/signup" style="color: var(--accent); font-weight: 700;">Sign up</a>
              ` : type === 'signup' || type === 'register' ? `
                Already registered? <a href="#/login" style="color: var(--accent); font-weight: 700;">Sign in here</a>
              ` : `
                Remember your password? <a href="#/login" style="color: var(--accent); font-weight: 700;">Back to sign in</a>
              `}
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}

export function initAuthEvents(type) {
  setupGoogleIdentity();
  const form = document.getElementById('auth-form');
  const submitBtn = document.getElementById('auth-submit-btn');

  // Google OAuth button handler (Firebase + Google Identity Services)
  document.getElementById('google-auth-btn')?.addEventListener('click', async () => {
    await signInWithGoogleFirebase();
  });

  // Apple ID button handler
  document.getElementById('apple-auth-btn')?.addEventListener('click', async () => {
    Toast.show('Connecting to Sign in with Apple...', 'info');
    const emailPrompt = prompt('Enter Apple ID email to authenticate:', 'user@icloud.com');
    if (emailPrompt) {
      const res = await apiFetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailPrompt, name: emailPrompt.split('@')[0] })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        state.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        state.currentUser = data.user;
        state.isAuthenticated = true;
        state.isAdmin = data.is_admin;
        state.isSeller = data.is_seller;
        state.setActiveMode(data.is_admin ? 'admin' : 'buyer');
        await state.syncData();
        Toast.show(`Welcome, ${data.user.name}!`, 'success');
        window.location.hash = getPostLoginRedirect(data.is_admin, data.is_seller);
      }
    }
  });

  // Email / Password submit handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email')?.value.trim();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    if (type === 'signup' || type === 'register') {
      const name = document.getElementById('auth-name')?.value.trim();
      const password = document.getElementById('auth-password')?.value;
      const roleChoice = document.querySelector('input[name="auth-role"]:checked')?.value || 'buyer';

      const res = await state.register(name, email, roleChoice);
      if (res.success) {
        Toast.show(`Account created! Welcome to Bookora, ${res.user.name}.`, 'success');
        window.location.hash = roleChoice === 'creator' ? '#/seller/apply' : '#/';
      } else {
        Toast.show(res.error, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      }
    } else if (type === 'forgot') {
      try {
        await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        Toast.show('If an account exists, a password reset link has been dispatched.', 'success');
        window.location.hash = '#/login';
      } catch (err) {
        Toast.show('Failed to send reset link.', 'error');
      }
    } else {
      const password = document.getElementById('auth-password')?.value;
      const res = await state.login(email, password);
      if (res.success) {
        Toast.show(`Welcome back, ${res.user.name}!`, 'success');
        window.location.hash = getPostLoginRedirect(res.is_admin, state.isSeller);
      } else {
        Toast.show(res.error, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      }
    }
  });
}
