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
  if (!/^https?:\/\//i.test(sourceUrl)) throw new Error('Original sales page is unavailable.');
  const token = await firebaseToken();
  if (!token) {
    window.location.hash = '#/login?returnTo=' + encodeURIComponent(window.location.hash || '#/explore');
    return;
  }
  const response = await fetch(`${API_BASE_URL}/api/external/purchase/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ book_id: book.id })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.redirect_url) throw new Error(result.error || 'Could not start the external purchase session.');
  window.location.href = result.redirect_url;
}

function renderExternalPaymentStatus() {
  const main = document.getElementById('main-content');
  if (!main) return false;
  const hash = window.location.hash || '';
  if (!hash.startsWith('#/external-payment')) return false;
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const sessionId = params.get('session_id') || '';
  if (!sessionId) {
    main.innerHTML = `<section style="min-height:60vh;display:grid;place-items:center;padding:40px"><div style="max-width:620px;text-align:center"><h1 style="font-size:2rem;font-weight:800;color:#0F172A">Purchase session missing</h1><p style="color:#475569;line-height:1.6">Open the eBook from Bookora again to create a new secure purchase session.</p><a href="#/explore" class="btn btn-primary">Back to Explore</a></div></section>`;
    return true;
  }

  main.innerHTML = `<section style="min-height:65vh;display:grid;place-items:center;padding:40px;background:#F8FAFC"><div style="width:min(680px,100%);background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,.06)"><div id="external-payment-status-card"></div></div></section>`;
  const card = document.getElementById('external-payment-status-card');
  let stopped = false;
  let attempts = 0;

  const draw = (stateName, message, detail = '') => {
    const isSuccess = stateName === 'fulfilled';
    const isPending = stateName === 'pending';
    card.innerHTML = `
      <div style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:${isSuccess ? '#DCFCE7' : isPending ? '#FEF3C7' : '#FEE2E2'};color:${isSuccess ? '#15803D' : isPending ? '#A16207' : '#B91C1C'};font-size:26px;margin-bottom:18px">${isSuccess ? '✓' : isPending ? '…' : '!'}</div>
      <h1 style="margin:0 0 10px;font-size:1.8rem;font-weight:800;color:#0F172A">${isSuccess ? 'Payment verified' : isPending ? 'Waiting for payment confirmation' : 'Purchase status unavailable'}</h1>
      <p style="margin:0;color:#475569;line-height:1.65">${message}</p>
      ${detail ? `<p style="margin:14px 0 0;color:#64748B;font-size:.9rem;line-height:1.55">${detail}</p>` : ''}
      ${isSuccess ? `<div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><a href="#/library" class="btn btn-primary">Open My Library</a><a href="#/orders" class="btn btn-secondary">View Orders</a></div>` : ''}`;
  };

  const check = async () => {
    if (stopped) return;
    attempts += 1;
    try {
      const response = await fetch(`${API_BASE_URL}/api/external/purchase/status?session_id=${encodeURIComponent(sessionId)}`, { headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success && result.status === 'fulfilled' && result.library_id) {
        stopped = true;
        draw('fulfilled', 'The external seller has securely confirmed the successful payment. Your Bookora Library access is now active.', `Library entitlement: ${result.library_id}`);
        try { await state.syncData(); } catch (_) {}
        return;
      }
      if (response.status === 404) {
        stopped = true;
        draw('error', 'This purchase session no longer exists. Please start the purchase again from the Bookora eBook page.');
        return;
      }
      draw('pending', 'Bookora has not received a verified payment confirmation yet. Do not rely on a browser success page; access is granted only after the seller server confirms the real payment.', 'You can keep this page open. It will check again automatically.');
    } catch (_) {
      draw('pending', 'We are waiting for the external seller confirmation service. No access is granted until Bookora receives a verified confirmation.', 'Network check failed temporarily; Bookora will retry automatically.');
    }
    if (attempts < 200 && !stopped) setTimeout(check, 3000);
    else if (!stopped) draw('pending', 'Payment confirmation is taking longer than expected.', 'Please return to this page later. Your Library will unlock automatically after the seller sends a valid server-side confirmation.');
  };
  check();
  return true;
}

function applyExternalDetailUI() {
  if (renderExternalPaymentStatus()) return;
  const page = document.querySelector('.bd-page[data-book-id]');
  if (!page) return;
  const bookId = page.dataset.bookId;
  const book = state.getApprovedBooks().find(b => String(b.id) === String(bookId));
  if (!book?.external_imported) return;

  const badge = page.querySelector('.bd-badge');
  if (badge) { badge.classList.add('external'); badge.textContent = 'EXTERNAL SOURCE • BUY ON ORIGINAL WEBSITE'; }

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
      try { await openExternalPurchase(book); }
      catch (error) { alert(error.message || 'Could not start the purchase. Please try again.'); if (label) label.textContent = old; buy.disabled = false; }
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
