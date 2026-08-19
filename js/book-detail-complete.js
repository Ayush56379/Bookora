/* Bookora — complete Book Detail runtime fixes.
   Keeps the existing page component, but makes cover media, wishlist,
   verified reviews and responsive detail interactions reliable. */
import { state } from './state.js';
import { Toast } from './components/Toast.js';

(() => {
  'use strict';

  function coverUrl(book) {
    if (!book) return '';
    const values = [
      book.cover_file_id, book.coverFileId,
      book.cover_url, book.coverUrl,
      book.cover_image_url, book.coverImageUrl,
      book.front_cover_url, book.frontCoverUrl,
      book.front_cover, book.frontCover,
      book.cover_image, book.coverImage,
      book.cover, book.thumbnail, book.image_url, book.image,
      book.thumbnail_url
    ];
    const raw = values.find(v => typeof v === 'string' && v.trim())?.trim() || '';
    if (!raw) return '';
    if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(raw)}&sz=w1600`;
    const match = raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i) || raw.match(/\/d\/([A-Za-z0-9_-]{10,})/i);
    if (/drive\.google\.com/i.test(raw) && match?.[1]) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(match[1])}&sz=w1600`;
    return /^(https?:\/\/|data:image\/|blob:)/i.test(raw) ? raw : '';
  }

  function getBook() {
    try {
      const path = location.hash.split('?')[0] || '';
      if (!path.startsWith('#/book/')) return null;
      return state.getBookBySlug(decodeURIComponent(path.slice(7))) || null;
    } catch (_) { return null; }
  }

  function toast(message, type = 'info') {
    try { Toast.show(message, type); } catch (_) {}
  }

  function installCover(book) {
    const box = document.querySelector('.book-detail-page .book-cover-spine')?.parentElement;
    if (!box || !book) return;
    const url = coverUrl(book);
    if (!url) return;
    let img = box.querySelector('.detail-cover-image');
    if (!img) {
      img = document.createElement('img');
      img.className = 'detail-cover-image';
      img.alt = `Cover of ${book.title || 'eBook'}`;
      img.decoding = 'async';
      img.fetchPriority = 'high';
      box.prepend(img);
    }
    if (img.src !== url) img.src = url;
    img.onerror = () => { img.remove(); box.classList.remove('has-real-cover'); };
    img.onload = () => box.classList.add('has-real-cover');
  }

  async function handleWishlist(event) {
    const button = event.target instanceof Element ? event.target.closest('#detail-wishlist-btn') : null;
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const book = getBook();
    if (!book) return;
    button.disabled = true;
    try {
      const added = await state.toggleWishlist(String(book.id));
      const svg = button.querySelector('svg');
      const label = button.querySelector('span');
      if (svg) svg.setAttribute('fill', added ? '#E11D48' : 'none');
      button.style.color = added ? '#E11D48' : 'var(--text-secondary)';
      if (label) label.textContent = added ? 'Saved in Wishlist' : 'Add to Wishlist';
      toast(added ? 'Added to your Wishlist' : 'Removed from your Wishlist', added ? 'success' : 'info');
    } catch (error) {
      toast(error?.message || 'Please sign in to use Wishlist.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function handleReviewSubmit(event) {
    const form = event.target instanceof Element ? event.target.closest('#submit-review-form') : null;
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const book = getBook();
    if (!book) return;

    if (!state.isAuthenticated || !state.currentUser?.uid) {
      toast('Please sign in before submitting a review.', 'info');
      return;
    }
    if (!state.hasPurchased(book.id)) {
      toast('Only verified purchasers can review this eBook.', 'warning');
      return;
    }

    const rating = Math.max(1, Math.min(5, Number(document.getElementById('review-rating-input')?.value || 5)));
    const title = String(document.getElementById('review-title-input')?.value || '').trim();
    const comment = String(document.getElementById('review-comment-input')?.value || '').trim();
    if (!comment) {
      toast('Please write your review first.', 'warning');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = 'Publishing…'; }
    try {
      const firebase = window.firebase;
      if (!firebase?.apps?.length) throw new Error('Review service is not ready.');
      const db = firebase.firestore();
      const uid = state.currentUser.uid;
      const now = new Date().toISOString();
      const review = {
        book_id: String(book.id),
        user_id: uid,
        user_name: state.currentUser.displayName || state.currentUser.name || state.currentUser.email?.split('@')[0] || 'Reader',
        user_email: state.currentUser.email || '',
        rating, title, comment,
        verified_purchase: true,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      const ref = await db.collection('reviews').add(review);
      state.reviews = Array.isArray(state.reviews) ? [...state.reviews, { ...review, id: ref.id, date: now, created_at: now }] : [{ ...review, id: ref.id, date: now, created_at: now }];
      state.notify?.('REVIEWS_UPDATED', { bookId: String(book.id) });
      toast('Thank you! Your verified review has been published.', 'success');
      window.dispatchEvent(new Event('hashchange'));
    } catch (error) {
      console.error('Bookora review submit:', error);
      toast(error?.message || 'Unable to publish the review right now.', 'error');
      if (submit) { submit.disabled = false; submit.textContent = 'Submit Verified Review'; }
    }
  }

  function addStyles() {
    if (document.getElementById('bookora-detail-complete-styles')) return;
    const style = document.createElement('style');
    style.id = 'bookora-detail-complete-styles';
    style.textContent = `
      .book-detail-page .book-detail-cover-box{position:relative;overflow:hidden;background:#172554;}
      .book-detail-page .detail-cover-image{position:absolute!important;inset:0;width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;object-position:center!important;z-index:2;}
      .book-detail-page .book-detail-cover-box.has-real-cover>div:not(.book-cover-spine){opacity:0;pointer-events:none;}
      .book-detail-page .book-detail-cover-box.has-real-cover .book-cover-spine{z-index:4;}
      .book-detail-page .detail-cover-image{transition:transform .25s ease;}
      .book-detail-page .detail-cover-image:hover{transform:scale(1.015);}
      .book-detail-page #detail-wishlist-btn{transition:color .18s ease,background .18s ease,transform .18s ease;}
      .book-detail-page #detail-wishlist-btn:hover{background:var(--bg-secondary);transform:translateY(-1px);}
      .book-detail-page #detail-wishlist-btn:disabled{opacity:.65;cursor:wait;}
      @media(max-width:900px){.book-detail-layout{grid-template-columns:minmax(220px,300px) 1fr!important;gap:2rem!important;padding:1.5rem!important;}}
      @media(max-width:700px){
        .book-detail-layout{grid-template-columns:1fr!important;gap:1.5rem!important;padding:1rem!important;}
        .book-detail-page .book-detail-cover-box{max-width:270px!important;margin-left:auto!important;margin-right:auto!important;}
        .book-detail-page #detail-preview-btn{max-width:270px!important;margin-left:auto!important;margin-right:auto!important;}
        .book-detail-page #detail-wishlist-btn{margin-left:auto!important;margin-right:auto!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    const book = getBook();
    if (!book) return;
    addStyles();
    const coverBox = document.querySelector('.book-detail-page .book-cover-spine')?.parentElement;
    if (coverBox) coverBox.classList.add('book-detail-cover-box');
    installCover(book);
  }

  document.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('#detail-wishlist-btn')) handleWishlist(event);
  }, true);
  document.addEventListener('submit', event => {
    if (event.target instanceof Element && event.target.closest('#submit-review-form')) handleReviewSubmit(event);
  }, true);
  window.addEventListener('hashchange', () => setTimeout(enhance, 0));
  window.addEventListener('load', () => setTimeout(enhance, 0));
  new MutationObserver(() => { if (location.hash.startsWith('#/book/')) enhance(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(enhance, 0);
})();
