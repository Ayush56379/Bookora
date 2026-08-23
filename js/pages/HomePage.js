// Bookora HomePage — buyer-first marketplace with fast Firebase catalog updates
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

function newest(books) {
  return [...books].sort((a,b) => (new Date(b?.createdAt || b?.created_at || b?.publishedAt || 0).getTime() || 0) - (new Date(a?.createdAt || a?.created_at || a?.publishedAt || 0).getTime() || 0));
}

function fastBooks() {
  const list = Array.isArray(window.__BOOKORA_FAST_BOOKS__) ? window.__BOOKORA_FAST_BOOKS__ : [];
  return list.map(book => state.normalizeBook(book)).filter(Boolean).filter(book => book.status === 'approved');
}

function catalogBooks() {
  const live = state.getApprovedBooks();
  return live.length ? live : fastBooks();
}

function featuredBooks() {
  const books = catalogBooks();
  const trending = books.filter(book => book.is_trending);
  const best = books.filter(book => book.is_bestseller);
  return (trending.length ? trending : best.length ? best : newest(books)).slice(0, 10);
}

function renderCatalogContent() {
  const target = document.getElementById('home-live-catalog');
  if (!target) return;
  const books = featuredBooks();
  target.innerHTML = books.length
    ? `<div class="kdp-book-grid">${books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')}</div>`
    : `<div class="kdp-loading-state"><div class="kdp-loading-spinner"></div><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div>`;
}

export function renderHomePage() {
  updateSEO({ title:'Bookora — Discover. Read. Publish.', description:'Discover, preview and buy verified eBooks on Bookora.' });
  const books = featuredBooks();

  return `<main class="bookora-home-clean">
    <section class="home-hero-video">
      <div class="home-video-bg home-video-bg-a"></div><div class="home-video-bg home-video-bg-b"></div>
      <div class="home-hero-inner">
        <div class="home-hero-copy home-visible">
          <span class="home-eyebrow">📚 WELCOME TO BOOKORA</span>
          <h1>Discover, Learn &amp;<br><span>Grow with eBooks</span></h1>
          <p>Find quality eBooks from verified creators, discover useful knowledge, and start reading instantly after purchase.</p>
          <div class="home-hero-actions"><a class="home-primary-action" href="#/explore">Explore eBooks <b>→</b></a><a class="home-secondary-action" href="#/categories">Browse Categories</a></div>
          <form id="home-search-form" class="home-search-clean"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input id="home-search-input" type="search" autocomplete="off" placeholder="Search eBooks, authors, topics..." aria-label="Search books"/><button type="submit">Search</button></form>
        </div>
        <div class="home-hero-art home-visible" aria-hidden="true"><div class="home-art-orbit home-orbit-one"></div><div class="home-art-orbit home-orbit-two"></div><div class="home-art-card home-art-back"></div><div class="home-art-card home-art-mid"></div><div class="home-art-device"><div class="home-device-screen"><div class="home-device-bar"></div><div class="home-device-line w1"></div><div class="home-device-line w2"></div><div class="home-device-line w3"></div><div class="home-device-line w4"></div></div></div><div class="home-art-front"><div class="home-art-label">BOOKORA</div><div class="home-art-title">Read.<br>Learn.<br>Grow.</div><div class="home-art-line"></div><div class="home-art-small">A library made for curious minds.</div></div></div>
      </div>
    </section>

    <section class="kdp-catalog-section">
      <div class="kdp-catalog-container">
        <div class="kdp-section-head">
          <div><span class="kdp-kicker">BOOKORA STORE</span><h2>${books.length ? 'Featured eBooks' : 'Discover eBooks'}</h2><p>Browse books from verified Bookora creators.</p></div>
          <a href="#/explore" class="kdp-view-all">View all <span>→</span></a>
        </div>
        <div class="kdp-tabs"><button class="kdp-tab active" type="button">Featured</button><a class="kdp-tab" href="#/best-sellers">Best Sellers</a><a class="kdp-tab" href="#/new-releases">New Releases</a></div>
        <div id="home-live-catalog">${books.length ? `<div class="kdp-book-grid">${books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')}</div>` : `<div class="kdp-loading-state"><div class="kdp-loading-spinner"></div><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div>`}</div>
      </div>
    </section>

    <section class="home-trust-clean"><div class="container home-trust-grid"><div class="home-trust-item"><span>01</span><div><strong>Verified books</strong><p>Browse approved publications with trusted metadata.</p></div></div><div class="home-trust-item"><span>02</span><div><strong>Preview before buying</strong><p>Check book details and available samples first.</p></div></div><div class="home-trust-item"><span>03</span><div><strong>Instant digital access</strong><p>Your purchased books stay available in your library.</p></div></div></div></section>
  </main>`;
}

export function initHomePageEvents() {
  const form = document.getElementById('home-search-form');
  const input = document.getElementById('home-search-input');
  if (form && input) form.addEventListener('submit', e => { e.preventDefault(); const q=input.value.trim(); window.location.hash=q ? `#/search?q=${encodeURIComponent(q)}` : '#/explore'; });

  const refresh = () => renderCatalogContent();
  window.addEventListener('bookora:fast-catalog', refresh);
  window.addEventListener('bookora:catalog-updated', refresh);
  const cleanup = () => { window.removeEventListener('bookora:fast-catalog', refresh); window.removeEventListener('bookora:catalog-updated', refresh); };
  window.addEventListener('hashchange', cleanup, { once:true });
}

if (!document.getElementById('bookora-kdp-home-styles')) {
  const style=document.createElement('style'); style.id='bookora-kdp-home-styles'; style.textContent=`
    .bookora-home-clean{background:var(--bg-page,#fff);color:var(--text-primary,#0f172a);overflow:hidden}
    .home-hero-video{position:relative;min-height:560px;display:flex;align-items:center;overflow:hidden;background:linear-gradient(120deg,#071a43 0%,#12356f 53%,#2458c9 100%);border-radius:0 0 28px 28px;color:#fff}.home-hero-inner{position:relative;z-index:3;width:min(1240px,calc(100% - 40px));margin:auto;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(350px,.88fr);align-items:center;gap:2rem;padding:4.2rem 0}.home-hero-copy{max-width:720px}.home-eyebrow{display:inline-flex;padding:.48rem .8rem;border:1px solid rgba(147,197,253,.45);border-radius:999px;background:rgba(37,99,235,.18);font-size:.72rem;font-weight:850;color:#dbeafe;margin-bottom:1rem}.home-hero-copy h1{font-family:var(--font-display);font-size:clamp(3rem,6vw,5.2rem);line-height:.98;letter-spacing:-.06em;margin:0 0 1.25rem;color:#fff}.home-hero-copy h1 span{color:#60a5fa}.home-hero-copy>p{max-width:680px;font-size:1.05rem;line-height:1.7;color:#e0edff;margin:0 0 1.5rem}.home-hero-actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.2rem}.home-primary-action,.home-secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;padding:.88rem 1.2rem;border-radius:12px;text-decoration:none;font-weight:800}.home-primary-action{background:#2563eb;color:#fff}.home-secondary-action{border:1px solid rgba(191,219,254,.5);background:rgba(255,255,255,.06);color:#fff}.home-search-clean{height:56px;max-width:650px;display:flex;align-items:center;gap:.65rem;padding:.35rem .4rem .35rem 1rem;background:#fff;border-radius:13px;box-shadow:0 14px 40px rgba(2,6,23,.22)}.home-search-clean svg{color:#64748b}.home-search-clean input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#0f172a;font-size:.92rem}.home-search-clean button{border:0;background:#2563eb;color:#fff;border-radius:10px;padding:.7rem 1.1rem;font-weight:800;cursor:pointer}.home-hero-art{height:400px;position:relative;display:flex;justify-content:center;align-items:center}.home-art-card{position:absolute;width:210px;height:295px;border-radius:14px;box-shadow:0 30px 70px rgba(2,6,23,.28)}.home-art-back{transform:translate(70px,-18px) rotate(8deg);background:linear-gradient(150deg,#93c5fd,#dbeafe)}.home-art-mid{transform:translate(-52px,20px) rotate(-8deg);background:linear-gradient(150deg,#60a5fa,#bfdbfe)}.home-art-front{position:absolute;z-index:5;width:210px;height:295px;transform:rotate(1deg);background:linear-gradient(145deg,#172554,#2563eb 70%,#60a5fa);color:#fff;padding:1.7rem;display:flex;flex-direction:column;justify-content:space-between;border-radius:14px;box-shadow:0 35px 75px rgba(2,6,23,.32)}.home-art-label{font-size:.65rem;font-weight:800;letter-spacing:.16em;opacity:.8}.home-art-title{font-family:var(--font-display);font-size:2.3rem;line-height:1.02;font-weight:850}.home-art-line{width:45px;height:3px;background:#93c5fd}.home-art-small{font-size:.68rem;opacity:.78}.home-art-device{position:absolute;z-index:7;width:150px;height:225px;right:20px;top:65px;background:#0b1220;border:8px solid #0b1220;border-radius:26px;box-shadow:0 24px 55px rgba(2,6,23,.38);transform:rotate(7deg)}.home-device-screen{height:100%;border-radius:18px;background:#f8fafc;padding:25px 13px}.home-device-bar{height:9px;width:54px;background:#cbd5e1;border-radius:99px;margin:0 auto 20px}.home-device-line{height:11px;border-radius:8px;background:#dbeafe;margin:13px 0}.home-device-line.w1{width:90%}.home-device-line.w2{width:72%}.home-device-line.w3{width:84%}.home-device-line.w4{width:57%}.home-art-orbit{position:absolute;border:1px solid rgba(191,219,254,.25);border-radius:50%}.home-orbit-one{width:350px;height:350px}.home-orbit-two{width:420px;height:420px}
    .kdp-catalog-section{background:var(--bg-page,#fff);padding:58px 0 64px}.kdp-catalog-container{width:min(1240px,calc(100% - 40px));margin:auto}.kdp-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-bottom:20px}.kdp-kicker{display:inline-block;color:#2563eb;font-size:.7rem;font-weight:850;letter-spacing:.14em;margin-bottom:.45rem}.kdp-section-head h2{font-family:var(--font-display);font-size:clamp(2rem,3vw,2.65rem);line-height:1.08;letter-spacing:-.04em;margin:0 0 .4rem}.kdp-section-head p{margin:0;color:var(--text-secondary,#64748b);font-size:.92rem}.kdp-view-all{font-size:.86rem;font-weight:800;color:var(--text-primary,#0f172a);text-decoration:none;white-space:nowrap}.kdp-view-all span{color:#2563eb}.kdp-tabs{display:flex;gap:.4rem;align-items:center;border-bottom:1px solid var(--border-subtle,#e2e8f0);margin-bottom:28px}.kdp-tab{border:0;background:transparent;color:var(--text-secondary,#64748b);text-decoration:none;font-size:.84rem;font-weight:800;padding:.72rem .9rem;cursor:pointer;border-bottom:2px solid transparent}.kdp-tab.active{color:#2563eb;border-bottom-color:#2563eb}.kdp-book-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:22px!important;width:100%!important;align-items:stretch!important}.kdp-book-item{display:block!important;width:100%!important;min-width:0!important;max-width:none!important}.kdp-book-item>.book-card{width:100%!important;max-width:none!important;min-width:0!important}.kdp-loading-state{min-height:330px;border:1px solid var(--border-subtle,#e2e8f0);border-radius:16px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:.45rem;background:var(--bg-card,#fff);color:var(--text-secondary,#64748b)}.kdp-loading-state strong{color:var(--text-primary,#0f172a);font-size:.95rem}.kdp-loading-state span{font-size:.76rem}.kdp-loading-spinner{width:30px;height:30px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:kdpSpin .8s linear infinite;margin-bottom:.35rem}@keyframes kdpSpin{to{transform:rotate(360deg)}}.home-trust-clean{padding:36px 0;border-top:1px solid var(--border-subtle,#e2e8f0);background:var(--bg-muted,#f8fafc)}.home-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.home-trust-item{display:flex;gap:1rem;align-items:flex-start;padding:1rem}.home-trust-item>span{font-family:var(--font-display);font-size:.75rem;font-weight:850;color:#2563eb}.home-trust-item strong{font-size:.9rem}.home-trust-item p{font-size:.76rem;color:var(--text-secondary,#64748b);line-height:1.5;margin:.3rem 0 0}
    @media(max-width:1100px){.kdp-book-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.home-hero-inner{grid-template-columns:1fr 360px}.home-hero-copy h1{font-size:clamp(2.8rem,5.5vw,4.4rem)}}
    @media(max-width:800px){.home-hero-video{min-height:auto}.home-hero-inner{grid-template-columns:1fr;text-align:center;padding:3.5rem 0}.home-hero-copy{margin:auto}.home-hero-copy>p{margin-left:auto;margin-right:auto}.home-hero-actions{justify-content:center}.home-search-clean{margin:auto}.home-hero-art{height:300px;transform:scale(.86)}.kdp-catalog-container{width:min(100% - 28px,1240px)}.kdp-catalog-section{padding:42px 0 48px}.kdp-section-head{align-items:flex-start}.kdp-book-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}.home-trust-grid{grid-template-columns:1fr}} 
    @media(max-width:560px){.home-hero-inner{padding:3rem .85rem}.home-hero-copy h1{font-size:clamp(2.5rem,12vw,3.5rem)}.home-hero-copy>p{font-size:.9rem}.home-primary-action,.home-secondary-action{padding:.76rem .85rem;font-size:.76rem}.home-search-clean{height:52px}.home-search-clean button{padding:.62rem .78rem}.home-search-clean input{font-size:.78rem}.home-hero-art{height:245px;transform:scale(.72)}.kdp-section-head{flex-direction:column;gap:.8rem}.kdp-view-all{align-self:flex-start}.kdp-tabs{overflow:auto;white-space:nowrap;margin-bottom:20px}.kdp-tab{padding:.62rem .7rem;font-size:.76rem}.kdp-book-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.home-trust-clean{padding:24px 0}}
  `; document.head.appendChild(style);
}
