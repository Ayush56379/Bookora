// Permanent header active-state synchronization.
// Exactly one buyer navigation item is active at a time, based on the current hash.
(() => {
  'use strict';

  const BUYER_ROUTES = [
    { key: 'home', test: hash => hash === '#/' || hash === '' },
    { key: 'explore', test: hash => hash.startsWith('#/explore') },
    { key: 'categories', test: hash => hash.startsWith('#/categories') },
    { key: 'best-sellers', test: hash => hash.startsWith('#/best-sellers') },
    { key: 'new-releases', test: hash => hash.startsWith('#/new-releases') },
    { key: 'pricing', test: hash => hash.startsWith('#/pricing') }
  ];

  function currentKey() {
    const hash = window.location.hash || '#/';
    return (BUYER_ROUTES.find(route => route.test(hash)) || {}).key || null;
  }

  function sync() {
    const header = document.getElementById('main-header');
    if (!header) return;

    // Do not interfere with Admin/Seller navigation; their Header component
    // already has route-aware active state.
    const desktopNav = header.querySelector('.desktop-nav');
    if (!desktopNav) return;

    const key = currentKey();
    if (!key) return;

    const links = Array.from(desktopNav.querySelectorAll('a.nav-link'));
    if (!links.length) return;

    const expected = {
      home: '#/',
      explore: '#/explore',
      categories: '#/categories',
      'best-sellers': '#/best-sellers',
      'new-releases': '#/new-releases',
      pricing: '#/pricing'
    }[key];

    let changed = false;
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const shouldBeActive = href === expected;
      const isActive = link.classList.contains('active');
      if (shouldBeActive !== isActive) {
        link.classList.toggle('active', shouldBeActive);
        changed = true;
      }
      if (shouldBeActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }

    // Safety rule: never leave multiple buyer links active.
    if (changed) {
      const active = links.filter(link => link.classList.contains('active'));
      if (active.length > 1) {
        active.slice(1).forEach(link => {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        });
        const winner = links.find(link => (link.getAttribute('href') || '') === expected);
        winner?.classList.add('active');
        winner?.setAttribute('aria-current', 'page');
      }
    }
  }

  let observer;
  function start() {
    sync();
    if (!observer) {
      observer = new MutationObserver(() => {
        // Header is frequently re-rendered by the SPA. Re-apply after render.
        sync();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener('hashchange', sync, { passive: true });
    document.addEventListener('click', event => {
      const link = event.target?.closest?.('#main-header a.nav-link');
      if (link) setTimeout(sync, 0);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
