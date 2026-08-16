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

  return `
    <div class="book-detail-page animate-fade-in" style="background: var(--bg-secondary); padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <!-- Breadcrumb -->
        <nav style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem;">
          <a href="#/" class="hover:text-blue-600">Home</a>
          <span>/</span>
          <a href="#/explore?category=${encodeURIComponent(book.category)}" class="hover:text-blue-600">${book.category}</a>
          <span>/</span>
          <span style="color: var(--text-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">${book.title}</span>
        </nav>

        <!-- Main Product Card (Split View) -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); display: grid; grid-template-columns: 340px 1fr; gap: 3.5rem; margin-bottom: 3rem;" class="book-detail-layout">
          
          <!-- LEFT: 3D Book Cover & Media -->
          <div style="display: flex; flex-direction: column; align-items: center;">
            
            <div style="width: 100%; max-width: 300px; aspect-ratio: 3/4.2; border-radius: var(--radius-lg); background: ${book.cover_gradient}; box-shadow: var(--shadow-book); position: relative; overflow: hidden; margin-bottom: 1.5rem;">
              <div class="book-cover-spine"></div>
              <div style="padding: 1.75rem 1.25rem 1.25rem 1.75rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; color: #FFFFFF;">
                <div>
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; margin-bottom: 0.5rem;">
                    ${book.category}
                  </div>
                  <h2 style="font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; line-height: 1.25; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${book.title}
                  </h2>
                  ${book.subtitle ? `<p style="font-size: 0.8rem; opacity: 0.85; margin-top: 0.4rem; line-height: 1.3;">${book.subtitle}</p>` : ''}
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; font-weight: 600;">${book.author}</span>
                  <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${book.format || 'PDF'}</span>
                </div>
              </div>
            </div>

            <!-- Preview Sample Button -->
            <button id="detail-preview-btn" class="btn btn-secondary" style="width: 100%; max-width: 300px; padding: 0.75rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Read Free Sample</span>
            </button>

            <!-- Wishlist Button -->
            <button id="detail-wishlist-btn" class="btn btn-ghost btn-sm" style="display: flex; align-items: center; gap: 0.5rem; color: ${isWish ? '#E11D48' : 'var(--text-secondary)'};">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>${isWish ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>

          </div>

          <!-- RIGHT: Book Information, Pricing & CTA -->
          <div style="display: flex; flex-direction: column;">
            
            <!-- Badge & Category -->
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem;">
              <span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">
                ${isInternal ? 'BOOKORA EXCLUSIVE' : 'EXTERNAL LISTING'}
              </span>
              <a href="#/category/${book.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
                ${book.category}
              </a>
            </div>

            <!-- Title & Subtitle -->
            <h1 style="font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-primary); line-height: 1.2; margin-bottom: 0.5rem;">
              ${book.title}
            </h1>
            ${book.subtitle ? `<p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">${book.subtitle}</p>` : ''}

            <!-- Author & Rating Strip -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
              <div style="font-size: 0.95rem; color: var(--text-secondary);">
                By <strong style="color: var(--text-primary); font-weight: 700;">${book.author}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <div style="display: flex; align-items: center;">
                  ${renderStars(book.rating || 5.0)}
                </div>
                <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${book.rating || 5.0}</span>
                <span style="font-size: 0.85rem; color: var(--text-muted);">(${book.review_count || 0} reviews)</span>
              </div>
            </div>

            <!-- Metadata Pills -->
            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.75rem;">
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Pages</span>
                <strong style="color: var(--text-primary);">${book.pages || 140} pages</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Language</span>
                <strong style="color: var(--text-primary);">${book.language || 'English'}</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Format</span>
                <strong style="color: var(--text-primary);">${book.format || 'PDF'}</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Platform</span>
                <strong style="color: var(--text-primary);">${book.source_domain || 'Bookora'}</strong>
              </div>
            </div>

            <!-- Description -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.6rem;">About this Publication</h3>
              <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
                ${book.description}
              </p>
            </div>

            <!-- Tags -->
            ${book.tags && book.tags.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 2rem;">
                ${book.tags.map(tag => `
                  <span style="background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 99px;">
                    #${tag}
                  </span>
                `).join('')}
              </div>
            ` : ''}

            <!-- CTA Purchase Box -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: auto;">
              
              ${isInternal ? `
                <!-- Bookora Internal Purchase Box -->
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                  <div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">One-time purchase • Lifetime access</div>
                    <div style="display: flex; align-items: baseline; gap: 0.6rem;">
                      <span style="font-size: 2rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">
                        ${formatPrice(book.sale_price || book.price)}
                      </span>
                      ${book.discount > 0 ? `
                        <span style="font-size: 1.1rem; color: var(--text-muted); text-decoration: line-through;">
                          ${formatPrice(book.price)}
                        </span>
                        <span class="badge badge-new" style="font-size: 0.75rem;">Save ${book.discount}%</span>
                      ` : ''}
                    </div>
                  </div>

                  ${hasPurchased ? `
                    <div style="display: flex; gap: 0.75rem;">
                      <a href="#/library" class="btn btn-primary btn-lg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Read in Library
                      </a>
                    </div>
                  ` : `
                    <a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-lg" style="padding: 0.85rem 2.25rem;">
                      Buy Now
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </a>
                  `}
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Instant PDF & EPUB Download
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    30-Day Money-Back Guarantee
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Secure Cashfree Payment
                  </span>
                </div>
              ` : `
                <!-- External Publisher Redirect Box -->
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">Publisher Listing Price</div>
                      <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">
                        ${formatPrice(book.sale_price || book.price)}
                      </div>
                    </div>
                    
                    <a href="${book.buy_url || book.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-lg" style="padding: 0.85rem 2rem;">
                      <span>Buy on Publisher Website</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  </div>

                  <div style="background: #FFFFFF; border: 1px solid #DDD6FE; border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.8rem; color: #5B21B6; line-height: 1.4;">
                    <strong>External Platform Disclaimer:</strong> This book is sold by the original publisher/seller on <strong>${book.source_domain || 'their official website'}</strong>. Checkout and payment take place on their website. Bookora does not process external payments.
                  </div>
                </div>
              `}

            </div>

          </div>

        </div>

        <!-- Author Bio Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; margin-bottom: 3rem; display: flex; align-items: center; gap: 1.5rem;">
          <div style="width: 64px; height: 64px; border-radius: 99px; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.5rem; flex-shrink: 0;">
            ${book.author.charAt(0)}
          </div>
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent); text-transform: uppercase;">About the Author</div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem;">${book.author}</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
              ${book.author_bio || 'Verified Bookora Creator producing structured technical and practical guides for international audiences.'}
            </p>
          </div>
        </div>

        <!-- Verified Reviews Section -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; margin-bottom: 3rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">
                Customer Reviews
              </h3>
              <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 2px;">
                Verified thoughts from readers who purchased this title.
              </p>
            </div>
            ${hasPurchased ? `
              <button id="open-review-form-btn" class="btn btn-secondary btn-sm">
                Write a Review
              </button>
            ` : ''}
          </div>

          <!-- Write Review Form (Conditional) -->
          <div id="review-form-container" style="display: none; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">Share Your Feedback</h4>
            <form id="submit-review-form">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Your Rating</label>
                <select id="review-rating-input" style="padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: #FFFFFF;">
                  <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                  <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                  <option value="3">⭐⭐⭐ (3 - Average)</option>
                  <option value="2">⭐⭐ (2 - Below Expectations)</option>
                  <option value="1">⭐ (1 - Poor)</option>
                </select>
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Review Headline</label>
                <input type="text" id="review-title-input" placeholder="e.g. Incredibly actionable and practical" required style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              </div>
              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Review Details</label>
                <textarea id="review-comment-input" rows="3" placeholder="What stood out to you most about this book?" required style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;"></textarea>
              </div>
              <div style="display: flex; gap: 0.75rem;">
                <button type="submit" class="btn btn-primary btn-sm">Submit Verified Review</button>
                <button type="button" id="cancel-review-btn" class="btn btn-ghost btn-sm">Cancel</button>
              </div>
            </form>
          </div>

          <!-- Reviews List -->
          ${reviews.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              ${reviews.map(r => `
                <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div style="display: flex;">${renderStars(r.rating)}</div>
                      <strong style="font-size: 0.95rem; color: var(--text-primary);">${r.title || 'Helpful Review'}</strong>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(r.date)}</span>
                  </div>
                  <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">
                    ${r.comment}
                  </p>
                  <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
                    <span>${r.user_name}</span>
                    ${r.verified_purchase ? `
                      <span class="badge badge-featured" style="font-size: 0.65rem; padding: 1px 6px;">✓ Verified Purchase</span>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="text-align: center; padding: 2rem 0; color: var(--text-muted); font-size: 0.9rem;">
              No customer reviews yet for this publication.
            </div>
          `}

        </div>

        <!-- Related Recommendations -->
        ${relatedBooks.length > 0 ? `
          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
              Readers Also Explored
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
              ${relatedBooks.map(b => renderBookCard(b)).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;
}

export function initBookDetailEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  // Sample Reader Button
  document.getElementById('detail-preview-btn')?.addEventListener('click', () => {
    ReaderModal.open(book, true);
  });

  // Wishlist Button
  const wishBtn = document.getElementById('detail-wishlist-btn');
  wishBtn?.addEventListener('click', () => {
    const isAdded = state.toggleWishlist(book.id);
    Toast.show(isAdded ? 'Added to your Wishlist' : 'Removed from Wishlist', isAdded ? 'success' : 'info');
    window.dispatchEvent(new Event('hashchange'));
  });

  // Review Form Toggle
  const openReviewBtn = document.getElementById('open-review-form-btn');
  const reviewFormBox = document.getElementById('review-form-container');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const reviewForm = document.getElementById('submit-review-form');

  if (openReviewBtn && reviewFormBox) {
    openReviewBtn.addEventListener('click', () => {
      reviewFormBox.style.display = 'block';
    });
  }

  if (cancelReviewBtn && reviewFormBox) {
    cancelReviewBtn.addEventListener('click', () => {
      reviewFormBox.style.display = 'none';
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = document.getElementById('review-rating-input').value;
      const title = document.getElementById('review-title-input').value.trim();
      const comment = document.getElementById('review-comment-input').value.trim();

      state.addReview({
        book_id: book.id,
        rating,
        title,
        comment
      });

      Toast.show('Thank you! Your verified review has been published.', 'success');
      window.dispatchEvent(new Event('hashchange'));
    });
  }
}
