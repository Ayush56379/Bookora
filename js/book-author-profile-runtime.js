// Bookora — public author profile hydration.
// Loads only safe public creator fields from the backend catalog and updates
// the existing About the author card without rebuilding the book page.
import { apiUrl } from './config.js';
import { state } from './state.js';

(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const getBookId = () => String(document.querySelector('.bd-page')?.dataset.bookId || '').trim();

  function fallbackInitial(name) {
    return String(name || 'B').trim().charAt(0).toUpperCase() || 'B';
  }

  function renderAuthorProfile(book, profile) {
    const section = [...document.querySelectorAll('.bd-section')]
      .find(node => node.querySelector('.bd-section-title')?.textContent?.trim() === 'About the author');
    if (!section) return;

    const author = String(profile?.author_name || book?.author || 'Bookora Creator').trim();
    const bio = String(profile?.author_bio || book?.author_bio || 'A verified Bookora creator sharing useful digital publications with readers.').trim();
    const store = String(profile?.author_store_name || book?.author_store_name || '').trim();
    const image = String(profile?.author_image || book?.author_image || '').trim();

    const title = section.querySelector('.bd-section-title');
    const copy = section.querySelector('.bd-section-copy');
    if (copy) copy.textContent = store ? `${store} • Creator profile` : 'Learn more about the creator behind this publication.';

    const authorBox = section.querySelector('.bd-author');
    if (!authorBox) return;
    authorBox.innerHTML = '';

    const avatar = document.createElement('div');
    avatar.className = 'bd-avatar';
    avatar.setAttribute('aria-hidden', 'true');

    if (image && /^(https?:\/\/|data:image\/)/i.test(image)) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = `${author} profile photo`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;';
      img.addEventListener('error', () => {
        avatar.textContent = fallbackInitial(author);
      }, { once: true });
      avatar.appendChild(img);
    } else {
      avatar.textContent = fallbackInitial(author);
    }

    const info = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = author;
    const bioText = document.createElement('p');
    bioText.textContent = bio;
    info.appendChild(heading);
    if (store) {
      const storeLine = document.createElement('div');
      storeLine.textContent = store;
      storeLine.style.cssText = 'font-size:11px;font-weight:800;color:#2563eb;margin:0 0 5px;';
      info.appendChild(storeLine);
    }
    info.appendChild(bioText);
    authorBox.appendChild(avatar);
    authorBox.appendChild(info);

    if (title) title.textContent = 'About the author';
  }

  async function hydrate() {
    const bookId = getBookId();
    if (!bookId) return;

    const localBook = state.getApprovedBooks().find(item => String(item.id) === bookId);
    try {
      const response = await fetch(apiUrl('/api/books'), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Author profile HTTP ${response.status}`);
      const payload = await response.json();
      const books = Array.isArray(payload) ? payload : (Array.isArray(payload?.books) ? payload.books : []);
      const book = books.find(item => String(item?.id || item?.bookId || '') === bookId) || localBook;
      if (!book) return;

      renderAuthorProfile(book, {
        author_name: book.author_name,
        author_bio: book.author_bio,
        author_store_name: book.author_store_name,
        author_image: book.author_image
      });
    } catch (error) {
      // Keep the existing book author card if the public profile endpoint is unavailable.
      console.warn('Bookora author profile hydration:', error?.message || error);
    }
  }

  const schedule = () => setTimeout(hydrate, 80);
  window.addEventListener('load', schedule);
  window.addEventListener('hashchange', schedule, true);
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN' || event === 'USER_UPDATED') schedule();
  });
  schedule();
})();
