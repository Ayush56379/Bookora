// Bookora — Premium Book Detail Page
// Complete, responsive and interaction-safe detail experience.
import { state } from '../state.js';
import { formatPrice, renderStars, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { renderBookCard } from '../components/BookCard.js';
import { Toast } from '../components/Toast.js';

const ICON = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12s3.4-6.5 9.8-6.5S21.8 12 21.8 12s-3.4 6.5-9.8 6.5S2.2 12 2.2 12Z"/><circle cx="12" cy="12" r="2.7"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.7c0 4.9-8.8 10.1-8.8 10.1S3.2 13.6 3.2 8.7A4.7 4.7 0 0 1 8 4c1.6 0 3 .8 4 2.1C13 4.8 14.4 4 16 4a4.7 4.7 0 0 1 4.8 4.7Z"/></svg>',
  share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.2M8.2 13.2l7.5 4.2"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5V4.5Z"/><path d="M5 4.5V21.5M8.5 6H16"/></svg>'
};

function esc(value = '') {
  return String(value).replace(/[&<>\"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[char]));
}

function slugify(value = '') {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function driveId(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;
  return raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1]
    || raw.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || raw.match(/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || '';
}

function coverSources(book) {
  const values = [
    book?.cover_url, book?.coverUrl, book?.cover_file_id, book?.coverFileId,
    book?.cover_image_url, book?.coverImageUrl, book?.front_cover_url,
    book?.frontCoverUrl, book?.front_cover, book?.frontCover,
    book?.cover_image, book?.coverImage, book?.cover, book?.thumbnail,
    book?.image_url, book?.image, book?.thumbnail_url
  ].filter(value => typeof value === 'string' && value.trim());
  const sources = [];
  const add = value => { if (value && !sources.includes(value)) sources.push(value); };
  values.forEach(value => {
    const id = driveId(value);
    if (id) {
      add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`);
      add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`);
      add(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=view&confirm=t`);
    }
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) add(value);
  });
  return sources;
}

function coverMarkup(book) {
  const sources = coverSources(book);
  const fallback = `linear-gradient(145deg, ${esc(book.cover_gradient || '#111827')}, #2563eb)`;
  const initial = sources[0] || '';
  return `<div class="bd-cover" data-cover-sources="${esc(JSON.stringify(sources))}" style="--cover-bg:${fallback};">
    ${initial ? `<img class="bd-cover-img" src="${esc(initial)}" alt="Cover of ${esc(book.title)}" loading="eager" decoding="async" referrerpolicy="no-referrer">` : ''}
    <div class="bd-cover-fallback"><span>${esc(book.category || 'eBook')}</span><strong>${esc(book.title)}</strong><small>${esc(book.author)}</small></div>
    <div class="bd-cover-gloss"></div>
    <div class="bd-cover-format">${esc(book.format || 'PDF')}</div>
  </div>`;
}

function getReviews(bookId) {
  return (Array.isArray(state.reviews) ? state.reviews : []).filter(review => String(review.book_id || review.bookId) === String(bookId));
}

function averageRating(book, reviews) {
  if (reviews.length) return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  return Number(book.rating || 0);
}

function statIcon(type) {
  return `<span class="bd-stat-icon bd-stat-${type}">${type === 'pages' ? ICON.book : type === 'language' ? 'Aa' : type === 'format' ? 'PDF' : '✓'}</span>`;
}

export function renderBookDetailPage(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) {
    return `<div class="bd-not-found"><div class="bd-not-found-icon">${ICON.book}</div><h1>eBook not found</h1><p>This publication may have been removed or is still waiting for approval.</p><a class="bd-btn bd-btn-primary" href="#/explore">Browse eBooks ${ICON.arrow}</a></div>`;
  }

  const internal = String(book.source_type || 'internal').toLowerCase() === 'internal';
  const purchased = state.hasPurchased(book.id);
  const wished = state.isInWishlist(book.id);
  const reviews = getReviews(book.id);
  const rating = averageRating(book, reviews);
  const reviewCount = Number(book.review_count ?? reviews.length ?? 0);
  const price = Number(book.sale_price ?? book.salePrice ?? book.price ?? 0);
  const originalPrice = Number(book.price ?? 0);
  const discount = Number(book.discount || (originalPrice > price && originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0));
  const related = state.getApprovedBooks().filter(item => String(item.id) !== String(book.id) && (item.category === book.category || item.source_type === book.source_type)).slice(0, 4);
  const tags = Array.isArray(book.tags) ? book.tags : String(book.tags || '').split(',').map(tag => tag.trim()).filter(Boolean);
  const pages = Number(book.pages || book.page_count || 0);
  const categorySlug = slugify(book.category || 'other');
  const buyUrl = book.buy_url || book.buyUrl || book.source_url || book.sourceUrl || '';

  updateSEO({
    title: `${book.title} — Bookora`,
    description: String(book.description || `Read ${book.title} by ${book.author} on Bookora.`).slice(0, 160),
    schemaData: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title,
      author: { '@type': 'Person', name: book.author },
      bookFormat: 'EBook',
      numberOfPages: pages || undefined,
      inLanguage: book.language || 'English',
      offers: { '@type': 'Offer', price: String(price), priceCurrency: 'INR', availability: 'https://schema.org/InStock' },
      aggregateRating: rating > 0 && reviewCount > 0 ? { '@type': 'AggregateRating', ratingValue: rating.toFixed(1), reviewCount: String(reviewCount) } : undefined
    }
  });

  const safeDescription = esc(book.description || 'A premium digital publication available through Bookora.');

  return `
  <style id="bookora-detail-v4">
    .bd-page{--bd-ink:#0f172a;--bd-muted:#64748b;--bd-line:#e2e8f0;--bd-soft:#f8fafc;--bd-blue:#2563eb;--bd-purple:#6d4aff;background:#f6f8fc;color:var(--bd-ink);min-height:calc(100vh - 72px);padding:28px 0 72px}
    .bd-page *{box-sizing:border-box}.bd-wrap{width:min(1180px,calc(100% - 32px));margin:auto}.bd-breadcrumb{display:flex;align-items:center;gap:9px;margin:5px 0 22px;color:#64748b;font-size:13px;white-space:nowrap;overflow:hidden}.bd-breadcrumb a{color:#64748b;text-decoration:none}.bd-breadcrumb a:hover{color:var(--bd-blue)}.bd-breadcrumb .current{color:#0f172a;font-weight:700;overflow:hidden;text-overflow:ellipsis}
    .bd-hero{background:#fff;border:1px solid var(--bd-line);border-radius:24px;box-shadow:0 12px 38px rgba(15,23,42,.06);padding:28px;display:grid;grid-template-columns:330px minmax(0,1fr);gap:42px;position:relative;overflow:hidden}.bd-hero:before{content:"";position:absolute;width:420px;height:420px;right:-250px;top:-280px;background:radial-gradient(circle,rgba(37,99,235,.10),transparent 67%);pointer-events:none}
    .bd-left{position:relative;z-index:1}.bd-cover{width:100%;max-width:300px;margin:0 auto 18px;aspect-ratio:3/4.2;border-radius:18px;position:relative;overflow:hidden;background:var(--cover-bg);box-shadow:0 22px 45px rgba(15,23,42,.18);isolation:isolate}.bd-cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;z-index:2}.bd-cover-img.is-failed{display:none}.bd-cover-fallback{position:absolute;inset:0;z-index:1;padding:25px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;background:var(--cover-bg)}.bd-cover-fallback span{text-transform:uppercase;letter-spacing:.12em;font-size:10px;font-weight:800;opacity:.75}.bd-cover-fallback strong{font-size:27px;line-height:1.08;font-family:var(--font-display);max-width:90%}.bd-cover-fallback small{font-size:13px;font-weight:700;opacity:.85;border-top:1px solid rgba(255,255,255,.25);padding-top:12px}.bd-cover-gloss{position:absolute;inset:0;z-index:3;background:linear-gradient(115deg,rgba(255,255,255,.18),transparent 30%,transparent 70%,rgba(0,0,0,.10));pointer-events:none}.bd-cover-format{position:absolute;right:12px;bottom:12px;z-index:4;background:rgba(15,23,42,.72);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:5px 8px;font-size:10px;font-weight:800;backdrop-filter:blur(8px)}
    .bd-action-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.bd-btn{border:0;text-decoration:none;cursor:pointer;min-height:46px;border-radius:12px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:700 14px Inter,sans-serif;transition:.18s ease}.bd-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}.bd-btn:hover{transform:translateY(-1px)}.bd-btn:disabled{opacity:.55;cursor:wait;transform:none}.bd-btn-primary{background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;box-shadow:0 10px 22px rgba(37,99,235,.22)}.bd-btn-secondary{background:#fff;color:#0f172a;border:1px solid #dbe3ee}.bd-btn-ghost{background:#f8fafc;color:#475569;border:1px solid #e2e8f0}.bd-wish.active{color:#e11d48;background:#fff1f2;border-color:#fecdd3}.bd-share{margin-top:10px;width:100%}
    .bd-content{position:relative;z-index:1;min-width:0}.bd-eyebrow{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:13px}.bd-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;color:#2563eb;font-size:10px;font-weight:800;letter-spacing:.05em}.bd-badge.external{background:#f5f3ff;border-color:#ddd6fe;color:#6d28d9}.bd-category{font-size:13px;font-weight:700;color:#2563eb;text-decoration:none}.bd-title{font-family:var(--font-display);font-size:clamp(2rem,4.4vw,3.35rem);line-height:1.05;letter-spacing:-.04em;margin:0 0 10px;color:#0b1328}.bd-subtitle{font-size:16px;color:#64748b;line-height:1.55;margin:0 0 17px;max-width:760px}.bd-author-line{display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding-bottom:18px;border-bottom:1px solid var(--bd-line);font-size:14px;color:#64748b}.bd-author-line strong{color:#0f172a}.bd-rating{display:inline-flex;align-items:center;gap:7px}.bd-rating-stars{display:inline-flex;align-items:center}.bd-rating-stars svg{width:16px;height:16px}.bd-rating-number{font-weight:800;color:#0f172a}.bd-rating-count{color:#64748b}
    .bd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:19px 0}.bd-stat{border:1px solid var(--bd-line);background:#fbfdff;border-radius:13px;padding:11px 10px;min-width:0}.bd-stat-label{display:block;font-size:10px;color:#94a3b8;font-weight:700;margin-bottom:4px}.bd-stat-value{display:block;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd-description{font-size:14px;color:#475569;line-height:1.75;margin-bottom:20px}.bd-description h3{font-size:15px;color:#0f172a;margin:0 0 7px}.bd-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:20px}.bd-tag{background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:700}
    .bd-purchase{background:#f8fbff;border:1px solid #dbe7ff;border-radius:18px;padding:17px}.bd-purchase-top{display:flex;align-items:center;justify-content:space-between;gap:16px}.bd-price-label{font-size:11px;color:#64748b;font-weight:600}.bd-price{font:900 31px/1.1 var(--font-display);letter-spacing:-.03em;color:#0b1328}.bd-original{font-size:13px;color:#94a3b8;text-decoration:line-through;margin-left:6px}.bd-save{font-size:10px;font-weight:800;background:#dcfce7;color:#166534;border-radius:999px;padding:4px 7px;margin-left:6px}.bd-trust{display:flex;flex-wrap:wrap;gap:13px;border-top:1px solid #e2e8f0;margin-top:13px;padding-top:12px;color:#64748b;font-size:10px;font-weight:700}.bd-trust span{display:inline-flex;align-items:center;gap:5px}.bd-trust svg{width:14px;height:14px;stroke:#16a34a;fill:none;stroke-width:2}
    .bd-section{margin-top:22px;background:#fff;border:1px solid var(--bd-line);border-radius:20px;padding:25px;box-shadow:0 8px 24px rgba(15,23,42,.035)}.bd-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px}.bd-section-title{font:800 21px/1.2 var(--font-display);letter-spacing:-.025em;margin:0}.bd-section-copy{font-size:12px;color:#64748b;margin:5px 0 0;line-height:1.5}.bd-tabs{display:flex;gap:5px;border-bottom:1px solid var(--bd-line);margin:-3px 0 20px;overflow:auto}.bd-tab{border:0;background:none;color:#64748b;padding:10px 13px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}.bd-tab.active{color:#2563eb;border-bottom-color:#2563eb}.bd-panel{display:none}.bd-panel.active{display:block}.bd-details-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.bd-detail-row{padding:13px;border:1px solid #e2e8f0;border-radius:12px;background:#fbfdff}.bd-detail-row span{display:block;color:#94a3b8;font-size:10px;font-weight:700;margin-bottom:4px}.bd-detail-row strong{font-size:13px}
    .bd-author{display:flex;align-items:flex-start;gap:16px}.bd-avatar{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;flex:0 0 auto;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font:900 22px var(--font-display);box-shadow:0 10px 22px rgba(37,99,235,.18)}.bd-author h3{margin:0 0 4px;font-size:16px}.bd-author p{margin:0;color:#64748b;font-size:13px;line-height:1.6}
    .bd-review-summary{display:grid;grid-template-columns:190px 1fr;gap:25px;align-items:center;margin-bottom:22px}.bd-score{text-align:center;padding:17px;border:1px solid #e2e8f0;border-radius:16px;background:#fbfdff}.bd-score-number{font:900 38px var(--font-display);letter-spacing:-.04em}.bd-score .bd-rating-stars{justify-content:center;margin:4px 0}.bd-score small{font-size:10px;color:#64748b}.bd-review-list{display:grid;gap:0}.bd-review{padding:18px 0;border-top:1px solid #e2e8f0}.bd-review:first-child{border-top:0;padding-top:0}.bd-review-top{display:flex;justify-content:space-between;gap:12px}.bd-review-title{font-weight:800;font-size:13px;margin:4px 0}.bd-review-comment{font-size:13px;color:#475569;line-height:1.65;margin:7px 0}.bd-review-meta{font-size:10px;color:#94a3b8}.bd-verified{color:#15803d;font-weight:800}.bd-empty{padding:30px 10px;text-align:center;color:#64748b;font-size:13px}.bd-review-form{display:none;margin-bottom:20px;padding:18px;border-radius:15px;background:#f8fafc;border:1px solid #e2e8f0}.bd-review-form.open{display:block}.bd-field{margin-bottom:12px}.bd-field label{display:block;font-size:11px;font-weight:800;margin-bottom:5px;color:#334155}.bd-field input,.bd-field textarea,.bd-field select{width:100%;border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:10px 11px;font:500 13px Inter,sans-serif;outline:none}.bd-field input:focus,.bd-field textarea:focus,.bd-field select:focus{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(37,99,235,.10)}.bd-form-actions{display:flex;gap:8px}
    .bd-related{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.bd-bottom-note{display:flex;align-items:center;gap:10px;margin-top:18px;color:#64748b;font-size:11px}.bd-bottom-note svg{width:17px;height:17px;stroke:#2563eb;fill:none;stroke-width:2}
    .bd-not-found{width:min(650px,calc(100% - 32px));margin:90px auto;text-align:center}.bd-not-found-icon{width:70px;height:70px;border-radius:20px;background:#eff6ff;color:#2563eb;display:grid;place-items:center;margin:0 auto 18px}.bd-not-found-icon svg{width:32px;height:32px;stroke:currentColor;fill:none;stroke-width:1.5}.bd-not-found h1{font:900 32px var(--font-display);margin:0 0 8px}.bd-not-found p{color:#64748b;margin:0 0 20px}
    @media(max-width:950px){.bd-hero{grid-template-columns:270px minmax(0,1fr);gap:27px;padding:21px}.bd-stats{grid-template-columns:repeat(2,1fr)}.bd-related{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:700px){.bd-page{padding:14px 0 45px}.bd-wrap{width:min(100% - 20px,560px)}.bd-breadcrumb{margin-bottom:13px}.bd-hero{display:block;padding:14px;border-radius:18px}.bd-left{margin-bottom:22px}.bd-cover{max-width:255px}.bd-action-row{grid-template-columns:1fr 1fr}.bd-content{padding:0 3px}.bd-title{font-size:32px}.bd-subtitle{font-size:14px}.bd-author-line{gap:9px}.bd-stats{gap:7px}.bd-stat{padding:9px}.bd-purchase-top{align-items:flex-start;flex-direction:column}.bd-purchase .bd-btn{width:100%}.bd-trust{gap:8px}.bd-section{padding:17px;border-radius:16px}.bd-section-head{align-items:flex-start;flex-direction:column}.bd-review-summary{grid-template-columns:1fr}.bd-details-grid{grid-template-columns:1fr}.bd-related{grid-template-columns:1fr}.bd-review-top{align-items:flex-start;flex-direction:column}.bd-form-actions .bd-btn{flex:1}.bd-share{margin-top:8px}}
    @media(max-width:390px){.bd-title{font-size:28px}.bd-cover{max-width:230px}.bd-action-row{grid-template-columns:1fr}.bd-stats{grid-template-columns:1fr 1fr}}
  </style>

  <main class="bd-page" data-book-id="${esc(book.id)}">
    <div class="bd-wrap">
      <nav class="bd-breadcrumb" aria-label="Breadcrumb">
        <a href="#/">Home</a><span>/</span><a href="#/explore">Explore</a><span>/</span><a href="#/explore?category=${encodeURIComponent(book.category || '')}">${esc(book.category || 'Books')}</a><span>/</span><span class="current">${esc(book.title)}</span>
      </nav>

      <section class="bd-hero">
        <div class="bd-left">
          ${coverMarkup(book)}
          <div class="bd-action-row">
            <button type="button" id="detail-preview-btn" class="bd-btn bd-btn-primary">${ICON.eye}<span>Read Free Sample</span></button>
            <button type="button" id="detail-wishlist-btn" class="bd-btn bd-btn-secondary bd-wish ${wished ? 'active' : ''}" aria-pressed="${wished}">${ICON.heart}<span>${wished ? 'Saved' : 'Wishlist'}</span></button>
          </div>
          <button type="button" id="detail-share-btn" class="bd-btn bd-btn-ghost bd-share">${ICON.share}<span>Share this eBook</span></button>
        </div>

        <div class="bd-content">
          <div class="bd-eyebrow"><span class="bd-badge ${internal ? '' : 'external'}">${internal ? 'BOOKORA EXCLUSIVE' : 'EXTERNAL LISTING'}</span><a class="bd-category" href="#/explore?category=${encodeURIComponent(book.category || '')}">${esc(book.category || 'Other')}</a></div>
          <h1 class="bd-title">${esc(book.title)}</h1>
          ${book.subtitle ? `<p class="bd-subtitle">${esc(book.subtitle)}</p>` : ''}
          <div class="bd-author-line"><span>By <strong>${esc(book.author)}</strong></span><span>•</span><span class="bd-rating"><span class="bd-rating-stars">${renderStars(rating || 0)}</span><span class="bd-rating-number">${rating ? rating.toFixed(1) : '—'}</span><span class="bd-rating-count">(${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})</span></span></div>

          <div class="bd-stats">
            <div class="bd-stat">${statIcon('pages')}<span class="bd-stat-label">Pages</span><span class="bd-stat-value">${pages || '—'}</span></div>
            <div class="bd-stat">${statIcon('language')}<span class="bd-stat-label">Language</span><span class="bd-stat-value">${esc(book.language || 'English')}</span></div>
            <div class="bd-stat">${statIcon('format')}<span class="bd-stat-label">Format</span><span class="bd-stat-value">${esc(book.format || 'PDF')}</span></div>
            <div class="bd-stat">${statIcon('verified')}<span class="bd-stat-label">Access</span><span class="bd-stat-value">${internal ? 'Instant' : 'Publisher'}</span></div>
          </div>

          <div class="bd-description"><h3>About this publication</h3><div>${safeDescription}</div></div>
          ${tags.length ? `<div class="bd-tags">${tags.slice(0,10).map(tag => `<span class="bd-tag">#${esc(tag)}</span>`).join('')}</div>` : ''}

          <div class="bd-purchase">
            ${internal ? `<div class="bd-purchase-top"><div><div class="bd-price-label">One-time purchase • Lifetime access</div><div><span class="bd-price">${formatPrice(price)}</span>${discount > 0 && originalPrice > price ? `<span class="bd-original">${formatPrice(originalPrice)}</span><span class="bd-save">Save ${discount}%</span>` : ''}</div></div>${purchased ? `<a class="bd-btn bd-btn-primary" href="#/library">${ICON.book}<span>Read in Library</span></a>` : `<a class="bd-btn bd-btn-primary" href="#/checkout/${encodeURIComponent(book.slug || book.id)}">Buy Now ${ICON.arrow}</a>`}</div>` : `<div class="bd-purchase-top"><div><div class="bd-price-label">Publisher listing price</div><div class="bd-price">${formatPrice(price)}</div></div>${buyUrl ? `<a class="bd-btn bd-btn-primary" href="${esc(buyUrl)}" target="_blank" rel="noopener noreferrer">Buy on Publisher Website ${ICON.arrow}</a>` : `<button class="bd-btn bd-btn-primary" type="button" id="external-buy-missing">Publisher Link Unavailable</button>`}</div>`}
            <div class="bd-trust"><span>${ICON.check} Secure checkout</span><span>${ICON.check} Instant digital access</span><span>${ICON.lock} Protected purchase</span></div>
          </div>
        </div>
      </section>

      <section class="bd-section" id="book-information">
        <div class="bd-tabs" role="tablist"><button class="bd-tab active" data-tab="overview" type="button">Overview</button><button class="bd-tab" data-tab="details" type="button">Book Details</button><button class="bd-tab" data-tab="reviews" type="button">Reviews (${reviewCount})</button></div>
        <div class="bd-panel active" data-panel="overview"><div class="bd-description" style="margin:0"><h3>About this publication</h3><div>${safeDescription}</div></div>${tags.length ? `<div class="bd-tags" style="margin-top:16px;margin-bottom:0">${tags.map(tag => `<span class="bd-tag">#${esc(tag)}</span>`).join('')}</div>` : ''}</div>
        <div class="bd-panel" data-panel="details"><div class="bd-details-grid"><div class="bd-detail-row"><span>Title</span><strong>${esc(book.title)}</strong></div><div class="bd-detail-row"><span>Author</span><strong>${esc(book.author)}</strong></div><div class="bd-detail-row"><span>Category</span><strong>${esc(book.category || 'Other')}</strong></div><div class="bd-detail-row"><span>Pages</span><strong>${pages || 'Not specified'}</strong></div><div class="bd-detail-row"><span>Language</span><strong>${esc(book.language || 'English')}</strong></div><div class="bd-detail-row"><span>Format</span><strong>${esc(book.format || 'PDF')}</strong></div><div class="bd-detail-row"><span>Publication type</span><strong>${internal ? 'Bookora Exclusive' : 'External Listing'}</strong></div><div class="bd-detail-row"><span>Access</span><strong>${internal ? 'Lifetime after purchase' : 'Publisher website'}</strong></div></div></div>
        <div class="bd-panel" data-panel="reviews"><div class="bd-review-summary"><div class="bd-score"><div class="bd-score-number">${rating ? rating.toFixed(1) : '—'}</div><div class="bd-rating-stars">${renderStars(rating || 0)}</div><small>${reviewCount} verified reader ${reviewCount === 1 ? 'review' : 'reviews'}</small></div><div><h3 style="margin:0 0 6px;font-size:15px">Reader feedback</h3><p class="bd-section-copy" style="margin:0">Reviews from readers help other customers choose the right publication.</p></div></div>
          <div id="review-form-container" class="bd-review-form"><h3 style="font-size:14px;margin:0 0 12px">Write your review</h3><form id="submit-review-form"><div class="bd-field"><label for="review-rating-input">Rating</label><select id="review-rating-input"><option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option></select></div><div class="bd-field"><label for="review-title-input">Headline</label><input id="review-title-input" maxlength="100" required placeholder="Summarize your experience"></div><div class="bd-field"><label for="review-comment-input">Review</label><textarea id="review-comment-input" rows="4" maxlength="1000" required placeholder="What did you like about this eBook?"></textarea></div><div class="bd-form-actions"><button class="bd-btn bd-btn-primary" type="submit">Submit Review</button><button class="bd-btn bd-btn-secondary" id="cancel-review-btn" type="button">Cancel</button></div></form></div>
          <div id="review-list" class="bd-review-list">${reviews.length ? reviews.map(review => `<article class="bd-review"><div class="bd-review-top"><div><div class="bd-rating-stars">${renderStars(Number(review.rating || 0))}</div><div class="bd-review-title">${esc(review.title || 'Reader review')}</div></div><span class="bd-review-meta">${esc(formatDate(review.date || review.created_at || review.createdAt || ''))}</span></div><p class="bd-review-comment">${esc(review.comment || '')}</p><div class="bd-review-meta">${esc(review.user_name || review.userName || 'Bookora Reader')} ${review.verified_purchase ? `<span class="bd-verified">• ✓ Verified Purchase</span>` : ''}</div></article>`).join('') : `<div class="bd-empty">No customer reviews yet. Be the first verified reader to share your feedback.</div>`}</div>
        </div>
      </section>

      <section class="bd-section">
        <div class="bd-section-head"><div><h2 class="bd-section-title">About the author</h2><p class="bd-section-copy">Learn more about the creator behind this publication.</p></div></div>
        <div class="bd-author"><div class="bd-avatar">${esc(String(book.author || 'B').charAt(0).toUpperCase())}</div><div><h3>${esc(book.author)}</h3><p>${esc(book.author_bio || 'A verified Bookora creator sharing practical and useful digital publications with readers.')}</p></div></div>
      </section>

      ${related.length ? `<section class="bd-section"><div class="bd-section-head"><div><h2 class="bd-section-title">Readers also explored</h2><p class="bd-section-copy">More publications from the same category and catalog.</p></div><a class="bd-category" href="#/explore?category=${encodeURIComponent(book.category || '')}">View all ${ICON.arrow}</a></div><div class="bd-related">${related.map(item => renderBookCard(item)).join('')}</div></section>` : ''}
      <div class="bd-bottom-note">${ICON.lock}<span>Bookora uses secure account and payment flows. Never share your password or payment credentials.</span></div>
    </div>
  </main>`;
}

async function loadBookReviews(book) {
  try {
    if (!window.firebase?.apps?.length) return;
    const db = window.firebase.firestore();
    const snapshot = await db.collection('reviews').where('book_id', '==', String(book.id)).get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    state.reviews = [...(Array.isArray(state.reviews) ? state.reviews.filter(r => String(r.book_id) !== String(book.id)) : []), ...reviews];
    if (document.querySelector('.bd-page')) window.dispatchEvent(new Event('hashchange'));
  } catch (error) {
    console.warn('Bookora reviews could not be loaded:', error?.message || error);
  }
}

async function submitReview(book) {
  if (!state.isAuthenticated || !state.currentUser?.uid) {
    Toast.show('Please sign in before submitting a review.', 'info');
    const returnTo = window.location.hash || `#/book/${book.slug || book.id}`;
    window.location.hash = `#/login?returnTo=${encodeURIComponent(returnTo)}`;
    return;
  }
  if (!state.hasPurchased(book.id)) {
    Toast.show('Only verified purchasers can review this eBook.', 'warning');
    return;
  }
  const rating = Math.max(1, Math.min(5, Number(document.getElementById('review-rating-input')?.value || 5)));
  const title = String(document.getElementById('review-title-input')?.value || '').trim();
  const comment = String(document.getElementById('review-comment-input')?.value || '').trim();
  if (!title || !comment) { Toast.show('Please complete the review before submitting.', 'warning'); return; }

  const submit = document.querySelector('#submit-review-form button[type="submit"]');
  if (submit) { submit.disabled = true; submit.textContent = 'Publishing…'; }
  try {
    if (!window.firebase?.apps?.length) throw new Error('Review service is not ready. Please try again.');
    const db = window.firebase.firestore();
    const review = {
      book_id: String(book.id), user_id: state.currentUser.uid,
      user_name: state.currentUser.name || state.currentUser.displayName || state.currentUser.email?.split('@')[0] || 'Reader',
      user_email: state.currentUser.email || '', rating, title, comment,
      verified_purchase: true, created_at: window.firebase.firestore.FieldValue.serverTimestamp(), date: window.firebase.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection('reviews').add(review);
    state.reviews = [...(Array.isArray(state.reviews) ? state.reviews : []), { ...review, id: ref.id, date: new Date().toISOString(), created_at: new Date().toISOString() }];
    Toast.show('Your verified review has been published.', 'success');
    window.dispatchEvent(new Event('hashchange'));
  } catch (error) {
    console.error('Review submit failed:', error);
    Toast.show(error?.message || 'Could not publish your review.', 'error');
    if (submit) { submit.disabled = false; submit.textContent = 'Submit Review'; }
  }
}

export function initBookDetailEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  document.querySelectorAll('.bd-cover-img').forEach(img => {
    img.addEventListener('error', () => {
      const box = img.closest('.bd-cover');
      let sources = [];
      try { sources = JSON.parse(box?.dataset.coverSources || '[]'); } catch (_) {}
      const current = sources.indexOf(img.src);
      const next = sources[current + 1];
      if (next) { img.src = next; return; }
      img.classList.add('is-failed');
    }, { once: false });
  });

  const preview = document.getElementById('detail-preview-btn');
  preview?.addEventListener('click', async () => {
    if (preview.dataset.busy === '1') return;
    preview.dataset.busy = '1'; preview.disabled = true;
    const label = preview.querySelector('span'); if (label) label.textContent = 'Preparing sample…';
    try { await ReaderModal.open(book, true); }
    catch (error) { console.error('Free sample failed:', error); Toast.show('Free sample could not be opened. Please try again.', 'error'); }
    finally { preview.dataset.busy = '0'; preview.disabled = false; if (label) label.textContent = 'Read Free Sample'; }
  });

  const wish = document.getElementById('detail-wishlist-btn');
  wish?.addEventListener('click', async () => {
    if (wish.dataset.busy === '1') return;
    if (!state.isAuthenticated || !state.currentUser?.uid) {
      Toast.show('Please sign in to save eBooks to your Wishlist.', 'info');
      const returnTo = window.location.hash || `#/book/${book.slug || book.id}`;
      window.location.hash = `#/login?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }
    wish.dataset.busy = '1'; wish.disabled = true;
    try {
      const added = await state.toggleWishlist(book.id);
      wish.classList.toggle('active', added); wish.setAttribute('aria-pressed', String(added));
      const label = wish.querySelector('span'); if (label) label.textContent = added ? 'Saved' : 'Wishlist';
      Toast.show(added ? 'Added to your Wishlist' : 'Removed from your Wishlist', added ? 'success' : 'info');
    } catch (error) { Toast.show(error?.message || 'Wishlist could not be updated.', 'error'); }
    finally { wish.dataset.busy = '0'; wish.disabled = false; }
  });

  document.getElementById('detail-share-btn')?.addEventListener('click', async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: book.title, text: `Check out ${book.title} on Bookora.`, url });
      else { await navigator.clipboard.writeText(url); Toast.show('Book link copied to clipboard.', 'success'); }
    } catch (error) {
      if (error?.name !== 'AbortError') Toast.show('Could not share this book.', 'error');
    }
  });

  document.getElementById('external-buy-missing')?.addEventListener('click', () => Toast.show('This external publisher has not provided a purchase link yet.', 'warning'));

  document.querySelectorAll('.bd-tab').forEach(tab => tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.bd-tab').forEach(item => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.bd-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === target));
    if (target === 'reviews') setTimeout(() => loadBookReviews(book), 0);
  }));

  const reviewFormBox = document.getElementById('review-form-container');
  const openReview = document.querySelector('[data-tab="reviews"]');
  if (openReview) {
    const write = document.createElement('button');
    write.type = 'button'; write.className = 'bd-btn bd-btn-secondary'; write.textContent = state.hasPurchased(book.id) ? 'Write a Review' : 'Verified reviews only';
    write.style.marginTop = '15px';
    write.addEventListener('click', () => {
      if (!state.isAuthenticated || !state.hasPurchased(book.id)) { Toast.show(state.hasPurchased(book.id) ? 'Please sign in to write your review.' : 'Only verified purchasers can review this eBook.', 'info'); return; }
      reviewFormBox?.classList.add('open'); reviewFormBox?.scrollIntoView({ behavior:'smooth', block:'center' });
    });
    document.querySelector('[data-panel="reviews"]')?.prepend(write);
  }
  document.getElementById('cancel-review-btn')?.addEventListener('click', () => reviewFormBox?.classList.remove('open'));
  document.getElementById('submit-review-form')?.addEventListener('submit', event => { event.preventDefault(); submitReview(book); });

  // Reviews are fetched after the first paint so the detail page never waits for Firestore.
  loadBookReviews(book);
}
