// Bookora Footer — premium, responsive, accessible and AdSense-friendly.
// Add real social URLs later in FOOTER_SOCIAL_LINKS. Empty values are intentionally not rendered.
const FOOTER_SOCIAL_LINKS = { facebook: '', x: '', instagram: '', linkedin: '', youtube: '' };
const icon = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.1 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.7l3.3 4.5L16.8 4H19l-5 6 5.2 7H14.5l-3.6-4.9L6.7 17H4.5l5.1-6.1L5 4Zm3 1.7 7.3 9.8h1.3L9.3 5.7H8Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.9" r="1" fill="currentColor" stroke="none"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 8.2H3V21h3.2V8.2ZM4.6 3A2 2 0 1 0 4.6 7 2 2 0 0 0 4.6 3ZM21 13.7c0-3.8-2-5.8-4.8-5.8-2.2 0-3.2 1.2-3.8 2v-1.7H9.2V21h3.2v-6.3c0-1.7.3-3.3 2.4-3.3 2.1 0 2.1 1.9 2.1 3.4V21H21v-7.3Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2C2.5 10 2.5 12 2.5 12s0 2 .5 3.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2c.5-1.8.5-3.8.5-3.8s0-2-.5-3.8ZM10 15.5v-7l6 3.5-6 3.5Z"/></svg>'
};

export function renderFooter() {
  const year = new Date().getFullYear();
  const social = Object.entries(FOOTER_SOCIAL_LINKS).filter(([, href]) => href && href !== '#').map(([name, href]) => `<a class="bookora-footer__social" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Bookora on ${name}">${icon[name]}</a>`).join('');
  return `
    <footer class="bookora-footer" aria-label="Bookora footer">
      <div class="bookora-footer__container">
        <section class="bookora-footer__trust-strip" aria-label="Bookora service highlights">
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon">⌁</span><div><strong>Secure Payments</strong><small>Protected checkout</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon">↯</span><div><strong>Instant Access</strong><small>Read after verification</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon">✓</span><div><strong>Verified Content</strong><small>Quality-focused listings</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon">♧</span><div><strong>Creator Friendly</strong><small>Tools for publishers</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon">?</span><div><strong>Support</strong><small>Help when you need it</small></div></div>
        </section>

        <div class="bookora-footer__main">
          <section class="bookora-footer__brand">
            <a href="#/" class="bookora-footer__brand-link" aria-label="Bookora home"><span class="bookora-footer__logo" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></span><span>Bookora</span></a>
            <p class="bookora-footer__description">Bookora is a digital eBook marketplace for readers and creators. Discover books, review useful publication details, access verified purchases, and publish your own work through a clear creator workflow.</p>
            <div class="bookora-footer__socials" aria-label="Bookora social links">${social || '<span class="bookora-footer__social-note">Social channels will be added soon.</span>'}</div>
            <div class="bookora-footer__security-card"><span class="bookora-footer__security-icon">🔒</span><div><strong>Privacy & secure digital access</strong><p>Purchase, account and content-access information is handled through the platform’s configured services.</p><a href="#/privacy">Learn more about privacy →</a></div></div>
          </section>

          <nav class="bookora-footer__column" aria-label="Explore Bookora"><h2>Explore</h2><a href="#/">Home</a><a href="#/explore">All eBooks</a><a href="#/best-sellers">Best Sellers</a><a href="#/new-releases">New Releases</a><a href="#/categories">Categories</a><a href="#/trending">Trending</a></nav>
          <nav class="bookora-footer__column" aria-label="Creators and authors"><h2>For Creators</h2><a href="#/publish">Publish on Bookora</a><a href="#/publish/external">External eBook Listing</a><a href="#/creator/dashboard">Creator Studio</a><a href="#/seller/apply">Become a Creator</a><a href="#/seller-guidelines">Author Guidelines</a><a href="#/seller/settings">Creator Settings</a></nav>
          <nav class="bookora-footer__column" aria-label="Support and company information"><h2>Support</h2><a href="#/help">Help Center</a><a href="#/faq">FAQ</a><a href="#/how-it-works">How Bookora Works</a><a href="#/contact">Contact Support</a><a href="#/review-support">Review & Support</a><a href="#/refund-policy">Refund Policy</a><h2 class="bookora-footer__secondary-heading">Company</h2><a href="#/about">About Bookora</a><a href="#/terms">Terms of Service</a><a href="#/privacy">Privacy & Security</a></nav>
        </div>

        <section class="bookora-footer__updates" aria-label="Bookora updates"><div><span class="bookora-footer__updates-icon">✉</span><div><h2>Stay updated with Bookora</h2><p>Follow new releases, platform updates and creator announcements through Bookora.</p></div></div><a href="#/contact" class="bookora-footer__updates-cta">Contact Bookora <span>→</span></a></section>
        <div class="bookora-footer__trust-row"><div><strong>Reader-first marketplace</strong><span>Clear book information · Verified purchase flow · Creator publishing</span></div><div><strong>Need help?</strong><span><a href="#/help">Help Center</a> · <a href="#/contact">Contact Support</a></span></div></div>
        <div class="bookora-footer__bottom"><p>© ${year} Bookora. All rights reserved.</p><div class="bookora-footer__bottom-links"><a href="#/about">About</a><a href="#/review-support">Review & Support</a><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/refund-policy">Refunds</a><a href="#/contact">Contact</a></div><p class="bookora-footer__tagline">Discover. Read. Publish.</p></div>
        <div class="bookora-footer__legal-note">Bookora provides digital marketplace and publishing services. Availability, pricing, purchase verification and external listings are subject to the applicable platform or publisher terms.</div>
      </div>
    </footer>`;
}
