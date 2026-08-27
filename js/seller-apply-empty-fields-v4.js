/* Bookora seller onboarding V4: only authenticated email may autofill; add account reveal control. */
(() => {
  'use strict';
  const FORM_ID='seller-apply-form', EMAIL_ID='apply-email', ACCOUNT_ID='apply-account', FLAG='__BOOKORA_SELLER_V4__';
  const isProtected=e=>e?.id===EMAIL_ID||e?.type==='hidden'||e?.type==='checkbox'||e?.type==='file';
  function clean(form){
    if(!form||form.id!==FORM_ID)return;
    form.setAttribute('autocomplete','off');
    form.querySelectorAll('input,textarea,select').forEach(e=>{
      if(isProtected(e)||e.dataset.userTouched==='1')return;
      e.setAttribute('autocomplete',/account|bank|ifsc|pan|upi|holder/i.test(`${e.id} ${e.name} ${e.placeholder}`)||e.type==='password'?'new-password':'off');
      e.setAttribute('data-lpignore','true');e.setAttribute('data-1p-ignore','true');
      if(e.tagName==='SELECT'){
        [...e.options].forEach(o=>o.selected=false);
        if(!e.multiple){if(!e.options[0]||e.options[0].value!==''){const o=document.createElement('option');o.value='';o.textContent='Select an option';e.insertBefore(o,e.firstChild)}e.value=''}
      }else e.value='';
      e.removeAttribute('value');e.removeAttribute('checked');
    });
    form.querySelectorAll('input[type="checkbox"]').forEach(e=>{if(e.dataset.userTouched!=='1')e.checked=false;e.removeAttribute('checked')});
    const email=form.querySelector('#'+EMAIL_ID),auth=String(window.__BOOKORA_AUTH_EMAIL__||'').trim();
    if(email){email.readOnly=true;email.autocomplete='email';if(auth)email.value=auth;}
  }
  function setup(form){
    if(!form||form.dataset[FLAG])return;
    const touch=e=>{const t=e.target;if(t?.matches('input,textarea,select')&&!t.matches('#'+EMAIL_ID))t.dataset.userTouched='1'};
    ['input','change','paste','drop'].forEach(x=>form.addEventListener(x,touch,true));form.dataset[FLAG]='1';
    const input=form.querySelector('#'+ACCOUNT_ID);
    if(input&&!document.getElementById('seller-account-eye-v4')){
      input.type='password';input.autocomplete='new-password';const wrap=document.createElement('div');wrap.className='seller-account-input-wrap-v4';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
      const b=document.createElement('button');b.id='seller-account-eye-v4';b.type='button';b.className='seller-account-eye-v4';b.textContent='👁';b.setAttribute('aria-label','Show account number');wrap.appendChild(b);
      b.addEventListener('click',e=>{e.preventDefault();const show=input.type==='text';input.type=show?'password':'text';b.setAttribute('aria-label',show?'Show account number':'Hide account number')});
    }
    clean(form);[50,250,800,1500,3000].forEach(d=>setTimeout(()=>clean(form),d));
  }
  const s=document.createElement('style');s.textContent='#seller-apply-form .seller-account-input-wrap-v4{position:relative;width:100%}#seller-apply-form .seller-account-input-wrap-v4 input{padding-right:3rem}#seller-apply-form .seller-account-eye-v4{position:absolute;right:.5rem;top:50%;transform:translateY(-50%);width:34px;height:34px;border:0;border-radius:8px;background:transparent;cursor:pointer;font-size:16px}#seller-apply-form .seller-account-eye-v4:hover{background:#f1f5f9}';document.head.appendChild(s);
  function boot(){if(!location.hash.includes('/seller/apply'))return;const f=document.getElementById(FORM_ID);if(f)setup(f)}
  const obs=new MutationObserver(boot);const start=()=>{if(document.body){obs.observe(document.body,{childList:true,subtree:true});boot()}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();window.addEventListener('hashchange',()=>setTimeout(boot,0));
})();
