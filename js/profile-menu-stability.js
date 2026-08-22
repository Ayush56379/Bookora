// Bookora permanent profile-menu stability + Google avatar authority.
// Keeps an open desktop profile dropdown stable during background hydration
// and makes Firebase Auth's Google photoURL the authoritative avatar.

(() => {
  'use strict';
  if (window.__BOOKORA_PROFILE_MENU_STABILITY__) return;
  window.__BOOKORA_PROFILE_MENU_STABILITY__ = true;

  let menuWasOpen = false;
  let lastHash = window.location.hash || '#/';
  let applying = false;

  const isMenuOpen = () => document.getElementById('user-menu-dropdown')?.style.display === 'block';

  const firebaseUser = () => {
    try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
  };

  const getFirebasePhoto = () => String(firebaseUser()?.photoURL || '').trim();

  const getUserName = () => String(firebaseUser()?.displayName || '').trim();

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

  import('./state.js').then(({ state }) => {
    if (!state) return;
    window.__BOOKORA_STATE__ = state;
    if (!state.__profileMenuStabilityPatched) {
      state.__profileMenuStabilityPatched = true;
      const originalNotify = state.notify.bind(state);
      state.notify = (event, payload = null) => {
        const rendered = !!document.querySelector('#main-content');
        if (rendered && ['DATA_SYNCED', 'AUTH_STATE_CHANGED', 'USER_PROFILE_PHOTO_UPDATED'].includes(event)) return;
        return originalNotify(event, payload);
      };
    }
    syncGooglePhotoToState();
    syncAvatarDom();
  }).catch(() => {});

  function attachFirebasePhotoListener() {
    try {
      const auth = window.firebase?.auth?.();
      if (!auth || auth.__bookoraProfilePhotoListener) return false;
      auth.__bookoraProfilePhotoListener = true;
      auth.onAuthStateChanged(() => {
        setTimeout(syncGooglePhotoToState, 0);
        setTimeout(syncAvatarDom, 0);
        setTimeout(syncAvatarDom, 300);
      });
      return true;
    } catch (_) { return false; }
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#user-menu-btn')) {
      setTimeout(() => {
        menuWasOpen = isMenuOpen();
        syncGooglePhotoToState();
        syncAvatarDom();
      }, 0);
      return;
    }

    if (target.closest('#header-logout-btn') || target.closest('#user-menu-dropdown a') || target.closest('#user-menu-dropdown button[data-profile-mode]')) {
      menuWasOpen = false;
      return;
    }

    if (!target.closest('#user-menu-dropdown')) menuWasOpen = false;
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
    attachFirebasePhotoListener();
    syncGooglePhotoToState();
    syncAvatarDom();
    setTimeout(attachFirebasePhotoListener, 300);
    setTimeout(attachFirebasePhotoListener, 1000);
  };

  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
