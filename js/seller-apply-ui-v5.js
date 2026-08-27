/* Bookora seller application UI V5: fixed account reveal control, checkbox layout, field policy, and submission progress. */
(() => {
  'use strict';
  const FORM_ID = 'seller-apply-form';
  const EMAIL_ID = 'apply-email';
  const ACCOUNT_ID = 'apply-account';
  const FLAG = '__BOOKORA_SELLER_UI_V5__';
  const PROGRESS_FLAG = '__BOOKORA_SELLER_PROGRESS_V1__';

  const protectedField = el => el?.id === EMAIL_ID || el?.type === 'hidden' || el?.type === 'file';
  function clearUnentered(form) {
    form.querySelectorAll('input,textarea,select').forEach(el => {
      if (protectedField(el) || el.type === 'checkbox' || el.dataset.userTouched === '1') return;
      el.setAttribute('autocomplete', /account|bank|ifsc|pan|upi|holder/i.test(`${el.id} ${el.name} ${el.placeholder}`) ? 'new-password' : 'off');
      el.setAttribute('data-lpignore', 'true');
      el.setAttribute('data-1p-ignore', 'true');
      if (el.tagName === 'SELECT') {
        [...el.options].forEach(o => { o.selected = false; });
        if (!el.multiple) {
          if (!el.options[0] || el.options[0].value !== '') {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Select an option';
            el.insertBefore(option, el.firstChild);
          }
          el.value = '';
        }
      } else el.value = '';
      el.removeAttribute('value');
      el.removeAttribute('checked');
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(box => {
      if (box.dataset.userTouched !== '1') box.checked = false;
      box.removeAttribute('checked');
      box.setAttribute('autocomplete', 'off');
    });
    const email = form.querySelector('#' + EMAIL_ID);
    const authEmail = String(window.__BOOKORA_AUTH_EMAIL__ || '').trim();
    if (email) {
      email.readOnly = true;
      email.autocomplete = 'email';
      if (authEmail) email.value = authEmail;
    }
  }

  function installProgress(form) {
    if (window[PROGRESS_FLAG]) return;
    window[PROGRESS_FLAG] = true;

    let overlay = null;
    let percentEl = null;
    let messageEl = null;
    let progressRing = null;
    let hideTimer = null;

    const ensureOverlay = () => {
      if (overlay?.isConnected) return overlay;
      overlay = document.createElement('div');
      overlay.id = 'bookora-seller-progress-overlay';
      overlay.innerHTML = `
        <div class="bookora-seller-progress-card" role="status" aria-live="polite" aria-label="Seller application progress">
          <div class="bookora-seller-progress-ring" aria-hidden="true"><div class="bookora-seller-progress-spinner"></div><strong id="bookora-seller-progress-percent">0%</strong></div>
          <h3>Submitting your application</h3>
          <p id="bookora-seller-progress-message">Preparing secure submission…</p>
          <div class="bookora-seller-progress-track"><div id="bookora-seller-progress-bar"></div></div>
          <small>Please keep this page open.</small>
        </div>`;
      document.body.appendChild(overlay);
      percentEl = overlay.querySelector('#bookora-seller-progress-percent');
      messageEl = overlay.querySelector('#bookora-seller-progress-message');
      progressRing = overlay.querySelector('#bookora-seller-progress-bar');
      return overlay;
    };

    const setProgress = (value, message) => {
      ensureOverlay();
      const safe = Math.max(0, Math.min(99, Math.round(value)));
      if (percentEl) percentEl.textContent = `${safe}%`;
      if (messageEl && message) messageEl.textContent = message;
      if (progressRing) progressRing.style.width = `${safe}%`;
    };

    const show = () => {
      clearTimeout(hideTimer);
      ensureOverlay().classList.add('is-visible');
      setProgress(10, 'Validating your seller details…');
      setTimeout(() => setProgress(25, 'Preparing your secure application…'), 250);
    };

    const finish = success => {
      if (!overlay) return;
      if (success) {
        setProgress(100, 'Application submitted successfully.');
        if (percentEl) percentEl.textContent = '100%';
        if (progressRing) progressRing.style.width = '100%';
        hideTimer = setTimeout(() => overlay?.classList.remove('is-visible'), 900);
      } else {
        overlay.classList.remove('is-visible');
      }
    };

    form.addEventListener('submit', () => show(), true);

    if (!window.__BOOKORA_SELLER_FETCH_PATCH__) {
      window.__BOOKORA_SELLER_FETCH_PATCH__ = true;
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const input = args[0];
        const url = typeof input === 'string' ? input : input?.url || '';
        const isSellerApply = String(url).includes('/api/seller/apply');
        if (isSellerApply) setProgress(55, 'Sending your application securely to Bookora…');
        try {
          const response = await nativeFetch(...args);
          if (isSellerApply) {
            if (response.ok) setProgress(88, 'Application accepted. Synchronizing your seller record…');
            else finish(false);
          }
          return response;
        } catch (error) {
          if (isSellerApply) finish(false);
          throw error;
        }
      };
    }

    window.__BOOKORA_SELLER_PROGRESS__ = { show, finish, setProgress };
  }

  function setup(form) {
    if (!form || form.id !== FORM_ID || form.dataset[FLAG]) return;
    form.dataset[FLAG] = '1';
    form.setAttribute('autocomplete', 'off');

    const markTouched = event => {
      const target = event.target;
      if (target?.matches('input,textarea,select') && target.id !== EMAIL_ID) target.dataset.userTouched = '1';
    };
    ['input', 'change', 'paste', 'drop'].forEach(type => form.addEventListener(type, markTouched, true));

    clearUnentered(form);

    const account = form.querySelector('#' + ACCOUNT_ID);
    if (account) {
      form.querySelectorAll('#seller-account-eye-v4').forEach(btn => btn.remove());
      const oldWrap = account.closest('.seller-account-input-wrap-v4');
      if (oldWrap) oldWrap.parentNode.insertBefore(account, oldWrap);
      oldWrap?.remove();

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
      label.classList.toggle('is-checked', box.checked);
      box.addEventListener('change', () => label.classList.toggle('is-checked', box.checked));
    });

    installProgress(form);

    const style = document.createElement('style');
    style.id = 'seller-apply-ui-v5-styles';
    style.textContent = `
      #${FORM_ID} .seller-account-control-v5{position:relative!important;width:100%!important;display:block!important}
      #${FORM_ID} .seller-account-control-v5 input{width:100%!important;box-sizing:border-box!important;padding-right:3.5rem!important}
      #${FORM_ID} .seller-account-eye-v5{position:absolute!important;right:8px!important;top:50%!important;transform:translateY(-50%)!important;width:36px!important;height:36px!important;min-width:36px!important;padding:0!important;margin:0!important;border:1px solid #e2e8f0!important;border-radius:9px!important;background:#f8fafc!important;color:#334155!important;display:grid!important;place-items:center!important;cursor:pointer!important;z-index:20!important;line-height:1!important}
      #${FORM_ID} .seller-account-eye-v5:hover{background:#eef2ff!important;border-color:var(--accent)!important}
      #${FORM_ID} .seller-account-eye-v5:focus-visible{outline:2px solid var(--accent)!important;outline-offset:2px!important}
      #${FORM_ID} .seller-check-v5{display:grid!important;grid-template-columns:24px minmax(0,1fr)!important;align-items:start!important;column-gap:12px!important;width:100%!important;box-sizing:border-box!important;padding:14px 16px!important;margin:0 0 10px!important;border:1px solid #e2e8f0!important;border-radius:12px!important;background:#fff!important;cursor:pointer!important;line-height:1.5!important;text-align:left!important}
      #${FORM_ID} .seller-check-v5:hover{border-color:var(--accent)!important;background:#faf7ff!important}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]{appearance:none!important;-webkit-appearance:none!important;width:22px!important;height:22px!important;min-width:22px!important;margin:0!important;border:2px solid #94a3b8!important;border-radius:6px!important;background:#fff!important;display:grid!important;place-items:center!important;cursor:pointer!important;box-sizing:border-box!important}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]::after{content:'✓';font-size:14px;font-weight:900;color:#fff;transform:scale(0);transition:transform .12s ease}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]:checked{background:var(--accent)!important;border-color:var(--accent)!important}
      #${FORM_ID} .seller-check-v5 input[type="checkbox"]:checked::after{transform:scale(1)}
      #${FORM_ID} .seller-check-v5 span{display:block!important;min-width:0!important;color:#334155!important;font-size:.86rem!important}
      #${FORM_ID} .seller-check-v5.is-checked{border-color:var(--accent)!important;background:#faf7ff!important;box-shadow:0 0 0 2px rgba(124,58,237,.06)!important}
      #${FORM_ID} .seller-check-v5.is-checked span{color:#1e293b!important}
      #bookora-seller-progress-overlay{position:fixed!important;inset:0!important;z-index:2147483646!important;display:grid!important;place-items:center!important;padding:24px!important;background:rgba(15,23,42,.38)!important;backdrop-filter:blur(5px)!important;opacity:0!important;visibility:hidden!important;transition:opacity .18s ease,visibility .18s ease!important}
      #bookora-seller-progress-overlay.is-visible{opacity:1!important;visibility:visible!important}
      .bookora-seller-progress-card{width:min(390px,calc(100vw - 40px));box-sizing:border-box;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:28px 24px 24px;text-align:center;box-shadow:0 24px 70px rgba(15,23,42,.25)}
      .bookora-seller-progress-card h3{margin:18px 0 6px;font-size:1.08rem;color:#0f172a}
      .bookora-seller-progress-card p{margin:0 0 18px;color:#64748b;font-size:.86rem;line-height:1.45;min-height:2.5em}
      .bookora-seller-progress-card small{display:block;margin-top:12px;color:#94a3b8;font-size:.72rem}
      .bookora-seller-progress-ring{position:relative;width:108px;height:108px;margin:0 auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--accent) 0%,#e2e8f0 0%);isolation:isolate}
      .bookora-seller-progress-ring::before{content:'';position:absolute;inset:8px;border-radius:50%;background:#fff;z-index:-1}
      .bookora-seller-progress-spinner{position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:var(--accent);border-right-color:rgba(124,58,237,.28);animation:bookoraSellerSpin .85s linear infinite}
      .bookora-seller-progress-ring strong{font-size:1.15rem;color:#0f172a;z-index:2}
      .bookora-seller-progress-track{height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden}
      #bookora-seller-progress-bar{height:100%;width:0;background:var(--accent);border-radius:999px;transition:width .25s ease}
      @keyframes bookoraSellerSpin{to{transform:rotate(360deg)}}
      @media(max-width:640px){#${FORM_ID} .seller-check-v5{padding:12px!important;column-gap:10px!important}.bookora-seller-progress-card{padding:24px 18px 20px}}
    `;
    document.head.appendChild(style);

    // Keep the circular indicator synchronized with the horizontal percentage bar.
    const originalSetProgress = window.__BOOKORA_SELLER_PROGRESS__?.setProgress;
    if (originalSetProgress && !window.__BOOKORA_SELLER_PROGRESS_RING_PATCHED__) {
      window.__BOOKORA_SELLER_PROGRESS_RING_PATCHED__ = true;
      const controller = window.__BOOKORA_SELLER_PROGRESS__;
      const setProgress = controller.setProgress;
      controller.setProgress = (value, message) => {
        setProgress(value, message);
        const ring = document.querySelector('#bookora-seller-progress-overlay .bookora-seller-progress-ring');
        if (ring) ring.style.background = `conic-gradient(var(--accent) ${Math.max(0, Math.min(100, value))}%, #e2e8f0 0%)`;
      };
      window.__BOOKORA_SELLER_PROGRESS__ = controller;
    }
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