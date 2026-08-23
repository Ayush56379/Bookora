// Bookora HomePage — clean, buyer-first marketplace with live Firebase catalog updates
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

function newest(books) {
  return [...books].sort((a, b) => {
    const ad = new Date(a?.createdAt || a?.created_at || a?.publishedAt || 0).getTime() || 0;
    const bd = new Date(b?.createdAt || b?.created_at || b?.publishedAt || 0).getTime() || 0;
    return bd - ad;
  });
}

function getFeaturedBooks() {
  const books = state.getApprovedBooks();
  const trending = state.getTrendingBooks();
  const best = state.getBestSellers();
  return (trending.length ? trending : best.length ? best : newest(books)).slice(0, 8);
}

function renderCatalogContent() {
  const featured = getFeaturedBooks();
  const catalog = document.getElementById('home-live-catalog');
  if (!catalog) return;
  catalog.innerHTML = featured.length
    ? `<div class="home-book-grid">${featured.map((book, i) => `<div class="home-book-item home-visible" style="--home-delay:${Math.min(i * 55, 385)}ms">${renderBookCard(book)}</div>`).join('')}</div>`
    : `<div class="home-empty-state"><div class="home-empty-icon">📚</div><h3>Your next read is coming soon</h3><p>There are no approved eBooks to display yet.</p><a href="#/explore" class="btn btn-primary">Explore Catalog</a></div>`;
}

export function renderHomePage() {
  updateSEO({ title: 'Bookora — Discover. Read. Publish.', description: 'Discover, preview and buy verified eBooks on Bookora.' });
  const featured = getFeaturedBooks();

  return `
    <main class="bookora-home-clean">
      <section class="home-hero-video">
        <div class="home-video-bg home-video-bg-a"></div><div class="home-video-bg home-video-bg-b"></div>
        <div class="home-hero-inner">
          <div class="home-hero-copy home-reveal home-visible">
            <span class="home-eyebrow">📚 WELCOME TO BOOKORA</span>
            <h1>Discover, Learn &amp;<br><span>Grow with eBooks</span></h1>
            <p>Find quality eBooks from verified creators, discover useful knowledge, and start reading instantly after purchase.</p>
            <div class="home-hero-actions"><a class="home-primary-action" href="#/explore">Explore eBooks <b>→</b></a><a class="home-secondary-action" href="#/categories">Browse Categories</a></div>
            <form id="home-search-form" class="home-search-clean"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input id="home-search-input" type="search" autocomplete="off" placeholder="Search eBooks, authors, topics..." aria-label="Search books" /><button type="submit">Search</button></form>
          </div>
          <div class="home-hero-art home-reveal home-visible" aria-hidden="true">
            <div class="home-art-orbit home-orbit-one"></div><div class="home-art-orbit home-orbit-two"></div>
            <div class="home-art-card home-art-back"><span></span></div><div class="home-art-card home-art-mid"><span></span></div>
            <div class="home-art-device"><div class="home-device-screen"><div class="home-device-bar"></div><div class="home-device-line w1"></div><div class="home-device-line w2"></div><div class="home-device-line w3"></div><div class="home-device-line w4"></div></div></div>
            <div class="home-art-front"><div class="home-art-label">BOOKORA</div><div class="home-art-title">Read.<br>Learn.<br>Grow.</div><div class="home-art-line"></div><div class="home-art-small">A library made for curious minds.</div></div>
            <div class="home-floating-page page-one">BOOK</div><div class="home-floating-page page-two">READ</div>
          </div>
        </div>
      </section>

      <section class="home-catalog-clean">
        <div class="container">
          <div class="home-section-head home-reveal home-visible"><div><span class="home-section-kicker">CURATED FOR YOU</span><h2>${featured.length ? 'Featured eBooks' : 'Discover eBooks'}</h2><p>Fresh picks and approved reads from the Bookora catalog.</p></div><a class="home-view-all" href="#/explore">View all <span>→</span></a></div>
          <div id="home-live-catalog">${featured.length ? `<div class="home-book-grid">${featured.map((book, i) => `<div class="home-book-item home-visible" style="--home-delay:${Math.min(i * 55, 385)}ms">${renderBookCard(book)}</div>`).join('')}</div>` : `<div class="home-empty-state"><div class="home-empty-icon">📚</div><h3>Loading the latest eBooks…</h3><p>Bookora is connecting to the catalog.</p></div>`}</div>
        </div>
      </section>

      <section class="home-trust-clean"><div class="container home-trust-grid"><div class="home-trust-item home-reveal home-visible"><span>01</span><div><strong>Verified books</strong><p>Browse approved publications with trusted metadata.</p></div></div><div class="home-trust-item home-reveal home-visible"><span>02</span><div><strong>Preview before buying</strong><p>Check book details and available samples first.</p></div></div><div class="home-trust-item home-reveal home-visible"><span>03</span><div><strong>Instant digital access</strong><p>Your purchased books stay available in your library.</p></div></div></div></section>
      <section class="home-creator-clean"><div class="container home-creator-inner"><div><span class="home-section-kicker">FOR CREATORS</span><h2>Have a book to publish?</h2><p>Share your work with readers through Bookora.</p></div><a href="#/publish" class="btn btn-primary btn-lg">Publish your eBook <span>→</span></a></div></section>
    </main>`;
}

export function initHomePageEvents() {
  const form = document.getElementById('home-search-form');
  const input = document.getElementById('home-search-input');
  if (form && input) form.addEventListener('submit', event => { event.preventDefault(); const q = input.value.trim(); window.location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/explore'; });

  // DATA_SYNCED does not re-route the SPA. Only replace the catalog region so the page never blinks.
  const refreshCatalog = () => renderCatalogContent();
  window.addEventListener('bookora:catalog-updated', refreshCatalog);
  const cleanup = () => window.removeEventListener('bookora:catalog-updated', refreshCatalog);
  window.addEventListener('hashchange', cleanup, { once: true });

  const reveal = () => document.querySelectorAll('.home-reveal,.home-book-item').forEach(el => {
    if (el.dataset.homeVisible === '1') return;
    if (el.getBoundingClientRect().top < window.innerHeight * .94) { el.dataset.homeVisible = '1'; el.classList.add('home-visible'); }
  });
  reveal();
  window.addEventListener('scroll', reveal, { passive: true });
}

if (!document.getElementById('bookora-clean-home-styles')) {
  const style = document.createElement('style'); style.id = 'bookora-clean-home-styles';
  style.textContent = `
    .bookora-home-clean{background:#fff;color:#0f172a;overflow:hidden}.home-hero-video{position:relative;min-height:590px;display:flex;align-items:center;overflow:hidden;background:linear-gradient(120deg,#071a43 0%,#12356f 53%,#2458c9 100%);border-radius:0 0 32px 32px;color:#fff}.home-hero-inner{position:relative;z-index:3;width:min(1240px,calc(100% - 40px));margin:auto;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(360px,.88fr);align-items:center;gap:2rem;padding:4.8rem 0}.home-hero-copy{max-width:720px}.home-eyebrow{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .85rem;border:1px solid rgba(147,197,253,.45);border-radius:999px;background:rgba(37,99,235,.18);font-size:.72rem;font-weight:850;letter-spacing:.06em;color:#dbeafe;margin-bottom:1rem}.home-hero-copy h1{font-family:var(--font-display);font-size:clamp(3rem,6vw,5.25rem);line-height:.98;letter-spacing:-.06em;margin:0 0 1.25rem;color:#fff}.home-hero-copy h1 span{color:#60a5fa}.home-hero-copy>p{max-width:680px;font-size:1.08rem;line-height:1.7;color:#e0edff;margin:0 0 1.55rem}.home-hero-actions{display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.25rem}.home-primary-action,.home-secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;padding:.9rem 1.25rem;border-radius:13px;text-decoration:none;font-weight:800;transition:transform .22s ease,box-shadow .22s ease,background .22s ease}.home-primary-action{background:#2563eb;color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.18)}.home-secondary-action{border:1px solid rgba(191,219,254,.5);background:rgba(255,255,255,.06);color:#fff}.home-primary-action:hover,.home-secondary-action:hover{transform:translateY(-2px)}.home-search-clean{height:58px;max-width:650px;display:flex;align-items:center;gap:.65rem;padding:.4rem .45rem .4rem 1.1rem;background:#fff;border:2px solid rgba(255,255,255,.35);border-radius:15px;box-shadow:0 14px 40px rgba(2,6,23,.22)}.home-search-clean svg{color:#64748b;flex:0 0 auto}.home-search-clean input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#0f172a;font-size:.92rem}.home-search-clean button{border:0;background:#2563eb;color:#fff;border-radius:11px;padding:.72rem 1.15rem;font-weight:800;cursor:pointer}.home-search-clean button:hover{background:#1d4ed8}.home-hero-art{height:430px;position:relative;display:flex;justify-content:center;align-items:center;perspective:1000px}.home-art-card{position:absolute;width:215px;height:300px;border-radius:14px;box-shadow:0 30px 70px rgba(2,6,23,.28)}.home-art-back{transform:translate(75px,-18px) rotate(8deg);background:linear-gradient(150deg,#93c5fd,#dbeafe);animation:bookoraFloatBack 5.5s ease-in-out infinite}.home-art-mid{transform:translate(-55px,20px) rotate(-8deg);background:linear-gradient(150deg,#60a5fa,#bfdbfe);animation:bookoraFloatMid 4.8s ease-in-out infinite}.home-art-front{position:absolute;z-index:5;width:215px;height:300px;transform:rotate(1deg);background:linear-gradient(145deg,#172554,#2563eb 70%,#60a5fa);color:#fff;padding:1.8rem;display:flex;flex-direction:column;justify-content:space-between;border-radius:14px;box-shadow:0 35px 75px rgba(2,6,23,.32);animation:bookoraFloatFront 4.2s ease-in-out infinite}.home-art-label{font-size:.65rem;font-weight:800;letter-spacing:.16em;opacity:.8}.home-art-title{font-family:var(--font-display);font-size:2.3rem;line-height:1.02;font-weight:850}.home-art-line{width:45px;height:3px;background:#93c5fd}.home-art-small{font-size:.68rem;line-height:1.45;opacity:.78}.home-art-device{position:absolute;z-index:7;width:155px;height:235px;right:24px;top:72px;background:#0b1220;border:8px solid #0b1220;border-radius:27px;box-shadow:0 24px 55px rgba(2,6,23,.38);transform:rotate(7deg);animation:bookoraDeviceFloat 4.5s ease-in-out infinite}.home-device-screen{height:100%;border-radius:18px;background:#f8fafc;padding:26px 14px;overflow:hidden}.home-device-bar{height:9px;width:54px;background:#cbd5e1;border-radius:99px;margin:0 auto 20px}.home-device-line{height:11px;border-radius:8px;background:#dbeafe;margin:13px 0}.home-device-line.w1{width:90%}.home-device-line.w2{width:72%}.home-device-line.w3{width:84%}.home-device-line.w4{width:57%}.home-floating-page{position:absolute;z-index:8;padding:.45rem .6rem;border-radius:8px;background:rgba(255,255,255,.92);color:#1d4ed8;font-size:.55rem;font-weight:900;letter-spacing:.1em;box-shadow:0 12px 30px rgba(2,6,23,.2)}.page-one{left:34px;top:80px;transform:rotate(-12deg);animation:bookoraChipOne 4s ease-in-out infinite}.page-two{right:0;bottom:72px;transform:rotate(10deg);animation:bookoraChipTwo 4.7s ease-in-out infinite}.home-art-orbit{position:absolute;border:1px solid rgba(191,219,254,.25);border-radius:50%;animation:bookoraOrbit 12s linear infinite}.home-orbit-one{width:360px;height:360px}.home-orbit-two{width:430px;height:430px;animation-duration:18s;animation-direction:reverse}.home-video-bg{position:absolute;border-radius:50%;filter:blur(1px);pointer-events:none}.home-video-bg-a{width:520px;height:520px;right:-160px;top:-170px;background:rgba(96,165,250,.2);animation:bookoraGlow 7s ease-in-out infinite}.home-video-bg-b{width:400px;height:400px;left:-220px;bottom:-220px;background:rgba(37,99,235,.24);animation:bookoraGlow 9s ease-in-out infinite reverse}.home-catalog-clean{padding:5rem 0 5.5rem;background:#fff}.home-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;margin-bottom:2rem}.home-section-kicker{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.14em;color:#2563eb;margin-bottom:.6rem}.home-section-head h2,.home-creator-inner h2{font-family:var(--font-display);font-size:clamp(1.8rem,3vw,2.35rem);line-height:1.1;letter-spacing:-.035em;margin:0 0 .45rem}.home-section-head p,.home-creator-inner p{margin:0;color:#64748b;font-size:.92rem;line-height:1.55}.home-view-all{font-size:.8rem;font-weight:750;color:#475569;text-decoration:none}.home-view-all:hover{color:#2563eb}.home-view-all span{color:#2563eb}.home-book-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1.25rem}.home-book-item{opacity:0;transform:translateY(20px);transition:opacity .55s ease var(--home-delay),transform .55s cubic-bezier(.2,.75,.25,1) var(--home-delay)}.home-book-item.home-visible{opacity:1;transform:none}.home-empty-state{padding:4rem 1.5rem;text-align:center;border:1px solid #e5eaf2;border-radius:20px;background:#f8fafc}.home-empty-icon{font-size:2.2rem;margin-bottom:.7rem}.home-empty-state h3{margin:.2rem 0 .4rem;font-size:1.15rem}.home-empty-state p{margin:0 0 1.2rem;color:#64748b}.home-trust-clean{padding:3rem 0;border-top:1px solid #e8eef7;border-bottom:1px solid #e8eef7;background:#f8fafc}.home-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.home-trust-item{display:flex;gap:1rem;align-items:flex-start;padding:1.25rem;border-radius:15px}.home-trust-item>span{font-family:var(--font-display);font-size:.75rem;font-weight:850;color:#2563eb}.home-trust-item strong{font-size:.9rem}.home-trust-item p{font-size:.76rem;color:#64748b;line-height:1.5;margin:.3rem 0 0}.home-creator-clean{padding:4rem 0;background:#fff}.home-creator-inner{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:2.4rem 2.6rem;border-radius:22px;background:linear-gradient(135deg,#0f172a,#172554);color:#fff;box-shadow:0 22px 55px rgba(15,23,42,.15)}.home-creator-inner h2{color:#fff}.home-creator-inner p{color:#cbd5e1}.home-creator-inner .home-section-kicker{color:#93c5fd}.home-reveal{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.75,.25,1)}.home-reveal.home-visible{opacity:1;transform:none}
    @keyframes bookoraFloatBack{0%,100%{transform:translate(75px,-18px) rotate(8deg)}50%{transform:translate(85px,-32px) rotate(11deg)}}@keyframes bookoraFloatMid{0%,100%{transform:translate(-55px,20px) rotate(-8deg)}50%{transform:translate(-66px,7px) rotate(-11deg)}}@keyframes bookoraFloatFront{0%,100%{transform:translateY(0) rotate(1deg)}50%{transform:translateY(-12px) rotate(-1deg)}}@keyframes bookoraDeviceFloat{0%,100%{transform:translate(0,0) rotate(7deg)}50%{transform:translate(8px,-16px) rotate(10deg)}}@keyframes bookoraChipOne{0%,100%{transform:translate(0,0) rotate(-12deg)}50%{transform:translate(-10px,-14px) rotate(-5deg)}}@keyframes bookoraChipTwo{0%,100%{transform:translate(0,0) rotate(10deg)}50%{transform:translate(9px,-12px) rotate(16deg)}}@keyframes bookoraGlow{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.15);opacity:.9}}@keyframes bookoraOrbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @media(max-width:1050px){.home-book-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.home-hero-inner{gap:1rem}.home-art-device{right:0}}@media(max-width:800px){.home-hero-video{min-height:auto;border-radius:0 0 24px 24px}.home-hero-inner{grid-template-columns:1fr;text-align:center;padding:4rem 1rem}.home-hero-copy{margin:auto}.home-hero-copy>p{margin-left:auto;margin-right:auto}.home-hero-actions{justify-content:center}.home-search-clean{margin:auto}.home-hero-art{height:310px}.home-book-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-trust-grid{grid-template-columns:1fr}.home-creator-inner{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.home-hero-inner{padding:3.2rem .85rem}.home-hero-copy h1{font-size:clamp(2.65rem,12vw,3.6rem)}.home-hero-copy>p{font-size:.92rem}.home-primary-action,.home-secondary-action{padding:.78rem .85rem;font-size:.78rem}.home-search-clean{height:52px;padding-left:.85rem}.home-search-clean button{padding:.62rem .8rem}.home-search-clean input{font-size:.8rem}.home-hero-art{height:255px;transform:scale(.86)}.home-art-device{right:-4px;top:52px}.home-floating-page{display:none}.home-catalog-clean{padding:3.5rem 0}.home-section-head{align-items:flex-start;flex-direction:column}.home-book-grid{gap:.75rem}.home-creator-inner{padding:2rem 1.4rem}.home-creator-inner .btn{width:100%;justify-content:center}}@media(prefers-reduced-motion:reduce){.home-reveal,.home-book-item,.home-art-card,.home-art-front,.home-art-device,.home-floating-page,.home-art-orbit,.home-video-bg{animation:none!important;transition:none!important;opacity:1;transform:none}}
  `;
  document.head.appendChild(style);
}
