/* Bookora seller onboarding field policy.
 * Only the authenticated email may be prefilled automatically.
 * Every other application input/select/textarea starts empty until the user
 * explicitly enters/selects a value. Also provides consistent visible checkbox UI.
 */
(() => {
  'use strict';

  const EMAIL_ID = 'apply-email';
  const SELLER_FORM_ID = 'seller-apply-form';
  const CLEARED = '__BOOKORA_SELLER_EMPTY_POLICY_V3__';

  function clearNonEmailFields(form) {
    if (!form || form.id !== SELLER_FORM_ID) return;
    form.querySelectorAll('input, textarea, select').forEach((el) => {
      if (el.id === EMAIL_ID || el.type === 'hidden' || el.type === 'checkbox' || el.type === 'file') return;
      // Never overwrite something the user has already typed/selected.
      if (el.dataset.userTouched === '1') return;
      if (el.tagName === 'SELECT') {
        if (el.multiple) {
          [...el.options].forEach(option => { option.selected = false; });
        } else {
          el.selectedIndex = 0;
          // A non-empty first option is a default value, so reset it to an empty placeholder.
          if (el.options[0] && el.options[0].value !== '') {
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Select an option';
            placeholder.disabled = false;
            placeholder.selected = true;
            el.insertBefore(placeholder, el.firstChild);
          }
          el.value = '';
        }
      } else if (el.type === 'number') {
        el.value = '';
      } else {
        el.value = '';
      }
      el.removeAttribute('value');
      el.removeAttribute('checked');
    });

    // Checkboxes must always start unchecked; user must explicitly tick them.
    form.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      if (el.dataset.userTouched !== '1') el.checked = false;
      el.removeAttribute('checked');
    });

    const email = form.querySelector(`#${EMAIL_ID}`);
    if (email) {
      email.readOnly = true;
      email.autocomplete = 'email';
      // Email is the ONLY allowed automatic value. Keep the authenticated email if available.
      const authenticatedEmail = String(window.__BOOKORA_AUTH_EMAIL__ || '').trim();
      if (authenticatedEmail) email.value = authenticatedEmail;
    }
  }

  function trackUserInput(form) {
    if (!form || form.dataset[ CLEARED ]) return;
    form.addEventListener('input', event => {
      const el = event.target;
      if (el && el.matches('input,textarea,select')) el.dataset.userTouched = '1';
    }, true);
    form.addEventListener('change', event => {
      const el = event.target;
      if (el && el.matches('input,textarea,select')) el.dataset.userTouched = '1';
    }, true);
    form.dataset[ CLEARED ] = '1';
  }

  function styleCheckboxes() {
    if (document.getElementById('seller-checkbox-v3-styles')) return;
    const style = document.createElement('style');
    style.id = 'seller-checkbox-v3-styles';
    style.textContent = `
      #seller-apply-form .seller-check{position:relative;display:flex;align-items:flex-start;gap:.75rem;padding:.8rem .9rem;border:1px solid #e2e8f0;border-radius:12px;background:#fff;cursor:pointer;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease}
      #seller-apply-form .seller-check:hover{border-color:var(--accent);background:#faf7ff}
      #seller-apply-form .seller-check input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:21px;height:21px;min-width:21px;margin:.05rem 0 0;border:2px solid #94a3b8;border-radius:6px;background:#fff;display:grid;place-content:center;cursor:pointer}
      #seller-apply-form .seller-check input[type="checkbox"]::before{content:"";width:9px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg) scale(0);transition:transform .12s ease}
      #seller-apply-form .seller-check input[type="checkbox"]:checked{background:var(--accent);border-color:var(--accent)}
      #seller-apply-form .seller-check input[type="checkbox"]:checked::before{transform:rotate(-45deg) scale(1)}
      #seller-apply-form .seller-check:has(input:checked){border-color:var(--accent);background:#faf7ff;box-shadow:0 0 0 2px rgba(124,58,237,.06)}
      #seller-apply-form .seller-check span{flex:1}
    `;
    document.head.appendChild(style);
  }

  function boot() {
    if (!location.hash.includes('/seller/apply')) return;
    const form = document.getElementById(SELLER_FORM_ID);
    if (!form) return;
    styleCheckboxes();
    trackUserInput(form);
    clearNonEmailFields(form);
  }

  const observer = new MutationObserver(() => boot());
  const start = () => {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    boot();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('hashchange', () => setTimeout(boot, 0));
})();
