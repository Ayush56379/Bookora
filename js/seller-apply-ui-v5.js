/* Bookora seller application UI V5: fixed account reveal control and checkbox layout. */
(() => {
  'use strict';
  const FORM_ID = 'seller-apply-form';
  const ACCOUNT_ID = 'apply-account';
  const FLAG = '__BOOKORA_SELLER_UI_V5__';

  function setup(form) {
    if (!form || form.id !== FORM_ID || form.dataset[FLAG]) return;
    form.dataset[FLAG] = '1';
    form.setAttribute('autocomplete', 'off');

    const account = form.querySelector('#' + ACCOUNT_ID);
    if (account) {
      account.type = 'password';
      account.autocomplete = 'new-password';
      account.setAttribute('inputmode', 'numeric');
      account.setAttribute('data-lpignore', 'true');
      account.setAttribute('data-1p-ignore', 'true');
      const field = account.closest('.seller-field');
      if (field) {
        const holder = document.createElement('div');
        holder.className = 'seller-account-control-v5';
        account.parentNode.insertBefore(holder, account);
        holder.appendChild(account);
        const eye = document.createElement('button');
        eye.type = 'button';
        eye.className = 'seller-account-eye-v5';
        eye.setAttribute('aria-label', 'Show account number');
        eye.setAttribute('aria-pressed', 'false');
        eye.innerHTML = '<span aria-hidden="true">&#128065;</span>';
        holder.appendChild(eye);
        eye.addEventListener('mousedown', e => e.preventDefault());
        eye.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          const visible = account.type === 'text';
          account.type = visible ? 'password' : 'text';
          eye.setAttribute('aria-label', visible ? 'Show account number' : 'Hide account number');
          eye.setAttribute('aria-pressed', String(!visible));
          account.focus({ preventScroll: true });
        });
      }
    }

    form.querySelectorAll('.seller-check').forEach(label => {
      const box = label.querySelector('input[type="checkbox"]');
      if (!box) return;
      label.classList.add('seller-check-v5');
      box.checked = false;
      box.removeAttribute('checked');
      box.setAttribute('autocomplete', 'off');
      box.addEventListener('change', () => label.classList.toggle('is-checked', box.checked));
    });

    const style = document.createElement('style');
    style.id = 'seller-apply-ui-v5-styles';
    style.textContent = `
      #${FORM_ID} .seller-account-control-v5{position:relative;width:100%;display:block}
      #${FORM_ID} .seller-account-control-v5 input{width:100%!important;box-sizing:border-box!important;padding-right:3.25rem!important}
      #${FORM_ID} .seller-account-eye-v5{position:absolute!important;right:8px!important;top:50%!important;transform:translateY(-50%)!important;width:36px!important;height:36px!important;min-width:36px!important;padding:0!important;margin:0!important;border:0!important;border-radius:9px!important;background:#f1f5f9!important;color:#334155!important;display:grid!important;place-items:center!important;cursor:pointer!important;z-index:5!important;line-height:1!important}
      #${FORM_ID} .seller-account-eye-v5:hover{background:#e2e8f0!important}
      #${FORM_ID} .seller-account-eye-v5:focus-visible{outline:2px solid var(--accent)!important;outline-offset:2px!important}
      #${FORM_ID} .seller-check-v5{display:grid!important;grid-template-columns:24px minmax(0,1fr)!important;align-items:start!important;column-gap:12px!important;width:100%!important;box-sizing:border-box!important;padding:14px 16px!important;margin:0!important;border:1px solid #e2e8f0!important;border-radius:12px!important;background:#fff!important;cursor:pointer!important;line-height:1.5!important;text-align:left!important}
      #${FORM_ID} .seller-check-v5:hover{border-color:var(--accent)!important;background:#faf7ff!important}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]{appearance:none!important;-webkit-appearance:none!important;width:22px!important;height:22px!important;min-width:22px!important;margin:0!important;border:2px solid #94a3b8!important;border-radius:6px!important;background:#fff!important;display:grid!important;place-items:center!important;cursor:pointer!important;box-sizing:border-box!important}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]::after{content:'✓';font-size:14px;font-weight:900;color:#fff;transform:scale(0);transition:transform .12s ease}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]:checked{background:var(--accent)!important;border-color:var(--accent)!important}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]:checked::after{transform:scale(1)}
      #${FORM_ID} .seller-check-v5 span{display:block!important;min-width:0!important;color:#334155!important;font-size:.86rem!important}
      #${FORM_ID} .seller-check-v5.is-checked{border-color:var(--accent)!important;background:#faf7ff!important;box-shadow:0 0 0 2px rgba(124,58,237,.06)!important}
      #${FORM_ID} .seller-check-v5.is-checked span{color:#1e293b!important}
      @media(max-width:640px){#${FORM_ID} .seller-check-v5{padding:12px!important;column-gap:10px!important}}
    `;
    document.head.appendChild(style);
  }

  function boot() {
    if (!location.hash.includes('/seller/apply')) return;
    const form = document.getElementById(FORM_ID);
    if (form) setup(form);
  }
  const observer = new MutationObserver(boot);
  const start = () => { if (document.body) { observer.observe(document.body, {childList:true, subtree:true}); boot(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
  window.addEventListener('hashchange', () => setTimeout(boot, 0));
})();
