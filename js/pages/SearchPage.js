// SearchPage Component — AI-style typo-tolerant search
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

const normalize = value => String(value ?? '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function levenshtein(a, b) {
  a = normalize(a); b = normalize(b);
  if (!a) return b.length;
  if (!b) return a.length;
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 5) return Math.max(a.length, b.length);
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let left = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(prev[j] + 1, left + 1, prev[j - 1] + cost);
      prev[j - 1] = left;
      left = next;
    }
    prev[b.length] = left;
  }
  return prev[b.length];
}

function tokenSimilarity(queryToken, textToken) {
  if (!queryToken || !textToken) return 0;
  if (queryToken === textToken) return 1;
  if (textToken.startsWith(queryToken) || queryToken.startsWith(textToken)) return 0.92;
  if (queryToken.length >= 3 && textToken.includes(queryToken)) return 0.88;
  const distance = levenshtein(queryToken, textToken);
  const max = Math.max(queryToken.length, textToken.length);
  if (max <= 2) return distance === 1 ? 0.7 : 0;
  const tolerance = queryToken.length <= 4 ? 1 : queryToken.length <= 7 ? 2 : 3;
  return distance <= tolerance ? Math.max(0, 1 - distance / max) : 0;
}

function fieldScore(query, text, weight = 1) {
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;
  if (t === q) return 100 * weight;
  if (t.includes(q)) return 85 * weight;
  const qTokens = q.split(' ').filter(Boolean);
  const tTokens = t.split(' ').filter(Boolean);
  let total = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const tt of tTokens) best = Math.max(best, tokenSimilarity(qt, tt));
    total += best;
  }
  return qTokens.length ? (total / qTokens.length) * 72 * weight : 0;
}

function smartScore(book, query) {
  const title = book?.title || '';
  const author = book?.author || book?.seller_name || '';
  const category = book?.category || '';
  const description = book?.description || '';
  const tags = Array.isArray(book?.tags) ? book.tags.join(' ') : String(book?.tags || '');
  const subtitle = book?.subtitle || '';
  const combined = `${title} ${subtitle} ${author} ${category} ${tags} ${description}`;
  const exact = normalize(combined).includes(normalize(query));
  let score = 0;
  score += fieldScore(query, title, 4.5);
  score += fieldScore(query, subtitle, 2.8);
  score += fieldScore(query, author, 2.4);
  score += fieldScore(query, category, 2.2);
  score += fieldScore(query, tags, 2.6);
  score += fieldScore(query, description, 0.8);
  if (exact) score += 45;
  return score;
}

function smartSearchBooks(query) {
  const q = normalize(query);
  const books = state.getApprovedBooks();
  if (!q) return books;
  return books
    .map(book => ({ book, score: smartScore(book, q) }))
    .filter(item => item.score >= 18)
    .sort((a, b) => b.score - a.score)
    .map(item => item.book);
}

export function renderSearchPage(query) {
  const q = (query || '').trim();
  const books = smartSearchBooks(q);
  const smartMatch = q && books.length > 0;

  updateSEO({
    title: `Search: "${q}"`,
    description: `Smart search results for "${q}" on Bookora.`
  });

  return `
    <div class="search-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">${q ? 'AI Smart Search' : 'Search Results'}</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
            Results for "${q}"
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            ${q && smartMatch ? `Found ${books.length} relevant publication${books.length === 1 ? '' : 's'} — spelling mistakes are automatically tolerated.` : `Found ${books.length} matching publication${books.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1.25rem auto; border-radius: var(--radius-full); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No eBooks Found</h3>
            <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.75rem;">
              We couldn't find any books matching "<strong>${q}</strong>". Try a different keyword or browse our featured categories.
            </p>
            <div style="display: flex; justify-content: center; gap: 0.75rem;">
              <a href="#/explore" class="btn btn-primary btn-sm">Explore All eBooks</a>
              <a href="#/" class="btn btn-secondary btn-sm">Back to Home</a>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}
