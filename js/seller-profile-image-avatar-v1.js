/* Bookora seller profile avatar presentation V1.
 * Keeps the uploaded profile photo in a small circular avatar and crops
 * toward the upper-center so a typical portrait shows the user's face.
 */
(() => {
  'use strict';
  const STYLE_ID = 'bookora-seller-profile-avatar-v1';
  const apply = () => {
    if (!location.hash.includes('/seller/apply')) return;
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        #seller-profile-image-field .seller-profile-image-drop{align-items:center;min-height:72px;padding:12px 14px;border-radius:14px}
        #seller-profile-image-field .seller-profile-image-preview-wrap{width:56px!important;height:56px!important;min-width:56px!important;max-width:56px!important;flex:0 0 56px!important;border-radius:50%!important;overflow:hidden!important;border:2px solid #e2e8f0!important;background:#fff!important;box-shadow:0 1px 4px rgba(15,23,42,.08)!important}
        #seller-profile-image-field .seller-profile-image-preview-wrap img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:50% 32%!important;border-radius:50%!important}
        #seller-profile-image-field .seller-profile-image-placeholder{font-size:1.45rem!important;line-height:1!important}
        #seller-profile-image-field .seller-profile-image-copy{gap:2px!important}
        #seller-profile-image-field .seller-profile-image-copy strong{font-size:.88rem!important}
        #seller-profile-image-field .seller-profile-image-copy span,#seller-profile-image-field .seller-profile-image-copy small{font-size:.72rem!important}
        #seller-profile-image-field #seller-profile-image-remove{padding:7px 10px!important;white-space:nowrap!important}
        @media(max-width:640px){#seller-profile-image-field .seller-profile-image-drop{padding:10px 12px!important}.seller-profile-image-preview-wrap{width:52px!important;height:52px!important;min-width:52px!important;flex-basis:52px!important}}
      `;
      document.head.appendChild(style);
    }
  };
  const boot = () => { apply(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true});
  window.addEventListener('hashchange', apply);
})();
