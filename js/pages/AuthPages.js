// Bookora Authentication Pages
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

import {
  firebaseGoogleSignIn,
  firebaseAppleSignIn,
  firebaseRegister,
  firebaseLogin,
  firebaseForgotPassword
} from '../services/firebase.js';


// ---------------------------------------------------------
// POST LOGIN REDIRECT
// ---------------------------------------------------------
function getPostLoginRedirect(isAdmin, isSeller) {
  const hash = window.location.hash || '';

  try {
    const query = hash.includes('?')
      ? hash.substring(hash.indexOf('?') + 1)
      : '';

    const params = new URLSearchParams(query);
    const returnTo = params.get('returnTo');

    if (returnTo && returnTo.startsWith('/')) {
      return `#${returnTo}`;
    }
  } catch (error) {
    console.warn('Redirect parsing error:', error);
  }

  if (isAdmin) {
    return '#/admin';
  }

  if (isSeller) {
    return '#/creator/dashboard';
  }

  return '#/';
}


// ---------------------------------------------------------
// SAFE AUTH CALL
// Prevents the button from staying stuck forever.
// ---------------------------------------------------------
async function safeAuthCall(callback, timeoutMs = 25000) {
  let timeoutId;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            'Authentication server is taking too long. Please try again.'
          )
        );
      }, timeoutMs);
    });

    return await Promise.race([
      callback(),
      timeoutPromise
    ]);

  } finally {
    clearTimeout(timeoutId);
  }
}


// ---------------------------------------------------------
// AUTH PAGE
// ---------------------------------------------------------
export function renderAuthPage(type = 'login') {

  const isSignup =
    type === 'signup' ||
    type === 'register';

  const isForgot =
    type === 'forgot';

  updateSEO({
    title:
      isSignup
        ? 'Create Account'
        : isForgot
          ? 'Reset Password'
          : 'Sign In',

    description:
      'Secure Firebase authentication on Bookora.'
  });


  return `
    <div
      class="auth-page animate-fade-in"
      style="
        background: var(--bg-secondary);
        min-height: 85vh;
        padding: 4rem 0 6rem 0;
        display: flex;
        align-items: center;
      "
    >

      <div
        class="container"
        style="max-width: 920px;"
      >

        <div
          class="auth-split-grid"
          style="
            background: #FFFFFF;
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-md);
            overflow: hidden;
            display: grid;
            grid-template-columns: 1fr 1.2fr;
          "
        >

          <!-- ================================================= -->
          <!-- LEFT SIDE -->
          <!-- ================================================= -->

          <div
            style="
              background: linear-gradient(
                135deg,
                #0F172A 0%,
                #1E293B 100%
              );
              color: #FFFFFF;
              padding: 3rem 2.5rem;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            "
          >

            <div>

              <!-- Logo -->

              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                  margin-bottom: 2.5rem;
                "
              >

                <div
                  style="
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: var(--accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                >

                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    stroke-width="2.5"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>

                </div>

                <span
                  style="
                    font-family: var(--font-display);
                    font-weight: 800;
                    font-size: 1.4rem;
                  "
                >
                  Bookora
                </span>

              </div>


              <!-- Heading -->

              <h2
                style="
                  font-family: var(--font-display);
                  font-size: 1.85rem;
                  font-weight: 800;
                  line-height: 1.25;
                  margin-bottom: 1rem;
                "
              >
                ${
                  isSignup
                    ? 'Join the Future of Digital Reading & Publishing'
                    : isForgot
                      ? 'Account Recovery Center'
                      : 'Welcome Back to Your Knowledge Library'
                }
              </h2>


              <p
                style="
                  font-size: 0.95rem;
                  opacity: 0.85;
                  line-height: 1.6;
                "
              >
                Discover inspiring books, read in-browser across
                themes, and publish your own works directly with
                85% royalties.
              </p>

            </div>


            <!-- Security -->

            <div
              style="
                border-top: 1px solid rgba(255,255,255,0.15);
                padding-top: 1.5rem;
                font-size: 0.8rem;
                opacity: 0.75;
                display: flex;
                align-items: center;
                gap: 0.5rem;
              "
            >

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#60A5FA"
                stroke-width="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>

              <span>
                Firebase Authentication Security
              </span>

            </div>

          </div>


          <!-- ================================================= -->
          <!-- RIGHT SIDE -->
          <!-- ================================================= -->

          <div
            style="
              padding: 3rem 2.5rem;
            "
          >

            <h1
              style="
                font-family: var(--font-display);
                font-size: 1.6rem;
                font-weight: 800;
                color: var(--text-primary);
                margin-bottom: 0.35rem;
              "
            >
              ${
                isSignup
                  ? 'Create Your Account'
                  : isForgot
                    ? 'Reset Your Password'
                    : 'Sign In to Bookora'
              }
            </h1>


            <p
              style="
                font-size: 0.85rem;
                color: var(--text-secondary);
                margin-bottom: 1.75rem;
              "
            >
              ${
                isSignup
                  ? 'Sign up in seconds to start reading or selling.'
                  : isForgot
                    ? 'Enter your registered email to receive a password reset link.'
                    : 'Enter your credentials to access your library.'
              }
            </p>


            <!-- ================================================= -->
            <!-- SOCIAL LOGIN -->
            <!-- ================================================= -->

            ${
              !isForgot
                ? `

              <div
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 0.65rem;
                  margin-bottom: 1.5rem;
                "
              >

                <!-- GOOGLE -->

                <button
                  type="button"
                  id="google-auth-btn"
                  class="btn btn-secondary"
                  style="
                    width: 100%;
                    padding: 0.65rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    border-color: var(--border-medium);
                  "
                >

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>

                  <span>
                    Continue with Google
                  </span>

                </button>


                <!-- APPLE -->

                <button
                  type="button"
                  id="apple-auth-btn"
                  class="btn btn-secondary"
                  style="
                    width: 100%;
                    padding: 0.65rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    border-color: var(--border-medium);
                  "
                >

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="#000000"
                  >
                    <path
                      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.14 1.86-1 2.98 1.07.08 2.17-.51 2.83-1.33z"
                    />
                  </svg>

                  <span>
                    Continue with Apple
                  </span>

                </button>

              </div>


              <!-- DIVIDER -->

              <div
                style="
                  position: relative;
                  margin: 1.5rem 0;
                  text-align: center;
                "
              >

                <div
                  style="
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                  "
                >
                  <div
                    style="
                      width: 100%;
                      border-top: 1px solid var(--border-subtle);
                    "
                  ></div>
                </div>

                <span
                  style="
                    position: relative;
                    background: #FFFFFF;
                    padding: 0 10px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                  "
                >
                  Or with Email
                </span>

              </div>

            `
                : ''
            }


            <!-- ================================================= -->
            <!-- EMAIL FORM -->
            <!-- ================================================= -->

            <form id="auth-form">

              ${
                isSignup
                  ? `

                <!-- ROLE -->

                <div
                  style="
                    margin-bottom: 1.25rem;
                  "
                >

                  <label
                    style="
                      display: block;
                      font-size: 0.8rem;
                      font-weight: 600;
                      margin-bottom: 0.4rem;
                    "
                  >
                    I want to join as:
                  </label>


                  <div
                    style="
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 0.75rem;
                    "
                  >

                    <label
                      style="
                        border: 2px solid var(--accent);
                        border-radius: var(--radius-md);
                        padding: 0.65rem;
                        display: flex;
                        flex-direction: column;
                        cursor: pointer;
                        background: var(--accent-light);
                      "
                    >

                      <input
                        type="radio"
                        name="auth-role"
                        value="buyer"
                        checked
                        style="
                          margin-bottom: 4px;
                          accent-color: var(--accent);
                        "
                      />

                      <strong
                        style="
                          font-size: 0.85rem;
                          color: var(--text-primary);
                        "
                      >
                        👤 Reader / Buyer
                      </strong>

                      <span
                        style="
                          font-size: 0.7rem;
                          color: var(--text-muted);
                        "
                      >
                        Buy & read eBooks
                      </span>

                    </label>


                    <label
                      style="
                        border: 1px solid var(--border-medium);
                        border-radius: var(--radius-md);
                        padding: 0.65rem;
                        display: flex;
                        flex-direction: column;
                        cursor: pointer;
                        background: #FFFFFF;
                      "
                    >

                      <input
                        type="radio"
                        name="auth-role"
                        value="creator"
                        style="
                          margin-bottom: 4px;
                          accent-color: var(--accent);
                        "
                      />

                      <strong
                        style="
                          font-size: 0.85rem;
                          color: var(--text-primary);
                        "
                      >
                        ✍️ Author / Seller
                      </strong>

                      <span
                        style="
                          font-size: 0.7rem;
                          color: var(--text-muted);
                        "
                      >
                        Publish & earn 85%
                      </span>

                    </label>

                  </div>

                </div>


                <!-- NAME -->

                <div
                  style="
                    margin-bottom: 1rem;
                  "
                >

                  <label
                    style="
                      display: block;
                      font-size: 0.8rem;
                      font-weight: 600;
                      margin-bottom: 0.35rem;
                    "
                  >
                    Full Name *
                  </label>

                  <input
                    type="text"
                    id="auth-name"
                    placeholder="Your full name"
                    autocomplete="name"
                    required
                    style="
                      width: 100%;
                      padding: 0.65rem 0.85rem;
                      border-radius: var(--radius-md);
                      border: 1px solid var(--border-medium);
                      font-size: 0.95rem;
                    "
                  />

                </div>

              `
                  : ''
              }


              <!-- EMAIL -->

              <div
                style="
                  margin-bottom: 1rem;
                "
              >

                <label
                  style="
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 0.35rem;
                  "
                >
                  Email Address *
                </label>

                <!-- IMPORTANT: no hard-coded email -->

                <input
                  type="email"
                  id="auth-email"
                  placeholder="name@example.com"
                  value=""
                  autocomplete="email"
                  required
                  style="
                    width: 100%;
                    padding: 0.65rem 0.85rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-medium);
                    font-size: 0.95rem;
                  "
                />

              </div>


              <!-- PASSWORD -->

              ${
                !isForgot
                  ? `

                <div
                  style="
                    margin-bottom: 1.25rem;
                  "
                >

                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 0.35rem;
                    "
                  >

                    <label
                      style="
                        font-size: 0.8rem;
                        font-weight: 600;
                      "
                    >
                      Password *
                    </label>

                    ${
                      type === 'login'
                        ? `
                      <a
                        href="#/forgot-password"
                        style="
                          font-size: 0.75rem;
                          color: var(--accent);
                          font-weight: 600;
                        "
                      >
                        Forgot?
                      </a>
                    `
                        : ''
                    }

                  </div>


                  <div
                    style="
                      position: relative;
                      display: flex;
                      align-items: center;
                    "
                  >

                    <input
                      type="password"
                      id="auth-password"
                      placeholder="Enter password"
                      autocomplete="${
                        isSignup ? 'new-password' : 'current-password'
                      }"
                      required
                      minlength="6"
                      style="
                        width: 100%;
                        padding: 0.65rem 2.5rem 0.65rem 0.85rem;
                        border-radius: var(--radius-md);
                        border: 1px solid var(--border-medium);
                        font-size: 0.95rem;
                      "
                    />


                    <button
                      type="button"
                      id="toggle-pw-visibility"
                      style="
                        position: absolute;
                        right: 10px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #64748B;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                      "
                      title="Show/Hide Password"
                    >

                      <svg
                        id="eye-icon-open"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>


                      <svg
                        id="eye-icon-closed"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        style="display:none;"
                      >
                        <path d="m2 2 20 20"/>
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      </svg>

                    </button>

                  </div>

                </div>

              `
                  : ''
              }


              <!-- SUBMIT -->

              <button
                type="submit"
                id="auth-submit-btn"
                class="btn btn-primary btn-lg"
                style="
                  width: 100%;
                  padding: 0.85rem;
                  font-weight: 700;
                  font-size: 0.95rem;
                "
              >
                ${
                  isSignup
                    ? 'Create Account'
                    : isForgot
                      ? 'Send Password Reset Link'
                      : 'Sign In'
                }
              </button>

            </form>


            <!-- ================================================= -->
            <!-- BOTTOM LINK -->
            <!-- ================================================= -->

            <div
              style="
                margin-top: 1.5rem;
                font-size: 0.825rem;
                color: var(--text-secondary);
                text-align: center;
              "
            >

              ${
                type === 'login'
                  ? `
                    Don't have an account?
                    <a
                      href="#/signup"
                      style="
                        color: var(--accent);
                        font-weight: 700;
                      "
                    >
                      Sign up
                    </a>
                  `
                  : isSignup
                    ? `
                      Already registered?
                      <a
                        href="#/login"
                        style="
                          color: var(--accent);
                          font-weight: 700;
                        "
                      >
                        Sign in here
                      </a>
                    `
                    : `
                      Remember your password?
                      <a
                        href="#/login"
                        style="
                          color: var(--accent);
                          font-weight: 700;
                        "
                      >
                        Back to sign in
                      </a>
                    `
              }

            </div>

          </div>

        </div>

      </div>

    </div>
  `;
}


// ---------------------------------------------------------
// INITIALIZE AUTH EVENTS
// ---------------------------------------------------------
export function initAuthEvents(type) {

    const isSignup =
    type === 'signup' ||
    type === 'register';

  const isForgot =
    type === 'forgot';

  const form =
    document.getElementById('auth-form');

  const submitBtn =
    document.getElementById('auth-submit-btn');


  // -------------------------------------------------------
  // PASSWORD VISIBILITY
  // -------------------------------------------------------

  const toggleBtn =
    document.getElementById('toggle-pw-visibility');

  const pwInput =
    document.getElementById('auth-password');

  const eyeOpen =
    document.getElementById('eye-icon-open');

  const eyeClosed =
    document.getElementById('eye-icon-closed');


  toggleBtn?.addEventListener(
    'click',
    () => {

      if (!pwInput) {
        return;
      }

      const isPassword =
        pwInput.type === 'password';

      pwInput.type =
        isPassword
          ? 'text'
          : 'password';

      if (eyeOpen) {
        eyeOpen.style.display =
          isPassword
            ? 'none'
            : 'block';
      }

      if (eyeClosed) {
        eyeClosed.style.display =
          isPassword
            ? 'block'
            : 'none';
      }

    }
  );


  // -------------------------------------------------------
  // GOOGLE LOGIN
  // -------------------------------------------------------

  document
    .getElementById('google-auth-btn')
    ?.addEventListener(
      'click',
      async (event) => {

        const button =
          event.currentTarget;

        if (button) {
          button.disabled = true;
          button.style.opacity = '0.65';
          button.querySelector('span').textContent =
            'Connecting to Google...';
        }

        try {

          const roleChoice =
            document.querySelector(
              'input[name="auth-role"]:checked'
            )?.value || 'buyer';


          const res =
            await safeAuthCall(
              () =>
                firebaseGoogleSignIn(
                  roleChoice
                )
            );


          if (res?.success) {

            window.location.hash =
              getPostLoginRedirect(
                res.is_admin,
                res.is_seller
              );

          } else {

            if (button) {
              button.disabled = false;
              button.style.opacity = '1';
              button.querySelector('span').textContent =
                'Continue with Google';
            }

          }

        } catch (error) {

          console.error(
            'Google authentication error:',
            error
          );

          Toast.show(
            error.message ||
              'Google login failed. Please try again.',
            'error'
          );

          if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.querySelector('span').textContent =
              'Continue with Google';
          }

        }

      }
    );


  // -------------------------------------------------------
  // APPLE LOGIN
  // -------------------------------------------------------

  document
    .getElementById('apple-auth-btn')
    ?.addEventListener(
      'click',
      async (event) => {

        const button =
          event.currentTarget;

        if (button) {
          button.disabled = true;
          button.style.opacity = '0.65';
          button.querySelector('span').textContent =
            'Connecting to Apple...';
        }

        try {

          const roleChoice =
            document.querySelector(
              'input[name="auth-role"]:checked'
            )?.value || 'buyer';


          const res =
            await safeAuthCall(
              () =>
                firebaseAppleSignIn(
                  roleChoice
                )
            );


          if (res?.success) {

            window.location.hash =
              getPostLoginRedirect(
                res.is_admin,
                res.is_seller
              );

          } else {

            if (button) {
              button.disabled = false;
              button.style.opacity = '1';
              button.querySelector('span').textContent =
                'Continue with Apple';
            }

          }

        } catch (error) {

          console.error(
            'Apple authentication error:',
            error
          );

          Toast.show(
            error.message ||
              'Apple login failed.',
            'error'
          );

          if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.querySelector('span').textContent =
              'Continue with Apple';
          }

        }

      }
    );


  // -------------------------------------------------------
  // EMAIL FORM
  // -------------------------------------------------------

  form?.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const email =
        document
          .getElementById('auth-email')
          ?.value
          ?.trim()
          ?.toLowerCase();


      const password =
        document
          .getElementById('auth-password')
          ?.value || '';


      // Basic email validation

      if (!email) {

        Toast.show(
          'Please enter your email address.',
          'error'
        );

        return;
      }


      // Password validation

      if (!isForgot && password.length < 6) {

        Toast.show(
          'Password must be at least 6 characters.',
          'error'
        );

        return;
      }


      if (submitBtn) {

        submitBtn.disabled = true;

        submitBtn.textContent =
          isSignup
            ? 'Creating Account...'
            : isForgot
              ? 'Sending Reset Link...'
              : 'Signing In...';

      }


      try {

        // -------------------------------------------------
        // SIGN UP
        // -------------------------------------------------

        if (
          type === 'signup' ||
          type === 'register'
        ) {

          const name =
            document
              .getElementById('auth-name')
              ?.value
              ?.trim() ||
            email.split('@')[0];


          const roleChoice =
            document.querySelector(
              'input[name="auth-role"]:checked'
            )?.value || 'buyer';


          const res =
            await safeAuthCall(
              () =>
                firebaseRegister(
                  name,
                  email,
                  password,
                  roleChoice
                )
            );


          if (res?.success) {

            Toast.show(
              'Account created successfully.',
              'success'
            );

            window.location.hash =
              getPostLoginRedirect(
                res.is_admin,
                res.is_seller
              );

            return;
          }


          throw new Error(
            res?.error ||
            'Account creation failed.'
          );
        }


        // -------------------------------------------------
        // FORGOT PASSWORD
        // -------------------------------------------------

        if (type === 'forgot') {

          const res =
            await safeAuthCall(
              () =>
                firebaseForgotPassword(
                  email
                )
            );


          if (res?.success) {

            window.location.hash =
              '#/login';

            return;
          }


          throw new Error(
            res?.error ||
            'Password reset failed.'
          );
        }


        // -------------------------------------------------
        // LOGIN
        // -------------------------------------------------

        const res =
          await safeAuthCall(
            () =>
              firebaseLogin(
                email,
                password
              )
          );


        if (res?.success) {

          Toast.show(
            'Login successful.',
            'success'
          );

          window.location.hash =
            getPostLoginRedirect(
              res.is_admin,
              res.is_seller
            );

          return;
        }


        throw new Error(
          res?.error ||
          'Login failed.'
        );


      } catch (error) {

        console.error(
          'Authentication error:',
          error
        );


        Toast.show(
          error.message ||
            'Authentication failed. Please try again.',
          'error'
        );


        // Restore button

        if (submitBtn) {

          submitBtn.disabled = false;

          submitBtn.textContent =
            isSignup
              ? 'Create Account'
              : isForgot
                ? 'Send Password Reset Link'
                : 'Sign In';

        }

      }

    }
  );

}
