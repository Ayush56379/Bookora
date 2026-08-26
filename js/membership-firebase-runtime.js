import { state } from './state.js';
import { apiFetch } from './config.js';
import { Toast } from './components/Toast.js';

let installed = false;

function firebaseDb() {
  try {
    if (!window.firebase?.apps?.length) return null;
    return window.firebase.firestore();
  } catch (_) { return null; }
}

function uid() {
  return String(state.currentUser?.bookoraUserId || state.currentUser?.userId || state.currentUser?.id || '').trim();
}

function activeDoc(data) {
  if (String(data?.accessStatus || 'active').toLowerCase() !== 'active') return false;
  const expiry = Date.parse(data?.expiresAt || '');
  return !Number.isFinite(expiry) || expiry > Date.now();
}

async function syncLibraryFromFirebase() {
  const db = firebaseDb();
  const userId = uid();
  if (!db || !userId) return false;
  try {
    const snapshot = await db.collection('library').where('userId', '==', userId).get();
    const active = snapshot.docs.filter(doc => activeDoc(doc.data()));
    state.library = new Set(active.map(doc => String(doc.data()?.bookId || doc.data()?.book_id || '')).filter(Boolean));
    state.notify('LIBRARY_FIREBASE_SYNCED', { count: state.library.size });
    return true;
  } catch (error) {
    console.warn('[Bookora] Firebase membership library sync skipped:', error?.message || error);
    return false;
  }
}

async function syncMembershipFromFirebase() {
  const db = firebaseDb();
  const userId = uid();
  if (!db || !userId) return;
  try {
    const snapshot = await db.collection('memberships').where('user_id', '==', userId).where('status', '==', 'ACTIVE').get();
    const active = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(item => item.plan_id === 'lifetime' || !item.expiresAt || Date.parse(item.expiresAt) > Date.now());
    state.currentSubscription = active.find(item => item.plan_id === 'lifetime') || active.sort((a, b) => Date.parse(b.expiresAt || '') - Date.parse(a.expiresAt || ''))[0] || null;
  } catch (error) {
    console.warn('[Bookora] Firebase membership sync skipped:', error?.message || error);
  }
}

async function fixedTrialBooks() {
  const db = firebaseDb();
  if (!db) return [];
  try {
    const doc = await db.collection('membershipConfig').doc('plans').get();
    const ids = Array.isArray(doc.data()?.freeTrialBookIds) ? doc.data().freeTrialBookIds.map(String).slice(0, 2) : [];
    return ids.map(id => state.getBookById?.(id) || state.getApprovedBooks().find(book => String(book.id) === id)).filter(Boolean);
  } catch (_) { return []; }
}

async function installFixedTrialUi() {
  if (!location.hash.startsWith('#/pricing')) return;
  const modal = document.getElementById('bookora-trial-modal');
  if (!modal) return;
  const grid = document.getElementById('bookora-trial-grid');
  const title = modal.querySelector('h2');
  const text = modal.querySelector('p');
  const count = document.getElementById('bookora-trial-count');
  const start = document.getElementById('bookora-trial-start');
  if (title) title.textContent = 'Your 2 Free Trial eBooks';
  if (text) text.textContent = 'Every user receives the same 2 eBooks for 48 hours. No selection is required.';
  const books = await fixedTrialBooks();
  if (grid && books.length === 2) {
    grid.innerHTML = books.map(book => `<div style="border:2px solid #A7F3D0;background:#ECFDF5;border-radius:16px;padding:10px;"><div style="aspect-ratio:3/4;border-radius:11px;overflow:hidden;background:#0F172A;margin-bottom:9px;">${book.cover_url ? `<img src="${String(book.cover_url).replace(/"/g,'&quot;')}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">` : '<div style="height:100%;display:grid;place-items:center;color:#fff;font-size:26px;">📖</div>'}</div><strong style="display:block;color:#0F172A;font-size:12px;line-height:1.3;">${String(book.title || '').replace(/[&<>"']/g, '')}</strong><span style="display:block;color:#64748B;font-size:11px;margin-top:4px;">Included for everyone</span></div>`).join('');
    if (count) count.textContent = '2 / 2 included';
    if (start) { start.disabled = false; start.dataset.bookoraFixedTrial = 'true'; }
  }
}

async function startFixedTrial(button) {
  if (!state.isAuthenticated) {
    Toast.show('Please sign in first to start the free trial.', 'info');
    window.location.hash = '#/login?returnTo=' + encodeURIComponent('/pricing');
    return;
  }
  button.disabled = true;
  button.textContent = 'Starting...';
  try {
    const result = await apiFetch('/api/membership/trial', { method: 'POST', body: JSON.stringify({}) });
    if (!result?.success) throw new Error(result?.error || 'Free Trial could not be started.');
    await syncLibraryFromFirebase();
    document.getElementById('bookora-trial-modal')?.style.setProperty('display', 'none');
    Toast.show('Free Trial started. The same 2 eBooks are now available for 48 hours.', 'success');
  } catch (error) {
    Toast.show(error.message || 'Free Trial could not be started.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Start 2-Day Trial';
  }
}

function install() {
  if (installed) return;
  installed = true;
  state.subscribe(async event => {
    if (['USER_LOGGED_IN', 'DATA_SYNCED', 'MEMBERSHIP_ACTIVATED'].includes(event)) {
      await syncMembershipFromFirebase();
      await syncLibraryFromFirebase();
      setTimeout(installFixedTrialUi, 0);
    }
  });

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const trialButton = target?.closest('#bookora-trial-start');
    if (trialButton?.dataset.bookoraFixedTrial === 'true') {
      event.preventDefault();
      event.stopImmediatePropagation();
      startFixedTrial(trialButton);
    }
  }, true);

  window.addEventListener('hashchange', () => setTimeout(installFixedTrialUi, 0));
  setTimeout(async () => {
    await syncMembershipFromFirebase();
    await syncLibraryFromFirebase();
    await installFixedTrialUi();
  }, 1200);
}

install();

window.BookoraMembershipFirebase = { syncLibraryFromFirebase, syncMembershipFromFirebase };
