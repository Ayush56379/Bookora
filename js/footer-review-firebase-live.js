/* Bookora live website-review footer.
   Firebase is the source of truth. No moderation/approval dependency. */
(() => {
  const STYLE_ID = 'bookora-footer-review-live-style';
  const CARD_ID = 'bookora-footer-live-review-card';
  let timer = null;
  let refreshTimer = null;
  let reviews = [];
  let index = 0;

  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const photo = (v) => /^https?:\/\//i.test(String(v || '').trim()) ? String(v).trim() : '';
  const nameOf = (r) => String(r.displayName || r.publicName || r.name || 'Bookora Reader').trim() || 'Bookora Reader';
  const initials = (name) => name.split(/\s+/).filter(Boolean).map(x => x[0]).join('').toUpperCase().slice(0,2) || 'BR';

  const findBlock = () => {
    const direct = document.querySelector('.bookora-footer__rating-block');
    if (direct) return direct;
    const nodes = Array.from(document.querySelectorAll('div,section,article'));
    return nodes.find(el => /No rating yet|Our users love Bookora/i.test(el.textContent || '') && el.querySelector('svg,span')) || null;
  };

  const injectStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      #${CARD_ID}{margin-top:12px;padding:12px 10px;border-top:1px solid rgba(148,163,184,.18);}
      #${CARD_ID} .br-row{display:flex;align-items:center;gap:10px;min-width:0;}
      #${CARD_ID} .br-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;flex:0 0 40px;}
      #${CARD_ID} .br-initials{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;flex:0 0 40px;background:#eaf1ff;color:#2563eb;font:800 12px Inter,system-ui,sans-serif;}
      #${CARD_ID} .br-name{font:700 13px/1.2 Inter,system-ui,sans-serif;color:#17233b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      #${CARD_ID} .br-stars{margin-top:3px;font:700 13px/1 Inter,system-ui,sans-serif;color:#f59e0b;letter-spacing:1px;}
      #${CARD_ID} .br-text{margin:7px 0 0;font:400 12px/1.45 Inter,system-ui,sans-serif;color:#64748b;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    `;
    document.head.appendChild(s);
  };

  const getCard = () => {
    const block = findBlock();
    if (!block) return null;
    let card = document.getElementById(CARD_ID);
    if (!card) { card = document.createElement('div'); card.id = CARD_ID; block.appendChild(card); }
    return card;
  };

  const hideStaticEmpty = (block) => {
    if (!block) return;
    Array.from(block.querySelectorAll('*')).forEach(el => {
      const text = (el.textContent || '').trim();
      if (text === 'No rating yet') el.style.display = 'none';
    });
  };

  const render = () => {
    const block = findBlock();
    const card = getCard();
    if (!block || !card) return;
    if (!reviews.length) {
      card.style.display = 'none';
      hideStaticEmpty(block);
      return;
    }
    card.style.display = 'block';
    hideStaticEmpty(block);
    const r = reviews[index % reviews.length] || {};
    const rating = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)));
    const name = nameOf(r);
    const p = photo(r.photoURL || r.photoUrl || r.avatarUrl || r.avatar || r.profilePhoto);
    const avatar = p ? `<img class="br-avatar" src="${esc(p)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="br-initials">${esc(initials(name))}</span>`;
    const text = String(r.comment || '').trim();
    card.innerHTML = `<div class="br-row">${avatar}<div style="min-width:0;flex:1"><div class="br-name">${esc(name)}</div><div class="br-stars" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div></div></div>${text ? `<p class="br-text">${esc(text)}</p>` : ''}`;
  };

  const startRotation = () => {
    if (timer) clearInterval(timer);
    if (reviews.length <= 1) return;
    timer = setInterval(() => { index = (index + 1) % reviews.length; render(); }, 5000);
  };

  const load = async () => {
    try {
      const db = window.firebase?.firestore?.();
      if (!db) return;
      const snap = await db.collection('reviews').get();
      reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5)
        .sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      index = 0;
      render();
      startRotation();
    } catch (e) {
      console.warn('[Bookora footer] Firebase reviews unavailable:', e?.message || e);
      const card = document.getElementById(CARD_ID); if (card) card.style.display = 'none';
    }
  };

  const boot = () => {
    injectStyle();
    setTimeout(load, 350);
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(load, 30000);
    window.addEventListener('hashchange', () => setTimeout(render, 250));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
