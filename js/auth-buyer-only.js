// Bookora signup policy: public registration is BUYER-only.
// Seller/creator accounts must not be selectable or created from the signup UI.
(function enforceBuyerOnlySignup() {
  const isSignupRoute = () => {
    const hash = String(window.location.hash || '').toLowerCase();
    return hash === '#/signup' || hash === '#/register' || hash.startsWith('#/signup?') || hash.startsWith('#/register?');
  };

  const cleanSignupUI = () => {
    if (!isSignupRoute()) return;

    // Remove the entire role-selection block rendered by AuthPages.js.
    const roleRadio = document.querySelector('input[name="auth-role"]');
    if (roleRadio) {
      const roleSection = roleRadio.closest('div[style*="margin-bottom"]');
      if (roleSection) roleSection.remove();
      else roleRadio.closest('label')?.remove();
    }

    // If any old creator/seller controls survive due to a different renderer,
    // remove them as well.
    document.querySelectorAll('input[name="auth-role"]').forEach(input => input.closest('label')?.remove());

    // Enforce buyer at the UI/state level even if an older component still reads the field.
    const form = document.getElementById('auth-form');
    if (form && !form.querySelector('input[name="auth-role"][value="buyer"]')) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'auth-role';
      hidden.value = 'buyer';
      form.appendChild(hidden);
    }

    // Make signup copy buyer-only.
    document.querySelectorAll('p').forEach(el => {
      if (el.textContent.includes('start reading or selling.')) {
        el.textContent = 'Sign up in seconds to start reading and buying eBooks.';
      }
    });
  };

  const start = () => {
    cleanSignupUI();
    const observer = new MutationObserver(cleanSignupUI);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', cleanSignupUI);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
