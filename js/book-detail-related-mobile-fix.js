// Bookora — Related books mobile carousel fix.
// Mobile only: show exactly two related eBook cards per row and allow horizontal swipe.
(() => {
  'use strict';

  const STYLE_ID = 'bookora-related-mobile-carousel-styles';
  const SECTION_CLASS = 'bookora-related-books-section';
  const SCROLLER_CLASS = 'bookora-related-books-scroller';

  function isBookDetail() {
    return (location.hash || '').split('?')[0].startsWith('#/book/');
  }

  function textOf(el) {
    return String(el?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function findHeading() {
    const nodes = document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"],p,strong,div');
    for (const node of nodes) {
      const text = textOf(node);
      if (text === 'readers also explored' || text.startsWith('readers also explored ')) return node;
    }
    return null;
  }

  function findRelatedSection(heading) {
    let current = heading;
    for (let level = 0; current && level < 7; level += 1, current = current.parentElement) {
      if (current.querySelectorAll('.book-card').length >= 1) return current;
    }
    return null;
  }

  function findScroller(section) {
    const cards = [...section.querySelectorAll('.book-card')];
    if (!cards.length) return null;

    // Prefer the nearest ancestor that contains the cards and is not the whole page.
    let candidate = cards[0].parentElement;
    for (let level = 0; candidate && level < 5; level += 1, candidate = candidate.parentElement) {
      const count = candidate.querySelectorAll('.book-card').length;
      if (count >= 1 && count <= 8 && candidate !== section) return candidate;
    }
    return cards[0].parentElement;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 700px) {
        .${SECTION_CLASS} { overflow: hidden !important; }
        .${SECTION_CLASS} .${SCROLLER_CLASS} {
          display: grid !important;
          grid-auto-flow: column !important;
          grid-template-columns: none !important;
          grid-auto-columns: calc((100% - 14px) / 2) !important;
          gap: 14px !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          overscroll-behavior-x: contain !important;
          scroll-snap-type: x proximity !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          padding: 2px 2px 10px !important;
          margin: 0 !important;
        }
        .${SECTION_CLASS} .${SCROLLER_CLASS}::-webkit-scrollbar { display: none !important; }
        .${SECTION_CLASS} .${SCROLLER_CLASS} > .book-card {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          scroll-snap-align: start !important;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function apply() {
    if (!isBookDetail()) return;
    injectStyles();

    const heading = findHeading();
    if (!heading) return;
    const section = findRelatedSection(heading);
    if (!section) return;
    const scroller = findScroller(section);
    if (!scroller) return;

    section.classList.add(SECTION_CLASS);
    scroller.classList.add(SCROLLER_CLASS);
    scroller.setAttribute('aria-label', 'Related eBooks');
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  window.addEventListener('hashchange', () => setTimeout(schedule, 50));
  window.addEventListener('load', () => setTimeout(schedule, 100));
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  schedule();
})();
