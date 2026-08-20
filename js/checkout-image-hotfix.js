// Bookora checkout cover loader.
// Reuses the same Google Drive/catalog cover resolution strategy as Book Detail.
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
  if (!book) return [];
  const values = [
    book.cover_url, book.coverUrl, book.cover_file_id, book.coverFileId,
    book.cover_image_url, book.coverImageUrl, book.front_cover_url,
    book.frontCoverUrl, book.front_cover, book.frontCover,
    book.cover_image, book.coverImage, book.cover, book.thumbnail,
    book.image_url, book.image, book.thumbnail_url
  ].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());

  const sources = [];
  const add = value => { if (value && !sources.includes(value)) sources.push(value); };
  values.forEach(value => {
    const id = driveId(value);
    if (id) {
      add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`);
      add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`);
      add(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=view&confirm=t`);
    }
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) add(value);
  });
  return sources;
}

function applyCheckoutFix() {
  const page = document.querySelector('.checkout-page');
  if (!page) return;
  const book = getCheckoutBook();
  if (!book) return;

  window.__bookoraCheckoutBook = book;

  const snippet = page.querySelector('.checkout-book-cover')
    || page.querySelector('div[style*="width:52px"][style*="height:70px"]')
    || page.querySelector('div[style*="width: 52px"][style*="height: 70px"]');
  if (!snippet) return;

  const sources = coverSources(book);
  if (!sources.length) return;

  let image = snippet.querySelector('.checkout-real-cover');
  if (!image) {
    snippet.innerHTML = '';
    image = document.createElement('img');
    image.className = 'checkout-real-cover';
    image.alt = `${book.title || 'eBook'} cover`;
    image.loading = 'eager';
    image.fetchPriority = 'high';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:6px;display:block;';
    image.dataset.coverLoaderBound = '1';
    snippet.appendChild(image);
  } else if (image.dataset.coverLoaderBound === '1') {
    // Already installed; MutationObserver may call us again after the image is added.
    return;
  } else {
    image.dataset.coverLoaderBound = '1';
  }

  let index = Number(image.dataset.sourceIndex || 0);
  if (index >= sources.length) index = 0;

  const next = () => {
    if (index >= sources.length) {
      image.style.display = 'none';
      snippet.style.background = 'linear-gradient(145deg,#0f172a,#2563eb)';
      snippet.textContent = '';
      const fallback = document.createElement('div');
      fallback.style.cssText = 'width:100%;height:100%;padding:7px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;font-size:7px;';
      fallback.innerHTML = `<span style="font-weight:800;letter-spacing:.08em;">BOOKORA</span><strong style="font-size:8px;line-height:1.15;">${escapeAttr(book.title || 'eBook')}</strong><small>${escapeAttr(book.author || '')}</small>`;
      snippet.appendChild(fallback);
      return;
    }
    image.dataset.sourceIndex = String(index + 1);
    image.src = sources[index++];
  };

  image.onload = () => {
    image.style.display = 'block';
    snippet.dataset.coverApplied = '1';
  };
  image.onerror = next;

  // Browser may have completed the first failed request before this module ran.
  if (!image.src || (image.complete && image.naturalWidth === 0)) next();
  else if (!image.complete) image.src = sources[index++];
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
