// Bookora universal i18n runtime.
// Translates static UI + dynamically rendered catalog content (book titles,
// descriptions, author names, categories, reviews, buttons, placeholders, etc.).
// Original text is retained on every node so switching languages never creates
// translation-on-translation corruption.
import { state } from './state.js';

const STORAGE_KEY = 'bookora_language';
const CACHE_KEY = 'bookora_translation_cache_v2';
const DEFAULT_LANGUAGE = 'en';
const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

export const BOOKORA_LANGUAGES = {
  en:{name:'English',native:'English'},hi:{name:'Hindi',native:'हिन्दी'},gu:{name:'Gujarati',native:'ગુજરાતી'},mr:{name:'Marathi',native:'मराठी'},bn:{name:'Bengali',native:'বাংলা'},ta:{name:'Tamil',native:'தமிழ்'},te:{name:'Telugu',native:'తెలుగు'},kn:{name:'Kannada',native:'ಕನ್ನಡ'},ml:{name:'Malayalam',native:'മലയാളം'},pa:{name:'Punjabi',native:'ਪੰਜਾਬੀ'},ur:{name:'Urdu',native:'اردو'},es:{name:'Spanish',native:'Español'},fr:{name:'French',native:'Français'},de:{name:'German',native:'Deutsch'},pt:{name:'Portuguese',native:'Português'},ar:{name:'Arabic',native:'العربية'},ja:{name:'Japanese',native:'日本語'},ko:{name:'Korean',native:'한국어'},zh:{name:'Chinese',native:'中文'},ru:{name:'Russian',native:'Русский'}
};

let currentLanguage = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
let translating = false;
let observer = null;
let queuedNodes = new Set();
let flushTimer = null;
let cache = {};

try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_) { cache = {}; }

function normalizeLanguage(value) {
  const v = String(value || '').toLowerCase().split('-')[0];
  return BOOKORA_LANGUAGES[v] ? v : DEFAULT_LANGUAGE;
}

function isExcludedElement(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
  if (el.closest('[data-no-translate],script,style,noscript,svg,code,pre,textarea')) return true;
  if (el.matches('input[type="email"],input[type="url"],input[type="password"],input[type="number"],input[type="tel"],input[type="date"],input[type="time"],input[type="file"],input[type="hidden"]')) return true;
  if (el.matches('.bookora-brand,.site-brand,[data-site-name],[data-no-translate]')) return true;
  return false;
}

function looksLikeNonNaturalText(text) {
  const s = String(text || '').trim();
  if (!s || s.length < 2) return true;
  if (/^https?:\/\//i.test(s) || /^mailto:/i.test(s)) return true;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(s)) return true;
  if (/^[₹$€£¥₩₹]?\s*[\d,.]+(?:\s*[A-Z]{3})?$/.test(s)) return true;
  if (/^[#@][\w-]+$/.test(s)) return true;
  if (/^[A-Z0-9_-]{8,}$/.test(s) && !/\s/.test(s)) return true;
  return false;
}

function originalText(node) {
  if (!node.dataset.bookoraI18nOriginal) {
    node.dataset.bookoraI18nOriginal = node.textContent || '';
  }
  return node.dataset.bookoraI18nOriginal;
}

function cacheGet(key) { return cache[`${currentLanguage}|${key}`] || ''; }
function cacheSet(key, value) {
  cache[`${currentLanguage}|${key}`] = value;
  try {
    const keys = Object.keys(cache);
    if (keys.length > 1500) delete cache[keys[0]];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (_) {}
}

async function translateText(text, target) {
  if (target === 'en') return text;
  const cached = cacheGet(text);
  if (cached) return cached;
  const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, { method:'GET', mode:'cors', cache:'force-cache' });
  if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
  const data = await response.json();
  const result = Array.isArray(data?.[0]) ? data[0].map(x => x?.[0] || '').join('') : '';
  if (!result) throw new Error('Empty translation');
  cacheSet(text, result);
  return result;
}

function collectTextNodes(root = document.body) {
  const out = [];
  if (!root) return out;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || isExcludedElement(parent)) continue;
    const text = originalText(parent);
    if (looksLikeNonNaturalText(text)) continue;
    // Do not translate pure whitespace nodes.
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ\u0900-\u097F\u0980-\u09FF\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(text)) continue;
    out.push({ node, parent, text });
  }
  return out;
}

async function translateNodes(nodes) {
  if (translating) return;
  translating = true;
  try {
    const target = normalizeLanguage(currentLanguage);
    if (target === 'en') {
      nodes.forEach(({node,parent}) => {
        const original = parent?.dataset?.bookoraI18nOriginal;
        if (original != null && node.isConnected) node.nodeValue = original;
      });
      return;
    }

    const unique = [...new Set(nodes.map(x => x.text.trim()))];
    const translated = new Map();
    const CONCURRENCY = 6;
    let index = 0;
    async function worker() {
      while (index < unique.length) {
        const text = unique[index++];
        try { translated.set(text, await translateText(text, target)); }
        catch (_) { translated.set(text, text); }
      }
    }
    await Promise.all(Array.from({length: Math.min(CONCURRENCY, unique.length)}, worker));

    nodes.forEach(({node, text}) => {
      if (!node.isConnected) return;
      const value = translated.get(text.trim()) || text;
      // Preserve leading/trailing whitespace around the translated value.
      const leading = text.match(/^\s*/)?.[0] || '';
      const trailing = text.match(/\s*$/)?.[0] || '';
      node.nodeValue = leading + value + trailing;
    });

    translateAttributes(document.body, target);
  } finally {
    translating = false;
  }
}

async function translateAttributes(root, target) {
  if (!root || target === 'en') {
    if (target === 'en') restoreAttributes(root);
    return;
  }
  const elements = root.querySelectorAll('input[placeholder],textarea[placeholder],[title],[aria-label]');
  const jobs = [];
  elements.forEach(el => {
    if (isExcludedElement(el)) return;
    for (const attr of ['placeholder','title','aria-label']) {
      const value = el.getAttribute(attr);
      if (!value || looksLikeNonNaturalText(value)) continue;
      const key = `attr:${attr}:${value}`;
      if (!el.dataset[`bookoraI18n_${attr.replace('-','_')}`]) el.dataset[`bookoraI18n_${attr.replace('-','_')}`] = value;
      jobs.push({el,attr,value});
    }
  });
  const unique = [...new Set(jobs.map(x => x.value))];
  const translated = new Map();
  await Promise.all(unique.map(async value => {
    try { translated.set(value, await translateText(value, target)); } catch (_) { translated.set(value, value); }
  }));
  jobs.forEach(({el,attr,value}) => { if (el.isConnected) el.setAttribute(attr, translated.get(value) || value); });
}

function restoreAttributes(root) {
  if (!root) return;
  root.querySelectorAll('[data-bookora-i18n-placeholder],[data-bookora-i18n-title],[data-bookora-i18n-aria_label]').forEach(el => {
    const map = {placeholder:'data-bookora-i18n-placeholder',title:'data-bookora-i18n-title','aria-label':'data-bookora-i18n-aria_label'};
    Object.entries(map).forEach(([attr,key]) => { if (el.hasAttribute(key)) el.setAttribute(attr, el.getAttribute(key)); });
  });
}

async function applyLanguage() {
  if (!document.body) return;
  const nodes = collectTextNodes(document.body);
  await translateNodes(nodes);
  document.documentElement.lang = currentLanguage;
  document.documentElement.dataset.bookoraLanguage = currentLanguage;
  window.dispatchEvent(new CustomEvent('bookora:language-changed', { detail:{language:currentLanguage} }));
}

function queueAddedNodes(mutations) {
  if (translating) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes || []) {
      if (node.nodeType === Node.ELEMENT_NODE) queuedNodes.add(node);
      else if (node.nodeType === Node.TEXT_NODE && node.parentElement) queuedNodes.add(node.parentElement);
    }
  }
  clearTimeout(flushTimer);
  flushTimer = setTimeout(async () => {
    if (!queuedNodes.size) return;
    queuedNodes.clear();
    await applyLanguage();
  }, 80);
}

function installObserver() {
  if (observer || !document.body) return;
  observer = new MutationObserver(queueAddedNodes);
  observer.observe(document.body, {childList:true, subtree:true});
}

export async function setLanguage(language) {
  currentLanguage = normalizeLanguage(language);
  localStorage.setItem(STORAGE_KEY, currentLanguage);
  await applyLanguage();
}

export function getLanguage() { return currentLanguage; }
export function t(text) {
  const source = String(text ?? '');
  if (currentLanguage === 'en') return source;
  return cacheGet(source) || source;
}

window.BookoraI18n = {
  languages: BOOKORA_LANGUAGES,
  setLanguage,
  getLanguage,
  t,
  apply: applyLanguage
};

function wireLanguageControls() {
  document.addEventListener('change', e => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    if (el.matches('select[data-language],#language-select,#languageSelect,#settings-language')) setLanguage(el.value);
  });
  document.addEventListener('click', e => {
    const el = e.target instanceof Element ? e.target : null;
    const option = el?.closest('[data-language-option]');
    if (option) {
      e.preventDefault();
      setLanguage(option.getAttribute('data-language-option'));
    }
  });
}

async function boot() {
  installObserver();
  wireLanguageControls();
  await applyLanguage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
else boot();

state?.subscribe?.(event => {
  if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN' || event === 'USER_UPDATED') {
    setTimeout(() => applyLanguage(), 50);
  }
});
