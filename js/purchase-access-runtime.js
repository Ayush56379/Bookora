// Bookora purchased-access runtime.
// - Exchanges the Firebase ID token for the backend session token.
// - Syncs the server-side purchased library.
// - Opens/downloads the real purchased PDF through protected backend endpoints.
// - Prevents the old demo TXT download / fake reader flow from being used.
import { state } from './state.js';
import { apiUrl } from './config.js';
import { ReaderModal } from './components/ReaderModal.js';
import { Toast } from './components/Toast.js';

const API = String(apiUrl('') || window.BOOKORA_API_URL || '').replace(/\/$/, '');
let sessionPromise = null;

async function ensureBackendSession(force = false) {
  if (!force && state.token) return state.token;
  if (!force) {
    const cached = localStorage.getItem('bookora_auth_token') || '';
    if (cached) {
      state.token = cached;
      return cached;
    }
  }
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    try {
      const firebaseUser = window.firebase?.auth?.()?.currentUser;
      if (!firebaseUser) throw new Error('Please sign in to access your purchased eBook.');
      const idToken = await firebaseUser.getIdToken(true);
      const response = await fetch(`${API}/api/auth/firebase`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, Accept: 'application/json' },
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(data.error || 'Could not create a secure Bookora session.');
      state.token = data.token;
      localStorage.setItem('bookora_auth_token', data.token);
      if (data.user) state.currentUser = { ...state.currentUser, ...data.user };
      return data.token;
    } finally {
      sessionPromise = null;
    }
  })();
  return sessionPromise;
}

async function backend(path, options = {}) {
  let token = await ensureBackendSession(false);
  const request = async sessionToken => {
    const headers = { Accept: 'application/json', ...(options.headers || {}), Authorization: `Bearer ${sessionToken}` };
    return fetch(`${API}${path}`, { ...options, headers, cache: 'no-store' });
  };
  let response = await request(token);
  if (response.status === 401) {
    token = await ensureBackendSession(true);
    response = await request(token);
  }
  return response;
}

async function syncPurchasedLibrary() {
  if (!state.isAuthenticated) return [];
  const response = await backend('/api/library');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to load your library.');
  const books = Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);
  for (const book of books) {
    const id = String(book?.id || '').trim();
    if (id) state.library.add(id);
    const existing = state.books.find(item => String(item.id) === id);
    if (!existing && id) state.books.push(book);
  }
  return books;
}

async function fetchPurchasedPdf(bookId, mode = 'open') {
  const response = await backend(`/${mode === 'download' ? 'api/download' : 'api/open'}/${encodeURIComponent(bookId)}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Purchased PDF access was denied.');
  }
  const type = String(response.headers.get('content-type') || '').toLowerCase();
  if (!type.includes('application/pdf')) throw new Error('The purchased file is not a PDF.');
  return response.blob();
}

async function openPurchasedPdf(book) {
  if (!book?.id) throw new Error('Book information is missing.');
  const tab = window.open('about:blank', '_blank');
  if (!tab) throw new Error('Please allow pop-ups for Bookora to open the purchased PDF.');
  try {
    tab.document.write('<title>Bookora — Opening PDF…</title><p style="font-family:Arial;padding:24px">Opening your licensed PDF…</p>');
    await syncPurchasedLibrary();
    if (!state.hasPurchased(book.id)) throw new Error('This eBook is not unlocked for the current account.');
    const blob = await fetchPurchasedPdf(book.id, 'open');
    const url = URL.createObjectURL(blob);
    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  } catch (error) {
    try { tab.close(); } catch (_) {}
    throw error;
  }
}

async function downloadPurchasedPdf(book) {
  if (!book?.id) throw new Error('Book information is missing.');
  await syncPurchasedLibrary();
  if (!state.hasPurchased(book.id)) throw new Error('This eBook is not unlocked for the current account.');
  const blob = await fetchPurchasedPdf(book.id, 'download');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(book.title || 'Bookora-eBook').replace(/[^a-zA-Z0-9._-]+/g, '_')}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}

const originalReaderOpen = ReaderModal.open.bind(ReaderModal);
ReaderModal.open = async function(book, isSample = false) {
  if (isSample) return originalReaderOpen(book, true);
  try {
    await openPurchasedPdf(book);
  } catch (error) {
    console.error('Purchased reader:', error);
    Toast.show(error.message || 'Unable to open the purchased PDF.', 'error');
  }
};

window.BookoraPurchaseAccess = {
  ensureBackendSession,
  syncPurchasedLibrary,
  openPurchasedPdf,
  downloadPurchasedPdf,
  fetchPurchasedPdf
};

async function verifyPaymentSuccess(action = '') {
  const hash = window.location.hash || '';
  if (!hash.startsWith('#/payment/success')) return;
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const orderId = params.get('order_id');
  if (!orderId) return;

  const setStatus = (title, text, ok) => {
    const heading = document.querySelector('.payment-success-page h1');
    const message = document.querySelector('.payment-success-page p');
    if (heading) heading.textContent = title;
    if (message && !ok) message.innerHTML = text;
  };

  try {
    await ensureBackendSession(false);
    const verifyResponse = await backend(`/api/cashfree/verify-order?order_id=${encodeURIComponent(orderId)}`);
    const verifyData = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || !verifyData.paid) {
      setStatus('Payment Verification Pending', 'Cashfree has not confirmed this payment yet. Please wait a moment and refresh this page.', false);
      document.querySelectorAll('#success-read-btn, #success-download-btn').forEach(button => {
        button.disabled = true;
        button.style.opacity = '.55';
      });
      return;
    }

    const books = await syncPurchasedLibrary();
    let order = null;
    try {
      const ordersResponse = await backend('/api/orders');
      const ordersData = await ordersResponse.json().catch(() => []);
      const orders = Array.isArray(ordersData) ? ordersData : (Array.isArray(ordersData.orders) ? ordersData.orders : []);
      order = orders.find(item => String(item.id) === String(orderId) || String(item.cashfree_order_id) === String(orderId));
    } catch (_) {}

    const bookId = order?.book_id || '';
    const book = books.find(item => String(item.id) === String(bookId))
      || state.books.find(item => String(item.id) === String(bookId));

    setStatus('Payment Successful!', book ? `Thank you for your purchase. <strong>${String(book.title || 'Your eBook')}</strong> is now unlocked in your Bookora Library.` : 'Thank you for your purchase. Your eBook is now unlocked in your Bookora Library.', true);

    const readButton = document.getElementById('success-read-btn');
    const downloadButton = document.getElementById('success-download-btn');
    if (readButton) {
      readButton.disabled = !book;
      readButton.style.opacity = book ? '1' : '.55';
      readButton.onclick = book ? () => openPurchasedPdf(book).catch(error => Toast.show(error.message, 'error')) : null;
    }
    if (downloadButton) {
      downloadButton.disabled = !book;
      downloadButton.style.opacity = book ? '1' : '.55';
      downloadButton.onclick = book ? () => downloadPurchasedPdf(book).then(() => Toast.show(`Downloaded "${book.title}" as a licensed PDF.`, 'success')).catch(error => Toast.show(error.message, 'error')) : null;
    }

    if (book && action === 'read') await openPurchasedPdf(book);
    if (book && action === 'download') {
      await downloadPurchasedPdf(book);
      Toast.show(`Downloaded "${book.title}" as a licensed PDF.`, 'success');
    }
  } catch (error) {
    console.error('Payment verification:', error);
    setStatus('Payment Verification Error', 'We could not verify the transaction right now. Your payment is not treated as successful until Cashfree confirms it.', false);
  }
}

// If the user clicks before the asynchronous verification finishes, verify first
// and then perform the exact requested action so one click is enough.
document.addEventListener('click', async event => {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;
  const read = element.closest('#success-read-btn');
  const download = element.closest('#success-download-btn');
  if (!read && !download) return;
  if (!window.location.hash.startsWith('#/payment/success')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  await verifyPaymentSuccess(read ? 'read' : 'download');
}, true);

state.subscribe(event => {
  if (event === 'USER_LOGGED_IN') setTimeout(() => syncPurchasedLibrary().catch(() => {}), 150);
});

window.addEventListener('hashchange', () => setTimeout(verifyPaymentSuccess, 50));
window.addEventListener('load', () => setTimeout(verifyPaymentSuccess, 250));
