// Bookora — book detail media + smooth scroll hotfix.
// Loaded separately so it can repair already-rendered detail pages without
// replacing the core BookDetailPage component.
import { state } from './state.js';

(() => {
  'use strict';

  function driveId(value) {
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
    ].filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());

    const out = [];
    const add = v => { if (v && !out.includes(v)) out.push(v); };
    values.forEach(value => {
      const id = driveId(value);
      if (id) {
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`);
        add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`);
        add(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=view&confirm=t`);
      }
      if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) add(value);
    });
    return out;
  }

  function findBook() {
    const hash = (location.hash || '').split('?')[0];
    if (!hash.startsWith('#/book/')) return null;
    return state.getBookBySlug(decodeURIComponent(hash.slice(7))) || null;
  }

  function findCoverBox() {
    return document.querySelector('.book-detail-page .book-detail-cover-box')
      || document.querySelector('.book-detail-page [data-book-cover]')
      || document.querySelector('.book-detail-page .book-cover-spine')?.parentElement
      || document.querySelector('.book-detail-layout > div:first-child > div:first-child');
  }

  function installCover() {
    const book = findBook();
    const box = findCoverBox();
    if (!book || !box) return;
    const sources = coverSources(book);
    if (!sources.length) return;

    box.classList.add('bookora-cover-ready-box');
    let img = box.querySelector('.bookora-real-cover');
    if (!img) {
      img = document.createElement('img');
      img.className = 'bookora-real-cover';
      img.alt = `Cover of ${book.title || 'eBook'}`;
      img.decoding = 'async';
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.referrerPolicy = 'no-referrer';
      box.prepend(img);
    }

    let attempt = 0;
    const next = () => {
      if (attempt >= sources.length) return;
      img.classList.remove('loaded');
      img.src = sources[attempt++];
    };
    img.onload = () => {
      img.classList.add('loaded');
      box.classList.add('bookora-has-real-cover');
    };
    img.onerror = next;
    next();
  }

  function installSmoothScroll() {
    document.documentElement.style.scrollBehavior = 'smooth';
    if (window.__BOOKORA_DETAIL_SCROLL_FIX__) return;
    window.__BOOKORA_DETAIL_SCROLL_FIX__ = true;

    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
      if (!link || event.defaultPrevented) return;
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#/')) return;
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      event.preventDefault();
      const header = document.querySelector('#header-container');
      const offset = (header?.getBoundingClientRect().height || 0) + 16;
      window.scrollTo({
        top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset),
        behavior: 'smooth'
      });
    }, true);
  }

  function enhance() {
    if (!location.hash.startsWith('#/book/')) return;
    installSmoothScroll();
    installCover();
  }

  window.addEventListener('load', () => setTimeout(enhance, 50));
  window.addEventListener('hashchange', () => setTimeout(enhance, 50));
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') setTimeout(enhance, 50);
  });
  new MutationObserver(() => {
    if (location.hash.startsWith('#/book/')) enhance();
  }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(enhance, 50);
})();
