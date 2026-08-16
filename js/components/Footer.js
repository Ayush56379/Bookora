// Footer Component for Bookora
import { state } from '../state.js';

export function renderFooter() {
  return `
    <footer style="background: #FAFAFA; border-top: 1px solid var(--border-subtle); margin-top: auto; padding-top: 4rem; padding-bottom: 2.5rem;">
      <div class="container">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2.5rem; margin-bottom: 3.5rem;">
          
          <!-- Brand Column -->
          <div style="grid-column: span 1.5;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--accent); display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; color: var(--text-primary);">Bookora</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">
              The world's premier digital eBook marketplace. Discover hand-crafted publications, read directly in-browser, and publish your own works to a global audience.
            </p>
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 600; background: var(--accent-light); color: var(--accent); padding: 4px 10px; border-radius: 99px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Verified Cashfree Payments & DRM Protection
            </div>
          </div>

          <!-- Explore Column -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem;">Explore</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.9rem; color: var(--text-secondary);">
              <li><a href="#/" class="footer-link">Home</a></li>
              <li><a href="#/explore" class="footer-link">All eBooks Catalog</a></li>
              <li><a href="#/explore?sort=bestselling" class="footer-link">Best Sellers Ranking</a></li>
              <li><a href="#/explore?sort=newest" class="footer-link">New Releases</a></li>
              <li><a href="#/category/artificial-intelligence" class="footer-link">AI & Machine Learning</a></li>
              <li><a href="#/category/productivity" class="footer-link">Productivity & Habits</a></li>
            </ul>
          </div>

          <!-- Creators Column -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem;">Creators & Authors</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.9rem; color: var(--text-secondary);">
              <li><a href="#/publish" class="footer-link">Publish on Bookora</a></li>
              <li><a href="#/publish/external" class="footer-link">List External eBook Sales Page</a></li>
              <li><a href="#/creator/dashboard" class="footer-link">Creator Hub & Analytics</a></li>
              <li><a href="#/publish" class="footer-link">Royalties & Cashfree Payouts</a></li>
              <li><a href="#/publish" class="footer-link">Author Guidelines</a></li>
            </ul>
          </div>

          <!-- Support & Trust -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem;">Support & Trust</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.9rem; color: var(--text-secondary);">
              <li><a href="#/" class="footer-link">Help Center & FAQ</a></li>
              <li><a href="#/" class="footer-link">How External Discovery Works</a></li>
              <li><a href="#/" class="footer-link">30-Day Refund Policy</a></li>
              <li><a href="#/" class="footer-link">Terms of Service</a></li>
              <li><a href="#/" class="footer-link">Privacy & Security</a></li>
            </ul>
          </div>

        </div>

        <!-- Bottom Bar -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.75rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.825rem; color: var(--text-muted);">
          <div>
            © 2026 Bookora Inc. All rights reserved. <strong>Discover. Read. Publish.</strong>
          </div>
          <div style="display: flex; gap: 1.25rem;">
            <span>Powered by Cashfree Payments Gateway</span>
            <span>•</span>
            <span>SSL 256-bit Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
