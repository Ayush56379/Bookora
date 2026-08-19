// BookDetailPage Component
import { state } from '../state.js';
import { formatPrice, renderStars, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { renderBookCard } from '../components/BookCard.js';
import { Toast } from '../components/Toast.js';

export function renderBookDetailPage(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) {
    return `
      <div class="container" style="padding: 6rem 0; text-align: center;">
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem;">eBook Not Found</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">The eBook you requested could not be located in our catalog.</p>
        <a href="#/explore" class="btn btn-primary">Browse All eBooks</a>
      </div>
    `;
  }

  updateSEO({
    title: `${book.title} by ${book.author}`,
    description: book.description,
    schemaData: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      'name': book.title,
      'author': { '@type': 'Person', 'name': book.author },
      'bookFormat': 'EBook',
      'numberOfPages': book.pages || 150,
      'inLanguage': book.language || 'English',
      'offers': {
        '@type': 'Offer',
        'price': (book.sale_price || book.price).toString(),
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      }
    }
  });

  const isInternal = book.source_type === 'internal';
  const hasPurchased = state.hasPurchased(book.id);
  const isWish = state.isInWishlist(book.id);
  const reviews = state.reviews.filter(r => r.book_id === book.id);
  const relatedBooks = state.getApprovedBooks().filter(b => b.id !== book.id && (b.category === book.category || b.source_type === book.source_type)).slice(0, 3);

  const coverUrl = book.cover_url || book.coverUrl || '';
  const coverStyle = coverUrl
    ? `background:#fff url("${coverUrl.replace(/"/g, '&quot;')}") center/cover no-repeat;`
    : `background:${book.cover_gradient || 'linear-gradient(135deg,#172554,#2563eb)'};`;

  return `
    <div class="book-detail-page animate-fade-in" style="background: var(--bg-secondary); padding: 3rem 0 5rem 0;">
      <div class="container">
        <nav style="display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:var(--text-muted);margin-bottom:2rem;">
          <a href="#/" class="hover:text-blue-600">Home</a><span>/</span>
          <a href="#/explore?category=${encodeURIComponent(book.category)}" class="hover:text-blue-600">${book.category}</a><span>/</span>
          <span style="color:var(--text-primary);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;">${book.title}</span>
        </nav>

        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2.5rem;box-shadow:var(--shadow-sm);display:grid;grid-template-columns:340px 1fr;gap:3.5rem;margin-bottom:3rem;" class="book-detail-layout">
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:100%;max-width:300px;aspect-ratio:3/4.2;border-radius:var(--radius-lg);${coverStyle}box-shadow:var(--shadow-book);position:relative;overflow:hidden;margin-bottom:1.5rem;">
              ${coverUrl ? '' : `<div class="book-cover-spine"></div><div style="padding:1.75rem 1.25rem 1.25rem 1.75rem;height:100%;display:flex;flex-direction:column;justify-content:space-between;color:#fff;"><div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.85;margin-bottom:.5rem;">${book.category}</div><h2 style="font-family:var(--font-display);font-weight:800;font-size:1.35rem;line-height:1.25;">${book.title}</h2></div><div style="border-top:1px solid rgba(255,255,255,.25);padding-top:.75rem;display:flex;justify-content:space-between;"><span style="font-size:.85rem;font-weight:600;">${book.author}</span><span style="font-size:.7rem;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:4px;">${book.format || 'PDF'}</span></div></div>`}
            </div>

            <button id="detail-preview-btn" class="btn btn-secondary" style="width:100%;max-width:300px;padding:.75rem;margin-bottom:.75rem;display:flex;align-items:center;justify-content:center;gap:.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Read Free Sample</span>
            </button>

            <button id="detail-wishlist-btn" type="button" class="btn btn-ghost btn-sm" style="display:flex;align-items:center;gap:.5rem;color:${isWish ? '#E11D48' : 'var(--text-secondary)'};" aria-pressed="${isWish ? 'true' : 'false'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>${isWish ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          <div style="display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.85rem;">
              <span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">${isInternal ? 'BOOKORA EXCLUSIVE' : 'EXTERNAL LISTING'}</span>
              <a href="#/category/${book.category.toLowerCase().replace(/[^a-z0-9]/g,'-')}" style="font-size:.85rem;font-weight:600;color:var(--accent);">${book.category}</a>
            </div>
            <h1 style="font-family:var(--font-display);font-size:clamp(1.8rem,3.5vw,2.5rem);font-weight:800;color:var(--text-primary);line-height:1.2;margin-bottom:.5rem;">${book.title}</h1>
            ${book.subtitle ? `<p style="font-size:1.1rem;color:var(--text-secondary);line-height:1.5;margin-bottom:1rem;">${book.subtitle}</p>` : ''}

            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:1.5rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border-subtle);margin-bottom:1.5rem;">
              <div style="font-size:.95rem;color:var(--text-secondary);">By <strong style="color:var(--text-primary);font-weight:700;">${book.author}</strong></div>
              <div style="display:flex;align-items:center;gap:.4rem;"><div style="display:flex;align-items:center;">${renderStars(book.rating || 5.0)}</div><span style="font-weight:700;font-size:.9rem;color:var(--text-primary);">${book.rating || 5.0}</span><span style="font-size:.85rem;color:var(--text-muted);">(${book.review_count || 0} reviews)</span></div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:1.75rem;">
              ${[['Pages',`${book.pages || 140} pages`],['Language',book.language || 'English'],['Format',book.format || 'PDF'],['Platform',book.source_domain || 'Bookora']].map(([label,value])=>`<div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:.5rem .85rem;font-size:.825rem;"><span style="color:var(--text-muted);display:block;">${label}</span><strong style="color:var(--text-primary);">${value}</strong></div>`).join('')}
            </div>

            <div style="margin-bottom:2rem;"><h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin-bottom:.6rem;">About this Publication</h3><p style="font-size:.95rem;color:var(--text-secondary);line-height:1.7;">${book.description}</p></div>

            ${book.tags && book.tags.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:2rem;">${book.tags.map(tag=>`<span style="background:var(--bg-tertiary);color:var(--text-secondary);font-size:.75rem;font-weight:600;padding:3px 8px;border-radius:99px;">#${tag}</span>`).join('')}</div>` : ''}

            <div style="background:var(--bg-secondary);border:1px solid var(--border-medium);border-radius:var(--radius-lg);padding:1.5rem;margin-top:auto;">
              ${isInternal ? `
                <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1rem;">
                  <div><div style="font-size:.8rem;color:var(--text-muted);">One-time purchase • Lifetime access</div><div style="display:flex;align-items:baseline;gap:.6rem;"><span style="font-size:2rem;font-weight:800;color:var(--text-primary);font-family:var(--font-display);">${formatPrice(book.sale_price || book.price)}</span>${book.discount > 0 ? `<span style="font-size:1.1rem;color:var(--text-muted);text-decoration:line-through;">${formatPrice(book.price)}</span><span class="badge badge-new" style="font-size:.75rem;">Save ${book.discount}%</span>` : ''}</div></div>
                  ${hasPurchased ? `<a href="#/library" class="btn btn-primary btn-lg">Read in Library</a>` : `<a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-lg" style="padding:.85rem 2.25rem;">Buy Now <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></a>`}
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:1.25rem;font-size:.75rem;color:var(--text-muted);border-top:1px solid var(--border-subtle);padding-top:.75rem;"><span>✓ Instant PDF & EPUB Download</span><span>✓ 30-Day Money-Back Guarantee</span><span>✓ Secure Cashfree Payment</span></div>
              ` : `
                <div style="display:flex;flex-direction:column;gap:1rem;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:.8rem;color:var(--text-muted);">Publisher Listing Price</div><div style="font-size:2rem;font-weight:800;color:var(--text-primary);font-family:var(--font-display);">${formatPrice(book.sale_price || book.price)}</div></div><a href="${book.buy_url || book.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-lg" style="padding:.85rem 2rem;">Buy on Publisher Website</a></div><div style="background:#fff;border:1px solid #DDD6FE;border-radius:var(--radius-md);padding:.75rem 1rem;font-size:.8rem;color:#5B21B6;line-height:1.4;"><strong>External Platform Disclaimer:</strong> This book is sold by the original publisher/seller on <strong>${book.source_domain || 'their official website'}</strong>. Checkout and payment take place on their website. Bookora does not process external payments.</div></div>
              `}
            </div>
          </div>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2rem;margin-bottom:3rem;display:flex;align-items:center;gap:1.5rem;">
          <div style="width:64px;height:64px;border-radius:99px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.5rem;flex-shrink:0;">${book.author.charAt(0)}</div>
          <div><div style="font-size:.75rem;font-weight:700;color:var(--accent);text-transform:uppercase;">About the Author</div><h3 style="font-size:1.2rem;font-weight:800;color:var(--text-primary);margin-bottom:.25rem;">${book.author}</h3><p style="font-size:.9rem;color:var(--text-secondary);line-height:1.5;">${book.author_bio || 'Verified Bookora Creator producing structured technical and practical guides for international audiences.'}</p></div>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2.5rem;margin-bottom:3rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;"><div><h3 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--text-primary);">Customer Reviews</h3><p style="font-size:.875rem;color:var(--text-secondary);margin-top:2px;">Verified thoughts from readers who purchased this title.</p></div>${hasPurchased ? `<button id="open-review-form-btn" class="btn btn-secondary btn-sm">Write a Review</button>` : ''}</div>
          <div id="review-form-container" style="display:none;background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:2rem;"><h4 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Share Your Feedback</h4><form id="submit-review-form"><div style="margin-bottom:1rem;"><label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:.35rem;">Your Rating</label><select id="review-rating-input" style="padding:.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-medium);background:#fff;"><option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option><option value="4">⭐⭐⭐⭐ (4 - Very Good)</option><option value="3">⭐⭐⭐ (3 - Average)</option><option value="2">⭐⭐ (2 - Below Expectations)</option><option value="1">⭐ (1 - Poor)</option></select></div><div style="margin-bottom:1rem;"><label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:.35rem;">Review Headline</label><input type="text" id="review-title-input" required style="width:100%;padding:.55rem .75rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.9rem;" /></div><div style="margin-bottom:1.25rem;"><label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:.35rem;">Review Details</label><textarea id="review-comment-input" rows="3" required style="width:100%;padding:.55rem .75rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.9rem;"></textarea></div><div style="display:flex;gap:.75rem;"><button type="submit" class="btn btn-primary btn-sm">Submit Verified Review</button><button type="button" id="cancel-review-btn" class="btn btn-ghost btn-sm">Cancel</button></div></form></div>
          ${reviews.length > 0 ? `<div style="display:flex;flex-direction:column;gap:1.25rem;">${reviews.map(r=>`<div style="border-bottom:1px solid var(--border-subtle);padding-bottom:1.25rem;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;"><div style="display:flex;align-items:center;gap:.5rem;"><div style="display:flex;">${renderStars(r.rating)}</div><strong style="font-size:.95rem;color:var(--text-primary);">${r.title || 'Helpful Review'}</strong></div><span style="font-size:.75rem;color:var(--text-muted);">${formatDate(r.date)}</span></div><p style="font-size:.9rem;color:var(--text-secondary);line-height:1.6;margin-bottom:.5rem;">${r.comment}</p><div style="font-size:.75rem;color:var(--text-muted);display:flex;align-items:center;gap:.4rem;"><span>${r.user_name}</span>${r.verified_purchase ? `<span class="badge badge-featured" style="font-size:.65rem;padding:1px 6px;">✓ Verified Purchase</span>` : ''}</div></div>`).join('')}</div>` : `<div style="text-align:center;padding:2rem 0;color:var(--text-muted);font-size:.9rem;">No customer reviews yet for this publication.</div>`}
        </div>

        ${relatedBooks.length > 0 ? `<div><h3 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--text-primary);margin-bottom:1.5rem;">Readers Also Explored</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;">${relatedBooks.map(b=>renderBookCard(b)).join('')}</div></div>` : ''}
      </div>
    </div>
  `;
}

export function initBookDetailEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  document.getElementById('detail-preview-btn')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.dataset.busy === '1') return;
    button.dataset.busy = '1';
    button.disabled = true;
    try {
      await ReaderModal.open(book, true);
    } catch (error) {
      console.error('Free sample failed:', error);
      Toast.show('Free sample could not be opened. Please try again.', 'error');
    } finally {
      button.dataset.busy = '0';
      button.disabled = false;
    }
  });

  const wishBtn = document.getElementById('detail-wishlist-btn');
  wishBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    if (wishBtn.dataset.busy === '1') return;
    wishBtn.dataset.busy = '1';
    wishBtn.disabled = true;
    try {
      if (!state.isAuthenticated || !state.currentUser?.uid) {
        Toast.show('Please sign in to save eBooks to your Wishlist.', 'info');
        window.location.hash = `#/login?returnTo=${encodeURIComponent(window.location.hash || `#/book/${book.slug || book.id}`)}`;
        return;
      }
      const isAdded = await state.toggleWishlist(book.id);
      const icon = wishBtn.querySelector('svg');
      const label = wishBtn.querySelector('span');
      wishBtn.style.color = isAdded ? '#E11D48' : 'var(--text-secondary)';
      wishBtn.setAttribute('aria-pressed', isAdded ? 'true' : 'false');
      if (icon) icon.setAttribute('fill', isAdded ? '#E11D48' : 'none');
      if (label) label.textContent = isAdded ? 'Saved in Wishlist' : 'Add to Wishlist';
      Toast.show(isAdded ? 'Added to your Wishlist' : 'Removed from your Wishlist', isAdded ? 'success' : 'info');
    } catch (error) {
      console.error('Wishlist update failed:', error);
      Toast.show(error?.message || 'Wishlist could not be updated. Please try again.', 'error');
    } finally {
      wishBtn.dataset.busy = '0';
      wishBtn.disabled = false;
    }
  });

  const openReviewBtn = document.getElementById('open-review-form-btn');
  const reviewFormBox = document.getElementById('review-form-container');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const reviewForm = document.getElementById('submit-review-form');

  if (openReviewBtn && reviewFormBox) openReviewBtn.addEventListener('click', () => { reviewFormBox.style.display = 'block'; });
  if (cancelReviewBtn && reviewFormBox) cancelReviewBtn.addEventListener('click', () => { reviewFormBox.style.display = 'none'; });

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = document.getElementById('review-rating-input').value;
      const title = document.getElementById('review-title-input').value.trim();
      const comment = document.getElementById('review-comment-input').value.trim();
      state.addReview({ book_id: book.id, rating, title, comment });
      Toast.show('Thank you! Your verified review has been published.', 'success');
      window.dispatchEvent(new Event('hashchange'));
    });
  }
}
