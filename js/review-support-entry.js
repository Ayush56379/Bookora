(() => {
  let aiOpening = false;

  const openBookoraAI = async () => {
    if (aiOpening) return;
    aiOpening = true;
    try {
      let trigger = document.getElementById('bookora-ai-trigger-btn');
      if (!trigger) {
        const mod = await import('./components/BookoraAIEnhanced.js');
        const ai = mod?.BookoraAI;
        if (ai?.init) ai.init();
        trigger = document.getElementById('bookora-ai-trigger-btn');
        if (trigger) {
          ai?.open?.();
          return;
        }
      }
      if (trigger) trigger.click();
      else console.warn('[Bookora Support] Bookora AI could not be initialized.');
    } catch (error) {
      console.warn('[Bookora Support] AI assistant failed to open.', error);
    } finally {
      aiOpening = false;
    }
  };

  const isSupportPage = () => (location.hash || '').split('?')[0] === '#/review-support';

  const add = () => {
    if (isSupportPage() || document.getElementById('bookora-review-support-entry')) return;
    const b = document.createElement('button');
    b.id = 'bookora-review-support-entry';
    b.type = 'button';
    b.innerHTML = '<span>AI Bookora Support</span>';
    Object.assign(b.style, {
      position:'fixed', right:'18px', bottom:'18px', zIndex:'45', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'11px 15px',
      borderRadius:'999px', border:'0', background:'#2563eb', color:'#fff',
      font:'700 13px Inter,system-ui,sans-serif', textDecoration:'none',
      boxShadow:'0 10px 28px rgba(37,99,235,.28)', whiteSpace:'nowrap', cursor:'pointer'
    });
    b.addEventListener('click', openBookoraAI);
    document.body.appendChild(b);
  };

  const installHeroAnimation = () => {
    if (document.getElementById('bookora-home-device-animation')) return;
    const style = document.createElement('style');
    style.id = 'bookora-home-device-animation';
    style.textContent = `
      .home-hero-art .home-art-device{
        animation:bookoraDeviceFloat 4.8s ease-in-out infinite;
        transform-origin:center center;
        will-change:transform;
      }
      @keyframes bookoraDeviceFloat{
        0%,100%{transform:translate3d(0,0,0) rotate(7deg)}
        50%{transform:translate3d(0,-10px,0) rotate(7deg)}
      }
      @media (prefers-reduced-motion:reduce){.home-hero-art .home-art-device{animation:none!important}}
    `;
    document.head.appendChild(style);
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const safePhoto = (value) => /^https?:\/\//i.test(String(value || '').trim()) ? String(value).trim() : '';
  const initials = (name) => {
    const parts = String(name || 'Bookora Reader').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || 'B') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] || '') : '')).toUpperCase().slice(0,2);
  };

  let publicReviews = [];
  let reviewIndex = 0;
  let reviewTimer = null;
  let reviewRefreshTimer = null;

  const ensureReviewCard = () => {
    const block = document.querySelector('.bookora-footer__rating-block');
    if (!block || document.getElementById('bookora-footer-review-card')) return document.getElementById('bookora-footer-review-card');
    const card = document.createElement('div');
    card.id = 'bookora-footer-review-card';
    card.setAttribute('aria-live', 'polite');
    card.style.cssText = 'margin-top:14px;padding:13px 14px;border:1px solid rgba(148,163,184,.22);border-radius:14px;background:rgba(255,255,255,.72);min-height:78px;transition:opacity .25s ease,transform .25s ease;overflow:hidden;';
    block.appendChild(card);
    return card;
  };

  const renderReview = () => {
    const card = ensureReviewCard();
    if (!card || !publicReviews.length) {
      if (card) card.style.display = 'none';
      return;
    }
    card.style.display = 'block';
    const review = publicReviews[reviewIndex % publicReviews.length] || {};
    const name = String(review.displayName || 'Bookora Reader').trim() || 'Bookora Reader';
    const photo = safePhoto(review.photoURL || review.photoUrl || review.avatarUrl || review.avatar);
    const rating = Math.max(1, Math.min(5, Number(review.rating) || 0));
    const comment = String(review.comment || '').trim();
    const avatar = photo
      ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}" loading="lazy" referrerpolicy="no-referrer" style="width:38px;height:38px;border-radius:50%;object-fit:cover;display:block;">`
      : `<span style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#e2e8f0;color:#334155;font:800 12px Inter,system-ui,sans-serif;">${escapeHtml(initials(name))}</span>`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(4px)';
    setTimeout(() => {
      card.innerHTML = `<div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex:0 0 auto;">${avatar}</div>
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <strong style="font:700 13px Inter,system-ui,sans-serif;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(name)}</strong>
            <span style="font:700 12px Inter,system-ui,sans-serif;color:#f59e0b;white-space:nowrap;">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span>
          </div>
          ${comment ? `<p style="margin:5px 0 0;font:400 12px/1.45 Inter,system-ui,sans-serif;color:#475569;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(comment)}</p>` : ''}
        </div>
      </div>`;
      requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
    }, 120);
  };

  const startReviewRotation = () => {
    if (reviewTimer) clearInterval(reviewTimer);
    if (publicReviews.length <= 1) return;
    reviewTimer = setInterval(() => {
      reviewIndex = (reviewIndex + 1) % publicReviews.length;
      renderReview();
    }, 5000);
  };

  const loadPublicReviews = async () => {
    try {
      const base = typeof window !== 'undefined' ? (window.BOOKORA_API_URL || '') : '';
      if (!base) return;
      const response = await fetch(`${base}/api/reviews`, {headers:{Accept:'application/json'}, cache:'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      publicReviews = Array.isArray(data.reviews) ? data.reviews.filter(r => r && Number(r.rating) >= 1 && Number(r.rating) <= 5) : [];
      reviewIndex = 0;
      renderReview();
      startReviewRotation();
    } catch (error) {
      console.warn('[Bookora footer] Public review carousel unavailable:', error);
    }
  };

  const scheduleReviewRefresh = () => {
    if (reviewRefreshTimer) clearInterval(reviewRefreshTimer);
    reviewRefreshTimer = setInterval(loadPublicReviews, 60000);
  };

  const refresh = () => {
    const b = document.getElementById('bookora-review-support-entry');
    if (isSupportPage()) b?.remove();
    else add();
    installHeroAnimation();
    setTimeout(() => {
      loadPublicReviews();
      scheduleReviewRefresh();
    }, 150);
  };

  window.addEventListener('hashchange', refresh);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, { once:true });
  } else {
    refresh();
  }
})();
