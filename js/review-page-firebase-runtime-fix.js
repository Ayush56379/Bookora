/* Review page runtime: Firebase is the public-review source of truth.
   Shows the newest two reviews by default; remaining reviews appear only after View all. */
(() => {
  const MAX_VISIBLE = 2;
  let showAll = false;
  let lastSignature = '';
  let inFlight = false;

  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const valid = a => Array.isArray(a) ? a.filter(r => r && Number(r.rating) >= 1 && Number(r.rating) <= 5) : [];

  async function readReviews() {
    if (!window.firebase?.firestore) return [];
    const db = window.firebase.firestore();
    const snap = await db.collection('reviews').get();
    return valid(snap.docs.map(d => ({ id: d.id, ...d.data() }))).sort((a,b) => {
      const ad = Date.parse(a.createdAt || a.updatedAt || 0) || 0;
      const bd = Date.parse(b.createdAt || b.updatedAt || 0) || 0;
      return bd - ad;
    });
  }

  function markup(reviews) {
    return reviews.map(r => {
      const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
      const date = new Date(r.createdAt || r.updatedAt || Date.now()).toLocaleDateString('en-IN');
      return `<article class="rs-review"><div class="rs-review-top"><strong>${esc(r.displayName || 'Bookora Reader')}</strong><span>${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span></div><p>${esc(r.comment)}</p><small>${esc(r.category || 'overall')} · ${esc(date)}</small></article>`;
    }).join('');
  }

  function render(reviews) {
    const section = document.getElementById('rs-reviews-section');
    const list = document.getElementById('rs-reviews');
    const summary = document.getElementById('rs-summary');
    if (!section || !list || !summary) return false;
    if (!reviews.length) { section.style.display = 'none'; return true; }

    const average = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length;
    summary.textContent = `★ ${average.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? '' : 's'}`;
    const visible = showAll ? reviews : reviews.slice(0, MAX_VISIBLE);
    const signature = `${showAll}|${reviews.map(r => `${r.id}:${r.createdAt}:${r.rating}`).join('|')}`;
    if (signature !== lastSignature) {
      list.innerHTML = markup(visible);
      lastSignature = signature;
    }

    let controls = document.getElementById('rs-reviews-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'rs-reviews-controls';
      controls.className = 'rs-reviews-controls';
      controls.innerHTML = '<button type="button" id="rs-view-all" class="rs-view-all"></button>';
      list.insertAdjacentElement('afterend', controls);
    }
    const button = document.getElementById('rs-view-all');
    if (reviews.length > MAX_VISIBLE) {
      controls.style.display = 'flex';
      button.textContent = showAll ? 'Show less' : `View all reviews (${reviews.length})`;
      button.onclick = () => { showAll = !showAll; lastSignature = ''; render(reviews); };
    } else {
      controls.style.display = 'none';
    }
    section.style.display = 'block';
    return true;
  }

  async function attempt() {
    if (inFlight) return;
    if (!document.getElementById('rs-reviews-section')) return;
    inFlight = true;
    try {
      const reviews = await readReviews();
      render(reviews);
    } catch (e) {
      console.warn('[Bookora review Firebase runtime]', e?.message || e);
    } finally {
      inFlight = false;
    }
  }

  function boot() {
    void attempt();
    window.addEventListener('hashchange', () => setTimeout(() => { void attempt(); }, 100), { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
