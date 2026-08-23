// Bookora HomePage — clean, buyer-first marketplace
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

export function renderHomePage() {
  updateSEO({ title: 'Bookora — Discover. Read. Publish.', description: 'Discover, preview and buy verified eBooks on Bookora.' });
  const books = state.getApprovedBooks();
  const trending = state.getTrendingBooks();
  const best = state.getBestSellers();
  const ordered = trending.length ? trending : best.length ? best : newest(books);
  const featured = ordered.slice(0, 8);

  return `
    <main class="bookora-home-clean">
      <section class="home-hero-clean">
        <div class="home-hero-glow home-hero-glow-a"></div><div class="home-hero-glow home-hero-glow-b"></div>
        <div class="container home-hero-inner">
          <div class="home-hero-copy home-reveal">
            <span class="home-eyebrow">BOOKORA MARKETPLACE</span>
            <h1>Find your next<br><span>great eBook.</span></h1>
            <p>Discover inspiring books, practical guides and stories from creators. Preview, choose and buy in a few clicks.</p>
            <form id="home-search-form" class="home-search-clean">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input id="home-search-input" type="search" autocomplete="off" placeholder="Search books, authors or topics..." aria-label="Search books" />
              <button type="submit">Search</button>
            </form>
            <div class="home-quick-links"><a href="#/explore">Explore all eBooks <span>→</span></a><a href="#/best-sellers">Best sellers <span>→</span></a></div>
          </div>
          <div class="home-hero-art home-reveal home-reveal-delay" aria-hidden="true">
            <div class="home-art-card home-art-back"></div><div class="home-art-card home-art-mid"></div>
            <div class="home-art-card home-art-front"><div class="home-art-label">BOOKORA</div><div class="home-art-title">Read.<br>Learn.<br>Grow.</div><div class="home-art-line"></div><div class="home-art-small">A library made for curious minds.</div></div>
          </div>
        </div>
      </section>

      <section class="home-catalog-clean">
        <div class="container">
          <div class="home-section-head home-reveal">
            <div><span class="home-section-kicker">CURATED FOR YOU</span><h2>${featured.length ? 'Featured eBooks' : 'Discover eBooks'}</h2><p>${featured.length ? 'Fresh picks and popular reads from the Bookora catalog.' : 'New books will appear here as soon as they are approved.'}</p></div>
            <a class="home-view-all" href="#/explore">View all <span>→</span></a>
          </div>
          ${featured.length ? `<div class="home-book-grid">${featured.map((book, i) => `<div class="home-book-item" style="--home-delay:${Math.min(i * 55, 385)}ms">${renderBookCard(book)}</div>`).join('')}</div>` : `<div class="home-empty-state home-reveal"><div class="home-empty-icon">📚</div><h3>Your next read is coming soon</h3><p>There are no approved eBooks to display yet.</p><a href="#/explore" class="btn btn-primary">Explore Catalog</a></div>`}
        </div>
      </section>

      <section class="home-trust-clean"><div class="container home-trust-grid">
        <div class="home-trust-item home-reveal"><span>01</span><div><strong>Verified books</strong><p>Browse approved publications with trusted metadata.</p></div></div>
        <div class="home-trust-item home-reveal"><span>02</span><div><strong>Preview before buying</strong><p>Check book details and available samples first.</p></div></div>
        <div class="home-trust-item home-reveal"><span>03</span><div><strong>Instant digital access</strong><p>Your purchased books stay available in your library.</p></div></div>
      </div></section>

      <section class="home-creator-clean"><div class="container home-creator-inner"><div><span class="home-section-kicker">FOR CREATORS</span><h2>Have a book to publish?</h2><p>Share your work with readers through Bookora.</p></div><a href="#/publish" class="btn btn-primary btn-lg">Publish your eBook <span>→</span></a></div></section>
    </main>`;
}

export function initHomePageEvents() {
  const form = document.getElementById('home-search-form');
  const input = document.getElementById('home-search-input');
  if (form && input) form.addEventListener('submit', event => { event.preventDefault(); const q = input.value.trim(); window.location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/explore'; });

  const reveal = () => document.querySelectorAll('.home-reveal,.home-book-item').forEach(el => {
    if (el.dataset.homeVisible === '1') return;
    if (el.getBoundingClientRect().top < window.innerHeight * .94) { el.dataset.homeVisible = '1'; el.classList.add('home-visible'); }
  });
  reveal();
  window.addEventListener('scroll', reveal, { passive: true });
  window.setTimeout(reveal, 120);
}

if (!document.getElementById('bookora-clean-home-styles')) {
  const style = document.createElement('style'); style.id = 'bookora-clean-home-styles';
  style.textContent = `
    .bookora-home-clean{background:#fff;color:#0f172a;overflow:hidden}.home-hero-clean{position:relative;min-height:560px;display:flex;align-items:center;background:linear-gradient(180deg,#f8fbff,#fff);border-bottom:1px solid #e8eef7}.home-hero-inner{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);align-items:center;gap:3rem;padding:5.5rem 1rem 5rem}.home-hero-copy{max-width:720px}.home-eyebrow,.home-section-kicker{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.14em;color:#2563eb;margin-bottom:.9rem}.home-hero-copy h1{font-family:var(--font-display);font-size:clamp(3rem,6vw,5.2rem);line-height:1.02;letter-spacing:-.055em;margin:0 0 1.25rem;color:#0b1220}.home-hero-copy h1 span{color:#2563eb}.home-hero-copy>p{max-width:610px;font-size:1.08rem;line-height:1.7;color:#64748b;margin:0 0 1.7rem}.home-search-clean{height:58px;max-width:620px;display:flex;align-items:center;gap:.65rem;padding:.4rem .45rem .4rem 1.1rem;background:#fff;border:1px solid #dbe4f0;border-radius:15px;box-shadow:0 12px 35px rgba(15,23,42,.08)}.home-search-clean svg{color:#64748b;flex:0 0 auto}.home-search-clean input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#0f172a;font-size:.92rem}.home-search-clean button{border:0;background:#2563eb;color:#fff;border-radius:11px;padding:.72rem 1.15rem;font-weight:800;cursor:pointer}.home-search-clean button:hover{background:#1d4ed8}.home-quick-links{display:flex;gap:1.2rem;margin-top:1rem}.home-quick-links a,.home-view-all{font-size:.8rem;font-weight:750;color:#475569;text-decoration:none}.home-quick-links a:hover,.home-view-all:hover{color:#2563eb}.home-quick-links span,.home-view-all span{color:#2563eb}.home-hero-art{height:390px;position:relative;display:flex;justify-content:center;align-items:center}.home-art-card{position:absolute;width:230px;height:310px;border-radius:14px;box-shadow:0 25px 60px rgba(15,23,42,.15)}.home-art-back{transform:translate(70px,-15px) rotate(9deg);background:#dbeafe}.home-art-mid{transform:translate(-45px,18px) rotate(-8deg);background:#bfdbfe}.home-art-front{transform:rotate(1deg);background:linear-gradient(145deg,#172554,#2563eb);color:#fff;padding:2rem;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 30px 70px rgba(37,99,235,.25)}.home-art-label{font-size:.65rem;font-weight:800;letter-spacing:.16em;opacity:.8}.home-art-title{font-family:var(--font-display);font-size:2.35rem;line-height:1.02;font-weight:850}.home-art-line{width:45px;height:3px;background:#93c5fd}.home-art-small{font-size:.68rem;line-height:1.45;opacity:.78}.home-hero-glow{position:absolute;border-radius:50%;pointer-events:none}.home-hero-glow-a{width:420px;height:420px;right:-100px;top:-100px;background:rgba(37,99,235,.07)}.home-hero-glow-b{width:300px;height:300px;left:-150px;bottom:-150px;background:rgba(96,165,250,.07)}.home-catalog-clean{padding:5rem 0 5.5rem;background:#fff}.home-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;margin-bottom:2rem}.home-section-head h2,.home-creator-inner h2{font-family:var(--font-display);font-size:clamp(1.8rem,3vw,2.35rem);line-height:1.1;letter-spacing:-.035em;margin:0 0 .45rem}.home-section-head p,.home-creator-inner p{margin:0;color:#64748b;font-size:.92rem;line-height:1.55}.home-book-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1.25rem}.home-book-item{opacity:0;transform:translateY(20px);transition:opacity .55s ease var(--home-delay),transform .55s cubic-bezier(.2,.75,.25,1) var(--home-delay)}.home-book-item.home-visible{opacity:1;transform:none}.home-empty-state{padding:4rem 1.5rem;text-align:center;border:1px solid #e5eaf2;border-radius:20px;background:#f8fafc}.home-empty-icon{font-size:2.2rem;margin-bottom:.7rem}.home-empty-state h3{margin:.2rem 0 .4rem;font-size:1.15rem}.home-empty-state p{margin:0 0 1.2rem;color:#64748b}.home-trust-clean{padding:3rem 0;border-top:1px solid #e8eef7;border-bottom:1px solid #e8eef7;background:#f8fafc}.home-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.home-trust-item{display:flex;gap:1rem;align-items:flex-start;padding:1.25rem;border-radius:15px}.home-trust-item>span{font-family:var(--font-display);font-size:.75rem;font-weight:850;color:#2563eb}.home-trust-item strong{font-size:.9rem}.home-trust-item p{font-size:.76rem;color:#64748b;line-height:1.5;margin:.3rem 0 0}.home-creator-clean{padding:4rem 0;background:#fff}.home-creator-inner{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:2.4rem 2.6rem;border-radius:22px;background:linear-gradient(135deg,#0f172a,#172554);color:#fff;box-shadow:0 22px 55px rgba(15,23,42,.15)}.home-creator-inner h2{color:#fff}.home-creator-inner p{color:#cbd5e1}.home-creator-inner .home-section-kicker{color:#93c5fd}.home-reveal{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.75,.25,1)}.home-reveal.home-visible{opacity:1;transform:none}.home-reveal-delay{transition-delay:.12s}
    @media(max-width:1050px){.home-book-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.home-hero-inner{gap:1.5rem}}@media(max-width:800px){.home-hero-inner{grid-template-columns:1fr;text-align:center;padding:4rem 1rem}.home-hero-copy{margin:auto}.home-hero-copy>p{margin-left:auto;margin-right:auto}.home-search-clean{margin:auto}.home-quick-links{justify-content:center}.home-hero-art{height:300px}.home-art-card{width:180px;height:245px}.home-art-title{font-size:1.8rem}.home-book-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-trust-grid{grid-template-columns:1fr}.home-creator-inner{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.home-hero-inner{padding:3.2rem .85rem 3.6rem}.home-hero-copy h1{font-size:clamp(2.65rem,13vw,3.6rem)}.home-search-clean{height:52px;padding-left:.85rem}.home-search-clean button{padding:.62rem .8rem}.home-search-clean input{font-size:.8rem}.home-hero-art{height:255px}.home-art-card{width:155px;height:215px}.home-art-title{font-size:1.5rem}.home-catalog-clean{padding:3.5rem 0}.home-section-head{align-items:flex-start;flex-direction:column}.home-book-grid{gap:.75rem}.home-creator-inner{padding:2rem 1.4rem}.home-creator-inner .btn{width:100%;justify-content:center}}@media(prefers-reduced-motion:reduce){.home-reveal,.home-book-item{transition:none;opacity:1;transform:none}}
  `;
  document.head.appendChild(style);
}
