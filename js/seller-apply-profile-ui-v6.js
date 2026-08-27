/* Bookora seller application V6: polished profile image uploader + optional website field. */
(() => {
  'use strict';
  const FORM_ID = 'seller-apply-form';
  const FIELD_ID = 'seller-profile-image-field';
  const STYLE_ID = 'seller-apply-profile-ui-v6-styles';
  const findWebsiteField = form => {
    const fields = [...form.querySelectorAll('.seller-field')];
    return fields.find(field => /website/i.test(field.querySelector('label')?.textContent || '')) || null;
  };
  function setup(form) {
    if (!form || form.id !== FORM_ID || form.dataset.profileUiV6 === '1') return;
    form.dataset.profileUiV6 = '1';
    const websiteField = findWebsiteField(form);
    if (websiteField) {
      const input = websiteField.querySelector('input,textarea');
      const label = websiteField.querySelector('label');
      if (label) label.innerHTML = 'Website <span class="seller-optional-v6">(Optional)</span>';
      if (input) {
        input.type = 'url';
        input.required = false;
        input.autocomplete = 'url';
        input.inputMode = 'url';
        input.placeholder = 'https://yourwebsite.com';
        input.title = 'Optional: add your author, publisher, portfolio, or official website.';
        input.setAttribute('aria-label', 'Optional website URL');
      }
      let help = websiteField.querySelector('.seller-website-help-v6');
      if (!help) {
        help = document.createElement('div');
        help.className = 'seller-website-help-v6';
        help.textContent = 'Optional • Add your official author, publisher, portfolio, or personal website.';
        websiteField.appendChild(help);
      }
      if (input && !input.dataset.websiteValidationV6) {
        input.dataset.websiteValidationV6 = '1';
        input.addEventListener('blur', () => {
          const value = input.value.trim();
          if (!value) { input.setCustomValidity(''); return; }
          try {
            const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
            const url = new URL(normalized);
            if (!url.hostname || !url.hostname.includes('.')) throw new Error();
            input.setCustomValidity('');
          } catch (_) {
            input.setCustomValidity('Please enter a valid website URL, for example https://example.com');
          }
        });
      }
    }
    const upload = document.getElementById(FIELD_ID);
    if (upload) upload.classList.add('seller-profile-image-v6');
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        #${FORM_ID} .seller-optional-v6{font-size:.76rem;font-weight:600;color:#64748b;margin-left:.25rem}
        #${FORM_ID} .seller-website-help-v6{margin-top:.45rem;font-size:.75rem;line-height:1.45;color:#64748b}
        #${FORM_ID} .seller-profile-image-v6{margin-top:.15rem}
        #${FORM_ID} .seller-profile-image-v6 .seller-field>label{display:flex;align-items:center;gap:.2rem;margin-bottom:.6rem}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-drop{position:relative;display:grid;grid-template-columns:88px minmax(0,1fr) auto;align-items:center;gap:1rem;min-height:108px;padding:1rem 1.1rem;border:1.5px dashed #a5b4fc;border-radius:16px;background:linear-gradient(135deg,#fafaff,#f8fafc);box-shadow:0 2px 8px rgba(15,23,42,.04);transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-drop:hover,#${FORM_ID} .seller-profile-image-v6 .seller-profile-image-drop.is-dragging{border-color:var(--accent);background:#faf7ff;box-shadow:0 6px 20px rgba(15,23,42,.08)}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-preview-wrap{width:82px;height:82px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #dbeafe,0 4px 12px rgba(15,23,42,.08);background:#fff}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-placeholder{font-size:2rem;color:#94a3b8}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-copy{gap:.3rem}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-copy strong{font-size:.95rem;color:#0f172a}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-copy span{font-size:.78rem;color:#64748b}
        #${FORM_ID} .seller-profile-image-v6 .seller-profile-image-copy small{font-size:.75rem;color:#64748b;line-height:1.45}
        #${FORM_ID} .seller-profile-image-v6 #seller-profile-image-remove{margin-left:auto;white-space:nowrap;border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:.5rem .75rem;color:#475569;font-weight:600;cursor:pointer}
        #${FORM_ID} .seller-profile-image-v6 #seller-profile-image-remove:hover{border-color:#94a3b8;background:#f8fafc}
        #${FORM_ID} .seller-profile-image-v6 #seller-profile-image-status[data-kind="error"]{color:#dc2626;font-weight:600}
        #${FORM_ID} .seller-profile-image-v6 #seller-profile-image-status[data-kind="success"]{color:#15803d;font-weight:600}
        #${FORM_ID} #apply-portfolio[data-auto-generated="true"]{font-size:.78rem;color:#64748b}
        @media(max-width:700px){#${FORM_ID} .seller-profile-image-v6 .seller-profile-image-drop{grid-template-columns:64px minmax(0,1fr);padding:.85rem;gap:.8rem}#${FORM_ID} .seller-profile-image-v6 .seller-profile-image-preview-wrap{width:64px;height:64px}#${FORM_ID} .seller-profile-image-v6 #seller-profile-image-remove{grid-column:2;justify-self:start;margin:0}}
        @media(max-width:420px){#${FORM_ID} .seller-profile-image-v6 .seller-profile-image-drop{grid-template-columns:1fr}#${FORM_ID} .seller-profile-image-v6 .seller-profile-image-preview-wrap{width:72px;height:72px}#${FORM_ID} .seller-profile-image-v6 #seller-profile-image-remove{grid-column:1}}
      `;
      document.head.appendChild(style);
    }
  }
  function boot(){
    if (!location.hash.includes('/seller/apply')) return;
    const form = document.getElementById(FORM_ID);
    if (form) setup(form);
  }
  const observer = new MutationObserver(boot);
  const start = () => { if (document.body) { observer.observe(document.body,{childList:true,subtree:true}); boot(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('hashchange',()=>setTimeout(boot,0));
})();
