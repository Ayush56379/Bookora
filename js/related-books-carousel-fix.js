import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

const STYLE_ID = 'bookora-related-carousel-fix-v4';
let observer = null;
let pollTimer = 0;
let applying = false;

function normalize(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tagsOf(book) {
  return (Array.isArray(book?.tags) ? book.tags : String(book?.tags || '').split(','))
    .map(normalize).filter(Boolean);
}

function scoreRelated(book, candidate) {
  const category = normalize(book?.category);
  const candidateCategory = normalize(candidate?.category);
  const tags = tagsOf(book);
  const candidateTags = tagsOf(candidate);
  const baseWords = new Set(`${category} ${normalize(book?.title)} ${tags.join(' ')}`.split(/\s+/).filter(w => w.length >= 4));
  const candidateWords = `${candidateCategory} ${normalize(candidate?.title)} ${candidateTags.join(' ')}`.split(/\s+/).filter(w => w.length >= 4);
  const exactCategory = Boolean(category && candidateCategory && category === candidateCategory);
  const relatedCategory = Boolean(category && candidateCategory && (category.includes(candidateCategory) || candidateCategory.includes(category)));
  const tagMatch = candidateTags.some(tag => tags.some(sourceTag => tag === sourceTag || tag.includes(sourceTag) || sourceTag.includes(tag)));
  const wordMatch = candidateWords.filter(word => baseWords.has(word)).length;
  return (exactCategory ? 1000 : 0) + (relatedCategory ? 450 : 0) + (tagMatch ? 250 : 0) + Math.min(wordMatch, 5) * 35;
}

function ratingData(book) {
  const ownRating = Number(book?.rating || 0);
  const ownCount = Number(book?.review_count ?? book?.reviewCount ?? book?.reviews_count ?? 0);
  if (ownRating > 0 || ownCount > 0) return { rating: ownRating, count: ownCount };
  const reviews = Array.isArray(state.reviews)
    ? state.reviews.filter(review => String(review.book_id || review.bookId) === String(book?.id))
    : [];
  if (!reviews.length) return { rating: 0, count: 0 };
  return { rating: reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length, count: reviews.length };
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #app .bd-page .bd-related-carousel{position:relative;min-width:0;contain:layout style;overflow:hidden;}
    #app .bd-page .bd-related{
      display:flex!important;grid-template-columns:none!important;gap:16px!important;
      overflow-x:auto!important;overflow-y:hidden!important;
      scroll-behavior:smooth!important;scroll-snap-type:none!important;
      overscroll-behavior-x:contain!important;overflow-anchor:none!important;
      scrollbar-width:thin!important;padding:2px 48px 10px 2px!important;
      min-width:0!important;touch-action:pan-x!important;
      -webkit-overflow-scrolling:touch!important;
    }
    #app .bd-page .bd-related > *{
      flex:0 0 clamp(220px,23vw,260px)!important;
      width:clamp(220px,23vw,260px)!important;
      min-width:clamp(220px,23vw,260px)!important;
      max-width:clamp(220px,23vw,260px)!important;
    }
    #app .bd-page .bd-related-next{
      position:absolute!important;z-index:20!important;top:50%!important;right:7px!important;
      transform:translateY(-50%)!important;width:44px!important;height:44px!important;
      border:1px solid #dbe3ee!important;border-radius:50%!important;background:rgba(255,255,255,.97)!important;
      color:#0f172a!important;display:grid!important;place-items:center!important;cursor:pointer!important;
      box-shadow:0 8px 22px rgba(15,23,42,.14)!important;backdrop-filter:blur(8px)!important;
    }
    #app .bd-page .bd-related-next svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;}
    #app .bd-page .bd-related-next:hover{transform:translateY(-50%) scale(1.04)!important;}
    @media(max-width:600px){
      #app .bd-page .bd-related{gap:12px!important;padding:2px 46px 8px 2px!important;}
      #app .bd-page .bd-related > *{flex-basis:clamp(190px,72vw,230px)!important;width:clamp(190px,72vw,230px)!important;min-width:clamp(190px,72vw,230px)!important;max-width:clamp(190px,72vw,230px)!important;}
      #app .bd-page .bd-related-next{width:40px!important;height:40px!important;right:4px!important;}
    }
    @media(max-width:380px){#app .bd-page .bd-related > *{flex-basis:190px!important;width:190px!important;min-width:190px!important;max-width:190px!important;}}
  `;
  document.head.appendChild(style);
}

function decorateRatings(items) {
  return items.map(item => {
    const r = ratingData(item);
    return r.rating > 0 ? { ...item, rating: r.rating, review_count: r.count } : item;
  });
}

function candidateSignature(items) {
  return items.map(item => String(item?.id || item?.slug || item?.title || '')).join('|');
}

function applyRelatedCarousel() {
  if (applying) return;
  const page = document.querySelector('#app .bd-page');
  const related = page?.querySelector('.bd-related');
  if (!page || !related || related.dataset.carouselReady === '1') return;

  const currentId = page.dataset.bookId;
  const book = state.getApprovedBooks().find(item => String(item.id) === String(currentId))
    || state.getBookBySlug(window.location.hash.split('/').pop()?.split('?')[0] || '');
  if (!book) return;

  const candidates = state.getApprovedBooks()
    .filter(item => String(item.id) !== String(book.id))
    .map((item, index) => ({ item, score: scoreRelated(book, item), index }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 12)
    .map(entry => entry.item);
  if (!candidates.length) return;

  const signature = candidateSignature(candidates);
  if (related.dataset.relatedSignature === signature) {
    related.dataset.carouselReady = '1';
    return;
  }

  applying = true;
  try {
    const enriched = decorateRatings(candidates);
    let carousel = related.parentElement;
    if (!carousel?.classList.contains('bd-related-carousel')) {
      carousel = document.createElement('div');
      carousel.className = 'bd-related-carousel';
      related.parentNode.insertBefore(carousel, related);
      carousel.appendChild(related);
    }

    const previousScrollLeft = related.scrollLeft;
    related.innerHTML = enriched.map(item => renderBookCard(item)).join('');
    related.dataset.relatedSignature = signature;
    related.dataset.carouselReady = '1';

    if (!carousel.querySelector('.bd-related-next')) {
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'bd-related-next';
      next.setAttribute('aria-label', 'Show more related books');
      next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      next.addEventListener('click', () => {
        related.scrollBy({ left: Math.max(260, related.clientWidth * 0.8), behavior: 'smooth' });
      });
      carousel.appendChild(next);
    }

    if (previousScrollLeft > 0) {
      requestAnimationFrame(() => {
        related.scrollLeft = Math.min(previousScrollLeft, Math.max(0, related.scrollWidth - related.clientWidth));
      });
    }
  } finally {
    applying = false;
  }
}

function stopWatcher() {
  if (observer) { observer.disconnect(); observer = null; }
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = 0; }
}

function startWatcher() {
  stopWatcher();
  const app = document.getElementById('app') || document.body;
  const tryApply = () => {
    if (!document.querySelector('#app .bd-page')) return;
    applyRelatedCarousel();
    if (document.querySelector('#app .bd-page .bd-related[data-carousel-ready="1"]')) {
      stopWatcher();
      return;
    }
    pollTimer = window.setTimeout(tryApply, 150);
  };
  observer = new MutationObserver(() => {
    if (!applying) tryApply();
  });
  observer.observe(app, { childList: true, subtree: true });
  tryApply();
}

addStyles();
startWatcher();
window.addEventListener('hashchange', startWatcher);