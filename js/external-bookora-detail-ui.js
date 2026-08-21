import { state } from './state.js';
import { API_BASE_URL } from './config.js';

async function firebaseToken() {
  try {
    const auth = window.firebase?.auth?.();
    const user = auth?.currentUser;
    return user ? await user.getIdToken() : '';
  } catch (_) { return ''; }
}

async function openExternalPurchase(book) {
  const sourceUrl = String(book.external_checkout_url || book.source_url || book.canonical_url || '').trim();
  if (!/^https?:\/\//i.test(sourceUrl)) return;
  const token = await firebaseToken();
  if (!token) {
    window.location.hash = '#/login';
    return;
  }
  const response = await fetch(`${API_BASE_URL}/api/external/purchase/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ book_id: book.id })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.redirect_url) {
    throw new Error(result.error || 'Could not start the external purchase session.');
  }
  window.location.href = result.redirect_url;
}

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
    buy.removeAttribute('href');
    buy.removeAttribute('data-checkout');
    buy.setAttribute('type', 'button');
    buy.onclick = async event => {
      event.preventDefault();
      const old = label?.textContent || 'Buy on Original Website';
      if (label) label.textContent = 'Preparing secure purchase…';
      buy.disabled = true;
      try {
        await openExternalPurchase(book);
      } catch (error) {
        alert(error.message || 'Could not start the purchase. Please try again.');
        if (label) label.textContent = old;
        buy.disabled = false;
      }
    };
  }

  const stats = page.querySelectorAll('.bd-stat-value');
  if (stats[3]) stats[3].textContent = book.source_domain || 'Original Website';

  const purchase = page.querySelector('.bd-purchase');
  if (purchase && sourceUrl && !purchase.querySelector('.bookora-external-disclosure')) {
    const note = document.createElement('div');
    note.className = 'bookora-external-disclosure';
    note.innerHTML = `Payment and ebook delivery are completed on the original website. <strong>Bookora records the purchase only after the external seller securely confirms payment.</strong>`;
    purchase.appendChild(note);
  }
}

const run = () => setTimeout(applyExternalDetailUI, 0);
window.addEventListener('hashchange', run);
window.addEventListener('load', run);
run();