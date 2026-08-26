// Bookora mobile/profile menu interaction stability fix.
// This file also installs the route no-loading-flash guard before/while the SPA boots.
(() => {
  if (window.__BOOKORA_MENU_PERMANENT_FIX__) return;
  window.__BOOKORA_MENU_PERMANENT_FIX__ = true;

  const getDrawer = () => document.getElementById('mobile-nav-drawer');
  const getBackdrop = () => document.getElementById('mobile-drawer-backdrop');
  const getToggle = () => document.getElementById('mobile-nav-toggle-btn');

  const close = () => {
    const drawer = getDrawer(); const backdrop = getBackdrop();
    drawer?.classList.remove('open'); backdrop?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true'); backdrop?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    getToggle()?.setAttribute('aria-expanded', 'false');
    getToggle()?.setAttribute('aria-label', 'Open Navigation Drawer');
  };
  const open = () => {
    const drawer = getDrawer(); const backdrop = getBackdrop();
    if (!drawer || !backdrop) return;
    drawer.classList.add('open'); backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false'); backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('bookora-menu-open');
    document.body.classList.add('bookora-menu-open');
    getToggle()?.setAttribute('aria-expanded', 'true');
    getToggle()?.setAttribute('aria-label', 'Close Navigation Drawer');
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const toggle = target.closest('#mobile-nav-toggle-btn');
    if (toggle) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (getDrawer()?.classList.contains('open')) close(); else open(); return;
    }
    if (target.closest('#mobile-drawer-close-btn') || target.closest('#mobile-drawer-backdrop')) { event.preventDefault(); close(); return; }
    if (target.closest('.mobile-drawer-link')) close();
  }, true);
  window.addEventListener('hashchange', close, { passive: true });
  window.addEventListener('pageshow', close, { passive: true });
  window.addEventListener('resize', () => { if (window.innerWidth > 930) close(); }, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.BookoraMenuSafety = Object.freeze({ open, close });

  // Permanent SPA route guard. app-safe inserts a temporary Loading shell before
  // every render; that shell causes the visible blink. Keep the current DOM during
  // route changes and make the first-boot placeholder invisible.
  const installRouteGuard = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function' || app.__noLoadingFlashGuard) return !!app;
    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      const hash = window.location.hash || '#/';
      const main = document.querySelector('#main-content');
      if (!navigation && app.lastHash === hash && main) return;
      const root = app.root;
      let descriptor, proto = root;
      while (proto && !descriptor) { descriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML'); proto = Object.getPrototypeOf(proto); }
      let guarded = false;
      if (root && descriptor?.set) {
        const setter = descriptor.set, getter = descriptor.get;
        try {
          Object.defineProperty(root, 'innerHTML', {
            configurable: true, enumerable: descriptor.enumerable,
            get: getter ? () => getter.call(root) : undefined,
            set(value) {
              const html = String(value ?? '');
              if (html.includes('Loading Bookora…') || html.includes('Loading Bookora...')) {
                if (root.querySelector('#main-content')) return;
                const placeholder = '<div aria-hidden="true" style="height:60vh;min-height:420px;visibility:hidden;pointer-events:none"></div>';
                setter.call(root, html.replace(/<div[^>]*>Loading Bookora(?:…|\.\.\.)<\/div>/, placeholder));
                return;
              }
              setter.call(root, value);
            }
          });
          guarded = true;
        } catch (_) {}
      }
      try { return await originalRoute(force, navigation); }
      finally { if (guarded) { try { delete root.innerHTML; } catch (_) {} } }
    };
    app.__noLoadingFlashGuard = true;
    return true;
  };
  const started = performance.now();
  const timer = setInterval(() => { if (installRouteGuard() || performance.now() - started > 15000) clearInterval(timer); }, 25);
  installRouteGuard();
})();

// Publish wizard category hotfix. This is intentionally isolated from the
// existing publish/upload/payment code: it only repairs the category selector.
(() => {
  if (window.__BOOKORA_PUBLISH_CATEGORY_FIX__) return;
  window.__BOOKORA_PUBLISH_CATEGORY_FIX__ = true;

  const CATEGORIES = [
    'Art & Photography',
    'Biography & Memoir',
    'Business',
    "Children's Books",
    'Comics & Graphic Novels',
    'Computers & Technology',
    'Cooking, Food & Wine',
    'Crafts & Hobbies',
    'Education',
    'Fiction',
    'Health & Fitness',
    'History',
    'Law',
    'Literature',
    'Mathematics',
    'Medical',
    'Music',
    'Parenting & Family',
    'Philosophy',
    'Psychology',
    'Religion & Spirituality',
    'Romance',
    'Science',
    'Self-Help',
    'Social Science',
    'Sports & Recreation',
    'Travel',
    'Other'
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));

  function enhanceCategorySelect() {
    const select = document.getElementById('pub-category');
    if (!select) return;

    // If Admin already supplied a full category list, do not overwrite it.
    // Only repair the broken/empty selector shown in the publish wizard.
    const meaningful = [...select.options].filter(option => {
      const value = String(option.value || '').trim();
      const text = String(option.textContent || '').trim().toLowerCase();
      return value && text !== 'select category';
    });
    if (meaningful.length <= 1 && !select.dataset.bookoraCategoryExpanded) {
      const current = select.value;
      select.innerHTML = '<option value="">Select category</option>' + CATEGORIES.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('');
      select.dataset.bookoraCategoryExpanded = '1';
      if (current && CATEGORIES.includes(current)) select.value = current;
    }

    if (select.dataset.bookoraCategoryBound === '1') return;
    select.dataset.bookoraCategoryBound = '1';

    const host = document.createElement('div');
    host.id = 'bookora-custom-category-host';
    host.style.cssText = 'display:none;margin-top:.55rem;padding:.75rem .85rem;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;';
    host.innerHTML = `<label for="bookora-custom-category" style="display:block;font-size:.78rem;font-weight:700;color:#334155;margin-bottom:.4rem;">Apni category ka naam likhiye</label><input id="bookora-custom-category" type="text" maxlength="80" placeholder="Example: Indian Cooking" style="width:100%;box-sizing:border-box;padding:.7rem .8rem;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font:inherit;"><div style="margin-top:.35rem;font-size:.72rem;color:#64748b;">Ye category aapki eBook ke liye save hogi.</div>`;
    select.insertAdjacentElement('afterend', host);

    const input = host.querySelector('#bookora-custom-category');
    const showOther = () => {
      const isOther = select.value === 'Other' || select.dataset.bookoraOther === '1';
      host.style.display = isOther ? 'block' : 'none';
      if (isOther) {
        select.dataset.bookoraOther = '1';
        input?.focus();
      } else {
        delete select.dataset.bookoraOther;
      }
    };

    select.addEventListener('change', () => {
      if (select.value === 'Other') {
        showOther();
        return;
      }
      delete select.dataset.bookoraOther;
      host.style.display = 'none';
    });

    input?.addEventListener('input', () => {
      const custom = input.value.trim();
      if (!custom) {
        select.value = 'Other';
        return;
      }
      let option = [...select.options].find(item => item.dataset.bookoraCustom === '1');
      if (!option) {
        option = document.createElement('option');
        option.dataset.bookoraCustom = '1';
        select.appendChild(option);
      }
      option.value = custom;
      option.textContent = `Other: ${custom}`;
      select.value = custom;
    });
  }

  const run = () => {
    if (!String(window.location.hash || '').startsWith('#/publish')) return;
    try { enhanceCategorySelect(); } catch (error) { console.warn('[Bookora category fix skipped]', error); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('hashchange', () => setTimeout(run, 50));
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
})();
