// CheckoutPage Component
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

function driveId(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;
  return raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1]
    || raw.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || raw.match(/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || '';
}

function coverSources(book) {
  const values = [
    book?.cover_url, book?.coverUrl, book?.cover_file_id, book?.coverFileId,
    book?.cover_image_url, book?.coverImageUrl, book?.front_cover_url,
    book?.frontCoverUrl, book?.front_cover, book?.frontCover,
    book?.cover_image, book?.coverImage, book?.cover, book?.thumbnail,
    book?.image_url, book?.image, book?.thumbnail_url
  ].filter(value => typeof value === 'string' && value.trim());

  const sources = [];
  const add = value => { if (value && !sources.includes(value)) sources.push(value); };

  values.forEach(value => {
    const id = driveId(value);
    if (id) {
      add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000`);
      add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`);
      add(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=view&confirm=t`);
    }
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) add(value);
  });

  return sources;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function getCheckoutCurrency() {
  const configured = String(
    state.settings?.currency?.default_display_currency
    || state.settings?.currency?.display_currency
    || state.settings?.currency?.currency
    || 'INR'
  ).trim().toUpperCase();
  return /^[A-Z]{3}$/.test(configured) ? configured : 'INR';
}

function getCurrencyZero(currency) {
  return formatPrice(0, currency);
}

function renderCover(book) {
  const sources = coverSources(book);
  const initial = sources[0] || '';
  const title = escapeHtml(book.title || 'eBook');
  const author = escapeHtml(book.author || 'Bookora Creator');

  return `
    <div class="checkout-book-cover"
         data-cover-sources="${escapeHtml(JSON.stringify(sources))}"
         style="width:52px;height:70px;border-radius:6px;overflow:hidden;flex-shrink:0;background:linear-gradient(145deg,#0f172a,#2563eb);box-shadow:0 2px 6px rgba(0,0,0,.15);position:relative;">
      ${initial ? `<img class="checkout-cover-img" src="${escapeHtml(initial)}" alt="Cover of ${title}" loading="eager" decoding="async" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;display:block;">` : ''}
      <div class="checkout-cover-placeholder" style="position:absolute;inset:0;padding:7px;display:${initial ? 'none' : 'flex'};flex-direction:column;justify-content:space-between;color:#fff;background:linear-gradient(145deg,#0f172a,#2563eb);">
        <span style="font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8;">BOOKORA</span>
        <strong style="font-size:8px;line-height:1.15;">${title}</strong>
        <small style="font-size:7px;opacity:.85;">${author}</small>
      </div>
    </div>`;
}

function setupCoverFallbacks() {
  document.querySelectorAll('.checkout-book-cover').forEach(container => {
    const image = container.querySelector('.checkout-cover-img');
    if (!image || image.dataset.bound === 'true') return;

    let sources = [];
    try { sources = JSON.parse(container.dataset.coverSources || '[]'); } catch (_) {}
    let index = 0;

    image.dataset.bound = 'true';
    image.addEventListener('error', () => {
      index += 1;
      if (index < sources.length) {
        image.src = sources[index];
        return;
      }
      image.style.display = 'none';
      const placeholder = container.querySelector('.checkout-cover-placeholder');
      if (placeholder) placeholder.style.display = 'flex';
    });
  });
}

function applyCheckoutCurrency(currency) {
  const base = Number(window.__bookoraCheckoutBasePrice || 0);
  const total = Number(window.__bookoraCheckoutFinalPrice ?? base);
  const discount = Math.max(0, base - total);

  const subtotal = document.getElementById('checkout-subtotal-price');
  const discountAmt = document.getElementById('discount-amount');
  const taxIncluded = document.getElementById('checkout-tax-included');
  const totalLabel = document.getElementById('checkout-total-price');

  if (subtotal) subtotal.textContent = formatPrice(base, currency);
  if (discountAmt) discountAmt.textContent = `-${formatPrice(discount, currency)}`;
  if (taxIncluded) taxIncluded.textContent = `Included (${getCurrencyZero(currency)})`;
  if (totalLabel) totalLabel.textContent = formatPrice(total, currency);
}

export function renderCheckoutPage(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) {
    return `<div class="container" style="padding: 5rem 0; text-align: center;"><h2>eBook Not Found</h2><a href="#/explore" class="btn btn-primary">Browse Catalog</a></div>`;
  }

  updateSEO({
    title: `Checkout: ${book.title}`,
    description: `Secure checkout for ${book.title} on Bookora.`
  });

  const basePrice = Number(book.sale_price || book.price || 0);
  const currency = getCheckoutCurrency();
  window.__bookoraCheckoutBasePrice = basePrice;
  window.__bookoraCheckoutFinalPrice = basePrice;

  return `
    <div class="checkout-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 980px;">
        <div style="margin-bottom: 2rem;">
          <a href="#/book/${book.slug || book.id}" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Product Page</a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.5rem;">Secure Checkout</h1>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem; align-items: start;" class="checkout-layout">
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem;">1. Customer & License Information</h3>
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Full Name</label>
              <input type="text" id="checkout-name" value="${escapeHtml(state.currentUser?.name || '')}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Email Address (eBook delivery & license)</label>
              <input type="email" id="checkout-email" value="${escapeHtml(state.currentUser?.email || '')}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">Your unique cryptographic license key and download link will be registered to this email.</div>
            </div>
            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Country / Region</label>
              <select style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem; background: #FFFFFF;">
                <option value="US">United States</option><option value="IN" selected>India</option><option value="GB">United Kingdom</option><option value="CA">Canada</option><option value="AU">Australia</option><option value="DE">Germany</option>
              </select>
            </div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">2. Payment Processor</h3>
            <div style="background: var(--bg-secondary); border: 2px solid var(--accent); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.85rem;"><div style="width: 40px; height: 40px; border-radius: 8px; background: #1E3A8A; color: #FFFFFF; font-weight: 900; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">CF</div><div><div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Cashfree Payment Gateway</div><div style="font-size: 0.75rem; color: var(--text-muted);">UPI, Cards, NetBanking & Wallets</div></div></div>
              <span class="badge badge-featured" style="font-size: 0.7rem;">Verified SSL</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm); position: sticky; top: 90px;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">Order Summary</h3>
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
              ${renderCover(book)}
              <div style="min-width:0;"><h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; margin:0;">${escapeHtml(book.title)}</h4><div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">by ${escapeHtml(book.author)}</div><div style="font-size: 0.75rem; font-weight: 600; color: var(--accent); margin-top: 4px;">${escapeHtml(book.format || 'PDF + EPUB')}</div></div>
            </div>
            <div style="margin-bottom: 1.5rem;"><div style="display: flex; gap: 0.5rem;"><input type="text" id="coupon-input" placeholder="Promo code (e.g. BOOKORA20)" style="flex: 1; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.85rem;" /><button type="button" id="apply-coupon-btn" class="btn btn-secondary btn-sm" style="font-weight: 700;">Apply</button></div><div id="coupon-message" style="font-size: 0.75rem; margin-top: 4px;"></div></div>
            <div style="display: flex; flex-direction: column; gap: 0.65rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);"><span>Subtotal</span><span id="checkout-subtotal-price">${formatPrice(basePrice, currency)}</span></div>
              <div id="discount-row" style="display: none; justify-content: space-between; color: #059669; font-weight: 600;"><span>Promo Discount (20%)</span><span id="discount-amount">-${formatPrice(0, currency)}</span></div>
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);"><span>Digital VAT / GST</span><span id="checkout-tax-included" style="color: #059669; font-weight: 600;">Included (${getCurrencyZero(currency)})</span></div>
              <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.25rem; color: var(--text-primary); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;"><span>Total Due</span><span id="checkout-total-price" style="color: var(--accent);">${formatPrice(basePrice, currency)}</span></div>
            </div>
            <button id="trigger-cashfree-btn" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 800; font-size: 1rem;">Proceed to Cashfree Pay <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></button>
            <div style="text-align: center; margin-top: 1rem; font-size: 0.72rem; color: var(--text-muted);">Instant library delivery immediately upon verified transaction.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initCheckoutEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  if (!state.settings?.currency?.default_display_currency) {
    try { await state.syncData(); } catch (error) { console.warn('Checkout settings sync:', error); }
  }

  const currency = getCheckoutCurrency();
  const basePrice = Number(book.sale_price || book.price || 0);
  let currentTotal = basePrice;

  window.__bookoraCheckoutBasePrice = basePrice;
  window.__bookoraCheckoutFinalPrice = currentTotal;
  applyCheckoutCurrency(currency);
  setupCoverFallbacks();

  const unsubscribe = state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'SETTINGS_UPDATED') applyCheckoutCurrency(getCheckoutCurrency());
  });

  const couponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-input');
  const couponMsg = document.getElementById('coupon-message');
  const discountRow = document.getElementById('discount-row');

  couponBtn?.addEventListener('click', () => {
    const code = (couponInput?.value || '').trim().toUpperCase();
    if (code === 'BOOKORA20') {
      currentTotal = Math.max(0, basePrice * 0.80);
      window.__bookoraCheckoutFinalPrice = currentTotal;
      if (discountRow) discountRow.style.display = 'flex';
      if (couponMsg) { couponMsg.style.color = '#059669'; couponMsg.textContent = '✓ 20% discount coupon applied successfully!'; }
      applyCheckoutCurrency(getCheckoutCurrency());
      Toast.show('Promo code BOOKORA20 applied: 20% OFF!', 'success');
    } else {
      currentTotal = basePrice;
      window.__bookoraCheckoutFinalPrice = currentTotal;
      if (discountRow) discountRow.style.display = 'none';
      if (couponMsg) { couponMsg.style.color = '#DC2626'; couponMsg.textContent = 'Invalid promo code.'; }
      applyCheckoutCurrency(getCheckoutCurrency());
    }
  });

  // payment-runtime.js owns the real Cashfree click handler. This listener
  // only blocks accidental duplicate propagation while a checkout is opening.
  window.__bookoraCheckoutCleanup?.();
  window.__bookoraCheckoutCleanup = unsubscribe;
}
