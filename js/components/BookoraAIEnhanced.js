import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { BookoraAI as BaseAI } from './BookoraAI.js';

const safe = value => String(value ?? '').slice(0, 4000);

function getRouteContext() {
  const hash = window.location.hash || '#/';
  const [route] = hash.split('?');
  const path = route.replace(/^#/, '') || '/';
  const bookId = path.startsWith('/book/') ? path.slice(6) : null;
  const book = bookId ? (state.books || []).find(b => String(b.id || b.slug) === bookId) : null;
  return { hash, path, bookId, book };
}

function getPublicSiteContext() {
  const settings = state.settings || {};
  const plans = Array.isArray(settings.plans) ? settings.plans : [];
  const categories = (state.categories || []).map(c => ({ name: c.name, slug: c.slug }));
  const books = (state.books || []).slice(0, 60).map(b => ({
    id: b.id, title: b.title, author: b.author, category: b.category,
    price: b.price, sale_price: b.sale_price, status: b.status
  }));
  return {
    site: {
      name: settings.site?.name || settings.website_name || 'Bookora',
      tagline: settings.site?.tagline || settings.tagline || '',
      description: settings.site?.description || settings.website_description || '',
      currency: settings.currency?.code || settings.currency?.symbol || 'INR'
    },
    plans,
    categories,
    books
  };
}

function fallbackAnswer(query) {
  const q = String(query || '').toLowerCase();
  const { path, book } = getRouteContext();
  const site = getPublicSiteContext().site;
  if (book && (q.includes('book') || q.includes('about') || q.includes('price'))) {
    return `### ${book.title || 'This eBook'}\n\n${book.author ? `Author: **${book.author}**\n` : ''}${book.category ? `Category: **${book.category}**\n` : ''}${book.price != null ? `Price: **${book.sale_price || book.price}**\n` : ''}\nYou are currently viewing this book's detail page.`;
  }
  if (q.includes('publish') || q.includes('upload')) return 'To publish, open **[Publish eBook](#/publish)**. You need book information, a PDF, a cover, page count and pricing. The submission is sent for admin review.';
  if (q.includes('seller') || q.includes('author')) return 'Authors can apply for seller access at **[Seller Apply](#/seller/apply)**. After approval, Creator Studio provides the publishing workflow.';
  if (q.includes('library') || q.includes('purchase') || q.includes('buy')) return 'Purchased eBooks are available from **[My Library](#/library)** after successful payment verification.';
  if (q.includes('setting') || q.includes('admin')) return 'Admin-only platform configuration is available under **[Admin Settings](#/admin/settings)** when you are signed in as an administrator.';
  if (q.includes('category')) return `Bookora currently has ${state.categories?.length || 0} configured categories. Open **[Categories](#/categories)** to browse them.`;
  if (q.includes('login') || q.includes('sign in')) return 'Use **[Sign In](#/login)** to access your Bookora account. If you need a new account, use **[Sign Up](#/signup)**.';
  if (q.includes('plan') || q.includes('subscription') || q.includes('pricing')) return `Current plan information is available on **[Pricing](#/pricing)**. I will use the live plan data supplied by Bookora rather than inventing prices.`;
  if (q.includes('help') || q === 'hi' || q === 'hello' || q === 'hey') return `Hi! I am Bookora AI. I can help with the current **${site.name}** website, books, buying, library, publishing, seller access, settings and navigation. You are currently on **${path}**.`;
  return `I can help with the current **${site.name}** website. I do not want to guess when live information is unavailable. Ask me about this page, books, buying, library, publishing, seller access, plans or settings.`;
}

function installEnhancedAI() {
  const originalInit = BaseAI.init.bind(BaseAI);
  BaseAI.init = function () {
    originalInit();
    const root = document.getElementById('bookora-ai-root');
    if (root) {
      root.style.position = 'fixed';
      root.style.zIndex = '2147483000';
      root.style.pointerEvents = 'none';
      const trigger = root.querySelector('#bookora-ai-trigger-btn');
      const drawer = root.querySelector('#bookora-ai-drawer');
      if (trigger) trigger.style.pointerEvents = 'auto';
      if (drawer) drawer.style.pointerEvents = 'auto';
    }
  };

  BaseAI.updateContextChips = function () {
    const container = document.getElementById('ai-suggestions-container');
    if (!container) return;
    const { path, book } = getRouteContext();
    let chips;
    if (book) chips = ['What is this book?', 'What is the price?', 'How do I buy it?', 'How do I read it?'];
    else if (path.startsWith('/publish')) chips = ['How do I publish?', 'What files are required?', 'How does admin review work?', 'How does AI checking work?'];
    else if (path.startsWith('/seller')) chips = ['How do I become a seller?', 'Where is Creator Studio?', 'How does publishing work?', 'Where are seller settings?'];
    else if (path.startsWith('/admin')) chips = ['What can I manage here?', 'Where are books?', 'Where are users?', 'Where are platform settings?'];
    else if (path === '/library' || path === '/orders') chips = ['Where are my books?', 'How do I read a purchased book?', 'Where are my orders?', 'How does payment verification work?'];
    else if (path === '/pricing' || path === '/subscription') chips = ['What are the current plans?', 'Compare the plans', 'How do subscriptions work?', 'Where can I subscribe?'];
    else chips = ['What is Bookora?', 'How do I buy an eBook?', 'How do I publish an eBook?', 'How do I create an account?'];
    container.innerHTML = chips.map(x => `<button class="ai-chip-btn" data-query="${x}">${x}</button>`).join('');
    container.querySelectorAll('.ai-chip-btn').forEach(btn => btn.addEventListener('click', () => this.sendMessage(btn.dataset.query)));
  };

  BaseAI.sendMessage = async function (userText) {
    if (this.isGenerating) return;
    const text = String(userText || '').trim();
    if (!text) return;
    this.messages.push({ role: 'user', content: text });
    this.renderMessages();
    const list = document.getElementById('ai-messages-list');
    const loading = document.createElement('div');
    loading.className = 'ai-message ai-msg';
    loading.innerHTML = '<div class="msg-bubble">Bookora AI is checking the current website information…</div>';
    list?.appendChild(loading);
    this.toggleInputControls(true);
    this.abortController = new AbortController();
    const route = getRouteContext();
    const context = getPublicSiteContext();
    context.currentPage = { path: route.path, book: route.book };
    let reply = '';
    try {
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        signal: this.abortController.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token || ''}` },
        body: JSON.stringify({
          message: text,
          conversationHistory: this.messages.slice(-10),
          context,
          instructions: 'Answer ONLY from the supplied Bookora context and actual platform behavior. Never invent prices, plans, features, payment modes, login providers, royalty percentages, policies, or routes. If the context does not contain an answer, clearly say that the information is not available. Mention the current page when it helps. Use exact Bookora route links when recommending navigation.'
        })
      });
      const data = await response.json();
      reply = data?.message || data?.reply || '';
    } catch (error) {
      console.warn('Bookora AI backend unavailable:', error?.message || error);
    }
    loading.remove();
    if (!reply) reply = fallbackAnswer(text);
    const aiMessage = { role: 'assistant', content: reply };
    this.messages.push(aiMessage);
    this.renderMessages();
    this.toggleInputControls(false);
    this.abortController = null;
  };

  const originalOpen = BaseAI.open.bind(BaseAI);
  BaseAI.open = function () {
    originalOpen();
    this.updateContextChips();
  };

  return BaseAI;
}

export const BookoraAI = installEnhancedAI();
