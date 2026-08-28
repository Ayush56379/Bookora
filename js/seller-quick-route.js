// Bookora seller onboarding route resilience.
// Keep this route isolated so a seller-page module can never block global app boot.
(() => {
  if (window.__BOOKORA_FINAL_SELLER_ROUTE_V4__) return;
  window.__BOOKORA_FINAL_SELLER_ROUTE_V4__ = true;

  const getPhotoUrl = () => {
    try {
      const firebaseUser = window.firebase?.auth?.()?.currentUser;
      const u = window.__BOOKORA_APP_INSTANCE__?.state?.currentUser || {};
      return String(firebaseUser?.photoURL || u.photoURL || u.photoUrl || u.photo_url || u.profileImageUrl || u.avatarUrl || u.avatar || '').trim();
    } catch (_) { return ''; }
  };

  const saveAccountPhoto = async () => {
    const url = getPhotoUrl();
    const user = window.firebase?.auth?.()?.currentUser;
    const db = window.firebase?.firestore?.();
    if (!url || !user || !db) return;
    try {
      const ref = db.collection('sellers').doc(user.uid);
      const snap = await ref.get();
      const data = {
        user_id: user.uid,
        uid: user.uid,
        firebaseUid: user.uid,
        email: user.email || '',
        profileImageUrl: url,
        profileImageId: 'account-profile-photo',
        profileImageSource: 'account',
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };
      if (!snap.exists) {
        data.status = 'draft';
        data.sellerStatus = 'inactive';
        data.createdAt = window.firebase.firestore.FieldValue.serverTimestamp();
      }
      await ref.set(data, { merge: true });
    } catch (error) {
      console.info('[Bookora seller account photo] Firebase sync skipped:', error?.message || error);
    }
  };

  const applyAccountPhotoUI = () => {
    const url = getPhotoUrl();
    if (!url) return;
    const input = document.getElementById('profile-file');
    const browse = document.getElementById('profile-browse');
    const status = document.getElementById('profile-status');
    const preview = document.getElementById('profile-preview');
    if (input) { input.disabled = true; input.value = ''; }
    if (browse) { browse.style.display = 'none'; browse.disabled = true; }
    if (preview) preview.innerHTML = `<img src="${String(url).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" alt="Account profile photo" loading="eager">`;
    if (status) status.textContent = 'Using your Bookora account profile photo ✓';
  };

  const renderDirect = async (app) => {
    try {
      const m = await import('./pages/SellerApplyQuickPage.js?v=20260828-account-photo-5');
      await saveAccountPhoto();
      const main = document.getElementById('main-content');
      if (!main) return false;
      main.innerHTML = m.renderSellerApplyPage();
      if (typeof m.initSellerApplyEvents === 'function') await m.initSellerApplyEvents();
      applyAccountPhotoUI();
      return true;
    } catch (error) {
      console.error('[Bookora seller route recovery]', error);
      return false;
    }
  };

  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app) return false;
    if (app.__sellerRouteResilientV4) return true;
    app.__sellerRouteResilientV4 = true;

    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/seller/apply') {
        const m = await import('./pages/SellerApplyQuickPage.js?v=20260828-account-photo-5');
        return { html: m.renderSellerApplyPage(), init: async () => { await m.initSellerApplyEvents(); applyAccountPhotoUI(); } };
      }
      return original(path, params);
    };

    if (app.currentPath?.() === '/seller/apply') {
      const main = document.getElementById('main-content');
      const loading = main && /Loading Bookora/i.test(main.textContent || '');
      if (loading) setTimeout(() => renderDirect(app), 50);
      else setTimeout(applyAccountPhotoUI, 100);
    }
    return true;
  };

  if (!install()) [50, 150, 400, 1000, 2000].forEach(delay => setTimeout(install, delay));
})();
