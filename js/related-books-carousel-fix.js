import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

const STYLE_ID = 'bookora-related-carousel-fix-v1';
let applyTimer = 0;
let applying = false;

function normalize(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagsOf(book) {
  return (Array.isArray(book?.tags) ? book.tags : String(book?.tags || '').split(','))
    .map(normalize)
    .filter(Boolean);
}

function scoreRelated(book, candidate) {
  const category = normalize(book?.category);
  const candidateCategory = normalize(candidate?.category);
  const tags = tagsOf(book);
  const candidateTags = tagsOf(candidate);
  const baseText = `${category} ${normalize(book?.title)} ${tags.join(' ')}`;
  const candidateWords = `${candidateCategory} ${normalize(candidate?.title)} ${candidateTags.join(' ')}`
    .split(/\s+/)
    .filter(word => word.length >= 4);
  const baseWords = new Set(baseText.split(/\s+/).filter(word => word.length >= 4));
  const exactCategory = Boolean(category && candidateCategory && category === candidateCategory);
  const relatedCategory = Boolean(category && candidateCategory && (
    category.includes(candidateCategory) || candidateCategory.includes(category)
  ));
  const tagMatch = candidateTags.some(tag => tags.some(sourceTag => (
    tag === sourceTag || tag.includes(sourceTag) || sourceTag.includes(tag)
  )));
  const wordMatch = candidateWords.filter(word => baseWords.has(word)).length;
  const sameSource = String(book?.source_type || '') === String(candidate?.source_type || '');
  return (exactCategory ? 1000 : 0)
    + (relatedCategory ? 450 : 0)
    + (tagMatch ? 250 : 0)
    + Math.min(wordMatch, 5) * 35
    + (sameSource ? 8 : 0);
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #app .bd-page .bd-related-carousel{position:relative;min-width:0;}
    #app .bd-page .bd-related{
      display:flex!important;
      grid-template-columns:none!important;
      gap:16px!important;
      overflow-x:auto!important;
      overflow-y:hidden!important;
      scroll-behavior:smooth!important;
      scroll-snap-type:x proximity!important;
      overscroll-behavior-x:contain!important;
      scrollbar-width:thin!important;
      padding:2px 48px 10px 2px!important;
    }
    #app .bd-page .bd-related > *{
      flex:0 0 clamp(220px,23vw,260px)!important;
      width:clamp(220px,23vw,260px)!important;
      min-width:clamp(220px,23vw,260px)!important;
      max-width:clamp(220px,23vw,260px)!important;
      scroll-snap-align:start!important;
    }
    #app .bd-page .bd-related-next{
      position:absolute!important;
      z-index:20!important;
      top:50%!important;
      right:7px!important;
      transform:translateY(-50%)!important;
      width:44px!important;
      height:44px!important;
      border:1px solid #dbe3ee!important;
      border-radius:50%!important;
      background:rgba(255,255,255,.97)!important;
      color:#0f172a!important;
      display:grid!important;
      place-items:center!important;
      cursor:pointer!important;
      box-shadow:0 8px 22px rgba(15,23,42,.14)!important;
      backdrop-filter:blur(8px)!important;
    }
    #app .bd-page .bd-related-next svg{width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;}
    #app .bd-page .bd-related-next:hover{transform:translateY(-50%) scale(1.04)!important;}
    @media(max-width:600px){
      #app .bd-page .bd-related{gap:12px!important;padding:2px 46px 8px 2px!important;}
      #app .bd-page .bd-related > *{flex-basis:clamp(190px,72vw,230px)!important;width:clamp(190px,72vw,230px)!important;min-width:clamp(190px,72vw,230px)!important;max-width:clamp(190px,72vw,230px)!important;}
      #app .bd-page .bd-related-next{width:40px!important;height:40px!important;right:4px!important;}
    }
    @media(max-width:380px){
      #app .bd-page .bd-related > *{flex-basis:190px!important;width:190px!important;min-width:190px!important;max-width:190px!important;}
    }
  `;
  document.head.appendChild(style);
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

  applying = true;
  try {
    related.innerHTML = candidates.map(item => renderBookCard(item)).join('');
    related.dataset.carouselReady = '1';

    let carousel = related.parentElement;
    if (!carousel?.classList.contains('bd-related-carousel')) {
      carousel = document.createElement('div');
      carousel.className = 'bd-related-carousel';
      related.parentNode.insertBefore(carousel, related);
      carousel.appendChild(related);
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
  } finally {
    applying = false;
  }
}

function scheduleApply() {
  if (applyTimer) return;
  applyTimer = window.setTimeout(() => {
    applyTimer = 0;
    requestAnimationFrame(applyRelatedCarousel);
  }, 0);
}

addStyles();
scheduleApply();

const app = document.getElementById('app') || document.body;
new MutationObserver(mutations => {
  if (applying) return;
  const relevantChange = mutations.some(mutation => {
    const target = mutation.target?.closest?.('.bd-related');
    if (target) return false;
    return Array.from(mutation.addedNodes || []).some(node => {
      if (node.nodeType !== 1) return true;
      return !node.closest?.('.bd-related-carousel');
    });
  });
  if (relevantChange) scheduleApply();
}).observe(app, { childList: true, subtree: true });
