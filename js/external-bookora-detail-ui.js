import { state } from './state.js';

function applyExternalDetailUI() {
  const page = document.querySelector('.bd-page[data-book-id]');
  if (!page) return;
  const bookId = page.dataset.bookId;
  const book = state.getApprovedBooks().find(b => String(b.id) === String(bookId));
  if (!book?.external_imported || !book.bookora_sale_enabled || !book.bookora_fulfillment_enabled) return;

  const badge = page.querySelector('.bd-badge');
  if (badge) {
    badge.classList.add('external');
    badge.textContent = 'EXTERNAL SOURCE • SOLD ON BOOKORA';
  }

  const buy = page.querySelector('.bd-purchase .bd-btn-primary');
  if (buy) {
    const label = buy.querySelector('span');
    if (label) label.textContent = 'Buy on Bookora';
    buy.removeAttribute('target');
    buy.removeAttribute('rel');
    buy.setAttribute('href', `#/checkout/${encodeURIComponent(book.slug || book.id)}`);
  }

  const stats = page.querySelector('.bd-stat-value');
  if (stats) {
    const values = [...page.querySelectorAll('.bd-stat-value')];
    if (values[3]) values[3].textContent = 'Bookora';
  }

  const purchase = page.querySelector('.bd-purchase');
  if (purchase && !purchase.querySelector('.bookora-external-disclosure')) {
    const note = document.createElement('div');
    note.className = 'bookora-external-disclosure';
    note.innerHTML = `Originally published on <strong>${String(book.source_domain || 'the original publisher').replace(/[<>]/g, '')}</strong>. Bookora handles checkout and secure digital delivery for this authorized listing. <a href="${String(book.source_url || '#').replace(/\"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">View original page</a>`;
    purchase.appendChild(note);
  }
}

const run = () => setTimeout(applyExternalDetailUI, 0);
window.addEventListener('hashchange', run);
window.addEventListener('load', run);
run();
