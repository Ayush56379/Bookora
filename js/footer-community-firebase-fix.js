/* Footer community: Firebase is the source of truth.
   Only two things are rendered: reviewer profile photos + overall star rating. */
(() => {
  const STYLE_ID = 'bookora-footer-community-firebase-style';
  const MAX_AVATARS = 6;
  let renderInFlight = false;
  let renderQueued = false;

  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const validUrl = v => /^https?:\/\//i.test(String(v || '').trim()) ? String(v).trim() : '';

  function styles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      #bookora-footer-avatars{display:flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;padding-left:8px!important;}
      #bookora-footer-avatars .bookora-footer__avatar-image{width:40px!important;height:40px!important;border-radius:50%!important;margin-left:-9px!important;border:2px solid #fff!important;background:#fff!important;display:block!important;overflow:hidden!important;box-shadow:0 2px 7px rgba(15,23,42,.12)!important;}
      #bookora-footer-avatars .bookora-footer__avatar-image:first-child{margin-left:0!important;}
      #bookora-footer-avatars .bookora-footer__avatar-image img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;}
      #bookora-footer-rating{display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;letter-spacing:0!important;font-size:25px!important;line-height:1!important;min-height:32px!important;color:#f5a623!important;}
      #bookora-footer-rating .footer-star{display:inline-block!important;font-size:25px!important;line-height:1!important;}
    `;
    document.head.appendChild(s);
  }

  async function getReviews() {
    const db = window.firebase?.firestore?.();
    if (!db) return null;
    const snap = await db.collection('reviews').get();
    return snap.docs.map(d => ({id:d.id, ...d.data()}))
      .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5)
      .sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  async function resolvePhoto(review, db) {
    const direct = validUrl(review.photoURL || review.photoUrl || review.avatarUrl || review.avatar || review.profileImage || review.profilePhoto || review.imageUrl);
    if (direct) return direct;
    const uid = String(review.uid || review.firebaseUid || review.firebase_uid || '').trim();
    if (!uid) return '';
    try {
      const snap = await db.collection('users').doc(uid).get();
      if (snap.exists) {
        const u = snap.data() || {};
        return validUrl(u.photoURL || u.photoUrl || u.avatarUrl || u.avatar || u.profileImage || u.profilePhoto || u.imageUrl);
      }
    } catch (_) {}
    return '';
  }

  async function render() {
    if (renderInFlight) { renderQueued = true; return false; }
    renderInFlight = true;
    try {
      styles();
      const starsEl = document.getElementById('bookora-footer-rating');
      const avatarsEl = document.getElementById('bookora-footer-avatars');
      if (!starsEl || !avatarsEl || !window.firebase?.firestore) return false;
      const db = window.firebase.firestore();
      const reviews = await getReviews();
      if (!reviews) return false;
      const average = reviews.length ? reviews.reduce((sum,r) => sum + Number(r.rating || 0), 0) / reviews.length : 0;
      const rounded = Math.max(0, Math.min(5, Math.round(average)));
      starsEl.innerHTML = Array.from({length:5}, (_,i) => `<span class="footer-star">${i < rounded ? '★' : '☆'}</span>`).join('');
      starsEl.setAttribute('aria-label', reviews.length ? `${average.toFixed(1)} out of 5 stars` : 'No ratings yet');
      const selected = [];
      for (const review of reviews) {
        if (selected.length >= MAX_AVATARS) break;
        const photo = await resolvePhoto(review, db);
        if (!photo) continue;
        const name = String(review.displayName || review.publicName || review.name || 'Bookora Reader').trim() || 'Bookora Reader';
        selected.push(`<span class="bookora-footer__avatar-image" title="${esc(name)}"><img src="${esc(photo)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer"></span>`);
      }
      avatarsEl.innerHTML = selected.join('');
      avatarsEl.dataset.firebaseReady = '1';
      return true;
    } finally {
      renderInFlight = false;
      if (renderQueued) {
        renderQueued = false;
        setTimeout(() => { void render(); }, 0);
      }
    }
  }


  function boot() {
    styles();
    void render();
    window.addEventListener('hashchange', () => setTimeout(() => { void render(); }, 100), { passive: true });
    window.addEventListener('bookora:catalog-updated', () => { void render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
