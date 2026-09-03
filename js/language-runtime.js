// Bookora global language runtime.
// Keeps the selected UI language per signed-in Firebase user and restores it
// on future visits. Uses Google Website Translate so the complete rendered
// Bookora UI can follow the selected language without changing business data.
(() => {
  'use strict';
  if (window.__BOOKORA_LANGUAGE_RUNTIME__) return;
  window.__BOOKORA_LANGUAGE_RUNTIME__ = true;

  const LANGUAGES = [
    ['en','English','English'],
    ['hi','Hindi','हिन्दी'],
    ['gu','Gujarati','ગુજરાતી'],
    ['mr','Marathi','मराठी'],
    ['bn','Bengali','বাংলা'],
    ['ta','Tamil','தமிழ்'],
    ['te','Telugu','తెలుగు'],
    ['kn','Kannada','ಕನ್ನಡ'],
    ['ml','Malayalam','മലയാളം'],
    ['pa','Punjabi','ਪੰਜਾਬੀ'],
    ['ur','Urdu','اردو'],
    ['ar','Arabic','العربية'],
    ['es','Spanish','Español'],
    ['fr','French','Français'],
    ['de','German','Deutsch'],
    ['pt','Portuguese','Português'],
    ['it','Italian','Italiano'],
    ['ru','Russian','Русский'],
    ['zh-CN','Chinese (Simplified)','简体中文'],
    ['zh-TW','Chinese (Traditional)','繁體中文'],
    ['ja','Japanese','日本語'],
    ['ko','Korean','한국어'],
    ['tr','Turkish','Türkçe'],
    ['id','Indonesian','Bahasa Indonesia'],
    ['vi','Vietnamese','Tiếng Việt'],
    ['th','Thai','ไทย'],
    ['nl','Dutch','Nederlands'],
    ['pl','Polish','Polski'],
    ['uk','Ukrainian','Українська'],
    ['fa','Persian','فارسی'],
    ['sw','Swahili','Kiswahili']
  ];
  const MAP = Object.fromEntries(LANGUAGES.map(([code,name]) => [code,name]));
  const KEY = 'bookora_language_code';
  const OWNER_KEY = 'bookora_language_owner_uid';
  const COOKIE = 'googtrans';
  const DEFAULT = 'en';
  const valid = code => Boolean(MAP[String(code || '')]);

  const getLocal = () => {
    try {
      const code = localStorage.getItem(KEY);
      return valid(code) ? code : DEFAULT;
    } catch (_) { return DEFAULT; }
  };
  const getOwner = () => {
    try { return localStorage.getItem(OWNER_KEY) || ''; } catch (_) { return ''; }
  };
  const setLocal = (code, uid='') => {
    try {
      localStorage.setItem(KEY, valid(code) ? code : DEFAULT);
      if (uid) localStorage.setItem(OWNER_KEY, String(uid));
      else localStorage.removeItem(OWNER_KEY);
    } catch (_) {}
  };

  function setCookie(code) {
    const paths = ['/', '/Bookora/'];
    if (code === DEFAULT) {
      paths.forEach(path => {
        document.cookie = `${COOKIE}=; path=${path}; max-age=0; SameSite=Lax`;
      });
      return;
    }
    const value = encodeURIComponent(`/en/${code}`);
    paths.forEach(path => {
      document.cookie = `${COOKIE}=${value}; path=${path}; max-age=31536000; SameSite=Lax`;
    });
  }

  function auth() {
    try { return window.firebase?.apps?.length ? window.firebase.auth() : null; }
    catch (_) { return null; }
  }

  async function readFirebaseLanguage(uid) {
    if (!uid || !window.firebase?.firestore) return '';
    try {
      const snap = await window.firebase.firestore().collection('users').doc(String(uid)).get();
      const data = snap.exists ? (snap.data() || {}) : {};
      const code = String(data.languageCode || data.language || '').trim();
      return valid(code) ? code : '';
    } catch (_) { return ''; }
  }

  async function saveFirebase(code) {
    const user = auth()?.currentUser;
    if (!user?.uid || !window.firebase?.firestore || !valid(code)) return false;
    try {
      await window.firebase.firestore().collection('users').doc(String(user.uid)).set({
        languageCode: code,
        languageName: MAP[code] || MAP[DEFAULT],
        languageUpdatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.warn('[Bookora language] Firebase save skipped:', error?.message || error);
      return false;
    }
  }

  function ensureHost() {
    if (document.getElementById('google_translate_element')) return;
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
    document.body?.appendChild(el);
  }

  function initTranslator() {
    if (!window.google?.translate?.TranslateElement || document.querySelector('.goog-te-gadget')) return;
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: LANGUAGES.map(([code]) => code).join(','),
        autoDisplay: false,
        multilanguagePage: true
      }, 'google_translate_element');
    } catch (_) {}
  }

  window.googleTranslateElementInit = () => {
    ensureHost();
    initTranslator();
  };

  function loadTranslator() {
    if (getLocal() === DEFAULT) return;
    ensureHost();
    if (window.google?.translate?.TranslateElement) { initTranslator(); return; }
    if (document.getElementById('bookora-google-translate-script')) return;
    const script = document.createElement('script');
    script.id = 'bookora-google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  function renderOptions(select, current) {
    const signature = LANGUAGES.map(([code,name,native]) => `${code}:${name}:${native}`).join('|');
    if (select.dataset.bookoraLanguageOptions !== signature) {
      select.innerHTML = LANGUAGES.map(([code,name,native]) =>
        `<option value="${code}" ${code === current ? 'selected' : ''}>${name} — ${native}</option>`
      ).join('');
      select.dataset.bookoraLanguageOptions = signature;
    } else if (select.value !== current) {
      select.value = current;
    }
  }

  function setupLanguageSelect() {
    const select = document.getElementById('user-set-language');
    if (!select) return false;
    renderOptions(select, getLocal());
    if (select.dataset.bookoraLanguageBound === '1') return true;
    select.dataset.bookoraLanguageBound = '1';
    select.addEventListener('change', async () => {
      const code = valid(select.value) ? select.value : DEFAULT;
      const user = auth()?.currentUser;
      setLocal(code, user?.uid || '');
      setCookie(code);
      select.disabled = true;
      await saveFirebase(code);
      // Reloading once gives Google Translate a clean English source DOM and
      // prevents mixed-language text when the SPA replaces a route.
      window.location.reload();
    });
    return true;
  }

  async function hydrateForUser(user) {
    if (!user?.uid) {
      // Do not leak the previous signed-in user's language to another session.
      if (getOwner()) setLocal(DEFAULT, '');
      setCookie(DEFAULT);
      return;
    }
    const uid = String(user.uid);
    const firebaseCode = await readFirebaseLanguage(uid);
    const owner = getOwner();
    const localCode = getLocal();
    if (firebaseCode) {
      const changed = localCode !== firebaseCode || owner !== uid;
      setLocal(firebaseCode, uid);
      setCookie(firebaseCode);
      if (changed && document.visibilityState !== 'hidden') window.location.reload();
      return;
    }
    // First visit for this user: preserve only a language explicitly owned by
    // this same Firebase uid; otherwise start in English and record it.
    const code = owner === uid && valid(localCode) ? localCode : DEFAULT;
    setLocal(code, uid);
    setCookie(code);
    await saveFirebase(code);
  }

  function start() {
    if (!document.body) return;
    setupLanguageSelect();
    if (getLocal() !== DEFAULT) setTimeout(loadTranslator, 250);

    const retry = setInterval(() => {
      if (setupLanguageSelect()) clearInterval(retry);
    }, 300);
    setTimeout(() => clearInterval(retry), 15000);

    window.addEventListener('hashchange', () => {
      // Google Translate follows the new SPA DOM; re-ensure its host without
      // touching routing or application state.
      setTimeout(() => { setupLanguageSelect(); if (getLocal() !== DEFAULT) loadTranslator(); }, 50);
    });

    const a = auth();
    if (a) {
      a.onAuthStateChanged(user => { void hydrateForUser(user); });
    }

    window.BOOKORA_LANGUAGE = {
      languages: LANGUAGES.map(([code,name,native]) => ({code,name,native})),
      get: getLocal,
      set: async code => {
        const next = valid(code) ? code : DEFAULT;
        const user = auth()?.currentUser;
        setLocal(next, user?.uid || '');
        setCookie(next);
        await saveFirebase(next);
        window.location.reload();
      }
    };
  }

  const boot = () => setTimeout(start, 300);
  if (document.readyState === 'loading') window.addEventListener('load', boot, {once:true});
  else boot();
})();
