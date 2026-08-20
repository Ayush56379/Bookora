// Bookora checkout cover + payment context hotfix.
// Uses the real catalog cover URL instead of the old gradient placeholder.
import { state } from './state.js';

function escapeAttr(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getCheckoutBook() {
  const hash = window.location.hash || '';
  const match = hash.match(/^#\/checkout\/([^?]+)/);
  if (!match) return null;
  try { return state.getBookBySlug(decodeURIComponent(match[1])); }
  catch (_) { return null; }
}

function coverUrl(book) {
  return String(book?.cover_url || book?.coverUrl || book?.cover_image_url || book?.coverImageUrl || '').trim();
}

function applyCheckoutFix() {
  const page = document.querySelector('.checkout-page');
  if (!page) return;
  const book = getCheckoutBook();
  if (!book) return;

  // Keep the exact catalog object available to the real payment runtime.
  window.__bookoraCheckoutBook = book;

  const cover = coverUrl(book);
  // Current CheckoutPage uses the 52x70 placeholder div. Support both the
  // explicit hotfix class and the existing inline-style placeholder.
  const snippet = page.querySelector('.checkout-book-cover') || page.querySelector('div[style*="width: 52px"][style*="height: 70px"]');
  if (!snippet || !cover || snippet.dataset.coverApplied === '1') return;

  snippet.classList.add('checkout-book-cover');
  snippet.innerHTML = `<img src="${escapeAttr(cover)}" alt="${escapeAttr(book.title)} cover" style="width:100%;height:100%;object-fit:cover;border-radius:6px;display:block;" loading="eager" referrerpolicy="no-referrer" />`;
  snippet.style.background = '#F8FAFC';
  snippet.dataset.coverApplied = '1';
}

function install() {
  applyCheckoutFix();
  const observer = new MutationObserver(() => applyCheckoutFix());
  observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(applyCheckoutFix, 0));
  window.addEventListener('load', () => setTimeout(applyCheckoutFix, 50));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
