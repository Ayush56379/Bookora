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
      content: 'Hello! I am **Bookora AI**, your intelligent reading & marketplace assistant. How can I help you today?'
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
              <div style="font-size: 0.7rem; color: #64748B; margin-top: 2px;">Your intelligent marketplace copilot</div>
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
            <input type="text" id="ai-user-input" placeholder="Ask anything about Bookora, accounts, or publishing..." autocomplete="off" style="flex: 1; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.875rem;" />
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
      chips = ['What is this book about?', 'Who is the author?', 'Summarize key takeaways', 'Is it included in subscription?'];
    } else if (hash.startsWith('#/pricing') || hash.startsWith('#/subscription')) {
      chips = ['Which plan is right for me?', 'What is included in Reader Pro?', 'How do I cancel my subscription?'];
    } else if (hash.startsWith('#/publish') || hash.startsWith('#/seller')) {
      chips = ['How do author royalties work?', 'How to write a high-converting description?', 'What formats are supported?'];
    } else if (hash.startsWith('#/library') || hash.startsWith('#/orders')) {
      chips = ['Where is my purchased eBook?', 'How do reader controls work?', 'How do DRM downloads work?'];
    } else if (hash.startsWith('#/admin')) {
      chips = ['Show todays marketplace summary', 'How many books are pending approval?', 'What is our database health?'];
    } else {
      chips = ['How do I create an account?', 'How do I buy an eBook?', 'How does subscription work?', 'How can I publish an eBook?'];
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

  getInstantBookoraResponse(query) {
    const q = (query || '').toLowerCase();

    if (q.includes('create account') || q.includes('signup') || q.includes('register') || q.includes('join') || q.includes('sign up')) {
      return "To create an account on Bookora:\n\n1. Click **Sign In** in the top navigation.\n2. Select **[Sign Up](#/signup)**.\n3. Enter your **Full Name**, **Email Address**, and choose a password (minimum 8 characters).\n4. Or click **Continue with Google** / **Apple** for instant 1-click registration.\n5. Choose your initial account type: **Reader / Buyer** or apply as an **Author / Seller**.\n\nReady to get started? [Create Account](#/signup)";
    }

    if (q.includes('login') || q.includes('sign in') || q.includes('log in')) {
      return "To sign in to Bookora:\n\n1. Open the **[Sign In](#/login)** page.\n2. Enter your registered email and password.\n3. Or use **Continue with Google** / **Continue with Apple**.\n4. If you forgot your password, click **[Forgot Password?](#/forgot-password)** to receive reset instructions.";
    }

    if (q.includes('publish') || q.includes('author') || q.includes('sell') || q.includes('creator')) {
      return "To publish your eBook on Bookora:\n\n1. Sign in and apply for creator privileges at **[Seller Apply](#/seller/apply)**.\n2. Once approved by administration, open the **[Publish eBook](#/publish)** wizard or use our **[Smart External Importer](#/publish/external)**.\n3. Upload your PDF manuscript, cover image, set your pricing, and submit for moderation.\n4. Earn an industry-leading **85% author royalty** deposited directly to your bank via Cashfree Payouts.";
    }

    if (q.includes('buy') || q.includes('purchase') || q.includes('checkout') || q.includes('payment') || q.includes('how to buy')) {
      return "To buy an eBook on Bookora:\n\n1. Browse titles in the **[Catalog](#/explore)** and open any book detail page.\n2. Click **Buy Now** to proceed to the secure checkout.\n3. Complete payment via **Cashfree Sandbox** (supports UPI, Debit/Credit Card, NetBanking, and Wallets).\n4. Once verified, the eBook is instantly unlocked in **[My Library](#/library)** for in-browser reading and DRM download.";
    }

    if (q.includes('subscription') || q.includes('plan') || q.includes('pricing') || q.includes('tier') || q.includes('price')) {
      return "Bookora offers 3 flexible reading tiers:\n\n- **Free Reader (₹0)**: Browse catalog, read free 5-page sample previews, and save to wishlist.\n- **Reader Pro (₹299/mo)**: Unlimited in-browser reading on eligible titles + dark/sepia reading themes.\n- **Annual Book Club (₹2,499/yr)**: 12-month full unlimited access + 2 months free!\n\nExplore details at **[Pricing Plans](#/pricing)**.";
    }

    if (q.includes('where') && (q.includes('book') || q.includes('library') || q.includes('download') || q.includes('read'))) {
      return "All your purchased and subscription-accessible eBooks are located in **[My Library](#/library)**.\n\nFrom your library, you can:\n- Open the in-browser reader with Day, Sepia, and Night themes.\n- Continue reading from your last saved page.\n- Download your personalized, watermarked licensed file.";
    }

    if (q.includes('what is bookora') || q.includes('about bookora')) {
      return "Bookora is a modern, high-performance digital eBook marketplace where readers discover world-class publications with instant in-browser reading, and independent creators publish globally with verified Cashfree payouts.";
    }

    if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste') {
      return "Hello! I am **Bookora AI**, your personal marketplace assistant. How can I assist you today? You can ask me how to create an account, publish an eBook, explore reading plans, or browse the [Explore Catalog](#/explore)!";
    }

    return "I am your Bookora marketplace assistant! I can help you with account creation, author publishing (85% royalties), reading subscriptions, or browsing our **[Explore Catalog](#/explore)**. What would you like to know?";
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
      // Automatic fallback to built-in intelligence
    }

    if (!replyText) {
      replyText = this.getInstantBookoraResponse(userText);
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
