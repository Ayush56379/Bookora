import { renderAdminReviewSubmissionsPage, initAdminReviewSubmissionsEvents } from './pages/AdminReviewSubmissionsPage.js';
(() => {
  if (window.__BOOKORA_ADMIN_REVIEW_ROUTE__) return;
  window.__BOOKORA_ADMIN_REVIEW_ROUTE__ = true;
  const isAdminPath = () => /^#\/admin(?:\/|$)/.test(location.hash || '#/');
  const isReviewPath = () => (location.hash || '').split('?')[0].replace(/\/+$/,'') === '#/admin/review-submissions';
  function addTab(){
    if(!isAdminPath()) return;
    document.querySelectorAll('.admin-dashboard .container > div').forEach(strip => {
      if(!strip.querySelector('a[href="#/admin/overview"]')) return;
      if(strip.querySelector('[data-admin-review-tab]')) return;
      const a=document.createElement('a'); a.href='#/admin/review-submissions'; a.dataset.adminReviewTab='1'; a.className='nav-link'; a.textContent='Review Submissions'; a.style.cssText='font-size:.85rem;font-weight:700;border-radius:var(--radius-md);padding:.5rem 1rem;white-space:nowrap;';
      strip.appendChild(a);
    });
  }
  async function mount(){
    if(!isReviewPath()) return;
    const app=document.getElementById('app'); if(!app) return;
    const main=document.getElementById('main-content');
    if(!main) return setTimeout(mount,50);
    main.innerHTML=renderAdminReviewSubmissionsPage();
    try{await initAdminReviewSubmissionsEvents();}catch(e){console.error('[Bookora] Review submissions init failed',e);}
  }
  const sync=()=>{addTab();if(isReviewPath())setTimeout(mount,80);};
  window.addEventListener('hashchange',sync,true);
  const observer=new MutationObserver(()=>{addTab();if(isReviewPath()&&!document.querySelector('.ars-wrap'))setTimeout(mount,40);});
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();
