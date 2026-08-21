import { state } from './state.js';

function applyExternalDetailUI() {
  const page = document.querySelector('.bd-page[data-book-id]');
  if (!page) return;
  const bookId = page.dataset.bookId;
  const book = state.getApprovedBooks().find(b => String(b.id) === String(bookId));
  if (!book?.external_imported) return;

  const badge = page.querySelector('.bd-badge');
  if (badge) {
    badge.classList.add('external');
    badge.textContent = 'EXTERNAL SOURCE • BUY ON ORIGINAL WEBSITE';
  }

  const buy = page.querySelector('.bd-purchase .bd-btn-primary');
  const sourceUrl = String(book.external_checkout_url || book.source_url || book.canonical_url || '').trim();
  if (buy && /^https?:\/\//i.test(sourceUrl)) {
    const label = buy.querySelector('span');
    if (label) label.textContent = 'Buy on Original Website';
    buy.setAttribute('href', sourceUrl);
    buy.setAttribute('target', '_blank');
    buy.setAttribute('rel', 'noopener noreferrer');
    buy.removeAttribute('data-checkout');
  }

  const stats = page.querySelectorAll('.bd-stat-value');
  if (stats[3]) stats[3].textContent = book.source_domain || 'Original Website';

  const purchase = page.querySelector('.bd-purchase');
  if (purchase && sourceUrl && !purchase.querySelector('.bookora-external-disclosure')) {
    const note = document.createElement('div');
    note.className = 'bookora-external-disclosure';
    note.innerHTML = `This is an external listing. Bookora does not process payment or deliver the eBook. <strong>Purchase and download are completed on the original website.</strong>`;
    purchase.appendChild(note);
  }
}

const run = () => setTimeout(applyExternalDetailUI, 0);
window.addEventListener('hashchange', run);
window.addEventListener('load', run);
run();
