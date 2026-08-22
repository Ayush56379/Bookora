// Bookora permanent profile-menu stability + Google avatar authority.
// Keeps an open desktop profile dropdown open while background Firebase/session
// hydration occurs, and always prefers Firebase Auth's Google photoURL.

(() => {
  'use strict';
  if (window.__BOOKORA_PROFILE_MENU_STABILITY__) return;
  window.__BOOKORA_PROFILE_MENU_STABILITY__ = true;

  let menuWasOpen = false;
  let lastHash = window.location.hash || '#/';
  let applying = false;

  const isMenuOpen = () => document.getElementById('user-menu-dropdown')?.style.display === 'block';

  const getFirebasePhoto = () => {
    try { return String(window.firebase?.auth?.()?.currentUser?.photoURL || '').trim(); }
    catch (_) { return ''; }
  };

  const getUserName = () => {
    try {
      const user = window.firebase?.auth?.()?.currentUser;
      return String(user?.displayName || '').trim();
    } catch (_) { return ''; }
  };

  function syncGooglePhotoToState() {
    const photo = getFirebasePhoto();
    if (!photo) return false;
    try {
      const user = window.__BOOKORA_STATE__?.currentUser;
      if (user) {
        user.photoURL = photo;
        user.avatar = photo;
        const name = getUserName();
        if (name) user.name = name;
        localStorage.setItem('bookora_user_profile', JSON.stringify(user));
      }
    } catch (_) {}
    return true;
  }

  function syncAvatarDom() {
    const photo = getFirebasePhoto();
    if (!photo) return;
    document.querySelectorAll('#main-header img, #user-menu-dropdown img').forEach(img => {
      if (img.getAttribute('src') !== photo) img.setAttribute('src', photo);
      img.style.display = 'block';
    });
  }

  function reopenMenuIfNeeded() {
    if (!menuWasOpen || applying) return;
    const dropdown = document.getElementById('user-menu-dropdown');
    const button = document.getElementById('user-menu-btn');
    if (!dropdown || !button) return;
    applying = true;
    dropdown.style.display = 'block';
    button.setAttribute('aria-expanded', 'true');
    syncAvatarDom();
    requestAnimationFrame(() => {
      applying = false;
      if (menuWasOpen) dropdown.style.display = 'block';
    });
  }

  // Suppress low-level background events before they reach the SPA router.
  // This is intentionally installed synchronously after app.js has loaded.
  import('./state.js').then(({ state }) => {
    if (!state || state.__profileMenuStabilityPatched) return;
    state.__profileMenuStabilityPatched = true;
    window.__BOOKORA_STATE__ = state;
    const originalNotify = state.notify.bind(state);
    state.notify = (event, payload = null) => {
      const rendered = !!document.querySelector('#main-content');
      if (rendered && ['DATA_SYNCED', 'AUTH_STATE_CHANGED', 'USER_PROFILE_PHOTO_UPDATED'].includes(event)) {
        return;
      }
      return originalNotify(event, payload);
    };
    syncGooglePhotoToState();
    syncAvatarDom();
  }).catch(() => {});

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#user-menu-btn')) {
      // Let Header's own click handler run first; capture the final state next.
      setTimeout(() => {
        menuWasOpen = isMenuOpen();
        syncGooglePhotoToState();
        syncAvatarDom();
      }, 0);
      return;
    }

    if (target.closest('#header-logout-btn')) {
      menuWasOpen = false;
      return;
    }

    if (target.closest('#user-menu-dropdown a, #user-menu-dropdown button[data-profile-mode]')) {
      menuWasOpen = false;
      return;
    }
  }, false);

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (!target.closest('#user-menu-btn') && !target.closest('#user-menu-dropdown')) menuWasOpen = false;
  }, false);

  window.addEventListener('hashchange', () => {
    lastHash = window.location.hash || '#/';
    menuWasOpen = false;
  }, { passive: true });

  const observer = new MutationObserver(() => {
    if (window.location.hash !== lastHash) {
      lastHash = window.location.hash || '#/';
      menuWasOpen = false;
      return;
    }
    syncAvatarDom();
    reopenMenuIfNeeded();
  });

  const start = () => {
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    syncGooglePhotoToState();
    syncAvatarDom();
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
