// Bookora homepage: permanently replace the old Featured catalog with
// Firebase-backed Trending + All eBooks sections. This module only touches
// the public homepage catalog and leaves the rest of the app unchanged.
import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

const STYLE_ID = 'bookora-home-trending-six-styles';
const SECTION_ID = 'bookora-home-catalog-v2';
let observer = null;
let lastRenderKey = '';

function approvedBooks() {
  return (typeof state.getApprovedBooks === 'function' ? state.getApprovedBooks() : [])
    .map(book => state.normalizeBook(book))
    .filter(Boolean)
    .filter(book => String(book.status || '').toLowerCase() === 'approved');
}

function timestamp(book) {
  return Date.parse(book?.createdAt || book?.created_at || book?.publishedAt || book?.published_at || '') || 0;
}

function purchaseCount(book) {
  const fields = ['purchaseCount','purchase_count','purchases','salesCount','sales_count','soldCount','sold_count','totalSales','total_sales','ordersCount','orders_count','orderCount','order_count','buyCount','buy_count','unitsSold','units_sold'];
  return Math.max(0, ...fields.map(field => Number(book?.[field] ?? 0)).filter(Number.isFinite));
}

function reviewRating(book) {
  const direct = Number(book?.rating ?? book?.averageRating ?? book?.average_rating ?? 0);
  if (direct > 0) return direct;
  const id = String(book?.id || book?.bookId || book?.book_id || '');
  const reviews = Array.isArray(state.reviews) ? state.reviews.filter(r => String(r?.bookId || r?.book_id || '') === id) : [];
  const ratings = reviews.map(r => Number(r?.rating ?? r?.stars ?? 0)).filter(r => r >= 1 && r <= 5);
  return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
}

function trendingBooks(books) {
  const flagged = books.filter(book => book.is_trending === true || book.is_trending === 'true' || book.isTrending === true);
  const source = flagged.length >= 6 ? flagged : books;
  return [...source].sort((a, b) => {
    const score = (book) => purchaseCount(book) * 20 + reviewRating(book) * 8 + (book.is_bestseller ? 10 : 0) + (book.is_trending ? 25 : 0) + Math.min(20, timestamp(book) ? (Date.now() - timestamp(book)) < 30 * 86400000 ? 20 : 0 : 0);
    return score(b) - score(a) || timestamp(b) - timestamp(a);
  }).slice(0, 6);
}

function allBooks(books) {
  return [...books].sort((a, b) => timestamp(b) - timestamp(a)).slice(0, 6);
}

function cards(books) {
  return books.map(book => `<div class="bookora-home-catalog-item">${renderBookCard(book)}</div>`).join('');
}

function sectionMarkup(title, description, books) {
  return `<section class="bookora-home-catalog-block"><div class="bookora-home-catalog-head"><div><span class="bookora-home-kicker">BOOKORA STORE</span><h2>${title}</h2><p>${description}</p></div><a href="#/explore" class="bookora-home-view-all">View all <span>→</span></a></div><div class="bookora-home-grid">${books.length ? cards(books) : `<div class="bookora-home-empty"><div class="bookora-home-spinner"></div><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div>`}</div></section>`;
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${SECTION_ID}{background:var(--bg-page,#fff);padding:54px 0 66px}
    .bookora-home-catalog-block{width:min(1240px,calc(100% - 40px));margin:0 auto 58px}
    .bookora-home-catalog-block:last-child{margin-bottom:0}
    .bookora-home-catalog-head{display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-bottom:22px}
    .bookora-home-kicker{display:inline-block;color:#2563eb;font-size:.7rem;font-weight:850;letter-spacing:.14em;margin-bottom:.45rem}
    .bookora-home-catalog-head h2{font-family:var(--font-display);font-size:clamp(2rem,3vw,2.65rem);line-height:1.08;letter-spacing:-.04em;margin:0 0 .4rem;color:var(--text-primary,#0f172a)}
    .bookora-home-catalog-head p{margin:0;color:var(--text-secondary,#64748b);font-size:.92rem}
    .bookora-home-view-all{font-size:.86rem;font-weight:800;color:var(--text-primary,#0f172a);text-decoration:none;white-space:nowrap}
    .bookora-home-view-all span{color:#2563eb}
    .bookora-home-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:18px;width:100%;align-items:stretch}
    .bookora-home-catalog-item{min-width:0;width:100%}
    .bookora-home-catalog-item>.book-card{width:100%!important;max-width:none!important;min-width:0!important}
    .bookora-home-empty{grid-column:1/-1;min-height:280px;border:1px solid var(--border-subtle,#e2e8f0);border-radius:16px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:.45rem;color:var(--text-secondary,#64748b)}
    .bookora-home-empty strong{color:var(--text-primary,#0f172a);font-size:.95rem}
    .bookora-home-empty span{font-size:.76rem}
    .bookora-home-spinner{width:30px;height:30px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:bookoraHomeSpin .8s linear infinite;margin-bottom:.35rem}
    @keyframes bookoraHomeSpin{to{transform:rotate(360deg)}}
    @media(max-width:1200px){.bookora-home-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}
    @media(max-width:980px){.bookora-home-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}}
    @media(max-width:700px){#${SECTION_ID}{padding:42px 0 52px}.bookora-home-catalog-block{width:min(100% - 28px,1240px);margin-bottom:44px}.bookora-home-catalog-head{align-items:flex-start}.bookora-home-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}}
    @media(max-width:480px){.bookora-home-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.bookora-home-catalog-head h2{font-size:1.75rem}.bookora-home-catalog-head p{font-size:.82rem}}
  `;
  document.head.appendChild(style);
}

function isHome() {
  return (window.location.hash || '#/').split('?')[0].replace(/^#/, '') === '/';
}

function render() {
  if (!isHome()) return;
  const old = document.querySelector('.kdp-catalog-section');
  if (!old) return;
  const books = approvedBooks();
  const trending = trendingBooks(books);
  const all = allBooks(books);
  const key = `${books.length}:${trending.map(b => b.id).join(',')}:${all.map(b => b.id).join(',')}`;
  if (document.getElementById(SECTION_ID) && key === lastRenderKey) return;
  lastRenderKey = key;
  addStyles();
  const replacement = document.createElement('div');
  replacement.id = SECTION_ID;
  replacement.innerHTML = `${sectionMarkup('Trending eBooks','Popular books selected from the live Bookora catalog.',trending)}${sectionMarkup('All eBooks','Browse the latest approved eBooks from Bookora creators.',all)}`;
  old.replaceWith(replacement);
}

function scheduleRender() {
  if (!isHome()) return;
  requestAnimationFrame(() => requestAnimationFrame(render));
}

function init() {
  addStyles();
  window.addEventListener('hashchange', () => { lastRenderKey = ''; scheduleRender(); });
  window.addEventListener('bookora:catalog-updated', () => { lastRenderKey = ''; scheduleRender(); });
  window.addEventListener('bookora:fast-catalog', () => { lastRenderKey = ''; scheduleRender(); });
  observer = new MutationObserver(() => scheduleRender());
  observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  scheduleRender();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
