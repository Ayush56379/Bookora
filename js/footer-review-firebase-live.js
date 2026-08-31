/* Bookora live website-review footer.
   Firebase is the source of truth. No moderation/approval dependency.
   Only this reader-review display is handled here. */
(() => {
  const STYLE_ID = 'bookora-footer-review-live-style';
  const CARD_ID = 'bookora-footer-live-review-card';
  let refreshTimer = null;
  let reviews = [];

  const esc = (v) => String(v ?? '').replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const photo = (v) => /^https?:\/\//i.test(String(v || '').trim()) ? String(v).trim() : '';
  const nameOf = (r) => String(r.displayName || r.publicName || r.name || r.user_name || r.userName || 'Bookora Reader').trim() || 'Bookora Reader';
  const initials = (name) => name.split(/\s+/).filter(Boolean).map(x => x[0]).join('').toUpperCase().slice(0,2) || 'BR';

  const dedupeOneReviewPerUserBook = (rows) => {
    const unique = new Map();
    (Array.isArray(rows) ? rows : []).forEach(r => {
      const userKey = String(r.user_id || r.userId || r.uid || r.firebaseUid || r.email || r.user_email || r.userEmail || '').trim().toLowerCase();
      const bookKey = String(r.book_id || r.bookId || r.bookID || '').trim();
      const key = userKey && bookKey ? `user-book:${userKey}|${bookKey}` : `review:${String(r.id || r.reviewId || r.review_id || '')}`;
      const current = unique.get(key);
      if (!current) { unique.set(key, r); return; }
      const currentTime = current.created_at?.toDate ? current.created_at.toDate().getTime() : new Date(current.created_at || current.createdAt || current.date || 0).getTime();
      const nextTime = r.created_at?.toDate ? r.created_at.toDate().getTime() : new Date(r.created_at || r.createdAt || r.date || 0).getTime();
      if (nextTime > currentTime) unique.set(key, r);
    });
    return [...unique.values()];
  };

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
      #${CARD_ID} .br-list{display:flex;flex-direction:column;gap:14px;max-height:520px;overflow:auto;}
      #${CARD_ID} .br-review{padding:0 0 12px;border-bottom:1px solid rgba(148,163,184,.14);}
      #${CARD_ID} .br-review:last-child{border-bottom:0;padding-bottom:0;}
      #${CARD_ID} .br-row{display:flex;align-items:center;gap:10px;min-width:0;}
      #${CARD_ID} .br-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;display:block;flex:0 0 40px;}
      #${CARD_ID} .br-initials{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;flex:0 0 40px;background:#eaf1ff;color:#2563eb;font:800 12px Inter,system-ui,sans-serif;}
      #${CARD_ID} .br-name{font:700 13px/1.2 Inter,system-ui,sans-serif;color:#17233b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      #${CARD_ID} .br-stars{margin-top:3px;font:700 13px/1 Inter,system-ui,sans-serif;color:#f59e0b;letter-spacing:1px;}
      #${CARD_ID} .br-text{margin:7px 0 0;font:400 12px/1.45 Inter,system-ui,sans-serif;color:#64748b;white-space:normal;overflow-wrap:anywhere;}
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
    hideStaticEmpty(block);
    if (!reviews.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    card.innerHTML = `<div class="br-list">${reviews.map(r => {
      const rating = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)));
      const name = nameOf(r);
      const p = photo(r.photoURL || r.photoUrl || r.avatarUrl || r.avatar || r.profilePhoto);
      const avatar = p ? `<img class="br-avatar" src="${esc(p)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="br-initials">${esc(initials(name))}</span>`;
      const text = String(r.comment || '').trim();
      return `<article class="br-review"><div class="br-row">${avatar}<div style="min-width:0;flex:1"><div class="br-name">${esc(name)}</div><div class="br-stars" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div></div></div>${text ? `<p class="br-text">${esc(text)}</p>` : ''}</article>`;
    }).join('')}</div>`;
  };

  const load = async () => {
    try {
      const db = window.firebase?.firestore?.();
      if (!db) return;
      const snap = await db.collection('reviews').get();
      reviews = dedupeOneReviewPerUserBook(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5))
        .sort((a,b) => String(b.createdAt || b.created_at || b.date || '').localeCompare(String(a.createdAt || a.created_at || a.date || '')));
      render();
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
