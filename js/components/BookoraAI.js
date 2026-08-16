import { apiFetch, API_BASE_URL } from '../config.js';
import { state } from '../state.js';
import { Toast } from './Toast.js';

export const BookoraAI = {
  isOpen: false,
  isGenerating: false,
  abortController: null,
  messages: [
    {
      role: 'assistant',
      content: 'Hello! I am **Bookora AI**, your intelligent marketplace copilot. I have complete knowledge of all Bookora features, reading tools, publishing workflows, subscriptions, and account settings. How can I help you today?'
    }
  ],

  init() {
    if (document.getElementById('bookora-ai-root')) return;

    const root = document.createElement('div');
    root.id = 'bookora-ai-root';
    root.innerHTML = `
      <button id="bookora-ai-trigger-btn" class="bookora-ai-btn" aria-label="Open Bookora AI Assistant">
        <div class="ai-sparkle-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
          </svg>
        </div>
        <span class="ai-btn-label">Ask Bookora AI</span>
      </button>

      <div id="bookora-ai-drawer" class="bookora-ai-drawer">
        <div class="ai-drawer-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 1rem; color: #0F172A; line-height: 1;">Bookora AI</div>
              <div style="font-size: 0.7rem; color: #64748B; margin-top: 2px;">Your deep marketplace guide</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button id="ai-clear-btn" class="btn btn-ghost btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Clear Chat">Clear</button>
            <button id="ai-close-btn" style="background: none; border: none; font-size: 1.1rem; color: #64748B; cursor: pointer; padding: 4px;">✕</button>
          </div>
        </div>

        <div id="ai-suggestions-container" class="ai-suggestions-bar"></div>
        <div id="ai-messages-list" class="ai-messages-area"></div>

        <div class="ai-input-bar">
          <form id="ai-chat-form" style="display: flex; gap: 0.5rem; width: 100%;">
            <input type="text" id="ai-user-input" placeholder="Ask anything about Bookora, publishing, reading, or plans..." autocomplete="off" style="flex: 1; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.875rem;" />
            <button type="submit" id="ai-send-btn" class="btn btn-primary btn-sm" style="font-weight: 700; padding: 0 1rem; white-space: nowrap;">
              Send
            </button>
            <button type="button" id="ai-stop-btn" class="btn btn-secondary btn-sm" style="display: none; color: #DC2626; border-color: #FECACA; font-weight: 700;">
              Stop
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    this.attachEvents();
    this.renderMessages();
    this.updateContextChips();
  },

  attachEvents() {
    const triggerBtn = document.getElementById('bookora-ai-trigger-btn');
    const closeBtn = document.getElementById('ai-close-btn');
    const clearBtn = document.getElementById('ai-clear-btn');
    const stopBtn = document.getElementById('ai-stop-btn');
    const form = document.getElementById('ai-chat-form');

    triggerBtn?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.close());
    clearBtn?.addEventListener('click', () => {
      this.messages = [{ role: 'assistant', content: 'Chat history cleared. How can I help you today?' }];
      this.renderMessages();
    });

    stopBtn?.addEventListener('click', () => {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.isGenerating = false;
      this.toggleInputControls(false);
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('ai-user-input');
      const text = input?.value.trim();
      if (!text || this.isGenerating) return;
      input.value = '';
      this.sendMessage(text);
    });

    window.addEventListener('hashchange', () => {
      this.updateContextChips();
    });
  },

  toggle() {
    this.isOpen ? this.close() : this.open();
  },

  open() {
    this.isOpen = true;
    const drawer = document.getElementById('bookora-ai-drawer');
    if (drawer) drawer.classList.add('open');
    this.updateContextChips();
    setTimeout(() => document.getElementById('ai-user-input')?.focus(), 200);
  },

  close() {
    this.isOpen = false;
    const drawer = document.getElementById('bookora-ai-drawer');
    if (drawer) drawer.classList.remove('open');
  },

  toggleInputControls(generating) {
    this.isGenerating = generating;
    const sendBtn = document.getElementById('ai-send-btn');
    const stopBtn = document.getElementById('ai-stop-btn');
    const input = document.getElementById('ai-user-input');

    if (sendBtn) sendBtn.style.display = generating ? 'none' : 'block';
    if (stopBtn) stopBtn.style.display = generating ? 'block' : 'none';
    if (input) input.disabled = generating;
  },

  updateContextChips() {
    const container = document.getElementById('ai-suggestions-container');
    if (!container) return;

    const hash = window.location.hash || '#/';
    let chips = [];

    if (hash.startsWith('#/book/')) {
      chips = ['What is this book about?', 'How do I buy this eBook?', 'Is this included in Reader Pro?', 'How do sample previews work?'];
    } else if (hash.startsWith('#/pricing') || hash.startsWith('#/subscription')) {
      chips = ['Compare subscription tiers', 'What is included in Reader Pro?', 'How does Annual Club save money?', 'How do I cancel my subscription?'];
    } else if (hash.startsWith('#/publish') || hash.startsWith('#/seller')) {
      chips = ['How do 85% author royalties work?', 'How to list external sales pages?', 'What formats are supported?', 'How to get approved as an author?'];
    } else if (hash.startsWith('#/library') || hash.startsWith('#/orders')) {
      chips = ['Where are my purchased books?', 'How does in-browser reader work?', 'How do DRM downloads work?', 'Where can I find my invoice?'];
    } else if (hash.startsWith('#/admin')) {
      chips = ['Show todays marketplace summary', 'How many books are pending approval?', 'What is our database health?'];
    } else {
      chips = ['How do I create an account?', 'How does Bookora work?', 'How do 85% royalties work?', 'What are the subscription plans?'];
    }

    container.innerHTML = chips.map(chip => `
      <button class="ai-chip-btn" data-query="${chip}">${chip}</button>
    `).join('');

    container.querySelectorAll('.ai-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.query;
        this.sendMessage(q);
      });
    });
  },

  renderMessages() {
    const list = document.getElementById('ai-messages-list');
    if (!list) return;

    list.innerHTML = this.messages.map(m => `
      <div class="ai-message ${m.role === 'user' ? 'user-msg' : 'ai-msg'}">
        <div class="msg-bubble">
          ${this.formatMarkdown(m.content)}
        </div>
      </div>
    `).join('');

    list.scrollTop = list.scrollHeight;
  },

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/### (.*?)\n/g, '<h4 style="font-weight:700; margin: 6px 0 2px 0; color:#1E3A8A;">$1</h4>')
      .replace(/## (.*?)\n/g, '<h3 style="font-weight:800; margin: 8px 0 4px 0;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="ai-action-link" style="display:inline-block; margin:2px 0; padding:2px 8px; background:var(--accent-light); color:var(--accent); border-radius:4px; font-weight:700; text-decoration:none; border:1px solid rgba(37,99,235,0.2);">$1 →</a>')
      .replace(/\n/g, '<br/>');
  },

  // Deep Knowledge Engine for all Bookora features
  getDeepBookoraResponse(query) {
    const q = (query || '').toLowerCase();

    // 1. Account Creation & Sign In
    if (q.includes('create account') || q.includes('signup') || q.includes('register') || q.includes('sign up') || q.includes('join')) {
      return "### How to Create a Bookora Account:\n\n1. Click **[Sign Up](#/signup)** in the top navigation.\n2. Choose your role: **Reader / Buyer** or **Author / Seller**.\n3. Enter your **Full Name**, **Email Address**, and choose a secure password (minimum 8 characters).\n4. Or click **Continue with Google** / **Apple** for instant 1-click registration.\n\nOnce registered, you can immediately buy eBooks, access your personal **[Library](#/library)**, and save favorites to your **[Wishlist](#/wishlist)**!\n\n[Create Your Account](#/signup)";
    }

    if (q.includes('login') || q.includes('sign in') || q.includes('log in')) {
      return "### How to Sign In to Bookora:\n\n1. Go to the **[Sign In](#/login)** page.\n2. Enter your registered email and password, or use **Google Sign-In** / **Apple ID**.\n3. If you forgot your password, click **[Forgot Password?](#/forgot-password)** to get recovery instructions.\n\n[Sign In to Bookora](#/login)";
    }

    // 2. Dual Publishing Models & 85% Royalties
    if (q.includes('publish') || q.includes('author') || q.includes('sell') || q.includes('creator') || q.includes('royalty') || q.includes('royalties')) {
      return "### Author & Creator Publishing on Bookora:\n\nBookora offers two flexible publishing models with an industry-leading **85% author royalty rate**:\n\n1. **Type A (Native Bookora eBooks)**:\n   - Upload your PDF manuscript + cover image.\n   - Set your own price, description, and reading access model (*One-Time Purchase*, *Subscription Included*, or *Both*).\n   - Readers get instant in-browser reading & DRM watermarked downloads.\n\n2. **Type B (Smart External Importer)**:\n   - Paste your existing sales link from **Leanpub**, **Gumroad**, or publisher pages.\n   - Our metadata engine automatically imports the cover, title, author, and description.\n\n**Payouts**: Direct to your verified bank account via automated Cashfree Payouts.\n\n[Apply for Seller Status](#/seller/apply) • [Publish an eBook](#/publish)";
    }

    // 3. Buying & Cashfree Payments
    if (q.includes('buy') || q.includes('purchase') || q.includes('checkout') || q.includes('payment') || q.includes('pay') || q.includes('cashfree')) {
      return "### How eBook Purchases Work on Bookora:\n\n1. Find your desired book in the **[Explore Catalog](#/explore)**.\n2. Click **Buy Now** to open the secure **[Checkout](#/checkout)** page.\n3. Complete payment via **Cashfree Sandbox Gateway** (supports UPI apps like GPay/PhonePe, Debit/Credit Cards, NetBanking, and Wallets).\n4. Once payment is verified, the eBook is **instantly unlocked** in your **[My Library](#/library)** for lifetime reading and PDF download.\n\n[Explore Catalog](#/explore)";
    }

    // 4. In-Browser Reader & DRM Downloads
    if (q.includes('reader') || q.includes('read') || q.includes('library') || q.includes('download') || q.includes('drm') || q.includes('watermark')) {
      return "### In-Browser Reading & Downloads:\n\n- **In-Browser eBook Reader**: Read any purchased or subscription-eligible eBook directly in your browser with **Day**, **Sepia (Warm Paper)**, and **Night (Dark)** themes, adjustable font sizing (14px–26px), and fullscreen reading.\n- **Progress Sync**: Bookora automatically saves your reading progress so you always resume on the exact page you left off.\n- **DRM Downloads**: You can download licensed PDF copies stamped with your personalized reader license watermark directly from **[My Library](#/library)**.\n\n[Go to My Library](#/library)";
    }

    // 5. Subscription Plans & Tiers
    if (q.includes('subscription') || q.includes('plan') || q.includes('pricing') || q.includes('pro') || q.includes('annual') || q.includes('club')) {
      return "### Bookora Reading Subscription Tiers:\n\n1. **Free Reader (₹0)**:\n   - Browse the full marketplace catalog.\n   - Read free 5-page sample previews on any eBook.\n   - Save unlimited books to your Wishlist.\n\n2. **Bookora Reader Pro (₹299 / month)**:\n   - Unlimited in-browser reading on all subscription-eligible titles.\n   - Dark & Sepia reading themes + progress sync.\n   - Cancel anytime from your account settings.\n\n3. **Annual Book Club (₹2,499 / year — Save 30%)**:\n   - 12 months full unlimited reading access (includes 2 months free!).\n   - Early access to fresh releases and creator exclusives.\n\n[View Subscription Plans](#/pricing)";
    }

    // 6. Orders, Invoices & Receipts
    if (q.includes('order') || q.includes('invoice') || q.includes('refund') || q.includes('receipt')) {
      return "### Orders, Receipts & Invoices:\n\n- Every completed transaction generates an instant digital invoice.\n- You can view transaction IDs, download dates, payment status, and order details in **[Order History](#/orders)**.\n- For refund requests, our 100% digital fulfillment policy covers verified purchase errors within 7 days.\n\n[View Order History](#/orders)";
    }

    // 7. Categories & Topics
    if (q.includes('category') || q.includes('categories') || q.includes('topic') || q.includes('genre')) {
      return "### Explore by Category:\n\nBookora organizes publications across 20+ specialized topics including:\n- **Productivity & Time Management**\n- **Technology, Cloud & Web Architecture**\n- **Business, Startups & Leadership**\n- **Design, UI/UX & Creative Arts**\n- **Personal Finance & Investing**\n- **Science, Mathematics & Philosophy**\n\n[Browse All Categories](#/categories)";
    }

    // 8. What is Bookora / Platform Overview
    if (q.includes('what is bookora') || q.includes('about') || q.includes('overview') || q.includes('who are you')) {
      return "### About Bookora — Discover. Read. Publish.\n\nBookora is a modern digital eBook marketplace designed for readers and independent creators:\n- **For Readers**: Discover world-class books, read free previews, enjoy seamless in-browser reading across Day/Sepia/Night themes, and manage your permanent digital library.\n- **For Authors & Publishers**: Upload PDF manuscripts, earn an **85% royalty rate** with direct bank payouts via Cashfree, or import external sales pages from Gumroad/Leanpub.\n\n[Explore Catalog](#/explore) • [Start Publishing](#/publish)";
    }

    // 9. Greetings & Overview
    if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q.includes('help')) {
      return "Hello! I am **Bookora AI**, your marketplace assistant. I can help you with:\n\n- **[Create Account](#/signup)** / **[Sign In](#/login)**\n- **[Publish an eBook](#/publish)** (Earn 85% royalties)\n- **[Explore Catalog](#/explore)** (Browse books & free previews)\n- **[Subscription Plans](#/pricing)** (Reader Pro & Annual Club)\n- **[In-Browser Reader](#/library)** & DRM PDF downloads\n\nWhat would you like to explore?";
    }

    return "I am your complete Bookora marketplace assistant! I can guide you through reading in your **[Library](#/library)**, subscribing to **[Reader Pro](#/pricing)**, buying books via Cashfree, or publishing manuscripts with **85% royalties** in **[Creator Studio](#/publish)**. How can I help you today?";
  },

  async sendMessage(userText) {
    if (this.isGenerating) return;

    this.messages.push({ role: 'user', content: userText });
    this.renderMessages();

    const list = document.getElementById('ai-messages-list');
    const loadingEl = document.createElement('div');
    loadingEl.className = 'ai-message ai-msg';
    loadingEl.id = 'ai-active-loading-msg';
    loadingEl.innerHTML = '<div class="msg-bubble" style="display:flex; align-items:center; gap:6px; color:#64748B;"><span>Bookora AI is thinking</span><span class="ai-dots">...</span></div>';
    list?.appendChild(loadingEl);
    if (list) list.scrollTop = list.scrollHeight;

    this.toggleInputControls(true);
    this.abortController = new AbortController();

    const hash = window.location.hash || '#/';
    let bookId = null;
    if (hash.startsWith('#/book/')) {
      bookId = hash.replace('#/book/', '');
    }

    let replyText = '';

    try {
      const fetchPromise = apiFetch('/api/ai/chat', {
        method: 'POST',
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token || ''}`
        },
        body: JSON.stringify({
          message: userText,
          conversationHistory: this.messages.slice(-8),
          context: {
            page: hash,
            pageName: hash === '#/' ? 'Home' : hash.replace('#/', ''),
            bookId: bookId,
            user: state.currentUser ? state.currentUser.name : 'Guest'
          }
        })
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 5000)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      const data = await res.json();
      if (data && (data.message || data.reply)) {
        replyText = data.message || data.reply;
      }
    } catch (err) {
      console.log('Bookora AI delivering instant deep knowledge:', err.message);
    }

    if (!replyText) {
      replyText = this.getDeepBookoraResponse(userText);
    }

    loadingEl.remove();

    const aiMsgObj = { role: 'assistant', content: '' };
    this.messages.push(aiMsgObj);
    this.renderMessages();

    const lastBubble = list?.lastElementChild?.querySelector('.msg-bubble');
    if (lastBubble && replyText.length > 20) {
      let curr = 0;
      const chunkSize = Math.max(3, Math.floor(replyText.length / 25));
      const interval = setInterval(() => {
        curr += chunkSize;
        if (curr >= replyText.length) {
          curr = replyText.length;
          clearInterval(interval);
        }
        aiMsgObj.content = replyText.slice(0, curr);
        lastBubble.innerHTML = this.formatMarkdown(aiMsgObj.content);
        if (list) list.scrollTop = list.scrollHeight;
      }, 12);
    } else {
      aiMsgObj.content = replyText;
      this.renderMessages();
    }

    this.toggleInputControls(false);
    this.abortController = null;
  }
};
