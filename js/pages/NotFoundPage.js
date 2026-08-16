// NotFoundPage Component
import { updateSEO } from '../utils/seo.js';

export function renderNotFoundPage() {
  updateSEO({
    title: '404 - Page Not Found',
    description: 'The requested page could not be found on Bookora.'
  });

  return `
    <div class="not-found-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 4rem 0;">
      <div class="container" style="max-width: 520px; text-align: center;">
        <div style="font-family: var(--font-display); font-size: 6rem; font-weight: 900; color: var(--accent); opacity: 0.8; line-height: 1; margin-bottom: 1rem;">
          404
        </div>
        <h2 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem;">
          Page Not Found
        </h2>
        <p style="font-size: 1rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
          The page or publication you are looking for might have been removed, renamed, or is temporarily unavailable.
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem;">
          <a href="#/" class="btn btn-primary btn-lg">Go to Homepage</a>
          <a href="#/explore" class="btn btn-secondary btn-lg">Explore eBooks</a>
        </div>
      </div>
    </div>
  `;
}
