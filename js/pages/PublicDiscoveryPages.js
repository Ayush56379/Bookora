// PublicDiscoveryPages Component (Categories, Best Sellers, Trending, Authors, Legal & Info)
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { renderCategoryCard } from '../components/CategoryCard.js';
import { updateSEO } from '../utils/seo.js';
import '../public-category-data-runtime-fix.js?v=20260826-2';
import '../best-sellers-firebase-runtime.js?v=20260826-2';

export function renderCategoriesDirectoryPage() {
  updateSEO({ title: 'Browse All Categories', description: 'Explore complete topic categories on Bookora.' });
  return `
    <div class="categories-dir-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container">
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Explore Categories (${Array.isArray(state.categories) ? state.categories.length : 0})
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">Discover publications by topic.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
          ${state.categories.map(c => renderCategoryCard({ ...c, count: Number(c?.count || c?.bookCount || c?.publicationCount || 0) })).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderCuratedCatalogPage(type = 'bestsellers') {
  const isBest = type === 'bestsellers';
  const isTrend = type === 'trending';
  const title = isBest ? 'Best Sellers Leaderboard' : isTrend ? 'Trending Now' : 'New Releases';
  updateSEO({ title, description: `Explore ${title.toLowerCase()} on Bookora.` });

  const isBestLoading = isBest && state.__bestSellerLoading === true;
  const bestError = isBest && state.__bestSellerError ? String(state.__bestSellerError) : '';
  const books = isBest ? state.getBestSellers() : isTrend ? state.getTrendingBooks() : state.getNewReleases();

  let content;
  if (isBest && isBestLoading) {
    content = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;">
      ${Array.from({length:4}, () => `<div style="height:520px;border-radius:16px;background:#fff;border:1px solid var(--border-subtle);overflow:hidden;">
        <div style="height:390px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%);background-size:400% 100%;animation:bookoraBestSellerShimmer 1.4s ease infinite;"></div>
        <div style="padding:18px"><div style="height:16px;width:70%;background:#e2e8f0;border-radius:8px;margin-bottom:12px"></div><div style="height:12px;width:45%;background:#e2e8f0;border-radius:8px"></div></div>
      </div>`).join('')}
    </div>
    <style>@keyframes bookoraBestSellerShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}</style>`;
  } else if (isBest && bestError) {
    content = `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:4rem 2rem;text-align:center;">
      <p style="color:var(--text-primary);font-weight:700;margin-bottom:.5rem;">Unable to load Best Sellers</p>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;">Please try again.</p>
      <button class="btn btn-primary btn-sm" data-action="retry-best-sellers">Retry</button>
    </div>`;
  } else if (books.length > 0) {
    content = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;">${books.map(b => renderBookCard(b)).join('')}</div>`;
  } else if (isBest) {
    content = `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:4rem 2rem;text-align:center;">
      <p style="color:var(--text-primary);font-weight:700;margin-bottom:.5rem;">No Best Sellers yet</p>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;">Best Sellers appear here after successful paid purchases.</p>
    </div>`;
  } else {
    content = `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:4rem 2rem;text-align:center;">
      <p style="color:var(--text-muted);margin-bottom:1.5rem;">No publications available in this section yet.</p>
      <a href="#/publish" class="btn btn-primary btn-sm">Publish Your eBook</a>
    </div>`;
  }

  return `
    <div class="curated-catalog-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem 0;">
      <div class="container">
        <div style="margin-bottom:2.5rem;">
          <h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);">${title}</h1>
          <p style="font-size:.95rem;color:var(--text-secondary);">Real-time curated marketplace selections.</p>
        </div>
        ${content}
      </div>
    </div>
  `;
}

export function renderAuthorsDirectoryPage() {
  updateSEO({ title: 'Authors & Creators', description: 'Meet verified authors publishing on Bookora.' });
  const creators = state.users.filter(u => u.role === 'creator' || u.seller_status === 'approved');

  return `
    <div class="authors-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container">
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">Authors & Creators (${creators.length})</h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">Connect with independent writers and publishers.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          ${creators.map(c => `<div class="book-card" style="background:#FFFFFF;padding:1.5rem;text-align:center;">
            <img src="${c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${c.name}" style="width:72px;height:72px;border-radius:99px;object-fit:cover;margin:0 auto 1rem auto;" />
            <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:.25rem;">${c.name}</h3>
            <div style="font-size:.75rem;color:var(--accent);font-weight:600;margin-bottom:.75rem;">Verified Author</div>
            <p style="font-size:.85rem;color:var(--text-secondary);line-height:1.4;margin-bottom:1.25rem;">${c.bio || 'Bookora Author'}</p>
            <a href="#/explore?q=${encodeURIComponent(c.name)}" class="btn btn-secondary btn-sm" style="width:100%;">View Publications</a>
          </div>`).join('')}
        </div>
      </div>
    </div>
  `;
}
