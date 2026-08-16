// HomePage Component (Premium White & Blue Modern Marketplace)
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { renderCategoryCard } from '../components/CategoryCard.js';
import { updateSEO } from '../utils/seo.js';

export function renderHomePage() {
  updateSEO({
    title: 'Bookora — Discover. Read. Publish.',
    description: 'Bookora is a modern digital eBook marketplace. Discover inspiring books, read in-browser, download verified files, and publish your own works.'
  });

  const allApproved = state.getApprovedBooks();
  const trendingBooks = state.getTrendingBooks();
  const bestSellers = state.getBestSellers();
  const newReleases = state.getNewReleases();
  const externalBooks = state.getExternalBooks();
  const topCategories = (state.categories || []).filter(c => c.featured);

  // Real statistics calculated directly from live database state
  const totalApprovedBooks = allApproved.length;
  const totalCreators = (state.users || []).filter(u => u.role === 'creator' || u.seller_status === 'approved').length;
  const totalReaders = (state.users || []).filter(u => u.role === 'buyer').length;
  const totalOrders = (state.orders || []).filter(o => o.status === 'PAID' || o.status === 'Paid' || o.payment_status === 'PAID').length;

  return `
    <div class="homepage animate-fade-in" style="background: var(--bg-primary); overflow-x: hidden;">
      
      <!-- ================= 1. HERO SECTION ================= -->
      <section style="position: relative; background: radial-gradient(100% 100% at 50% 0%, #F8FAFC 0%, #FFFFFF 100%); padding-top: 5rem; padding-bottom: 5.5rem; border-bottom: 1px solid var(--border-subtle); overflow: hidden;">
        
        <div style="position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 700px; height: 400px; background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, rgba(255,255,255,0) 70%); pointer-events: none;"></div>

        <div class="container" style="position: relative; z-index: 10;">
          
          <div style="text-align: center; max-width: 840px; margin: 0 auto;">
            
            <div class="badge badge-bookora animate-slide-up" style="margin-bottom: 1.5rem; font-size: 0.825rem; padding: 0.4rem 1rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Discover. Read. Publish.
            </div>

            <h1 style="font-family: var(--font-display); font-size: clamp(2.5rem, 5.5vw, 4.2rem); font-weight: 800; letter-spacing: -0.04em; color: var(--text-primary); line-height: 1.12; margin-bottom: 1.5rem;">
              Discover Your Next <span style="color: var(--accent); background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Great eBook</span>
            </h1>

            ${totalApprovedBooks === 0 ? `
              <div style="background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem 2rem; max-width: 640px; margin: 0 auto 2.5rem auto; box-shadow: var(--shadow-xs);">
                <p style="font-size: 1.05rem; color: var(--text-primary); font-weight: 700; margin-bottom: 0.35rem;">
                  No eBooks published yet.
                </p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
                  Be the first creator to publish directly on Bookora or list an authorized external sales page.
                </p>
              </div>
            ` : `
              <p style="font-size: clamp(1.05rem, 2vw, 1.25rem); color: var(--text-secondary); line-height: 1.6; margin-bottom: 2.5rem; max-width: 680px; margin-left: auto; margin-right: auto;">
                Explore inspiring books, practical engineering guides, stories, and knowledge from creators around the world.
              </p>
            `}

            <!-- Search Bar -->
            <div style="max-width: 600px; margin: 0 auto 2.25rem auto; position: relative;" class="hero-search-box">
              <form id="hero-search-form" style="display: flex; align-items: center; background: #FFFFFF; border: 2px solid var(--border-medium); border-radius: var(--radius-full); padding: 6px 8px 6px 20px; box-shadow: var(--shadow-lg); transition: all var(--transition-fast);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.2" style="flex-shrink: 0; margin-right: 12px;">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input type="text" id="hero-search-input" placeholder="Search books, authors, topics, or categories..." style="flex: 1; border: none; outline: none; font-size: 0.95rem; color: var(--text-primary); background: transparent;" />
                <button type="submit" class="btn btn-primary btn-sm" style="border-radius: var(--radius-full); padding: 0.65rem 1.5rem; font-weight: 700;">
                  Search
                </button>
              </form>
            </div>

            <!-- CTA Buttons -->
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
              <a href="#/explore" class="btn btn-primary btn-lg">
                Explore Catalog
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>
              </a>
              <a href="#/publish" class="btn btn-secondary btn-lg">
                Publish Your eBook
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- ================= 2. LIVE STATISTICS ================= -->
      <section style="background: #FFFFFF; padding: 3rem 0; border-bottom: 1px solid var(--border-subtle);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 2rem; text-align: center;">
            
            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalApprovedBooks}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                eBooks Published
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalCreators}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                Verified Creators
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalReaders}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                Active Readers
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalOrders}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                Completed Sales
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ================= 3. CATEGORIES SECTION ================= -->
      <section style="padding: 5rem 0; background: var(--bg-secondary);">
        <div class="container">
          
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
            <div>
              <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Explore Topics</div>
              <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
                Browse by Category
              </h2>
              <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Explore comprehensive guides and literature across diverse subjects.
              </p>
            </div>
            <a href="#/categories" class="btn btn-secondary btn-sm" style="font-weight: 600;">
              View All Categories →
            </a>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
            ${topCategories.map(cat => renderCategoryCard(cat)).join('')}
          </div>

        </div>
      </section>

      <!-- ================= 4. TRENDING NOW ================= -->
      <section style="padding: 5rem 0; background: #FFFFFF; border-top: 1px solid var(--border-subtle);">
        <div class="container">
          
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
            <div>
              <div class="badge badge-featured" style="margin-bottom: 0.5rem;">Trending</div>
              <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
                Trending Publications
              </h2>
            </div>
            <a href="#/trending" class="btn btn-ghost btn-sm" style="font-weight: 600;">
              See More Trending →
            </a>
          </div>

          ${trendingBooks.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
              ${trendingBooks.map(b => renderBookCard(b)).join('')}
            </div>
          ` : `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3.5rem 2rem; text-align: center;">
              <p style="font-size: 1.05rem; color: var(--text-primary); font-weight: 700; margin-bottom: 0.35rem;">
                No books are trending yet.
              </p>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                Be the first author to publish an eBook on the marketplace!
              </p>
              <a href="#/publish" class="btn btn-primary btn-sm">Publish Your eBook</a>
            </div>
          `}

        </div>
      </section>

      <!-- ================= 5. HOW BOOKORA WORKS ================= -->
      <section style="padding: 5.5rem 0; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);">
        <div class="container">
          
          <div style="text-align: center; max-width: 640px; margin: 0 auto 3.5rem auto;">
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Platform Architecture</div>
            <h2 style="font-family: var(--font-display); font-size: 2.3rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
              How Bookora Works
            </h2>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
            
            <div class="book-card" style="padding: 2.25rem; text-align: center; background: #FFFFFF;">
              <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 1rem;">
                01
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                Discover
              </h3>
              <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                Find authentic publications from creators and verified external publishers.
              </p>
            </div>

            <div class="book-card" style="padding: 2.25rem; text-align: center; background: #FFFFFF;">
              <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 1rem;">
                02
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                Choose & Preview
              </h3>
              <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                Inspect verified metadata, ask Bookora AI questions, and read sample chapters.
              </p>
            </div>

            <div class="book-card" style="padding: 2.25rem; text-align: center; background: #FFFFFF;">
              <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 1rem;">
                03
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                Read & Enjoy
              </h3>
              <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                Buy directly on Bookora for instant in-browser reading & DRM downloads.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- ================= 6. CREATOR CTA BANNER ================= -->
      <section style="padding: 5rem 0; background: #FFFFFF; border-top: 1px solid var(--border-subtle);">
        <div class="container">
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: var(--radius-2xl); padding: 3.5rem 3rem; color: #FFFFFF; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2.5rem; box-shadow: var(--shadow-xl);">
            
            <div style="max-width: 580px;">
              <div class="badge" style="background: rgba(255,255,255,0.15); color: #93C5FD; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 1.25rem;">
                Creator Studio
              </div>
              <h2 style="font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.6rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem;">
                Have an eBook to Sell?
              </h2>
              <p style="font-size: 1.05rem; opacity: 0.85; line-height: 1.6; margin-bottom: 2rem;">
                Publish your eBook directly on Bookora or list your existing sales page to connect with readers globally.
              </p>
              <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <a href="#/publish" class="btn btn-primary btn-lg" style="background: #2563EB;">
                  Publish Your eBook
                </a>
                <a href="#/publish/external" class="btn btn-secondary btn-lg" style="background: rgba(255,255,255,0.1); color: #FFFFFF; border-color: rgba(255,255,255,0.25);">
                  Add External Sales Page
                </a>
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); border-radius: var(--radius-xl); padding: 2.25rem; min-width: 260px; text-align: center;">
              <div style="font-size: 3rem; font-weight: 800; color: #60A5FA; font-family: var(--font-display);">85%</div>
              <div style="font-size: 0.95rem; font-weight: 700; opacity: 0.95;">Author Royalty Rate</div>
              <div style="font-size: 0.775rem; opacity: 0.65; margin-top: 0.35rem;">Direct Cashfree Payouts</div>
            </div>

          </div>
        </div>
      </section>

      <!-- ================= 7. FAQ ACCORDION ================= -->
      <section style="padding: 5.5rem 0; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);">
        <div class="container" style="max-width: 840px;">
          
          <div style="text-align: center; margin-bottom: 3.5rem;">
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Help Center</div>
            <h2 style="font-family: var(--font-display); font-size: 2.3rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
              Frequently Asked Questions
            </h2>
          </div>

          <div class="faq-accordion" style="display: flex; flex-direction: column; gap: 1rem;">
            
            ${[
              {
                q: 'What is Bookora?',
                a: 'Bookora is a digital eBook marketplace supporting both native digital publications and external eBook discovery from verified publishers.'
              },
              {
                q: 'How do internal and external books work?',
                a: 'Bookora native books are purchased securely with instant in-browser reading and DRM download. External books link directly to verified publisher websites.'
              },
              {
                q: 'How can I publish an eBook?',
                a: 'Click "Publish" in the header. Fill in the book details, upload your manuscript, set your price, and submit for Admin approval.'
              },
              {
                q: 'Where does payment happen?',
                a: 'For Bookora native books, payments are processed securely via Cashfree Sandbox. For external books, transactions occur on the seller platform.'
              }
            ].map(faq => `
              <div class="faq-item" style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-xs);">
                <button class="faq-question-btn" style="width: 100%; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; text-align: left; font-weight: 700; font-size: 1rem; color: var(--text-primary); background: transparent; border: none; cursor: pointer;">
                  <span>${faq.q}</span>
                  <svg class="faq-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform var(--transition-fast);"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem 1.5rem; font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; border-top: 1px solid var(--border-subtle);">
                  ${faq.a}
                </div>
              </div>
            `).join('')}

          </div>

        </div>
      </section>

    </div>
  `;
}

export function initHomePageEvents() {
  const searchForm = document.getElementById('hero-search-form');
  const searchInput = document.getElementById('hero-search-input');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) {
        window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
      } else {
        window.location.hash = '#/explore';
      }
    });
  }

  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.faq-item');
      const answer = parent.querySelector('.faq-answer');
      const icon = btn.querySelector('.faq-icon');
      const isExpanded = answer.style.display === 'block';

      document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
      document.querySelectorAll('.faq-icon').forEach(ic => ic.style.transform = 'rotate(0deg)');

      if (!isExpanded) {
        answer.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}
