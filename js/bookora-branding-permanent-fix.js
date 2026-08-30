/* Bookora branding + clean startup loader.
   Startup must show only the centered Bookora wordmark.
   Any orphan spinner/box injected by another bootstrap script is removed. */
(() => {
  const fixText = node => {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const value = node.nodeValue || '';
    const fixed = value.replace(/Bookora\s+Store/gi, 'Bookora').replace(/Buocora/gi, 'Bookora');
    if (fixed !== value) node.nodeValue = fixed;
  };

  const normalizeAdded = root => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { fixText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);
  };

  const isStartupOrphanBox = el => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.id === 'bookora-brevo-loader' || el.closest('#bookora-brevo-loader')) return false;

    // This guard intentionally remains active after #main-content exists.
    // Some bootstrap/runtime code injects the unwanted blue square only after
    // the SPA shell is mounted. The square is never a valid Bookora UI item.
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.width > 110 || rect.height > 110) return false;

    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor || '';
    const pos = cs.position || '';
    const z = Number.parseInt(cs.zIndex, 10);
    const blue = /rgb\(\s*37\s*,\s*99\s*,\s*235\s*\)|rgb\(\s*59\s*,\s*130\s*,\s*246\s*\)/.test(bg);
    const centered = Math.abs((rect.left + rect.width / 2) - innerWidth / 2) < 140 && Math.abs((rect.top + rect.height / 2) - innerHeight / 2) < 140;
    const empty = !(el.textContent || '').trim() && !el.querySelector('img,svg,canvas,input,button,a');
    return blue && centered && empty && (pos === 'fixed' || pos === 'absolute' || Number.isFinite(z));
  };

  const removeStartupOrphanBoxes = root => {
    if (!root) return;
    const candidates = [];
    if (root instanceof HTMLElement) candidates.push(root);
    if (root.querySelectorAll) candidates.push(...root.querySelectorAll('*'));
    candidates.slice(0, 250).forEach(el => {
      try { if (isStartupOrphanBox(el)) el.remove(); } catch (_) {}
    });
  };

  const installLoader = () => {
    if (!document.body || document.getElementById('bookora-brevo-loader')) return;

    const style = document.createElement('style');
    style.id = 'bookora-brevo-loader-style';
    style.textContent = `
      #bookora-brevo-loader {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        opacity: 1;
        visibility: visible;
        transition: opacity .18s ease, visibility .18s ease;
      }
      #bookora-brevo-loader.is-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      #bookora-brevo-loader .bookora-loader-word {
        margin: 0;
        padding: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: clamp(56px, 7vw, 88px);
        line-height: 1;
        font-weight: 600;
        letter-spacing: -0.055em;
        color: #12a879;
        animation: bookora-loader-color 2.8s ease-in-out infinite;
        user-select: none;
      }
      @keyframes bookora-loader-color {
        0%, 100% { color: #12a879; }
        25% { color: #7750e8; }
        50% { color: #2563eb; }
        75% { color: #e24b8f; }
      }
      @media (prefers-reduced-motion: reduce) {
        #bookora-brevo-loader .bookora-loader-word { animation: none; }
      }
    `;
    document.head.appendChild(style);

    const loader = document.createElement('div');
    loader.id = 'bookora-brevo-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading Bookora');
    const word = document.createElement('div');
    word.className = 'bookora-loader-word';
    word.textContent = 'Bookora';
    loader.appendChild(word);
    document.body.appendChild(loader);

    let hidden = false;
    const hide = () => {
      if (hidden) return;
      hidden = true;
      const el = document.getElementById('bookora-brevo-loader');
      if (!el) return;
      el.classList.add('is-hidden');
      setTimeout(() => el.remove(), 220);
    };
    window.__BOOKORA_HIDE_LOADER__ = hide;

    // Do not tie startup UX to window.load: module/Firebase requests can delay
    // that event indefinitely. Hide as soon as the app shell exists, with a
    // short hard safety deadline so the overlay can never become permanent.
    const appReadyObserver = new MutationObserver(() => {
      if (document.querySelector('#main-content')) {
        hide();
        appReadyObserver.disconnect();
      }
    });
    appReadyObserver.observe(document.body, { childList: true, subtree: true });
    if (document.querySelector('#main-content')) hide();
    setTimeout(hide, 3500);
    window.addEventListener('load', () => setTimeout(hide, 40), { once: true });
  };

  const redirectAuthenticatedAuthRoute = () => {
    const path = (location.hash || '#/').split('?')[0];
    if (!['#/login', '#/signup', '#/register'].includes(path)) return;
    const goHome = () => {
      try {
        const profile = JSON.parse(localStorage.getItem('bookora_user_profile') || 'null');
        if (profile?.uid || profile?.firebaseUid || profile?.bookoraUserId) {
          location.hash = '#/';
          return true;
        }
      } catch (_) {}
      try {
        const user = window.firebase?.auth?.()?.currentUser;
        if (user) { location.hash = '#/'; return true; }
      } catch (_) {}
      return false;
    };
    if (goHome()) return;
    const check = setInterval(() => { if (goHome()) clearInterval(check); }, 250);
    setTimeout(() => clearInterval(check), 5000);
  };

  const start = () => {
    installLoader();
    removeStartupOrphanBoxes(document.body);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);

    let scheduled = false;
    const pending = new Set();
    const flush = () => {
      scheduled = false;
      const items = Array.from(pending); pending.clear();
      items.slice(0, 80).forEach(item => {
        normalizeAdded(item);
        removeStartupOrphanBoxes(item);
      });
    };
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) mutation.addedNodes?.forEach(node => pending.add(node));
      if (!scheduled && pending.size) {
        scheduled = true;
        (window.requestAnimationFrame || (fn => setTimeout(fn, 0)))(flush);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__BOOKORA_BRANDING_GUARD__ = observer;

    // Keep the orphan-box guard active permanently. It is deliberately narrow:
    // only small, centered, empty blue fixed/absolute elements are removed.
    const safetySweep = setInterval(() => removeStartupOrphanBoxes(document.body), 400);
    window.__BOOKORA_LOADING_BOX_GUARD__ = safetySweep;
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  window.addEventListener('hashchange', redirectAuthenticatedAuthRoute);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', redirectAuthenticatedAuthRoute, { once: true });
  else redirectAuthenticatedAuthRoute();
})();