import { apiFetch } from './config.js';
import { state } from './state.js';
import { Toast } from './components/Toast.js';

let wired = new WeakSet();

async function startExternalPurchase(anchor, book) {
  if (anchor.dataset.bookoraBusy === '1') return;
  if (!state.isAuthenticated || !state.currentUser) {
    Toast.show('Please sign in before buying this external eBook.', 'info');
    const returnTo = window.location.hash || `#/book/${book.slug || book.id}`;
    window.location.hash = `#/login?returnTo=${encodeURIComponent(returnTo)}`;
    return;
  }
  anchor.dataset.bookoraBusy = '1';
  const oldText = anchor.querySelector('span')?.textContent || anchor.textContent || 'Buy on Publisher Website';
  const span = anchor.querySelector('span');
  if (span) span.textContent = 'Preparing secure purchase…';
  anchor.style.pointerEvents = 'none';
  try {
    const response = await apiFetch('/api/external/purchase/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ book_id: book.id })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.redirect_url) {
      throw new Error(data.error || 'External purchase session could not be created.');
    }
    window.location.href = data.redirect_url;
  } catch (error) {
    Toast.show(error?.message || 'Could not start the external purchase.', 'error');
    if (span) span.textContent = oldText;
    anchor.style.pointerEvents = '';
    anchor.dataset.bookoraBusy = '0';
  }
}

function wire() {
  document.querySelectorAll('.bd-purchase a[target="_blank"]').forEach(anchor => {
    if (wired.has(anchor)) return;
    const main = anchor.closest('main[data-book-id]');
    const bookId = main?.dataset.bookId || '';
    const book = bookId ? state.getApprovedBooks().find(item => String(item.id) === String(bookId)) : null;
    if (!book || String(book.source_type || '').toLowerCase() !== 'external') return;
    wired.add(anchor);
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
    anchor.addEventListener('click', event => {
      event.preventDefault();
      void startExternalPurchase(anchor, book);
    });
  });
}

const observer = new MutationObserver(wire);
observer.observe(document.body, { childList: true, subtree: true });
wire();
