// Bookora HomePage — clean, buyer-first marketplace
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

export function renderHomePage() {
  updateSEO({
    title: 'Bookora — Discover. Read. Publish.',
    description: 'Discover and buy verified eBooks on Bookora. Read instantly and access your purchased books from your library.'
  });

  const approved = state.getApprovedBooks();
  const trending = state.getTrendingBooks();
  const bestSellers = state.getBestSellers();

  // Prefer real catalog books. Never create fake/demo books just to fill the grid.
  const seen = new Set();
  const books = [...trending, ...bestSellers, ...approved].filter(book => {
    const id = String(book?.id ?? book?.bookId ?? book?.slug ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, 12);

  return `
    <div class="homepage homepage-clean" style="background:#fff;overflow-x:hidden;">
      <style>
        .homepage-clean .home-hero{background:linear-gradient(135deg,#07152f 0%,#102d62 55%,#1d4ed8 100%);border-radius:0 0 28px 28px;color:#fff;overflow:hidden;position:relative}
        .homepage-clean .home-hero:after{content:"";position:absolute;width:520px;height:520px;right:-160px;top:-210px;border-radius:50%;background:radial-gradient(circle,rgba(96,165,250,.24),transparent 68%);pointer-events:none}
        .homepage-clean .hero-inner{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.75fr);gap:2rem;align-items:center;padding:5rem 0 4.5rem}
        .homepage-clean .hero-copy{max-width:720px}
        .homepage-clean .hero-badge{display:inline-flex;align-items:center;gap:.45rem;padding:.42rem .8rem;border-radius:999px;background:rgba(59,130,246,.18);border:1px solid rgba(147,197,253,.25);color:#bfdbfe;font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:1rem}
        .homepage-clean .hero-title{font-family:var(--font-display);font-size:clamp(2.4rem,5vw,4.6rem);line-height:1.04;letter-spacing:-.045em;font-weight:900;margin:0 0 1.15rem;color:#fff}
        .homepage-clean .hero-title span{color:#60a5fa}
        .homepage-clean .hero-text{max-width:620px;color:#dbeafe;font-size:1.05rem;line-height:1.7;margin:0 0 1.6rem}
        .homepage-clean .hero-actions{display:flex;flex-wrap:wrap;gap:.75rem}
        .homepage-clean .hero-search{margin-top:1.4rem;display:flex;max-width:600px;background:#fff;border:1px solid rgba(255,255,255,.35);border-radius:14px;padding:5px;box-shadow:0 14px 40px rgba(2,6,23,.2)}
        .homepage-clean .hero-search input{min-width:0;flex:1;border:0;outline:0;padding:.75rem .9rem;background:transparent;color:#0f172a;font-size:.9rem}
        .homepage-clean .hero-search button{border:0;border-radius:10px;padding:.7rem 1rem;background:#2563eb;color:#fff;font-weight:800;cursor:pointer}
        .homepage-clean .hero-art{min-height:330px;display:grid;place-items:center;position:relative}
        .homepage-clean .hero-books{width:min(390px,100%);height:280px;position:relative;transform:rotate(-3deg)}
        .homepage-clean .hero-book{position:absolute;left:12%;width:70%;height:92px;border-radius:8px 16px 16px 8px;box-shadow:0 20px 30px rgba(2,6,23,.28);border:1px solid rgba(255,255,255,.18)}
        .homepage-clean .hero-book:nth-child(1){bottom:18px;background:#0f172a;transform:rotate(-5deg)}
        .homepage-clean .hero-book:nth-child(2){bottom:82px;background:#2563eb;transform:rotate(2deg)}
        .homepage-clean .hero-book:nth-child(3){bottom:146px;background:#93c5fd;transform:rotate(-2deg)}
        .homepage-clean .hero-device{position:absolute;right:0;top:8px;width:150px;height:240px;border:8px solid #0f172a;border-radius:24px;background:#f8fafc;box-shadow:0 25px 50px rgba(2,6,23,.35);transform:rotate(8deg);padding:16px 10px}
        .homepage-clean .device-bar{height:10px;width:58px;background:#cbd5e1;border-radius:99px;margin:0 auto 20px}
        .homepage-clean .device-line{height:13px;background:#dbeafe;border-radius:5px;margin:11px 0}.homepage-clean .device-line:nth-child(3){width:70%}.homepage-clean .device-line:nth-child(4){width:88%}.homepage-clean .device-line:nth-child(5){width:58%}
        .homepage-clean .catalog-section{padding:3.8rem 0 4.5rem;background:#fff}
        .homepage-clean .section-head{display:flex;align-items:end;justify-content:space-between;gap:1rem;margin-bottom:1.7rem}
        .homepage-clean .section-title{font-family:var(--font-display);font-size:clamp(1.7rem,3vw,2.3rem);font-weight:900;letter-spacing:-.03em;color:var(--text-primary);margin:0}
        .homepage-clean .section-subtitle{color:var(--text-secondary);font-size:.92rem;margin:.35rem 0 0}
        .homepage-clean .home-books-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1.15rem;align-items:start}
        .homepage-clean .home-books-grid .book-card{min-width:0}
        .homepage-clean .home-empty{border:1px dashed #cbd5e1;border-radius:18px;padding:3rem 1.5rem;text-align:center;background:#f8fafc;color:#64748b}
        .homepage-clean .benefits{background:#f5f9ff;border:1px solid #e2e8f0;border-radius:20px;padding:1.25rem;display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
        .homepage-clean .benefit{display:flex;align-items:center;gap:.75rem;padding:.7rem .8rem}.homepage-clean .benefit-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#2563eb;box-shadow:0 4px 14px rgba(37,99,235,.12);font-weight:900}.homepage-clean .benefit strong{display:block;font-size:.85rem;color:#0f172a}.homepage-clean .benefit span{display:block;font-size:.72rem;color:#64748b;margin-top:2px}
        .homepage-clean .creator-strip{margin-top:3.5rem;background:linear-gradient(135deg,#0f172a,#172554);border-radius:20px;padding:2.1rem 2.3rem;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:1.5rem}.homepage-clean .creator-strip h3{margin:0 0 .35rem;font-size:1.35rem}.homepage-clean .creator-strip p{margin:0;color:#cbd5e1;font-size:.86rem;line-height:1.5}
        @media(max-width:1100px){.homepage-clean .home-books-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
        @media(max-width:760px){.homepage-clean .hero-inner{grid-template-columns:1fr;padding:3.5rem 0}.homepage-clean .hero-art{min-height:250px}.homepage-clean .home-books-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.homepage-clean .benefits{grid-template-columns:repeat(2,1fr)}.homepage-clean .creator-strip{flex-direction:column;align-items:flex-start}.homepage-clean .section-head{align-items:flex-start;flex-direction:column}}
        @media(max-width:430px){.homepage-clean .home-books-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.homepage-clean .benefits{grid-template-columns:1fr}.homepage-clean .hero-search button{padding:.7rem .8rem}.homepage-clean .hero-art{display:none}}
      </style>

      <section class="home-hero">
        <div class="container hero-inner">
          <div class="hero-copy">
            <div class="hero-badge">📚 Welcome to Bookora</div>
            <h1 class="hero-title">Discover, Learn &amp;<br><span>Grow with eBooks</span></h1>
            <p class="hero-text">Find quality eBooks from verified creators, discover useful knowledge, and start reading instantly after purchase.</p>
            <div class="hero-actions">
              <a href="#/explore" class="btn btn-primary btn-lg">Explore eBooks →</a>
              <a href="#/categories" class="btn btn-secondary btn-lg" style="background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.35)">Browse Categories</a>
            </div>
            <form id="hero-search-form" class="hero-search">
              <input id="hero-search-input" type="search" autocomplete="off" placeholder="Search eBooks, authors, topics..." aria-label="Search eBooks">
              <button type="submit">Search</button>
            </form>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="hero-books"><div class="hero-book"></div><div class="hero-book"></div><div class="hero-book"></div><div class="hero-device"><div class="device-bar"></div><div class="device-line"></div><div class="device-line"></div><div class="device-line"></div><div class="device-line"></div></div></div>
          </div>
        </div>
      </section>

      <section class="catalog-section">
        <div class="container">
          <div class="section-head">
            <div><h2 class="section-title">Featured eBooks</h2><p class="section-subtitle">Real books from the Bookora catalog. Choose a book and start reading.</p></div>
            <a href="#/explore" class="btn btn-secondary btn-sm">View All eBooks →</a>
          </div>

          ${books.length ? `<div class="home-books-grid">${books.map(book => renderBookCard(book)).join('')}</div>` : `
            <div class="home-empty"><strong>No eBooks are available yet.</strong><p style="margin:.45rem 0 1rem">New approved books will appear here automatically.</p><a href="#/explore" class="btn btn-primary btn-sm">Explore Catalog</a></div>
          `}

          <div class="benefits" style="margin-top:3rem">
            <div class="benefit"><div class="benefit-icon">▣</div><div><strong>Wide Collection</strong><span>Books across multiple categories</span></div></div>
            <div class="benefit"><div class="benefit-icon">✓</div><div><strong>Secure &amp; Safe</strong><span>Protected checkout and access</span></div></div>
            <div class="benefit"><div class="benefit-icon">↯</div><div><strong>Instant Access</strong><span>Read purchased books instantly</span></div></div>
            <div class="benefit"><div class="benefit-icon">?</div><div><strong>24/7 Support</strong><span>Help whenever you need it</span></div></div>
          </div>

          <div class="creator-strip">
            <div><h3>Have an eBook to sell?</h3><p>Publish your work on Bookora and reach readers directly.</p></div>
            <a href="#/publish" class="btn btn-primary">Publish Your eBook →</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initHomePageEvents() {
  const searchForm = document.getElementById('hero-search-form');
  const searchInput = document.getElementById('hero-search-input');
  if (searchForm && searchInput && !searchForm.dataset.bound) {
    searchForm.dataset.bound = '1';
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const q = searchInput.value.trim();
      window.location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/explore';
    });
  }
}
