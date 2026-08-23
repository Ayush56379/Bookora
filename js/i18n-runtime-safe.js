// Bookora universal i18n runtime.
// Translates static UI + dynamically rendered catalog content (book titles,
// descriptions, author names, categories, reviews, buttons, placeholders, etc.).
// Original text is retained per DOM text node so language switching never
// translates an already translated value again.
import { state } from './state.js';

const STORAGE_KEY = 'bookora_language';
const CACHE_KEY = 'bookora_translation_cache_v3';
const DEFAULT_LANGUAGE = 'en';
const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

export const BOOKORA_LANGUAGES = {
  en:{name:'English',native:'English'},hi:{name:'Hindi',native:'हिन्दी'},gu:{name:'Gujarati',native:'ગુજરાતી'},mr:{name:'Marathi',native:'मराठी'},bn:{name:'Bengali',native:'বাংলা'},ta:{name:'Tamil',native:'தமிழ்'},te:{name:'Telugu',native:'తెలుగు'},kn:{name:'Kannada',native:'ಕನ್ನಡ'},ml:{name:'Malayalam',native:'മലയാളം'},pa:{name:'Punjabi',native:'ਪੰਜਾਬੀ'},ur:{name:'Urdu',native:'اردو'},es:{name:'Spanish',native:'Español'},fr:{name:'French',native:'Français'},de:{name:'German',native:'Deutsch'},pt:{name:'Portuguese',native:'Português'},ar:{name:'Arabic',native:'العربية'},ja:{name:'Japanese',native:'日本語'},ko:{name:'Korean',native:'한국어'},zh:{name:'Chinese',native:'中文'},ru:{name:'Russian',native:'Русский'}
};

let currentLanguage = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
let translating = false;
let observer = null;
let flushTimer = null;
let queuedNodes = new Set();
const originalNodes = new WeakMap();
let cache = {};
try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch (_) { cache = {}; }

function normalizeLanguage(value) {
  const v = String(value || '').toLowerCase().split('-')[0];
  return BOOKORA_LANGUAGES[v] ? v : DEFAULT_LANGUAGE;
}

function isExcludedElement(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
  if (el.closest('[data-no-translate],script,style,noscript,svg,code,pre')) return true;
  if (el.matches('textarea,input[type="password"],input[type="email"],input[type="url"],input[type="number"],input[type="tel"],input[type="date"],input[type="time"],input[type="file"],input[type="hidden"]')) return true;
  if (el.matches('.bookora-brand,.site-brand,[data-site-name]')) return true;
  return false;
}

function looksLikeNonNaturalText(text) {
  const s = String(text || '').trim();
  if (!s || s.length < 2) return true;
  if (/^https?:\/\//i.test(s) || /^mailto:/i.test(s)) return true;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(s)) return true;
  if (/^[₹$€£¥₩]?\s*[\d,.]+(?:\s*[A-Z]{3})?$/.test(s)) return true;
  if (/^[#@][\w-]+$/.test(s)) return true;
  if (/^[A-Z0-9_-]{8,}$/.test(s) && !/\s/.test(s)) return true;
  return false;
}

function getOriginal(node) {
  if (!originalNodes.has(node)) originalNodes.set(node, node.nodeValue || '');
  return originalNodes.get(node);
}

function cacheGet(source, target) { return cache[`${target}|${source}`] || ''; }
function cacheSet(source, target, value) {
  cache[`${target}|${source}`] = value;
  try {
    const keys = Object.keys(cache);
    if (keys.length > 2000) delete cache[keys[0]];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (_) {}
}

async function translateText(source, target) {
  if (target === 'en') return source;
  const cached = cacheGet(source, target);
  if (cached) return cached;
  const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(source)}`;
  const response = await fetch(url, { method:'GET', mode:'cors', cache:'force-cache' });
  if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
  const data = await response.json();
  const result = Array.isArray(data?.[0]) ? data[0].map(x => x?.[0] || '').join('') : '';
  if (!result) throw new Error('Empty translation');
  cacheSet(source, target, result);
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
    const source = getOriginal(node);
    if (looksLikeNonNaturalText(source)) continue;
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ\u0900-\u097F\u0980-\u09FF\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(source)) continue;
    out.push({node,source});
  }
  return out;
}

async function translateAttributes(root, target) {
  if (!root) return;
  const elements = root.querySelectorAll('input[placeholder],textarea[placeholder],[title],[aria-label]');
  const jobs = [];
  elements.forEach(el => {
    if (isExcludedElement(el)) return;
    for (const attr of ['placeholder','title','aria-label']) {
      const value = el.getAttribute(attr);
      if (!value || looksLikeNonNaturalText(value)) continue;
      const key = `bookoraOriginal${attr === 'aria-label' ? 'AriaLabel' : attr[0].toUpperCase()+attr.slice(1)}`;
      if (!el.dataset[key]) el.dataset[key] = value;
      const source = el.dataset[key];
      jobs.push({el,attr,source});
    }
  });
  if (target === 'en') {
    jobs.forEach(({el,attr,source}) => el.setAttribute(attr, source));
    return;
  }
  const unique = [...new Set(jobs.map(x => x.source))];
  const translated = new Map();
  let index = 0;
  async function worker() {
    while (index < unique.length) {
      const source = unique[index++];
      try { translated.set(source, await translateText(source,target)); }
      catch (_) { translated.set(source,source); }
    }
  }
  await Promise.all(Array.from({length:Math.min(6,unique.length)}, worker));
  jobs.forEach(({el,attr,source}) => { if (el.isConnected) el.setAttribute(attr, translated.get(source) || source); });
}

async function applyLanguage() {
  if (!document.body || translating) return;
  translating = true;
  try {
    const target = normalizeLanguage(currentLanguage);
    const nodes = collectTextNodes(document.body);
    if (target === 'en') {
      nodes.forEach(({node,source}) => { if (node.isConnected) node.nodeValue = source; });
    } else {
      const unique = [...new Set(nodes.map(x => x.source.trim()))];
      const translated = new Map();
      let index = 0;
      async function worker() {
        while (index < unique.length) {
          const source = unique[index++];
          try { translated.set(source, await translateText(source,target)); }
          catch (_) { translated.set(source,source); }
        }
      }
      await Promise.all(Array.from({length:Math.min(6,unique.length)}, worker));
      nodes.forEach(({node,source}) => {
        if (!node.isConnected) return;
        const raw = source;
        const value = translated.get(raw.trim()) || raw;
        const leading = raw.match(/^\s*/)?.[0] || '';
        const trailing = raw.match(/\s*$/)?.[0] || '';
        node.nodeValue = leading + value + trailing;
      });
    }
    await translateAttributes(document.body,target);
    document.documentElement.lang = target;
    document.documentElement.dataset.bookoraLanguage = target;
    window.dispatchEvent(new CustomEvent('bookora:language-changed',{detail:{language:target}}));
  } finally { translating = false; }
}

function queueAddedNodes(mutations) {
  for (const mutation of mutations) for (const node of mutation.addedNodes || []) {
    if (node.nodeType === Node.ELEMENT_NODE) queuedNodes.add(node);
    else if (node.nodeType === Node.TEXT_NODE && node.parentElement) queuedNodes.add(node.parentElement);
  }
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { queuedNodes.clear(); applyLanguage(); }, 100);
}

function installObserver() {
  if (observer || !document.body) return;
  observer = new MutationObserver(queueAddedNodes);
  observer.observe(document.body,{childList:true,subtree:true});
}

export async function setLanguage(language) {
  currentLanguage = normalizeLanguage(language);
  localStorage.setItem(STORAGE_KEY,currentLanguage);
  await applyLanguage();
}
export function getLanguage() { return currentLanguage; }
export function t(text) { return String(text ?? ''); }

window.BookoraI18n = { languages:BOOKORA_LANGUAGES,setLanguage,getLanguage,t,apply:applyLanguage };

function wireLanguageControls() {
  document.addEventListener('change',e => {
    const el=e.target instanceof Element?e.target:null;
    if (el?.matches('select[data-language],#language-select,#languageSelect,#settings-language')) setLanguage(el.value);
  });
  document.addEventListener('click',e => {
    const el=e.target instanceof Element?e.target:null;
    const option=el?.closest('[data-language-option]');
    if(option){e.preventDefault();setLanguage(option.getAttribute('data-language-option'));}
  });
}

async function boot(){installObserver();wireLanguageControls();await applyLanguage();}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
state?.subscribe?.(event=>{if(event==='DATA_SYNCED'||event==='USER_LOGGED_IN'||event==='USER_UPDATED')setTimeout(()=>applyLanguage(),50);});
