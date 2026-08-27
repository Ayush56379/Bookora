// Bookora Explore — unified filters + fast local AI-style natural-language filter.
// No external AI key is required. It interprets common English/Hinglish filter requests
// and applies the same catalog filters instantly on the canonical Explore page.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_SMART_FILTER_V1__) return;
  window.__BOOKORA_EXPLORE_SMART_FILTER_V1__ = true;

  const state = {
    search: '', category: '', source: 'all', min: 0, max: Infinity, rating: 0, ai: '', sort: ''
  };
  let scheduled = 0;

  const root = () => document.querySelector('.explore-page');
  const grid = () => document.querySelector('#explore-books-grid');
  const cards = () => [...document.querySelectorAll('#explore-books-grid .book-card[data-book-id]')];
  const clean = v => String(v ?? '').trim().toLowerCase();
  const num = v => { const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };

  const cardData = card => {
    const text = clean(card.textContent);
    const title = clean(card.querySelector('.book-card-title-link h3')?.textContent);
    const author = clean(card.querySelector('.book-card-author')?.textContent);
    const category = clean(card.querySelector('.book-cover-topline')?.textContent || card.querySelector('.book-card-meta-row .badge')?.textContent);
    const rating = num(card.querySelector('.book-rating-value')?.textContent);
    const priceText = card.querySelector('.book-card-price')?.textContent || '';
    const price = num(priceText);
    const external = /external/.test(text);
    return { text, title, author, category, rating, price, external };
  };

  const updateCount = visible => {
    const toolbar = document.querySelector('.catalog-toolbar');
    if (!toolbar) return;
    const candidates = [...toolbar.querySelectorAll('*')].filter(el => el.children.length === 0 && /showing\s+\d+\s+ebooks?/i.test(el.textContent || ''));
    if (candidates[0]) candidates[0].textContent = `Showing ${visible} eBooks`;
    const summary = document.querySelector('#mobile-filter-summary');
    if (summary) summary.textContent = `${visible} book${visible === 1 ? '' : 's'} shown`;
  };

  const readControls = () => {
    const p = root();
    if (!p) return;
    const search = p.querySelector('#filter-search-input');
    const cat = p.querySelector('input[name="filter-category"]:checked');
    const min = p.querySelector('#filter-min-price');
    const max = p.querySelector('#filter-max-price');
    const rating = p.querySelector('input[name="filter-rating"]:checked');
    const source = p.querySelector('input[name="filter-source"]:checked');
    const sort = p.querySelector('#catalog-sort-select');
    state.search = clean(search?.value);
    state.category = clean(cat?.value);
    state.min = Math.max(0, num(min?.value || 0));
    state.max = max?.value === '' ? Infinity : Math.max(state.min, num(max?.value || 999999));
    state.rating = Math.max(0, num(rating?.value || 0));
    state.source = clean(source?.value || 'all') || 'all';
    state.sort = clean(sort?.value || '');
  };

  const apply = () => {
    const p = root();
    if (!p) return;
    readControls();
    const q = clean(state.ai);
    let visible = 0;
    cards().forEach(card => {
      const b = cardData(card);
      const searchOk = !state.search || `${b.title} ${b.author} ${b.category} ${b.text}`.includes(state.search);
      const aiOk = !q || `${b.title} ${b.author} ${b.category} ${b.text}`.includes(q) || aiIntentMatch(b, q);
      const catOk = !state.category || b.category.includes(state.category);
      const sourceOk = state.source === 'all' || (state.source.includes('external') ? b.external : !b.external);
      const priceOk = b.price >= state.min && b.price <= state.max;
      const ratingOk = !state.rating || b.rating >= state.rating;
      const ok = searchOk && aiOk && catOk && sourceOk && priceOk && ratingOk;
      card.hidden = !ok;
      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    updateCount(visible);
    updateActiveSummary();
  };

  function aiIntentMatch(b, q) {
    const under = q.match(/(?:under|below|less than|upto|up to|kam|se kam|max(?:imum)?)[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const above = q.match(/(?:above|over|more than|greater than|minimum|min|zyada|se zyada)[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const rating = q.match(/(?:rating|rated|stars?|star)[^0-9]{0,8}(\d(?:\.\d)?)/i);
    if (under && b.price > Number(under[1])) return false;
    if (above && b.price < Number(above[1])) return false;
    if (rating && b.rating < Number(rating[1])) return false;
    if (/(?:bookora|internal)/i.test(q) && b.external) return false;
    if (/external/i.test(q) && !b.external) return false;
    if (/(?:free|zero price|free books)/i.test(q) && b.price > 0) return false;
    if (/(?:cheap|saste|low price)/i.test(q) && b.price > 199) return false;
    if (/(?:romance|business|finance|horror|fiction|self[- ]?help|science|education|biography|history|technology|health)/i.test(q)) {
      const terms = q.match(/romance|business|finance|horror|fiction|self[- ]?help|science|education|biography|history|technology|health/gi) || [];
      if (terms.length && !terms.some(t => b.category.includes(clean(t)) || b.text.includes(clean(t)))) return false;
    }
    return true;
  }

  const parseAI = query => {
    const raw = String(query || '').trim();
    const q = clean(raw);
    if (!q) { state.ai = ''; apply(); return; }
    if (/^(clear|reset|remove all filters|sab clear|sab hatao)$/i.test(q)) {
      document.querySelector('#reset-filters-btn')?.click();
      state.ai = '';
      setTimeout(apply, 0);
      return;
    }
    state.ai = q;
    const p = root();
    if (!p) return;

    const under = q.match(/(?:under|below|less than|upto|up to|kam|se kam|max(?:imum)?)[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const above = q.match(/(?:above|over|more than|greater than|minimum|min|zyada|se zyada)[^0-9]{0,10}(\d+(?:\.\d+)?)/i);
    const between = q.match(/(?:between|from)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-|se)\s*(\d+(?:\.\d+)?)/i);
    const rating = q.match(/(?:rating|rated|stars?|star)[^0-9]{0,8}(\d(?:\.\d)?)/i);
    if (between) {
      setInput('#filter-min-price', between[1]); setInput('#filter-max-price', between[2]);
    } else if (under) {
      setInput('#filter-min-price', '0'); setInput('#filter-max-price', under[1]);
    } else if (above) {
      setInput('#filter-min-price', above[1]);
    }
    if (rating) {
      const value = Math.min(5, Math.max(0, Number(rating[1])));
      const radio = [...p.querySelectorAll('input[name="filter-rating"]')].find(x => Number(x.value) === value);
      if (radio) radio.checked = true;
    }
    if (/external/i.test(q)) checkSource('external');
    else if (/(?:bookora|internal)/i.test(q)) checkSource('internal');

    const categories = [...p.querySelectorAll('input[name="filter-category"]')].map(x => String(x.value || '')).filter(Boolean);
    const matchedCategory = categories.find(c => q.includes(clean(c)) || clean(c).includes(q));
    if (matchedCategory) {
      const radio = [...p.querySelectorAll('input[name="filter-category"]')].find(x => x.value === matchedCategory);
      if (radio) radio.checked = true;
    }
    if (/(?:newest|latest|new releases)/i.test(q)) setSelect('newest');
    else if (/(?:price low|cheapest|lowest)/i.test(q)) setSelect('price-asc');
    else if (/(?:price high|expensive|highest)/i.test(q)) setSelect('price-desc');
    else if (/(?:popular|best selling|bestseller)/i.test(q)) setSelect('popular');
    apply();
  };

  const setInput = (selector, value) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const checkSource = value => {
    const radio = [...document.querySelectorAll('input[name="filter-source"]')].find(x => clean(x.value) === value);
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
  };
  const setSelect = value => {
    const el = document.querySelector('#catalog-sort-select');
    if (!el) return;
    const option = [...el.options].find(o => clean(o.value) === value || clean(o.textContent).includes(value.replace('-', ' ')));
    if (option) { el.value = option.value; el.dispatchEvent(new Event('change', { bubbles: true })); }
  };

  const updateActiveSummary = () => {
    const host = document.querySelector('#bookora-smart-filter-summary');
    if (!host) return;
    const bits = [];
    if (state.search) bits.push(`Search: ${state.search}`);
    if (state.category) bits.push(`Category: ${state.category}`);
    if (state.min > 0) bits.push(`Min ₹${state.min}`);
    if (state.max !== Infinity && state.max < 999999) bits.push(`Max ₹${state.max}`);
    if (state.rating) bits.push(`${state.rating}+ rating`);
    if (state.source !== 'all') bits.push(state.source === 'external' ? 'External' : 'Bookora');
    if (state.ai) bits.push(`AI: ${state.ai}`);
    host.textContent = bits.length ? bits.join(' • ') : 'No filters applied';
  };

  const injectAI = () => {
    const p = root();
    if (!p || document.getElementById('bookora-ai-filter')) return;
    const section = document.createElement('section');
    section.id = 'bookora-ai-filter';
    section.className = 'filter-section';
    section.innerHTML = `
      <div class="smart-filter-title"><span>✨ AI Smart Filter</span><span class="smart-filter-badge">FAST</span></div>
      <p class="smart-filter-help">Ask naturally: “business under ₹199”, “4.5 star books”, “horror under 500”, “external books”.</p>
      <div class="smart-filter-box"><input id="bookora-ai-filter-input" type="search" placeholder="Try: books under ₹199 with 4 stars..." autocomplete="off"><button id="bookora-ai-filter-btn" type="button">Apply</button></div>
      <div id="bookora-smart-filter-summary" class="smart-filter-summary">No filters applied</div>`;
    const searchSection = p.querySelector('[data-filter-body="keyword"]')?.closest('.filter-section');
    (searchSection || p.querySelector('.filter-sidebar'))?.after(section);

    document.getElementById('bookora-ai-filter-btn')?.addEventListener('click', () => parseAI(document.getElementById('bookora-ai-filter-input')?.value));
    document.getElementById('bookora-ai-filter-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') parseAI(e.currentTarget.value); });

    if (!document.getElementById('bookora-smart-filter-css')) {
      const style = document.createElement('style');
      style.id = 'bookora-smart-filter-css';
      style.textContent = `
        .explore-page #bookora-ai-filter{background:linear-gradient(145deg,#faf5ff,#fff);border:1px solid #ddd6fe;border-radius:12px;margin:0 0 10px;padding:13px 14px;box-shadow:0 2px 9px rgba(124,58,237,.06)}
        .explore-page .smart-filter-title{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:800;color:#4c1d95}.explore-page .smart-filter-badge{font-size:9px;padding:3px 6px;border-radius:999px;background:#ede9fe;color:#6d28d9;letter-spacing:.05em}.explore-page .smart-filter-help{font-size:10.5px;line-height:1.45;color:#64748b;margin:7px 0}.explore-page .smart-filter-box{display:flex;gap:6px}.explore-page #bookora-ai-filter-input{min-width:0;flex:1;height:38px;border:1px solid #ddd6fe;border-radius:8px;padding:0 9px;background:#fff;font-size:11.5px;outline:none}.explore-page #bookora-ai-filter-input:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(124,58,237,.1)}.explore-page #bookora-ai-filter-btn{height:38px;border:0;border-radius:8px;padding:0 11px;background:#7c3aed;color:#fff;font-size:11px;font-weight:800;cursor:pointer}.explore-page #bookora-ai-filter-btn:hover{background:#6d28d9}.explore-page .smart-filter-summary{margin-top:7px;color:#64748b;font-size:10px;line-height:1.4;word-break:break-word}
        .explore-page #explore-books-grid .book-card[hidden]{display:none!important}
      `;
      document.head.appendChild(style);
    }
  };

  const wire = () => {
    const p = root();
    if (!p) return;
    injectAI();
    if (p.dataset.smartFilterWired === '1') { scheduleApply(); return; }
    p.dataset.smartFilterWired = '1';
    p.addEventListener('input', e => {
      if (e.target.matches('#filter-search-input,#filter-min-price,#filter-max-price,#filter-price-slider')) scheduleApply();
    }, true);
    p.addEventListener('change', e => {
      if (e.target.matches('input[name="filter-category"],input[name="filter-rating"],input[name="filter-source"],#catalog-sort-select')) scheduleApply();
    }, true);
    p.querySelector('#reset-filters-btn')?.addEventListener('click', () => {
      state.ai = '';
      const ai = document.getElementById('bookora-ai-filter-input'); if (ai) ai.value = '';
      setTimeout(scheduleApply, 0);
    }, true);
    scheduleApply();
  };

  const scheduleApply = () => {
    cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(() => apply());
  };

  const boot = () => { if (root()) wire(); };
  window.addEventListener('hashchange', () => setTimeout(boot, 0));
  window.addEventListener('bookora:catalog-updated', () => setTimeout(boot, 0));
  const observer = new MutationObserver(() => { if (root()) { injectAI(); scheduleApply(); } });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else setTimeout(boot, 0);
})();
