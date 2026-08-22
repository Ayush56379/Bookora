// Bookora Smart Search Runtime
// Makes every recognizable search bar use the same typo-tolerant AI-style catalog search.
import { state } from './state.js';

(() => {
  'use strict';
  const INPUT_SELECTOR = 'input[type="search"], input[name*="search" i], input[id*="search" i], input[placeholder*="search" i], textarea[placeholder*="search" i]';
  const normalize = value => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

  function distance(a, b) {
    a = normalize(a); b = normalize(b);
    if (!a || !b) return Math.max(a.length, b.length);
    if (a === b) return 0;
    const row = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0]; row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const old = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = old;
      }
    }
    return row[b.length];
  }

  function similarity(query, text) {
    const q = normalize(query); const t = normalize(text);
    if (!q || !t) return 0;
    if (t.includes(q)) return 1;
    const qt = q.split(' '); const tt = t.split(' ');
    let total = 0;
    for (const word of qt) {
      let best = 0;
      for (const candidate of tt) {
        if (candidate.startsWith(word) || word.startsWith(candidate)) best = Math.max(best, .92);
        else {
          const d = distance(word, candidate); const max = Math.max(word.length, candidate.length);
          const tolerance = word.length <= 4 ? 1 : word.length <= 7 ? 2 : 3;
          if (d <= tolerance) best = Math.max(best, 1 - d / max);
        }
      }
      total += best;
    }
    return qt.length ? total / qt.length : 0;
  }

  function bestBook(query) {
    const books = state.getApprovedBooks?.() || [];
    let best = null;
    for (const book of books) {
      const text = [book.title, book.author, book.category, book.subtitle, book.tags, book.description].flat().join(' ');
      const score = similarity(query, text);
      if (!best || score > best.score) best = { book, score };
    }
    return best;
  }

  function route(input) {
    const q = String(input?.value || '').trim();
    if (!q) { window.location.hash = '#/search'; return; }
    window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
  }

  function enhance(input) {
    if (!input || input.dataset.bookoraSmartSearch === '1') return;
    input.dataset.bookoraSmartSearch = '1';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', input.getAttribute('aria-label') || 'Search eBooks with smart search');

    const form = input.closest('form');
    if (form && form.dataset.bookoraSmartSearch !== '1') {
      form.dataset.bookoraSmartSearch = '1';
      form.addEventListener('submit', event => {
        event.preventDefault();
        event.stopPropagation();
        route(input);
      }, true);
    }

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        route(input);
      }
    }, true);

    // Small non-invasive hint for obvious misspellings; the actual results are ranked by SearchPage.
    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length < 3) { input.removeAttribute('data-smart-hint'); return; }
      const match = bestBook(q);
      if (match && match.score >= .62 && normalize(match.book.title) !== normalize(q)) {
        input.dataset.smartHint = `Smart search will also find: ${match.book.title}`;
      } else input.removeAttribute('data-smart-hint');
    });
  }

  function scan() { document.querySelectorAll(INPUT_SELECTOR).forEach(enhance); }
  scan();
  window.addEventListener('load', scan);
  window.addEventListener('hashchange', () => setTimeout(scan, 30));
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
