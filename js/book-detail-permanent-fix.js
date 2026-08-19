// Bookora — stable Book Detail runtime.
// IMPORTANT: free-sample opening is handled only by book-sample-secure-reader.js.
// This file must never open a Google Drive PDF preview or create a sample modal.
import { state } from './state.js';

(() => {
  'use strict';

  let coverEnhanceQueued = false;

  function currentBook() {
    try {
      const hash = (location.hash || '').split('?')[0];
      return hash.startsWith('#/book/')
        ? state.getBookBySlug(decodeURIComponent(hash.slice('#/book/'.length)))
        : null;
    } catch (_) {
      return null;
    }
  }

  function driveId(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return (/^[A-Za-z0-9_-]{20,}$/.test(raw) ? raw : '')
      || raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1]
      || raw.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
      || raw.match(/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
      || '';
  }

  function mediaSources(book) {
    const fields = [
      'cover_url','coverUrl','cover_file_id','coverFileId',
      'cover_image_url','coverImageUrl','front_cover_url','frontCoverUrl',
      'front_cover','frontCover','cover_image','coverImage','cover',
      'thumbnail','image_url','image','thumbnail_url'
    ];
    const out = [];
    const add = value => { if (value && !out.includes(value)) out.push(value); };

    fields.forEach(key => {
      const value = String(book?.[key] || '').trim();
      if (!value) return;
      const id = driveId(value);
      if (id) {
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600`);
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000`);
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`);
        add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`);
      }
      if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) add(value);
    });

    return out;
  }

  function coverBox() {
    return document.querySelector('.book-detail-page .book-detail-cover-box')
      || document.querySelector('.book-detail-page .bookora-cover-ready-box')
      || document.querySelector('.book-detail-page .book-cover-spine')?.parentElement
      || document.querySelector('.book-detail-layout > div:first-child > div:first-child');
  }

  function repairCover() {
    const book = currentBook();
    const box = coverBox();
    if (!book || !box) return;

    const sources = mediaSources(book);
    if (!sources.length) return;

    box.classList.add('bookora-cover-ready-box');
    let img = box.querySelector('.bookora-permanent-cover');

    if (!img) {
      img = document.createElement('img');
      img.className = 'bookora-permanent-cover';
      img.alt = `Cover of ${book.title || 'eBook'}`;
      img.decoding = 'async';
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.referrerPolicy = 'no-referrer';
      box.prepend(img);
    }

    const sourceKey = sources.join('|');
    if (img.dataset.sourceKey === sourceKey && img.src) return;
    img.dataset.sourceKey = sourceKey;

    let index = 0;
    const showNext = () => {
      if (index >= sources.length) return;
      img.classList.remove('loaded');
      img.src = sources[index++];
    };

    img.onload = () => {
      img.classList.add('loaded');
      box.classList.add('bookora-cover-loaded');
    };
    img.onerror = showNext;
    showNext();
  }

  function addStyles() {
    if (document.getElementById('bookora-permanent-detail-styles')) return;

    const style = document.createElement('style');
    style.id = 'bookora-permanent-detail-styles';
    style.textContent = `
      html.bookora-detail-active,
      html.bookora-detail-active body{scroll-behavior:auto!important}

      .bookora-detail-grid{align-items:start!important}

      .bookora-cover-ready-box{
        position:relative!important;
        overflow:hidden!important;
        background:#fff!important;
        isolation:isolate
      }

      .bookora-permanent-cover{
        position:absolute!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        object-position:center!important;
        display:block!important;
        z-index:10!important;
        opacity:0;
        transition:opacity .08s linear
      }

      .bookora-permanent-cover.loaded{opacity:1}

      .bookora-cover-loaded>div:not(.book-cover-spine){
        opacity:0!important;
        pointer-events:none!important
      }

      .bookora-cover-loaded .book-cover-spine{z-index:12!important}

      #detail-preview-btn:disabled{
        opacity:.65!important;
        cursor:wait!important
      }

      .bd-stat-icon{
        width:28px!important;height:28px!important;min-width:28px!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        border-radius:8px!important;background:#eff6ff!important;color:#2563eb!important;
        font:800 10px/1 Inter,sans-serif!important;box-shadow:none!important;overflow:hidden!important
      }

      .bd-stat-icon svg{
        width:16px!important;height:16px!important;display:block!important;fill:none!important;
        stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important
      }

      .bd-stat{
        display:grid!important;grid-template-columns:28px 1fr!important;
        column-gap:8px!important;align-items:center!important
      }

      .bd-stat-label,.bd-stat-value{grid-column:2!important}

      @media(max-width:700px){
        .book-detail-page .book-detail-layout{
          grid-template-columns:1fr!important;gap:1.5rem!important;padding:1rem!important
        }
        .book-detail-page .book-detail-layout>div:first-child>div:first-child{
          max-width:270px!important;margin-inline:auto!important
        }
      }
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    if (!location.hash.startsWith('#/book/')) return;

    addStyles();
    document.documentElement.classList.add('bookora-detail-active');

    const page = document.querySelector('.book-detail-page');
    page?.querySelector('.book-detail-layout')?.classList.add('bookora-detail-grid');

    if (!coverEnhanceQueued) {
      coverEnhanceQueued = true;
      requestAnimationFrame(() => {
        coverEnhanceQueued = false;
        repairCover();
      });
    }
  }

  window.addEventListener('hashchange', () => setTimeout(enhance, 30));
  window.addEventListener('load', () => setTimeout(enhance, 30));

  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN' || event === 'REVIEWS_UPDATED') {
      setTimeout(enhance, 30);
    }
  });

  new MutationObserver(() => {
    if (location.hash.startsWith('#/book/')) enhance();
  }).observe(document.documentElement, { childList:true, subtree:true });

  setTimeout(enhance, 30);
})();
