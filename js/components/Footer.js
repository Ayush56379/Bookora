// Bookora Footer — fully routed, responsive and accessible.
export function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="bookora-footer" aria-label="Bookora footer">
      <div class="bookora-footer__container">
        <div class="bookora-footer__grid">
          <section class="bookora-footer__brand">
            <a href="#/" class="bookora-footer__brand-link" aria-label="Bookora home">
              <span class="bookora-footer__logo" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></span>
              <span>Bookora</span>
            </a>
            <p class="bookora-footer__description">Discover digital books, read verified publications, and publish your own work through a modern eBook marketplace built for readers and creators.</p>
            <span class="bookora-footer__trust">🛡️ Secure payments & protected digital content</span>
          </section>

          <nav class="bookora-footer__column" aria-label="Explore Bookora">
            <h2>Explore</h2>
            <a href="#/">Home</a><a href="#/explore">All eBooks</a><a href="#/best-sellers">Best Sellers</a><a href="#/new-releases">New Releases</a><a href="#/categories">Categories</a><a href="#/trending">Trending</a>
          </nav>

          <nav class="bookora-footer__column" aria-label="Creators and authors">
            <h2>Creators</h2>
            <a href="#/publish">Publish on Bookora</a><a href="#/publish/external">External eBook Listing</a><a href="#/creator/dashboard">Creator Studio</a><a href="#/seller/apply">Become a Creator</a><a href="#/seller-guidelines">Author Guidelines</a><a href="#/seller/settings">Creator Settings</a>
          </nav>

          <nav class="bookora-footer__column" aria-label="Support and policies">
            <h2>Support & Trust</h2>
            <a href="#/review-support" class="bookora-footer__support-link">❤️ Review & Support</a><a href="#/help">Help Center</a><a href="#/faq">FAQ</a><a href="#/how-it-works">How Bookora Works</a><a href="#/contact">Contact Support</a><a href="#/refund-policy">Refund Policy</a><a href="#/terms">Terms of Service</a><a href="#/privacy">Privacy & Security</a>
          </nav>
        </div>
        <div class="bookora-footer__bottom">
          <p>© ${year} Bookora. All rights reserved.</p>
          <div class="bookora-footer__bottom-links"><a href="#/review-support">Review & Support</a><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/refund-policy">Refunds</a><a href="#/contact">Contact</a></div>
          <p class="bookora-footer__tagline">Discover. Read. Publish.</p>
        </div>
      </div>
    </footer>`;
}
