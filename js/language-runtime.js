// Bookora global language runtime.
// Google Website Translator handles full visible-site translation.
// Firebase/Firestore persists the signed-in user's language preference.
(() => {
  'use strict';
  if (window.__BOOKORA_LANGUAGE_RUNTIME__) return;
  window.__BOOKORA_LANGUAGE_RUNTIME__ = true;

  const LANGUAGES = [
    ['en','English'],['hi','Hindi'],['gu','Gujarati'],['mr','Marathi'],['bn','Bengali'],
    ['ta','Tamil'],['te','Telugu'],['kn','Kannada'],['ml','Malayalam'],['pa','Punjabi'],
    ['ur','Urdu'],['ar','Arabic'],['es','Spanish'],['fr','French'],['de','German'],
    ['pt','Portuguese'],['it','Italian'],['ru','Russian'],['zh-CN','Chinese (Simplified)'],
    ['zh-TW','Chinese (Traditional)'],['ja','Japanese'],['ko','Korean'],['tr','Turkish'],
    ['id','Indonesian'],['vi','Vietnamese'],['th','Thai'],['nl','Dutch'],['pl','Polish'],
    ['uk','Ukrainian'],['fa','Persian'],['sw','Swahili']
  ];
  const MAP = Object.fromEntries(LANGUAGES.map(([code,name]) => [code,name]));
  const KEY = 'bookora_language_code';
  const COOKIE = 'googtrans';
  const DEFAULT = 'en';

  function getCode() {
    try { const c = localStorage.getItem(KEY); if (MAP[c]) return c; } catch (_) {}
    return DEFAULT;
  }

  function setCookie(code) {
    const maxAge = 60 * 60 * 24 * 365;
    if (code === DEFAULT) {
      document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `${COOKIE}=; path=/Bookora/; max-age=0; SameSite=Lax`;
      return;
    }
    const value = encodeURIComponent(`/en/${code}`);
    document.cookie = `${COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `${COOKIE}=${value}; path=/Bookora/; max-age=${maxAge}; SameSite=Lax`;
  }

  function auth() { try { return window.firebase?.apps?.length ? window.firebase.auth() : null; } catch (_) { return null; } }

  async function saveFirebase(code) {
    const user = auth()?.currentUser;
    if (!user || !window.firebase?.firestore) return false;
    try {
      const db = window.firebase.firestore();
      await db.collection('users').doc(user.uid).set({
        languageCode: code,
        languageName: MAP[code] || MAP[DEFAULT],
        languageUpdatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[Bookora Language] Firestore save failed:', e?.message || e);
      return false;
    }
  }

  async function loadFirebasePreference() {
    const user = auth()?.currentUser;
    if (!user || !window.firebase?.firestore) return;
    try {
      const local = getCode();
      const snap = await window.firebase.firestore().collection('users').doc(user.uid).get();
      const remote = String(snap.data()?.languageCode || '').trim();
      // An explicit local choice wins; otherwise use the saved Firebase choice.
      const hasLocal = (() => { try { return !!localStorage.getItem(KEY); } catch (_) { return false; } })();
      const code = hasLocal ? local : (MAP[remote] ? remote : DEFAULT);
      if (code !== getCode()) {
        localStorage.setItem(KEY, code);
        setCookie(code);
        window.location.reload();
      } else if (code !== DEFAULT) setCookie(code);
    } catch (e) { console.warn('[Bookora Language] Firestore load skipped:', e?.message || e); }
  }

  function ensureTranslateHost() {
    let el = document.getElementById('google_translate_element');
    if (!el) {
      el = document.createElement('div');
      el.id = 'google_translate_element';
      el.setAttribute('aria-hidden','true');
      el.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;';
      document.body.appendChild(el);
    }
  }

  function initTranslator() {
    if (!window.google?.translate?.TranslateElement || document.querySelector('.goog-te-gadget')) return;
    try {
      new window.google.translate.TranslateElement({
        pageLanguage:'en',
        includedLanguages:LANGUAGES.map(x => x[0]).join(','),
        autoDisplay:false
      }, 'google_translate_element');
    } catch (e) { console.warn('[Bookora Language] Translator init failed:', e); }
  }

  window.googleTranslateElementInit = () => { ensureTranslateHost(); initTranslator(); };

  function loadTranslator() {
    if (window.google?.translate?.TranslateElement) return initTranslator();
    if (document.getElementById('bookora-google-translate-script')) return;
    const script = document.createElement('script');
    script.id = 'bookora-google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  function setupLanguageSelect() {
    const select = document.getElementById('user-set-language');
    if (!select) return;
    const current = getCode();
    select.innerHTML = LANGUAGES.map(([code,name]) => `<option value="${code}" ${code === current ? 'selected' : ''}>${name}</option>`).join('');
    if (select.dataset.bookoraLanguageBound === '1') return;
    select.dataset.bookoraLanguageBound = '1';
    select.addEventListener('change', async () => {
      const code = MAP[select.value] ? select.value : DEFAULT;
      try { localStorage.setItem(KEY, code); } catch (_) {}
      setCookie(code);
      select.disabled = true;
      await saveFirebase(code);
      window.location.reload();
    });
  }

  function start() {
    ensureTranslateHost();
    loadTranslator();
    setupLanguageSelect();
    const observer = new MutationObserver(() => setupLanguageSelect());
    observer.observe(document.body, {childList:true, subtree:true});
    const a = auth();
    if (a) {
      a.onAuthStateChanged(() => loadFirebasePreference());
      setTimeout(loadFirebasePreference, 800);
    }
    window.BOOKORA_LANGUAGE = {
      languages: LANGUAGES.map(([code,name]) => ({code,name})),
      get: getCode,
      set: async code => { if (!MAP[code]) return; try { localStorage.setItem(KEY,code); } catch (_) {} setCookie(code); await saveFirebase(code); window.location.reload(); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
