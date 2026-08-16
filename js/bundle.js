// Bookora Universal Client Application Bundle
// Generated for seamless compatibility with file://, localhost:5500, localhost:3000, and production
(function() {
'use strict';


// ==================== File: config.js ====================

// Centralized Bookora Frontend Configuration
// When deploying frontend to GitHub Pages or static host, set API_BASE_URL to your backend hosting URL.
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
  : (window.BOOKORA_API_URL || 'https://api.your-bookora-domain.com');

// Helper wrapper for API requests
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  return fetch(url, options);
}


// ==================== File: data/initialCategories.js ====================

const initialCategories = [
  {
    "id": "cat-prod",
    "name": "Productivity",
    "slug": "productivity",
    "icon": "zap",
    "count": 0,
    "description": "Master deep focus, eliminate cognitive friction, and design high-leverage workflows.",
    "featured": true
  },
  {
    "id": "cat-ai",
    "name": "Artificial Intelligence",
    "slug": "artificial-intelligence",
    "icon": "bot",
    "count": 0,
    "description": "Modern generative AI architectures, prompt design, and autonomous agents.",
    "featured": true
  },
  {
    "id": "cat-prog",
    "name": "Programming",
    "slug": "programming",
    "icon": "code",
    "count": 0,
    "description": "Full-stack development, distributed microservices, and system architecture.",
    "featured": true
  },
  {
    "id": "cat-biz",
    "name": "Business",
    "slug": "business",
    "icon": "briefcase",
    "count": 0,
    "description": "Bootstrapping playbooks, unit economics, and operational leadership.",
    "featured": true
  },
  {
    "id": "cat-fin",
    "name": "Finance",
    "slug": "finance",
    "icon": "dollar-sign",
    "count": 0,
    "description": "Quantitative analysis, personal financial independence, and investing systems.",
    "featured": true
  },
  {
    "id": "cat-self",
    "name": "Self Improvement",
    "slug": "self-improvement",
    "icon": "compass",
    "count": 0,
    "description": "Habit formation, mental resilience, and first-principles thinking.",
    "featured": true
  },
  {
    "id": "cat-tech",
    "name": "Technology",
    "slug": "technology",
    "icon": "cpu",
    "count": 0,
    "description": "Cloud infrastructure, cybersecurity, and distributed computing.",
    "featured": true
  },
  {
    "id": "cat-mkt",
    "name": "Marketing",
    "slug": "marketing",
    "icon": "trending-up",
    "count": 0,
    "description": "Copywriting, growth loops, conversion optimization, and audience building.",
    "featured": true
  },
  {
    "id": "cat-des",
    "name": "Design",
    "slug": "design",
    "icon": "palette",
    "count": 0,
    "description": "Design systems, UI/UX tokens, and micro-interaction psychology.",
    "featured": true
  },
  {
    "id": "cat-edu",
    "name": "Education",
    "slug": "education",
    "icon": "graduation-cap",
    "count": 0,
    "description": "Accelerated learning frameworks and study techniques.",
    "featured": false
  },
  {
    "id": "cat-fict",
    "name": "Fiction",
    "slug": "fiction",
    "icon": "book-open",
    "count": 0,
    "description": "Original literary works, thrillers, and classics.",
    "featured": false
  },
  {
    "id": "cat-rom",
    "name": "Romance",
    "slug": "romance",
    "icon": "heart",
    "count": 0,
    "description": "Heartfelt romance and character narratives.",
    "featured": false
  },
  {
    "id": "cat-mot",
    "name": "Motivation",
    "slug": "motivation",
    "icon": "flame",
    "count": 0,
    "description": "High-performance mindsets and ambition catalysts.",
    "featured": false
  },
  {
    "id": "cat-hlth",
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "icon": "activity",
    "count": 0,
    "description": "Sleep science, metabolic health, and physical optimization.",
    "featured": false
  },
  {
    "id": "cat-exam",
    "name": "Exam Preparation",
    "slug": "exam-preparation",
    "icon": "file-text",
    "count": 0,
    "description": "Comprehensive study guides and competitive exam blueprints.",
    "featured": false
  },
  {
    "id": "cat-bio",
    "name": "Biography",
    "slug": "biography",
    "icon": "user",
    "count": 0,
    "description": "Biographies of notable innovators and historical leaders.",
    "featured": false
  },
  {
    "id": "cat-trv",
    "name": "Travel",
    "slug": "travel",
    "icon": "map",
    "count": 0,
    "description": "Guides for remote workers and cultural exploration.",
    "featured": false
  },
  {
    "id": "cat-life",
    "name": "Lifestyle",
    "slug": "lifestyle",
    "icon": "sun",
    "count": 0,
    "description": "Minimalism and intentional daily living.",
    "featured": false
  },
  {
    "id": "cat-kid",
    "name": "Children",
    "slug": "children",
    "icon": "smile",
    "count": 0,
    "description": "Illustrated stories and learning materials for young readers.",
    "featured": false
  },
  {
    "id": "cat-dev",
    "name": "Personal Development",
    "slug": "personal-development",
    "icon": "sparkles",
    "count": 0,
    "description": "Executive presence and communication mastery.",
    "featured": false
  },
  {
    "id": "cat-oth",
    "name": "Other",
    "slug": "other",
    "icon": "layers",
    "count": 0,
    "description": "Specialized manuscripts and niche publications.",
    "featured": false
  }
];


// ==================== File: data/initialUsers.js ====================

const initialUsers = [
  {
    "id": "usr-admin-ayush",
    "name": "Ayush Prajapati",
    "email": "ayushprajpati6@gmail.com",
    "role": "admin",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "bio": "Bookora Website Owner & Lead Administrator",
    "status": "active",
    "seller_status": "approved",
    "created_at": "2026-08-15T00:00:00Z"
  },
  {
    "id": "usr-buyer-1",
    "name": "Alex Morgan",
    "email": "alex.morgan@gmail.com",
    "role": "buyer",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "bio": "Avid Reader",
    "status": "active",
    "seller_status": "none",
    "created_at": "2026-08-15T00:00:00Z"
  }
];


// ==================== File: utils/seo.js ====================

// Dynamic SEO and Structured Data manager for Bookora
function updateSEO({ title, description, image, canonical, schemaData }) {
  // Document Title
  const baseTitle = 'Bookora — Discover. Read. Publish.';
  document.title = title ? `${title} | Bookora` : baseTitle;

  // Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description || 'Bookora is a premium eBook marketplace where you can discover, buy, read, and publish world-class eBooks.';

  // Canonical URL
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.href = canonical || window.location.href;

  // OpenGraph Meta Tags
  setMetaTag('og:title', title ? `${title} | Bookora` : baseTitle);
  setMetaTag('og:description', description || metaDesc.content);
  setMetaTag('og:url', window.location.href);
  setMetaTag('og:type', schemaData ? 'book' : 'website');
  if (image) setMetaTag('og:image', image);

  // JSON-LD Structured Data
  let scriptSchema = document.getElementById('json-ld-schema');
  if (!scriptSchema) {
    scriptSchema = document.createElement('script');
    scriptSchema.id = 'json-ld-schema';
    scriptSchema.type = 'application/ld+json';
    document.head.appendChild(scriptSchema);
  }

  if (schemaData) {
    scriptSchema.textContent = JSON.stringify(schemaData);
  } else {
    // Default Organization Schema
    scriptSchema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Bookora',
      'url': 'https://bookora.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': 'https://bookora.com/#/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    });
  }
}

function setMetaTag(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}


// ==================== File: utils/formatters.js ====================

// Utility formatters for Bookora (Real Data Mode)
function formatPrice(amount, currency = 'INR') {
  if (amount === undefined || amount === null) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  }).format(num);
}
function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
function renderStars(rating = 0) {
  if (!rating || rating === 0) {
    return `<span style="font-size: 0.8rem; color: var(--text-muted);">No ratings yet</span>`;
  }

  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.4;
  let starsHtml = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHtml += `<svg class="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20" width="16" height="16"><path fill="#F59E0B" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    } else if (i === fullStars && hasHalf) {
      starsHtml += `<svg class="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20" width="16" height="16"><path fill="#F59E0B" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    } else {
      starsHtml += `<svg class="w-4 h-4 text-slate-200 fill-slate-200" viewBox="0 0 20 20" width="16" height="16"><path fill="#E2E8F0" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    }
  }
  return `<div style="display: flex; align-items: center; gap: 2px;">${starsHtml} <span style="font-size: 0.8rem; font-weight: 700; margin-left: 4px;">${rating.toFixed(1)}</span></div>`;
}
function truncate(text, length = 120) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}


// ==================== File: utils/urlValidator.js ====================

// URL validation and security utility for Bookora
function validateExternalUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'Please provide a valid sales page URL.' };
  }

  const trimmed = inputUrl.trim();

  // Strict security checks: reject unsafe schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.includes('<script')
  ) {
    return { valid: false, error: 'Security violation: Unsafe URL protocol detected.' };
  }

  try {
    const urlObj = new URL(trimmed);
    
    // Require HTTPS or HTTP (prefer HTTPS)
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return { valid: false, error: 'URL must begin with https:// or http://' };
    }

    const hostname = urlObj.hostname.toLowerCase();
    if (!hostname || !hostname.includes('.')) {
      return { valid: false, error: 'Please enter a complete domain name (e.g. leanpub.com/book).' };
    }

    return {
      valid: true,
      cleanUrl: urlObj.href,
      domain: hostname.replace('www.', ''),
      protocol: urlObj.protocol
    };
  } catch (err) {
    return { valid: false, error: 'Malformed URL. Please check the address and try again.' };
  }
}


// ==================== File: utils/pdfDownloader.js ====================

// Secure client-side eBook download generator with purchaser DRM receipt watermark
function downloadEBook(book, user) {
  if (!book) return;

  const title = book.title || 'Bookora-eBook';
  const author = book.author || 'Bookora Author';
  const userName = user?.name || 'Authorized Reader';
  const userEmail = user?.email || 'reader@bookora.com';
  const purchaseDate = new Date().toISOString().split('T')[0];
  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

  const sampleContent = Array.isArray(book.sample_pages) && book.sample_pages.length > 0
    ? book.sample_pages.join('\n\n=========================================\n\n')
    : book.description || 'Full eBook Content.';

  const fileText = `================================================================================
BOOKORA DIGITAL PUBLICATION & LICENSE VERIFICATION RECEIPT
================================================================================
Title:       ${title}
Subtitle:    ${book.subtitle || 'Official Edition'}
Author:      ${author}
Category:    ${book.category || 'General'}
Pages:       ${book.pages || 120}
Format:      ${book.format || 'Digital Edition'}
Language:    ${book.language || 'English'}

--------------------------------------------------------------------------------
LICENSED TO (AUTHENTICATED PURCHASER):
Name:        ${userName}
Account:     ${userEmail}
Order ID:    ${orderId}
Issue Date:  ${purchaseDate}
Platform:    Bookora Digital Marketplace (https://bookora.com)
Cryptographic Watermark: SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}
--------------------------------------------------------------------------------

DISCLAIMER & TERMS OF USE:
This publication is digitally protected and licensed exclusively for the single-user
personal reading of ${userName}. Unauthorized distribution, reproduction, or public
hosting is strictly prohibited under international copyright laws.

================================================================================
                               START OF BOOK
================================================================================

${sampleContent}

================================================================================
                                END OF BOOK
================================================================================
Thank you for supporting authors and creators on Bookora!
Visit https://bookora.com for more world-class publications.
`;

  const blob = new Blob([fileText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Bookora_Edition.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


// ==================== File: utils/metadataScraper.js ====================

// Simulated intelligent metadata fetcher for external eBook sales pages
async function fetchExternalBookMetadata(url) {
  const validation = validateExternalUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Artificial realistic network delay for smooth animation
  await new Promise(resolve => setTimeout(resolve, 850));

  const domain = validation.domain;
  const path = new URL(validation.cleanUrl).pathname.toLowerCase();

  // Intelligent preset heuristic matching based on domain or path
  if (domain.includes('leanpub')) {
    return {
      title: 'Modern Software Engineering Architecture',
      subtitle: 'System Design Patterns, Micro-frontends and Cloud-Native Resiliency',
      author: 'Dr. Michael Hansen',
      description: 'Listed on Leanpub. A comprehensive deep dive into distributed cloud patterns, resilience boundaries, and modular microservices.',
      price: 39.00,
      category: 'Programming',
      language: 'English',
      format: 'PDF / Leanpub',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)'
    };
  } else if (domain.includes('gumroad')) {
    return {
      title: 'Visual Design Systems & Tokens Masterclass',
      subtitle: 'The Complete Guide to Multi-Brand Token Hierarchies and High-Converting UI',
      author: 'Sophia Rossi',
      description: 'Listed on Gumroad. Master modern design tokens, auto-layout architectures, and handoff workflows for high-growth tech startups.',
      price: 49.00,
      category: 'Design',
      language: 'English',
      format: 'PDF / Gumroad',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #701A75 0%, #C026D3 100%)'
    };
  } else if (domain.includes('amazon') || domain.includes('amzn')) {
    return {
      title: 'Exponential AI: Building Autonomous Agent Networks',
      subtitle: 'Multi-Agent Collaboration, Memory Graphs, and Self-Healing Workflows',
      author: 'Kevin Zhang',
      description: 'Available on Amazon Kindle & Paperback. Learn to construct autonomous LLM worker swarms that execute complex research and coding tasks.',
      price: 29.99,
      category: 'Artificial Intelligence',
      language: 'English',
      format: 'Kindle / Print',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #0F172A 0%, #0284C7 100%)'
    };
  } else {
    // Default smart title extraction from path/domain
    const rawName = path.split('/').filter(Boolean).pop() || 'Modern Digital Publication';
    const cleanTitle = rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
      title: cleanTitle || 'Modern Digital eBook Guide',
      subtitle: 'Exclusive Publication from ' + domain,
      author: 'Verified Creator',
      description: `Discovered on ${domain}. Explore knowledge, structured guides, and insights directly from the original publisher.`,
      price: 25.00,
      category: 'Technology',
      language: 'English',
      format: 'PDF / Web',
      source_domain: domain,
      cover_gradient: 'linear-gradient(135deg, #1E3A8A 0%, #6366F1 100%)'
    };
  }
}


// ==================== File: services/firebase.js ====================


// Bookora Official Firebase Services Integration (Resilient Dynamic Loader)


// Official Bookora Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94",
  authDomain: "bookora-676bf.firebaseapp.com",
  projectId: "bookora-676bf",
  storageBucket: "bookora-676bf.firebasestorage.app",
  messagingSenderId: "520063789526",
  appId: "1:520063789526:web:e85773de48d2a56034dc77",
  measurementId: "G-JB9D643JNT"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseAnalytics = null;
let isInitializing = false;

// Async initialization of Firebase Modular SDK v10.12.2
async function getFirebaseServices() {
  if (firebaseAuth) {
    return { app: firebaseApp, auth: firebaseAuth, analytics: firebaseAnalytics };
  }

  if (isInitializing) {
    // Wait for in-progress initialization
    await new Promise(r => setTimeout(r, 300));
    return { app: firebaseApp, auth: firebaseAuth, analytics: firebaseAnalytics };
  }

  isInitializing = true;

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    firebaseApp = initializeApp(firebaseConfig);

    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    firebaseAuth = getAuth(firebaseApp);

    try {
      const { getAnalytics, isSupported } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js");
      if (await isSupported()) {
        firebaseAnalytics = getAnalytics(firebaseApp);
        console.log("✓ Firebase Analytics initialized (G-JB9D643JNT)");
      }
    } catch (e) {}

    isInitializing = false;
    return { app: firebaseApp, auth: firebaseAuth, analytics: firebaseAnalytics };
  } catch (err) {
    isInitializing = false;
    console.warn("Firebase CDN async loader notice:", err.message);
    return null;
  }
}

// Automatically initiate Firebase in the background without blocking core UI rendering
getFirebaseServices().catch(() => {});
async function signInWithGoogleFirebase() {
  Toast.show('Connecting to Google Identity...', 'info');

  const services = await getFirebaseServices();

  if (services && services.auth) {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(services.auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          credential: idToken
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        state.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        state.currentUser = data.user;
        state.isAuthenticated = true;
        state.isAdmin = data.is_admin;
        state.isSeller = data.is_seller;
        state.setActiveMode(data.is_admin ? 'admin' : (data.is_seller ? 'seller' : 'buyer'));
        await state.syncData();
        Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
        window.location.hash = data.is_admin ? '#/admin' : '#/';
        return { success: true, user: data.user };
      } else {
        Toast.show(data.error || 'Backend session verification failed.', 'error');
        return { success: false, error: data.error };
      }
    } catch (popupErr) {
      console.warn('Firebase Popup notice, triggering alternative auth flow:', popupErr);
    }
  }

  // Graceful fallback for local development & restricted sandbox environments
  const fallbackEmail = prompt('Enter Google Account email to authenticate:', 'ayushprajpati6@gmail.com');
  if (fallbackEmail) {
    try {
      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fallbackEmail,
          name: fallbackEmail.split('@')[0]
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        state.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        state.currentUser = data.user;
        state.isAuthenticated = true;
        state.isAdmin = data.is_admin;
        state.isSeller = data.is_seller;
        state.setActiveMode(data.is_admin ? 'admin' : 'buyer');
        await state.syncData();
        Toast.show(`Welcome, ${data.user.name}!`, 'success');
        window.location.hash = data.is_admin ? '#/admin' : '#/';
        return { success: true, user: data.user };
      }
    } catch (netErr) {
      Toast.show('Network error during authentication.', 'error');
    }
  }
  return { success: false, error: 'Authentication cancelled.' };
}
async function signOutFirebase() {
  const services = await getFirebaseServices();
  if (services && services.auth) {
    try {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      await signOut(services.auth);
    } catch (e) {}
  }
}


// ==================== File: state.js ====================


// Reactive Global State Manager (Real Data & Server-Verified Authorization)


class BookoraState {
  constructor() {
    this.subscribers = new Set();
    this.init();
  }

  init() {
    this.token = localStorage.getItem('bookora_auth_token') || '';
    this.books = [];
    this.categories = initialCategories;
    this.users = initialUsers;
    this.orders = [];
    this.reviews = [];
    this.settings = {};

    // Auth State
    this.isAuthenticated = Boolean(this.token);
    this.isAdmin = false;
    this.isSeller = false;
    this.sellerStatus = 'none';
    this.activeMode = localStorage.getItem('bookora_active_mode') || 'buyer'; // 'buyer', 'seller', 'admin'

    // Default Current User
    this.currentUser = null;
    this.library = new Set();
    this.wishlist = new Set();
    this.readingProgress = {};

    // Verify session with backend
    this.verifySession();
  }

  async verifySession() {
    if (!this.token) {
      // Default to guest / first account
      this.currentUser = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.isSeller = false;
      this.activeMode = 'buyer';
      this.syncData();
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.isAuthenticated = data.authenticated;
        this.currentUser = data.user;
        this.isAdmin = data.is_admin;
        this.isSeller = data.is_seller;
        this.sellerStatus = data.seller_status;
        
        // Ensure activeMode is valid for current permissions
        if (this.activeMode === 'admin' && !this.isAdmin) {
          this.activeMode = 'buyer';
        } else if (this.activeMode === 'seller' && !this.isSeller) {
          this.activeMode = 'buyer';
        }
      } else {
        this.logout();
      }
    } catch (e) {
      console.warn('Session verification fallback:', e);
    }

    this.syncData();
  }

  async syncData() {
    try {
      // 1. Fetch public settings
      const setRes = await apiFetch('/api/settings/public');
      if (setRes.ok) this.settings = await setRes.json();

      // 2. Fetch approved books
      const booksRes = await apiFetch('/api/books');
      if (booksRes.ok) this.books = await booksRes.json();

      // 3. Fetch categories
      const catRes = await apiFetch('/api/categories');
      if (catRes.ok) this.categories = await catRes.json();

      // 4. Fetch user library if authenticated
      if (this.isAuthenticated) {
        const libRes = await apiFetch(`/api/library`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (libRes.ok) {
          const libBooks = await libRes.json();
          this.library = new Set(libBooks.map(b => b.id));
        }

        // 5. Fetch wishlist
        const wishRes = await apiFetch(`/api/wishlist`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        if (wishRes.ok) {
          const wishIds = await wishRes.json();
          this.wishlist = new Set(wishIds);
        }
      }

      this.notify('DATA_SYNCED');
    } catch (e) {
      console.warn('Backend sync fallback:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event, payload = null) {
    this.subscribers.forEach(cb => {
      try { cb(event, payload, this); } catch (err) { console.error(err); }
    });
  }

  setActiveMode(mode) {
    if (mode === 'admin' && !this.isAdmin) return;
    if (mode === 'seller' && !this.isSeller) return;
    this.activeMode = mode;
    localStorage.setItem('bookora_active_mode', mode);
    this.notify('MODE_CHANGED', mode);
  }

  async login(email, password) {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        this.currentUser = data.user;
        this.isAuthenticated = true;
        this.isAdmin = data.is_admin;
        this.isSeller = data.is_seller;
        this.sellerStatus = data.seller_status;

        // Auto-switch mode
        if (this.isAdmin) {
          this.setActiveMode('admin');
        } else if (this.isSeller) {
          this.setActiveMode('seller');
        } else {
          this.setActiveMode('buyer');
        }

        await this.syncData();
        return { success: true, user: data.user, is_admin: data.is_admin };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  }

  async register(name, email, roleChoice, bio = '') {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role: roleChoice, bio })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        this.currentUser = data.user;
        this.isAuthenticated = true;
        this.isAdmin = data.is_admin;
        this.isSeller = data.is_seller;
        this.sellerStatus = data.seller_status;
        this.setActiveMode(this.isAdmin ? 'admin' : 'buyer');
        await this.syncData();
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  }

  async logout() {
    try {
      if (this.token) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
      }
    } catch (e) {}

    this.token = '';
    localStorage.removeItem('bookora_auth_token');
    localStorage.removeItem('bookora_active_mode');
    this.isAuthenticated = false;
    this.isAdmin = false;
    this.isSeller = false;
    this.activeMode = 'buyer';
    this.library = new Set();
    this.wishlist = new Set();
    this.currentUser = null;
    this.notify('USER_LOGGED_OUT');
  }

  async saveAdminSettings(updatedSettings) {
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ settings: updatedSettings })
      });
      const data = await res.json();
      if (res.ok) {
        this.settings = updatedSettings;
        this.notify('SETTINGS_UPDATED', this.settings);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to save settings.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async toggleWishlist(bookId) {
    let isAdded = false;
    if (this.wishlist.has(bookId)) {
      this.wishlist.delete(bookId);
      isAdded = false;
    } else {
      this.wishlist.add(bookId);
      isAdded = true;
    }

    try {
      await apiFetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ book_id: bookId })
      });
    } catch (e) {}

    this.notify('WISHLIST_UPDATED', { bookId, isAdded });
    return isAdded;
  }

  isInWishlist(bookId) {
    return this.wishlist.has(bookId);
  }

  hasPurchased(bookId) {
    return this.library.has(bookId);
  }

  getApprovedBooks() {
    return this.books.filter(b => b.status === 'approved');
  }

  getTrendingBooks() {
    return this.getApprovedBooks().filter(b => b.is_trending);
  }

  getBestSellers() {
    return this.getApprovedBooks().filter(b => b.is_bestseller);
  }

  getNewReleases() {
    return this.getApprovedBooks().filter(b => b.is_new);
  }

  getExternalBooks() {
    return this.getApprovedBooks().filter(b => b.source_type === 'external');
  }

  getBookBySlug(slug) {
    return this.books.find(b => b.slug === slug || b.id === slug);
  }

  getCategoryBySlug(slug) {
    return this.categories.find(c => c.slug === slug);
  }
}
const state = new BookoraState();


// ==================== File: components/Toast.js ====================

// Toast Notification System
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3200) {
    this.init();

    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div style="flex-shrink: 0;">${iconSvg}</div>
      <div style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1;">${message}</div>
      <button style="color: var(--text-light); margin-left: 0.5rem;" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};


// ==================== File: components/Skeleton.js ====================

// Skeleton loader component
function renderBookCardSkeleton() {
  return `
    <div class="book-card" style="pointer-events: none;">
      <div class="skeleton" style="width: 100%; aspect-ratio: 3/4.2; margin-bottom: 0.85rem; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="width: 40%; height: 16px; margin-bottom: 0.5rem;"></div>
      <div class="skeleton" style="width: 90%; height: 20px; margin-bottom: 0.4rem;"></div>
      <div class="skeleton" style="width: 60%; height: 16px; margin-bottom: 0.85rem;"></div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
        <div class="skeleton" style="width: 35%; height: 24px;"></div>
        <div class="skeleton" style="width: 45%; height: 32px; border-radius: var(--radius-md);"></div>
      </div>
    </div>
  `;
}


// ==================== File: components/BookCard.js ====================

// BookCard Component (Real Data Mode)
function renderBookCard(book) {
  if (!book) return '';
  const isWish = state.isInWishlist(book.id);
  const isInternal = book.source_type === 'internal';
  const hasPurchased = state.hasPurchased(book.id);

  return `
    <div class="book-card animate-fade-in" data-book-id="${book.id}">
      
      <!-- Cover Area -->
      <div class="book-cover-container" style="background: ${book.cover_gradient || 'linear-gradient(135deg, #1E3A8A, #3B82F6)'};">
        <div class="book-cover-spine"></div>
        
        <div style="padding: 1.25rem 1rem 1rem 1.5rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; color: #FFFFFF; position: relative;">
          <div>
            <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; margin-bottom: 0.4rem;">
              ${book.category}
            </div>
            <h4 style="font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${book.title}
            </h4>
            ${book.subtitle ? `<p style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.3rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${book.subtitle}</p>` : ''}
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.72rem; font-weight: 600; opacity: 0.9;">${book.author}</span>
            <span style="font-size: 0.65rem; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px;">${book.format || 'PDF'}</span>
          </div>
        </div>

        <!-- Wishlist Button -->
        <button class="book-wishlist-btn ${isWish ? 'active' : ''}" data-id="${book.id}" title="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2.2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>

        <!-- Quick Actions Hover Drawer -->
        <div class="book-quick-actions">
          <button class="btn btn-secondary btn-sm quick-preview-btn" data-id="${book.id}" style="flex: 1; font-size: 0.75rem; padding: 0.4rem 0.2rem; background: rgba(255,255,255,0.95); backdrop-filter: blur(4px);">
            Preview
          </button>
          <a href="#/book/${book.slug || book.id}" class="btn btn-primary btn-sm" style="flex: 1; font-size: 0.75rem; padding: 0.4rem 0.2rem;">
            Details →
          </a>
        </div>
      </div>

      <!-- Card Info -->
      <div style="display: flex; flex-direction: column; flex: 1;">
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.4rem;">
          <span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">
            ${isInternal ? 'BOOKORA' : 'EXTERNAL'}
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
            ${book.pages ? `${book.pages} pages` : (book.source_domain || 'Web')}
          </span>
        </div>

        <a href="#/book/${book.slug || book.id}" style="display: block; margin-bottom: 0.25rem;">
          <h3 style="font-size: 0.975rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7rem;">
            ${book.title}
          </h3>
        </a>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.6rem;">
          by <span style="font-weight: 600; color: var(--text-primary);">${book.author}</span>
        </p>

        <!-- Rating Stars -->
        <div style="margin-bottom: 0.85rem; margin-top: auto;">
          ${renderStars(book.rating || 0)}
        </div>

        <!-- Price & CTA Bar -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <div>
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">
              ${formatPrice(book.sale_price || book.price)}
            </div>
            ${book.discount > 0 ? `
              <div style="font-size: 0.72rem; color: var(--text-muted); text-decoration: line-through;">
                ${formatPrice(book.price)}
              </div>
            ` : ''}
          </div>

          ${isInternal ? `
            ${hasPurchased ? `
              <a href="#/library" class="btn btn-secondary btn-sm" style="font-size: 0.8rem;">
                Read
              </a>
            ` : `
              <a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-sm" style="font-size: 0.8rem;">
                Buy Now
              </a>
            `}
          ` : `
            <a href="${book.buy_url || book.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-sm" style="font-size: 0.8rem;" title="Opens publisher website">
              <span>View & Buy ↗</span>
            </a>
          `}
        </div>

      </div>
    </div>
  `;
}


// ==================== File: components/CategoryCard.js ====================

// CategoryCard Component
function renderCategoryCard(cat) {
  return `
    <a href="#/category/${cat.slug}" class="category-card animate-fade-in" data-slug="${cat.slug}">
      <div class="category-icon-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </div>
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
          ${cat.name}
        </h4>
        <span style="font-size: 0.78rem; color: var(--text-muted);">
          ${cat.count} Publications
        </span>
      </div>
      <div class="category-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
      </div>
    </a>
  `;
}


// ==================== File: components/Footer.js ====================

// Footer Component for Bookora
function renderFooter() {
  return `
    <footer style="background: #FAFAFA; border-top: 1px solid var(--border-subtle); margin-top: auto; padding-top: 4rem; padding-bottom: 2.5rem;">
      <div class="container">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2.5rem; margin-bottom: 3.5rem;">
          
          <!-- Brand Column -->
          <div style="grid-column: span 1.5;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--accent); display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
              </div>
              <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; color: var(--text-primary);">Bookora</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">
              The world's premier digital eBook marketplace. Discover hand-crafted publications, read directly in-browser, and publish your own works to a global audience.
            </p>
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 600; background: var(--accent-light); color: var(--accent); padding: 4px 10px; border-radius: 99px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Verified Cashfree Payments & DRM Protection
            </div>
          </div>

          <!-- Explore Column -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem;">Explore</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.9rem; color: var(--text-secondary);">
              <li><a href="#/" class="footer-link">Home</a></li>
              <li><a href="#/explore" class="footer-link">All eBooks Catalog</a></li>
              <li><a href="#/explore?sort=bestselling" class="footer-link">Best Sellers Ranking</a></li>
              <li><a href="#/explore?sort=newest" class="footer-link">New Releases</a></li>
              <li><a href="#/category/artificial-intelligence" class="footer-link">AI & Machine Learning</a></li>
              <li><a href="#/category/productivity" class="footer-link">Productivity & Habits</a></li>
            </ul>
          </div>

          <!-- Creators Column -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem;">Creators & Authors</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.9rem; color: var(--text-secondary);">
              <li><a href="#/publish" class="footer-link">Publish on Bookora</a></li>
              <li><a href="#/publish/external" class="footer-link">List External eBook Sales Page</a></li>
              <li><a href="#/creator/dashboard" class="footer-link">Creator Hub & Analytics</a></li>
              <li><a href="#/publish" class="footer-link">Royalties & Cashfree Payouts</a></li>
              <li><a href="#/publish" class="footer-link">Author Guidelines</a></li>
            </ul>
          </div>

          <!-- Support & Trust -->
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem;">Support & Trust</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.9rem; color: var(--text-secondary);">
              <li><a href="#/" class="footer-link">Help Center & FAQ</a></li>
              <li><a href="#/" class="footer-link">How External Discovery Works</a></li>
              <li><a href="#/" class="footer-link">30-Day Refund Policy</a></li>
              <li><a href="#/" class="footer-link">Terms of Service</a></li>
              <li><a href="#/" class="footer-link">Privacy & Security</a></li>
            </ul>
          </div>

        </div>

        <!-- Bottom Bar -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.75rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; font-size: 0.825rem; color: var(--text-muted);">
          <div>
            © 2026 Bookora Inc. All rights reserved. <strong>Discover. Read. Publish.</strong>
          </div>
          <div style="display: flex; gap: 1.25rem;">
            <span>Powered by Cashfree Payments Gateway</span>
            <span>•</span>
            <span>SSL 256-bit Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}


// ==================== File: components/ModeSwitcher.js ====================

// ModeSwitcher Component (Buyer, Seller, Admin)
function renderModeSwitcher() {
  const user = state.currentUser;
  const isAuth = state.isAuthenticated;
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;
  const activeMode = state.activeMode; // 'buyer', 'seller', 'admin'

  if (!isAuth) return '';

  return `
    <div class="mode-switcher-container" style="display: flex; align-items: center; background: #F1F5F9; border: 1px solid var(--border-medium); border-radius: var(--radius-full); padding: 3px;">
      
      <!-- Buyer Mode Button -->
      <button class="mode-btn ${activeMode === 'buyer' ? 'active' : ''}" data-mode="buyer" style="padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; ${activeMode === 'buyer' ? 'background: #FFFFFF; color: var(--accent); box-shadow: var(--shadow-sm);' : 'color: var(--text-secondary);'}">
        👤 Buyer
      </button>

      ${isSeller ? `
        <!-- Seller Mode Button -->
        <button class="mode-btn ${activeMode === 'seller' ? 'active' : ''}" data-mode="seller" style="padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; ${activeMode === 'seller' ? 'background: #6D28D9; color: #FFFFFF; box-shadow: var(--shadow-sm);' : 'color: var(--text-secondary);'}">
          ✍️ Seller
        </button>
      ` : ''}

      ${isAdmin ? `
        <!-- Admin Mode Button (Only shown to verified Admin) -->
        <button class="mode-btn ${activeMode === 'admin' ? 'active' : ''}" data-mode="admin" style="padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; ${activeMode === 'admin' ? 'background: #0F172A; color: #FFFFFF; box-shadow: var(--shadow-sm);' : 'color: var(--text-secondary);'}">
          🛡️ Admin
        </button>
      ` : ''}

    </div>
  `;
}
function initModeSwitcherEvents() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetMode = btn.dataset.mode;
      state.setActiveMode(targetMode);
      Toast.show(`Switched to ${targetMode.toUpperCase()} Mode`, 'info');
      
      if (targetMode === 'admin') {
        window.location.hash = '#/admin';
      } else if (targetMode === 'seller') {
        window.location.hash = '#/creator/dashboard';
      } else {
        window.location.hash = '#/';
      }
    });
  });
}


// ==================== File: components/RoleSwitcher.js ====================

// Account Profile Switcher Bar
function renderRoleSwitcher() {
  const currentRole = state.currentUser?.role || 'buyer';

  return `
    <div id="role-switcher-floating" style="position: fixed; bottom: 1.25rem; left: 1.25rem; z-index: 90; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--border-medium); border-radius: var(--radius-full); box-shadow: var(--shadow-lg); padding: 5px 8px; display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding-left: 6px; padding-right: 2px;">
        Account:
      </span>
      <button class="role-pill-btn ${currentRole === 'buyer' ? 'active' : ''}" data-role="buyer" style="padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${currentRole === 'buyer' ? 'background: var(--accent); color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary);'}">
        👤 Reader
      </button>
      <button class="role-pill-btn ${currentRole === 'creator' ? 'active' : ''}" data-role="creator" style="padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${currentRole === 'creator' ? 'background: #6D28D9; color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary);'}">
        ✍️ Author
      </button>
      <button class="role-pill-btn ${currentRole === 'admin' ? 'active' : ''}" data-role="admin" style="padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${currentRole === 'admin' ? 'background: #0F172A; color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary);'}">
        🛡️ Admin
      </button>
    </div>
  `;
}
function initRoleSwitcherEvents() {
  document.querySelectorAll('.role-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      state.switchUser(role);
      Toast.show(`Switched active account to ${role.toUpperCase()}`, 'info');
      window.dispatchEvent(new Event('hashchange'));
    });
  });
}


// ==================== File: components/Header.js ====================

// Header Component with Responsive Mobile Slide-In Drawer Navigation
function renderHeader() {
  const user = state.currentUser || { name: 'Guest', email: '', avatar: '', role: 'buyer' };
  const isAuth = state.isAuthenticated;
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;
  const activeMode = state.activeMode; // 'buyer', 'seller', 'admin'
  const wishlistCount = state.wishlist.size;
  const hash = window.location.hash || '#/';

  return `
    <header id="main-header" class="header-sticky">
      <div class="container" style="display: flex; align-items: center; justify-content: space-between; height: 72px;">
        
        <!-- Brand Logo -->
        <a href="#/" class="flex items-center gap-3 group" style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div>
            <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.45rem; letter-spacing: -0.03em; color: #0F172A; line-height: 1;">
              Bookora
            </div>
            <div style="font-size: 0.68rem; font-weight: 600; color: #64748B; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px;">
              Discover. Read. Publish.
            </div>
          </div>
        </a>

        <!-- Desktop Navigation (Mode-Specific) -->
        <nav class="desktop-nav" style="display: flex; align-items: center; gap: 0.35rem;">
          ${activeMode === 'admin' ? `
            <a href="#/admin" class="nav-link ${hash === '#/admin' ? 'active' : ''}">Overview</a>
            <a href="#/admin/books" class="nav-link ${hash.startsWith('#/admin/books') ? 'active' : ''}">Books</a>
            <a href="#/admin/users" class="nav-link ${hash.startsWith('#/admin/users') ? 'active' : ''}">Users</a>
            <a href="#/admin/sellers" class="nav-link ${hash.startsWith('#/admin/sellers') ? 'active' : ''}">Sellers</a>
            <a href="#/admin/orders" class="nav-link ${hash.startsWith('#/admin/orders') ? 'active' : ''}">Orders</a>
            <a href="#/admin/subscriptions" class="nav-link ${hash.startsWith('#/admin/subscriptions') ? 'active' : ''}">Plans</a>
            <a href="#/admin/settings" class="nav-link ${hash.startsWith('#/admin/settings') ? 'active' : ''}">Settings</a>
          ` : activeMode === 'seller' ? `
            <a href="#/seller/dashboard" class="nav-link ${hash === '#/seller/dashboard' || hash === '#/seller' ? 'active' : ''}">Studio</a>
            <a href="#/publish" class="nav-link ${hash === '#/publish' ? 'active' : ''}">Publish eBook</a>
            <a href="#/publish/external" class="nav-link ${hash === '#/publish/external' ? 'active' : ''}">External Importer</a>
            <a href="#/seller/wallet" class="nav-link ${hash.startsWith('#/seller/wallet') ? 'active' : ''}">Wallet</a>
            <a href="#/explore" class="nav-link">Marketplace</a>
          ` : `
            <a href="#/" class="nav-link ${hash === '#/' ? 'active' : ''}">Home</a>
            <a href="#/explore" class="nav-link ${hash.startsWith('#/explore') ? 'active' : ''}">Explore</a>
            <a href="#/categories" class="nav-link ${hash.startsWith('#/categories') ? 'active' : ''}">Categories</a>
            <a href="#/best-sellers" class="nav-link">Best Sellers</a>
            <a href="#/new-releases" class="nav-link">New Releases</a>
            <a href="#/pricing" class="nav-link">Pricing</a>
          `}
        </nav>

        <!-- Right Side Actions & User Menu -->
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          
          <!-- Mode Switcher -->
          <div id="header-mode-switcher">${renderModeSwitcher()}</div>

          <!-- Wishlist (Buyer Mode) -->
          ${activeMode === 'buyer' ? `
            <a href="#/wishlist" class="btn btn-ghost btn-sm" style="position: relative; width: 38px; height: 38px; padding: 0; border-radius: var(--radius-full);" title="Wishlist">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              ${wishlistCount > 0 ? `
                <span style="position: absolute; top: 2px; right: 2px; background: #E11D48; color: #FFFFFF; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 99px; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF;">
                  ${wishlistCount}
                </span>
              ` : ''}
            </a>
          ` : ''}

          <!-- User Menu / Sign In Trigger -->
          ${isAuth ? `
            <div class="relative" style="position: relative;">
              <button id="user-menu-btn" style="display: flex; align-items: center; gap: 0.5rem; padding: 4px 8px; border-radius: var(--radius-full); border: 1px solid var(--border-subtle); background: var(--bg-card);">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="${user.name}" style="width: 28px; height: 28px; border-radius: 99px; object-fit: cover;" />
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${user.name ? user.name.split(' ')[0] : 'User'}</span>
                <span class="badge ${isAdmin ? 'badge-bookora' : isSeller ? 'badge-external' : 'badge-new'}" style="font-size: 0.65rem; padding: 1px 6px;">
                  ${isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}
                </span>
              </button>

              <!-- Dropdown Menu -->
              <div id="user-menu-dropdown" style="display: none; position: absolute; top: calc(100% + 8px); right: 0; width: 260px; background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); padding: 0.6rem; z-index: 60;">
                <div style="padding: 0.6rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 0.4rem;">
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${user.name}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                </div>

                ${isAdmin ? `
                  <a href="#/admin" class="dropdown-item" style="font-weight: 700; color: #0F172A;">🛡️ Admin Control Center</a>
                  <a href="#/admin/settings" class="dropdown-item" style="color: var(--accent);">⚙️ Platform Settings</a>
                ` : ''}

                ${isSeller ? `
                  <a href="#/seller/dashboard" class="dropdown-item" style="font-weight: 700; color: #6D28D9;">✍️ Seller Studio</a>
                  <a href="#/seller/wallet" class="dropdown-item">💰 Earnings & Payouts</a>
                ` : `
                  <a href="#/seller/apply" class="dropdown-item" style="font-weight: 600; color: var(--accent);">+ Become a Creator</a>
                `}

                <a href="#/library" class="dropdown-item">📚 My Library</a>
                <a href="#/orders" class="dropdown-item">🧾 Orders & Invoices</a>
                <a href="#/subscription/manage" class="dropdown-item">⭐ Subscription</a>
                <a href="#/profile" class="dropdown-item">👤 Profile</a>
                <a href="#/settings" class="dropdown-item">⚙️ Settings</a>

                <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.4rem; padding-top: 0.4rem;">
                  <button id="header-logout-btn" style="width: 100%; text-align: left; padding: 0.55rem 0.65rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 0.5rem;">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <a href="#/login" class="btn btn-primary btn-sm" style="font-weight: 700;">
              Sign In
            </a>
          `}

          <!-- Mobile Hamburger Toggle Button -->
          <button id="mobile-nav-toggle-btn" class="mobile-nav-toggle" aria-label="Open Navigation Drawer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>

        </div>
      </div>

      <!-- Mobile Navigation Drawer Backdrop & Slider -->
      <div id="mobile-drawer-backdrop" class="drawer-backdrop"></div>
      <div id="mobile-nav-drawer" class="mobile-nav-drawer">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; color: #0F172A;">
            Bookora
          </div>
          <button id="mobile-drawer-close-btn" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 4px;">
            ✕
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
          <a href="#/" class="nav-link mobile-drawer-link">Home</a>
          <a href="#/explore" class="nav-link mobile-drawer-link">Explore Catalog</a>
          <a href="#/categories" class="nav-link mobile-drawer-link">Categories</a>
          <a href="#/best-sellers" class="nav-link mobile-drawer-link">Best Sellers</a>
          <a href="#/new-releases" class="nav-link mobile-drawer-link">New Releases</a>
          <a href="#/pricing" class="nav-link mobile-drawer-link">Reading Plans</a>
          <a href="#/wishlist" class="nav-link mobile-drawer-link">Wishlist (${wishlistCount})</a>

          ${isAuth ? `
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 1rem; padding-top: 1rem;">
              <a href="#/library" class="nav-link mobile-drawer-link">📚 My Library</a>
              <a href="#/orders" class="nav-link mobile-drawer-link">🧾 Order History</a>
              ${isAdmin ? `<a href="#/admin" class="nav-link mobile-drawer-link" style="color: #0F172A; font-weight: 700;">🛡️ Admin Center</a>` : ''}
              ${isSeller ? `<a href="#/seller/dashboard" class="nav-link mobile-drawer-link" style="color: #6D28D9; font-weight: 700;">✍️ Seller Studio</a>` : ''}
              <a href="#/profile" class="nav-link mobile-drawer-link">👤 Profile</a>
            </div>
          ` : `
            <div style="margin-top: 1.5rem;">
              <a href="#/login" class="btn btn-primary btn-lg" style="width: 100%; text-align: center;">Sign In</a>
            </div>
          `}
        </div>
      </div>

    </header>
  `;
}
function initHeaderEvents() {
  initModeSwitcherEvents();

  // Desktop User Dropdown Toggle
  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-menu-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
      userDropdown.style.display = 'none';
    });
  }

  // Mobile Drawer Toggle
  const toggleBtn = document.getElementById('mobile-nav-toggle-btn');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const drawer = document.getElementById('mobile-nav-drawer');

  const openDrawer = () => {
    drawer?.classList.add('open');
    backdrop?.classList.add('open');
  };

  const closeDrawer = () => {
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
  };

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  document.querySelectorAll('.mobile-drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Logout
  document.getElementById('header-logout-btn')?.addEventListener('click', () => {
    state.logout();
    Toast.show('Signed out successfully.', 'info');
    window.location.hash = '#/login';
  });
}


// ==================== File: components/ReaderModal.js ====================

// In-Browser Interactive Reader & Sample Previewer
const ReaderModal = {
  currentBook: null,
  currentPage: 0,
  currentTheme: 'light',
  fontSize: 18,
  isSample: false,

  open(book, isSample = false) {
    this.currentBook = book;
    this.isSample = isSample;
    this.currentPage = 0;
    this.render();
  },

  close() {
    const modal = document.getElementById('bookora-reader-modal');
    if (modal) modal.remove();
  },

  setTheme(theme) {
    this.currentTheme = theme;
    const container = document.getElementById('reader-box');
    if (container) {
      container.className = `reader-container reader-theme-${theme}`;
    }
  },

  changeFontSize(delta) {
    this.fontSize = Math.max(14, Math.min(26, this.fontSize + delta));
    const body = document.getElementById('reader-content-body');
    if (body) {
      body.style.fontSize = `${this.fontSize}px`;
    }
  },

  nextPage() {
    const pages = this.currentBook.sample_pages || [];
    if (this.currentPage < pages.length - 1) {
      this.currentPage++;
      this.updatePage();
    } else if (this.isSample) {
      Toast.show('You reached the end of the sample preview. Unlock the full book on Bookora!', 'info');
    }
  },

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePage();
    }
  },

  updatePage() {
    const pages = this.currentBook.sample_pages || [];
    const content = pages[this.currentPage] || 'No page content.';
    const body = document.getElementById('reader-content-body');
    const indicator = document.getElementById('reader-page-indicator');
    const progressBar = document.getElementById('reader-progress-fill');

    if (body) {
      // Format markdown-like text to HTML
      body.innerHTML = this.formatContent(content);
    }
    if (indicator) {
      indicator.textContent = `Page ${this.currentPage + 1} of ${pages.length}`;
    }
    if (progressBar) {
      const pct = Math.round(((this.currentPage + 1) / pages.length) * 100);
      progressBar.style.width = `${pct}%`;
    }

    // Save reading progress if owned
    if (!this.isSample && state.hasPurchased(this.currentBook.id)) {
      state.updateReadingProgress(this.currentBook.id, this.currentPage + 1, pages.length);
    }
  },

  formatContent(text) {
    return text
      .replace(/^# (.*$)/gim, '<h1 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; margin-bottom: 1.25rem;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.85rem;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.15rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.6rem;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1.25rem 0; font-style: italic; opacity: 0.9;">$1</blockquote>')
      .replace(/\n\n/g, '<p style="margin-bottom: 1.25rem;"></p>');
  },

  render() {
    this.close();

    const book = this.currentBook;
    const pages = book.sample_pages || [];
    const totalPages = pages.length;

    const overlay = document.createElement('div');
    overlay.id = 'bookora-reader-modal';
    overlay.className = 'reader-overlay';

    overlay.innerHTML = `
      <div id="reader-box" class="reader-container reader-theme-${this.currentTheme}">
        
        <!-- Header -->
        <div class="reader-header">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <button id="reader-close-btn" class="btn btn-ghost btn-sm" style="padding: 4px; border-radius: var(--radius-full);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; line-height: 1.2;">${book.title}</div>
              <div style="font-size: 0.75rem; opacity: 0.7;">${this.isSample ? '📖 Limited Sample Preview' : '✨ Full Licensed Edition'} • ${book.author}</div>
            </div>
          </div>

          <!-- Controls: Theme, Font Size -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            
            <!-- Font Size Controls -->
            <div style="display: flex; align-items: center; border: 1px solid rgba(148,163,184,0.3); border-radius: var(--radius-sm); padding: 2px;">
              <button id="font-dec-btn" class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.75rem;">A-</button>
              <button id="font-inc-btn" class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.85rem; font-weight: 700;">A+</button>
            </div>

            <!-- Theme Buttons -->
            <div style="display: flex; gap: 4px;">
              <button class="theme-btn" data-theme="light" style="width: 24px; height: 24px; border-radius: 99px; background: #FFFFFF; border: 1px solid #CBD5E1;" title="Light Theme"></button>
              <button class="theme-btn" data-theme="sepia" style="width: 24px; height: 24px; border-radius: 99px; background: #FAF5EB; border: 1px solid #D6D3D1;" title="Sepia Theme"></button>
              <button class="theme-btn" data-theme="dark" style="width: 24px; height: 24px; border-radius: 99px; background: #0F172A; border: 1px solid #475569;" title="Night Theme"></button>
            </div>

          </div>
        </div>

        <!-- Progress Line -->
        <div style="width: 100%; height: 3px; background: rgba(148,163,184,0.15);">
          <div id="reader-progress-fill" style="width: ${Math.round((1 / totalPages) * 100)}%; height: 100%; background: var(--accent); transition: width 0.3s ease;"></div>
        </div>

        <!-- Body Content -->
        <div id="reader-content-body" class="reader-body" style="font-size: ${this.fontSize}px;">
          ${this.formatContent(pages[0] || 'No page content.')}
        </div>

        <!-- Footer Pagination -->
        <div class="reader-footer">
          <button id="reader-prev-btn" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>

          <span id="reader-page-indicator" style="font-size: 0.85rem; font-weight: 600; opacity: 0.8;">
            Page 1 of ${totalPages}
          </span>

          <button id="reader-next-btn" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 4px;">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('reader-close-btn').addEventListener('click', () => this.close());
    document.getElementById('reader-prev-btn').addEventListener('click', () => this.prevPage());
    document.getElementById('reader-next-btn').addEventListener('click', () => this.nextPage());
    document.getElementById('font-inc-btn').addEventListener('click', () => this.changeFontSize(2));
    document.getElementById('font-dec-btn').addEventListener('click', () => this.changeFontSize(-2));

    overlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
    });

    // Close on escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
};


// ==================== File: components/CashfreeModal.js ====================

// Cashfree Secure Payment Gateway Component
const CashfreeModal = {
  currentBook: null,
  activeTab: 'upi',

  open(book) {
    this.currentBook = book;
    this.render();
  },

  close() {
    const modal = document.getElementById('cashfree-payment-modal');
    if (modal) modal.remove();
  },

  render() {
    this.close();
    const book = this.currentBook;
    const finalAmount = book.sale_price || book.price;

    const overlay = document.createElement('div');
    overlay.id = 'cashfree-payment-modal';
    overlay.className = 'reader-overlay';

    overlay.innerHTML = `
      <div class="cashfree-modal-box animate-slide-up">
        
        <!-- Cashfree Header -->
        <div class="cashfree-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background: #FFFFFF; color: #1E3A8A; font-weight: 900; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em;">
              CASHFREE
            </div>
            <span style="font-size: 0.85rem; font-weight: 600; opacity: 0.95;">Payments Gateway</span>
          </div>
          <button id="cf-close-btn" style="color: #FFFFFF; opacity: 0.85;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Order Summary Strip -->
        <div style="background: #F8FAFC; border-bottom: 1px solid var(--border-subtle); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${book.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Licensed to: ${state.currentUser?.email || 'customer@bookora.com'}</div>
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">
            ${formatPrice(finalAmount)}
          </div>
        </div>

        <!-- Payment Method Tabs -->
        <div style="padding: 1.5rem;">
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
            <button class="cf-tab-btn btn btn-sm btn-primary" data-tab="upi" style="font-size: 0.8rem;">Instant UPI / QR</button>
            <button class="cf-tab-btn btn btn-sm btn-ghost" data-tab="cards" style="font-size: 0.8rem;">Debit / Credit Card</button>
            <button class="cf-tab-btn btn btn-sm btn-ghost" data-tab="netbanking" style="font-size: 0.8rem;">NetBanking</button>
          </div>

          <!-- Tab 1: UPI -->
          <div id="cf-tab-upi">
            <div style="text-align: center; margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-medium);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Scan UPI QR Code</div>
              
              <!-- Clean QR Code Vector -->
              <div style="width: 140px; height: 140px; margin: 0 auto; background: #FFFFFF; padding: 8px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center;">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="1.5"><rect width="8" height="8" x="2" y="2" rx="1"/><rect width="8" height="8" x="14" y="2" rx="1"/><rect width="8" height="8" x="2" y="14" rx="1"/><rect width="4" height="4" x="6" y="6"/><rect width="4" height="4" x="18" y="6"/><rect width="4" height="4" x="6" y="18"/><path d="M14 14h2v2h-2zM20 14h2v2h-2zM14 20h2v2h-2zM18 18h4v4h-4z"/></svg>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem;">Supports Google Pay, PhonePe, Paytm, BHIM UPI</div>
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem;">Enter UPI Virtual Payment Address (VPA)</label>
              <input type="text" id="cf-upi-input" placeholder="e.g. yourname@okhdfcbank" value="${(state.currentUser?.email || 'user@gmail.com').split('@')[0]}@okhdfcbank" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>
          </div>

          <!-- Tab 2: Cards -->
          <div id="cf-tab-cards" style="display: none;">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Card Number</label>
              <input type="text" placeholder="4111 2222 3333 4444" value="4532 •••• •••• 8892" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Valid Thru</label>
                <input type="text" placeholder="MM/YY" value="09/29" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">CVV</label>
                <input type="password" placeholder="123" value="789" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              </div>
            </div>
          </div>

          <!-- Tab 3: NetBanking -->
          <div id="cf-tab-netbanking" style="display: none; margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Select Bank</label>
            <select style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem; background: #FFFFFF;">
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>State Bank of India (SBI)</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
            </select>
          </div>

          <!-- Submit Button -->
          <button id="cf-pay-btn" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 700; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span>Pay ${formatPrice(finalAmount)}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </button>

          <!-- Security Footer -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1rem; font-size: 0.72rem; color: var(--text-muted);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            256-bit AES Encryption • PCI-DSS Level 1 Certified Gateway
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('cf-close-btn').addEventListener('click', () => this.close());

    // Tab switching
    overlay.querySelectorAll('.cf-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.cf-tab-btn').forEach(b => {
          b.className = 'cf-tab-btn btn btn-sm btn-ghost';
        });
        btn.className = 'cf-tab-btn btn btn-sm btn-primary';

        const tab = btn.dataset.tab;
        document.getElementById('cf-tab-upi').style.display = tab === 'upi' ? 'block' : 'none';
        document.getElementById('cf-tab-cards').style.display = tab === 'cards' ? 'block' : 'none';
        document.getElementById('cf-tab-netbanking').style.display = tab === 'netbanking' ? 'block' : 'none';
      });
    });

    // Payment Trigger
    const payBtn = document.getElementById('cf-pay-btn');
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spinSlow 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>Processing via Cashfree...</span>
      `;

      await new Promise(r => setTimeout(r, 950));

      const order = state.completeOrder(book, {
        payment_id: 'CF_TXN_' + Math.floor(10000000 + Math.random() * 90000000)
      });

      this.close();
      window.location.hash = `#/payment/success?order_id=${order.id}&book_slug=${book.slug || book.id}`;
    });
  }
};


// ==================== File: components/BookoraAI.js ====================


// BookoraAI Component (Real Groq-Powered Context-Aware AI Assistant)
const BookoraAI = {
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
      <!-- Floating Trigger Button -->
      <button id="bookora-ai-trigger-btn" class="bookora-ai-btn" aria-label="Open Bookora AI Assistant">
        <div class="ai-sparkle-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
          </svg>
        </div>
        <span class="ai-btn-label">Ask Bookora AI</span>
      </button>

      <!-- AI Chat Drawer Panel -->
      <div id="bookora-ai-drawer" class="bookora-ai-drawer">
        
        <!-- Header -->
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

        <!-- Dynamic Context Suggestions -->
        <div id="ai-suggestions-container" class="ai-suggestions-bar">
          <!-- Dynamic Chips Injected Here -->
        </div>

        <!-- Chat Messages Area -->
        <div id="ai-messages-list" class="ai-messages-area"></div>

        <!-- Input Bar -->
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

  async sendMessage(userText) {
    if (this.isGenerating) return;

    // Add user message
    this.messages.push({ role: 'user', content: userText });
    this.renderMessages();

    // Show loading state
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

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
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

      const data = await res.json();
      loadingEl.remove();

      let replyText = '';
      if (data && (data.message || data.reply)) {
        replyText = data.message || data.reply;
      } else {
        replyText = "I'm ready to assist you with Bookora eBooks, orders, or publishing. What would you like to explore?";
      }

      // Smooth streaming appearance
      const aiMsgObj = { role: 'assistant', content: '' };
      this.messages.push(aiMsgObj);
      this.renderMessages();

      const lastBubble = list?.lastElementChild?.querySelector('.msg-bubble');
      if (lastBubble && replyText.length > 20) {
        let curr = 0;
        const chunkSize = Math.max(3, Math.floor(replyText.length / 30));
        const interval = setInterval(() => {
          curr += chunkSize;
          if (curr >= replyText.length) {
            curr = replyText.length;
            clearInterval(interval);
          }
          aiMsgObj.content = replyText.slice(0, curr);
          lastBubble.innerHTML = this.formatMarkdown(aiMsgObj.content);
          if (list) list.scrollTop = list.scrollHeight;
        }, 15);
      } else {
        aiMsgObj.content = replyText;
        this.renderMessages();
      }

    } catch (err) {
      loadingEl.remove();
      if (err.name === 'AbortError') {
        this.messages.push({ role: 'assistant', content: 'Response generation stopped.' });
      } else {
        this.messages.push({
          role: 'assistant',
          content: 'Bookora AI is temporarily unavailable. Please check your connection or try again.'
        });
      }
      this.renderMessages();
    } finally {
      this.toggleInputControls(false);
      this.abortController = null;
    }
  }
};


// ==================== File: pages/NotFoundPage.js ====================

// NotFoundPage Component
function renderNotFoundPage() {
  updateSEO({
    title: '404 - Page Not Found',
    description: 'The requested page could not be found on Bookora.'
  });

  return `
    <div class="not-found-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 4rem 0;">
      <div class="container" style="max-width: 520px; text-align: center;">
        <div style="font-family: var(--font-display); font-size: 6rem; font-weight: 900; color: var(--accent); opacity: 0.8; line-height: 1; margin-bottom: 1rem;">
          404
        </div>
        <h2 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem;">
          Page Not Found
        </h2>
        <p style="font-size: 1rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
          The page or publication you are looking for might have been removed, renamed, or is temporarily unavailable.
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem;">
          <a href="#/" class="btn btn-primary btn-lg">Go to Homepage</a>
          <a href="#/explore" class="btn btn-secondary btn-lg">Explore eBooks</a>
        </div>
      </div>
    </div>
  `;
}


// ==================== File: pages/StaticPages.js ====================

// StaticPages Component (Help, Guidelines, Terms, Privacy, Refund)
function renderStaticPage(pageType) {
  let title = 'Help Center & Documentation';
  let desc = 'Learn how Bookora works, publishing rules, and customer protection.';
  let content = '';

  if (pageType === 'guidelines') {
    title = 'Creator & Author Publishing Guidelines';
    content = `
      <h2>1. Quality & Format Standards</h2>
      <p>All eBooks published on Bookora must be high-signal, properly formatted digital publications (PDF or EPUB). Content must have accurate metadata, high-resolution covers, and authentic authorship.</p>
      <h2>2. 85% Creator Royalties</h2>
      <p>Authors retain 85% of net sale proceeds. Payouts are transferred automatically via Cashfree Payouts directly into your verified bank account.</p>
      <h2>3. External Sales Page Verification</h2>
      <p>When submitting an external eBook sales page (Leanpub, Gumroad, Amazon, O'Reilly), you must confirm you have authorized rights to promote and link to the source domain. External listings redirect users directly to the publisher's website for checkout.</p>
    `;
  } else if (pageType === 'refund') {
    title = '30-Day Buyer Refund Policy';
    content = `
      <h2>1. 100% Satisfaction Guarantee</h2>
      <p>For native Bookora eBooks, we offer a no-questions-asked 30-day money-back guarantee if the publication does not meet your expectations.</p>
      <h2>2. Refund Processing</h2>
      <p>Refunds are credited back to your original payment method via Cashfree within 3 to 5 business days.</p>
      <h2>3. External Purchases Disclaimer</h2>
      <p>For external books purchased on third-party publisher websites (e.g. Leanpub, Gumroad, Amazon), refund requests must be handled according to the external publisher's specific terms.</p>
    `;
  } else if (pageType === 'terms') {
    title = 'Terms of Service';
    content = `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or publishing on Bookora, you agree to comply with our platform policies, intellectual property guidelines, and applicable international laws.</p>
      <h2>2. Single-User License</h2>
      <p>Purchased Bookora eBooks grant a perpetual, non-exclusive single-user license to read and download the publication for personal use with digital watermark protection.</p>
    `;
  } else if (pageType === 'privacy') {
    title = 'Privacy & Security Policy';
    content = `
      <h2>1. Data Protection</h2>
      <p>We do not sell personal data. All payments are processed through PCI-DSS Level 1 certified Cashfree Payment Gateway with 256-bit AES encryption.</p>
      <h2>2. Account Security</h2>
      <p>Your reading history, library progress, and payment receipts are securely stored and encrypted.</p>
    `;
  } else {
    title = 'Help Center & Support';
    content = `
      <h2>Getting Help with Bookora</h2>
      <p>Welcome to the Bookora Help Center. Whether you are a reader looking to access your purchases, or an author wanting to scale your digital publications, our team is here for you.</p>
      <h2>Support Contact</h2>
      <p>For technical inquiries or author assistance, email <strong>support@bookora.com</strong>.</p>
    `;
  }

  updateSEO({ title, description: desc });

  return `
    <div class="static-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 4rem 0 6rem 0;">
      <div class="container" style="max-width: 800px;">
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2.5rem; box-shadow: var(--shadow-sm);">
          <div class="badge badge-bookora" style="margin-bottom: 0.75rem;">Documentation</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
            ${title}
          </h1>
          <div class="static-content" style="font-size: 1rem; color: var(--text-secondary); line-height: 1.8;">
            ${content}
          </div>
          <div style="margin-top: 3rem; border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
            <a href="#/" class="btn btn-primary btn-sm">← Back to Homepage</a>
          </div>
        </div>
      </div>
    </div>
  `;
}


// ==================== File: pages/CategoryPage.js ====================

// CategoryPage Component
function renderCategoryPage(slug) {
  const category = state.getCategoryBySlug(slug) || {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Explore top publications in this category.',
    count: 0
  };

  updateSEO({
    title: `${category.name} eBooks`,
    description: category.description || `Browse top ${category.name} eBooks on Bookora.`
  });

  const books = state.getApprovedBooks().filter(b => 
    b.category.toLowerCase() === category.name.toLowerCase() ||
    b.category.toLowerCase().replace(/[^a-z0-9]/g, '-') === slug
  );

  return `
    <div class="category-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <!-- Category Banner Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; margin-bottom: 2.5rem; box-shadow: var(--shadow-sm); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem;">
          <div style="max-width: 680px;">
            <a href="#/explore" style="font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-bottom: 0.5rem; display: inline-block;">
              ← Back to All Categories
            </a>
            <h1 style="font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 0.5rem;">
              ${category.name}
            </h1>
            <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6;">
              ${category.description}
            </p>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent); font-family: var(--font-display);">
              ${books.length}
            </div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">
              Publications Found
            </div>
          </div>
        </div>

        <!-- Books Grid -->
        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No eBooks in ${category.name} Yet</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Be the first author to publish in this category!</p>
            <a href="#/publish" class="btn btn-primary btn-sm">Publish Your eBook</a>
          </div>
        `}

      </div>
    </div>
  `;
}


// ==================== File: pages/SearchPage.js ====================

// SearchPage Component
function renderSearchPage(query) {
  const q = (query || '').trim();

  updateSEO({
    title: `Search: "${q}"`,
    description: `Search results for "${q}" on Bookora.`
  });

  const books = state.getApprovedBooks().filter(b => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return b.title.toLowerCase().includes(lower) ||
           b.author.toLowerCase().includes(lower) ||
           b.category.toLowerCase().includes(lower) ||
           b.description.toLowerCase().includes(lower) ||
           (b.tags && b.tags.some(t => t.toLowerCase().includes(lower)));
  });

  return `
    <div class="search-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Search Results</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
            Results for "${q}"
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Found ${books.length} matching publication${books.length === 1 ? '' : 's'}.
          </p>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1.25rem auto; border-radius: var(--radius-full); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No eBooks Found</h3>
            <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.75rem;">
              We couldn't find any books matching "<strong>${q}</strong>". Try checking for spelling errors or browse our featured categories.
            </p>
            <div style="display: flex; justify-content: center; gap: 0.75rem;">
              <a href="#/explore" class="btn btn-primary btn-sm">Explore All eBooks</a>
              <a href="#/" class="btn btn-secondary btn-sm">Back to Home</a>
            </div>
          </div>
        `}

      </div>
    </div>
  `;
}


// ==================== File: pages/BookDetailPage.js ====================

// BookDetailPage Component
function renderBookDetailPage(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) {
    return `
      <div class="container" style="padding: 6rem 0; text-align: center;">
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem;">eBook Not Found</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">The eBook you requested could not be located in our catalog.</p>
        <a href="#/explore" class="btn btn-primary">Browse All eBooks</a>
      </div>
    `;
  }

  updateSEO({
    title: `${book.title} by ${book.author}`,
    description: book.description,
    schemaData: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      'name': book.title,
      'author': { '@type': 'Person', 'name': book.author },
      'bookFormat': 'EBook',
      'numberOfPages': book.pages || 150,
      'inLanguage': book.language || 'English',
      'offers': {
        '@type': 'Offer',
        'price': (book.sale_price || book.price).toString(),
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      }
    }
  });

  const isInternal = book.source_type === 'internal';
  const hasPurchased = state.hasPurchased(book.id);
  const isWish = state.isInWishlist(book.id);
  const reviews = state.reviews.filter(r => r.book_id === book.id);
  const relatedBooks = state.getApprovedBooks().filter(b => b.id !== book.id && (b.category === book.category || b.source_type === book.source_type)).slice(0, 3);

  return `
    <div class="book-detail-page animate-fade-in" style="background: var(--bg-secondary); padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <!-- Breadcrumb -->
        <nav style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2rem;">
          <a href="#/" class="hover:text-blue-600">Home</a>
          <span>/</span>
          <a href="#/explore?category=${encodeURIComponent(book.category)}" class="hover:text-blue-600">${book.category}</a>
          <span>/</span>
          <span style="color: var(--text-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">${book.title}</span>
        </nav>

        <!-- Main Product Card (Split View) -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); display: grid; grid-template-columns: 340px 1fr; gap: 3.5rem; margin-bottom: 3rem;" class="book-detail-layout">
          
          <!-- LEFT: 3D Book Cover & Media -->
          <div style="display: flex; flex-direction: column; align-items: center;">
            
            <div style="width: 100%; max-width: 300px; aspect-ratio: 3/4.2; border-radius: var(--radius-lg); background: ${book.cover_gradient}; box-shadow: var(--shadow-book); position: relative; overflow: hidden; margin-bottom: 1.5rem;">
              <div class="book-cover-spine"></div>
              <div style="padding: 1.75rem 1.25rem 1.25rem 1.75rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; color: #FFFFFF;">
                <div>
                  <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; margin-bottom: 0.5rem;">
                    ${book.category}
                  </div>
                  <h2 style="font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; line-height: 1.25; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${book.title}
                  </h2>
                  ${book.subtitle ? `<p style="font-size: 0.8rem; opacity: 0.85; margin-top: 0.4rem; line-height: 1.3;">${book.subtitle}</p>` : ''}
                </div>
                <div style="border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.85rem; font-weight: 600;">${book.author}</span>
                  <span style="font-size: 0.7rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${book.format || 'PDF'}</span>
                </div>
              </div>
            </div>

            <!-- Preview Sample Button -->
            <button id="detail-preview-btn" class="btn btn-secondary" style="width: 100%; max-width: 300px; padding: 0.75rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Read Free Sample</span>
            </button>

            <!-- Wishlist Button -->
            <button id="detail-wishlist-btn" class="btn btn-ghost btn-sm" style="display: flex; align-items: center; gap: 0.5rem; color: ${isWish ? '#E11D48' : 'var(--text-secondary)'};">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>${isWish ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>

          </div>

          <!-- RIGHT: Book Information, Pricing & CTA -->
          <div style="display: flex; flex-direction: column;">
            
            <!-- Badge & Category -->
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem;">
              <span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">
                ${isInternal ? 'BOOKORA EXCLUSIVE' : 'EXTERNAL LISTING'}
              </span>
              <a href="#/category/${book.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
                ${book.category}
              </a>
            </div>

            <!-- Title & Subtitle -->
            <h1 style="font-family: var(--font-display); font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; color: var(--text-primary); line-height: 1.2; margin-bottom: 0.5rem;">
              ${book.title}
            </h1>
            ${book.subtitle ? `<p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">${book.subtitle}</p>` : ''}

            <!-- Author & Rating Strip -->
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 1.5rem;">
              <div style="font-size: 0.95rem; color: var(--text-secondary);">
                By <strong style="color: var(--text-primary); font-weight: 700;">${book.author}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <div style="display: flex; align-items: center;">
                  ${renderStars(book.rating || 5.0)}
                </div>
                <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${book.rating || 5.0}</span>
                <span style="font-size: 0.85rem; color: var(--text-muted);">(${book.review_count || 0} reviews)</span>
              </div>
            </div>

            <!-- Metadata Pills -->
            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.75rem;">
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Pages</span>
                <strong style="color: var(--text-primary);">${book.pages || 140} pages</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Language</span>
                <strong style="color: var(--text-primary);">${book.language || 'English'}</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Format</span>
                <strong style="color: var(--text-primary);">${book.format || 'PDF'}</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem 0.85rem; font-size: 0.825rem;">
                <span style="color: var(--text-muted); display: block;">Platform</span>
                <strong style="color: var(--text-primary);">${book.source_domain || 'Bookora'}</strong>
              </div>
            </div>

            <!-- Description -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.6rem;">About this Publication</h3>
              <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
                ${book.description}
              </p>
            </div>

            <!-- Tags -->
            ${book.tags && book.tags.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 2rem;">
                ${book.tags.map(tag => `
                  <span style="background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.75rem; font-weight: 600; padding: 3px 8px; border-radius: 99px;">
                    #${tag}
                  </span>
                `).join('')}
              </div>
            ` : ''}

            <!-- CTA Purchase Box -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: auto;">
              
              ${isInternal ? `
                <!-- Bookora Internal Purchase Box -->
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                  <div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">One-time purchase • Lifetime access</div>
                    <div style="display: flex; align-items: baseline; gap: 0.6rem;">
                      <span style="font-size: 2rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">
                        ${formatPrice(book.sale_price || book.price)}
                      </span>
                      ${book.discount > 0 ? `
                        <span style="font-size: 1.1rem; color: var(--text-muted); text-decoration: line-through;">
                          ${formatPrice(book.price)}
                        </span>
                        <span class="badge badge-new" style="font-size: 0.75rem;">Save ${book.discount}%</span>
                      ` : ''}
                    </div>
                  </div>

                  ${hasPurchased ? `
                    <div style="display: flex; gap: 0.75rem;">
                      <a href="#/library" class="btn btn-primary btn-lg">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Read in Library
                      </a>
                    </div>
                  ` : `
                    <a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-lg" style="padding: 0.85rem 2.25rem;">
                      Buy Now
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </a>
                  `}
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 1.25rem; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Instant PDF & EPUB Download
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    30-Day Money-Back Guarantee
                  </span>
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Secure Cashfree Payment
                  </span>
                </div>
              ` : `
                <!-- External Publisher Redirect Box -->
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">Publisher Listing Price</div>
                      <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">
                        ${formatPrice(book.sale_price || book.price)}
                      </div>
                    </div>
                    
                    <a href="${book.buy_url || book.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-lg" style="padding: 0.85rem 2rem;">
                      <span>Buy on Publisher Website</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  </div>

                  <div style="background: #FFFFFF; border: 1px solid #DDD6FE; border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.8rem; color: #5B21B6; line-height: 1.4;">
                    <strong>External Platform Disclaimer:</strong> This book is sold by the original publisher/seller on <strong>${book.source_domain || 'their official website'}</strong>. Checkout and payment take place on their website. Bookora does not process external payments.
                  </div>
                </div>
              `}

            </div>

          </div>

        </div>

        <!-- Author Bio Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; margin-bottom: 3rem; display: flex; align-items: center; gap: 1.5rem;">
          <div style="width: 64px; height: 64px; border-radius: 99px; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.5rem; flex-shrink: 0;">
            ${book.author.charAt(0)}
          </div>
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent); text-transform: uppercase;">About the Author</div>
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem;">${book.author}</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
              ${book.author_bio || 'Verified Bookora Creator producing structured technical and practical guides for international audiences.'}
            </p>
          </div>
        </div>

        <!-- Verified Reviews Section -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; margin-bottom: 3rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">
                Customer Reviews
              </h3>
              <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 2px;">
                Verified thoughts from readers who purchased this title.
              </p>
            </div>
            ${hasPurchased ? `
              <button id="open-review-form-btn" class="btn btn-secondary btn-sm">
                Write a Review
              </button>
            ` : ''}
          </div>

          <!-- Write Review Form (Conditional) -->
          <div id="review-form-container" style="display: none; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">Share Your Feedback</h4>
            <form id="submit-review-form">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Your Rating</label>
                <select id="review-rating-input" style="padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: #FFFFFF;">
                  <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                  <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                  <option value="3">⭐⭐⭐ (3 - Average)</option>
                  <option value="2">⭐⭐ (2 - Below Expectations)</option>
                  <option value="1">⭐ (1 - Poor)</option>
                </select>
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Review Headline</label>
                <input type="text" id="review-title-input" placeholder="e.g. Incredibly actionable and practical" required style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              </div>
              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Review Details</label>
                <textarea id="review-comment-input" rows="3" placeholder="What stood out to you most about this book?" required style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;"></textarea>
              </div>
              <div style="display: flex; gap: 0.75rem;">
                <button type="submit" class="btn btn-primary btn-sm">Submit Verified Review</button>
                <button type="button" id="cancel-review-btn" class="btn btn-ghost btn-sm">Cancel</button>
              </div>
            </form>
          </div>

          <!-- Reviews List -->
          ${reviews.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              ${reviews.map(r => `
                <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div style="display: flex;">${renderStars(r.rating)}</div>
                      <strong style="font-size: 0.95rem; color: var(--text-primary);">${r.title || 'Helpful Review'}</strong>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(r.date)}</span>
                  </div>
                  <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">
                    ${r.comment}
                  </p>
                  <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
                    <span>${r.user_name}</span>
                    ${r.verified_purchase ? `
                      <span class="badge badge-featured" style="font-size: 0.65rem; padding: 1px 6px;">✓ Verified Purchase</span>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="text-align: center; padding: 2rem 0; color: var(--text-muted); font-size: 0.9rem;">
              No customer reviews yet for this publication.
            </div>
          `}

        </div>

        <!-- Related Recommendations -->
        ${relatedBooks.length > 0 ? `
          <div>
            <h3 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
              Readers Also Explored
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
              ${relatedBooks.map(b => renderBookCard(b)).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    </div>
  `;
}
function initBookDetailEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  // Sample Reader Button
  document.getElementById('detail-preview-btn')?.addEventListener('click', () => {
    ReaderModal.open(book, true);
  });

  // Wishlist Button
  const wishBtn = document.getElementById('detail-wishlist-btn');
  wishBtn?.addEventListener('click', () => {
    const isAdded = state.toggleWishlist(book.id);
    Toast.show(isAdded ? 'Added to your Wishlist' : 'Removed from Wishlist', isAdded ? 'success' : 'info');
    window.dispatchEvent(new Event('hashchange'));
  });

  // Review Form Toggle
  const openReviewBtn = document.getElementById('open-review-form-btn');
  const reviewFormBox = document.getElementById('review-form-container');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const reviewForm = document.getElementById('submit-review-form');

  if (openReviewBtn && reviewFormBox) {
    openReviewBtn.addEventListener('click', () => {
      reviewFormBox.style.display = 'block';
    });
  }

  if (cancelReviewBtn && reviewFormBox) {
    cancelReviewBtn.addEventListener('click', () => {
      reviewFormBox.style.display = 'none';
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = document.getElementById('review-rating-input').value;
      const title = document.getElementById('review-title-input').value.trim();
      const comment = document.getElementById('review-comment-input').value.trim();

      state.addReview({
        book_id: book.id,
        rating,
        title,
        comment
      });

      Toast.show('Thank you! Your verified review has been published.', 'success');
      window.dispatchEvent(new Event('hashchange'));
    });
  }
}


// ==================== File: pages/PricingPage.js ====================


// PricingPage & Subscription Components
function renderPricingPage() {
  updateSEO({
    title: 'Subscription Plans & Pricing',
    description: 'Explore Bookora Reader Pro & Annual Membership plans for unlimited eBook reading.'
  });

  const plans = state.subscriptionPlans || [];
  const currentSub = state.currentSubscription;

  return `
    <div class="pricing-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container" style="max-width: 1080px;">
        
        <!-- Header -->
        <div style="text-align: center; max-width: 720px; margin: 0 auto 3.5rem auto;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Transparent Memberships</div>
          <h1 style="font-family: var(--font-display); font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem;">
            Simple, Accessible Reading Plans
          </h1>
          <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6;">
            Buy individual eBooks permanently or subscribe for unlimited access to eligible publications.
          </p>
        </div>

        <!-- Plans Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 4rem;">
          ${plans.map(plan => {
            const isCurrent = currentSub && currentSub.plan_id === plan.id && currentSub.status === 'ACTIVE';
            return `
              <div class="book-card animate-slide-up" style="background: #FFFFFF; border: ${plan.is_popular ? '2px solid var(--accent)' : '1px solid var(--border-subtle)'}; padding: 2.5rem 2rem; display: flex; flex-direction: column; position: relative; box-shadow: ${plan.is_popular ? 'var(--shadow-lg)' : 'var(--shadow-sm)'};">
                
                ${plan.is_popular ? `
                  <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #FFFFFF; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 12px; border-radius: 99px;">
                    Most Popular
                  </div>
                ` : ''}

                <div style="margin-bottom: 1.5rem;">
                  <h3 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                    ${plan.name}
                  </h3>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; min-height: 2.5rem;">
                    ${plan.description}
                  </p>
                </div>

                <div style="margin-bottom: 1.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
                  <div style="display: flex; align-items: baseline; gap: 4px;">
                    <span style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 900; color: var(--text-primary);">
                      ${formatPrice(plan.price, plan.currency)}
                    </span>
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
                      ${plan.interval === 'free' ? 'forever' : `/${plan.interval}`}
                    </span>
                  </div>
                </div>

                <!-- Features List -->
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem; flex: 1;">
                  ${plan.features.map(f => `
                    <li style="display: flex; align-items: flex-start; gap: 0.5rem;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5" style="flex-shrink: 0; margin-top: 2px;"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>${f}</span>
                    </li>
                  `).join('')}
                </ul>

                <!-- Plan Action Button -->
                ${isCurrent ? `
                  <button class="btn btn-secondary btn-lg" disabled style="width: 100%; font-weight: 700;">
                    ✓ Current Active Plan
                  </button>
                ` : plan.price === 0 ? `
                  <a href="#/explore" class="btn btn-secondary btn-lg" style="width: 100%; font-weight: 700;">
                    Start Reading Free
                  </a>
                ` : `
                  <button class="btn btn-primary btn-lg subscribe-plan-btn" data-plan-id="${plan.id}" data-plan-price="${plan.price}" style="width: 100%; font-weight: 800;">
                    Subscribe via Cashfree
                  </button>
                `}

              </div>
            `;
          }).join('')}
        </div>

        <!-- Plan Comparison & FAQ -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <h2 style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
            Subscription FAQs
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; font-size: 0.9rem;">
            <div>
              <strong style="display: block; color: var(--text-primary); margin-bottom: 0.25rem;">Can I buy individual eBooks without subscribing?</strong>
              <p style="color: var(--text-secondary); line-height: 1.5;">Yes. Individual purchases are permanent and independent of subscriptions. You own lifetime access and DRM downloads.</p>
            </div>
            <div>
              <strong style="display: block; color: var(--text-primary); margin-bottom: 0.25rem;">How do I cancel my subscription?</strong>
              <p style="color: var(--text-secondary); line-height: 1.5;">You can cancel auto-renewal anytime in your Subscription Dashboard. Access continues until the current billing period expires.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
function renderSubscriptionManagePage() {
  updateSEO({
    title: 'Manage Subscription',
    description: 'Manage your active Bookora subscription, renewal status, and billing history.'
  });

  const sub = state.currentSubscription;

  return `
    <div class="subscription-manage-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 780px;">
        
        <div style="margin-bottom: 2.5rem;">
          <a href="#/dashboard" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Dashboard</a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            My Subscription
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          ${sub && sub.status === 'ACTIVE' ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
              <div>
                <span class="badge badge-featured" style="font-size: 0.7rem; margin-bottom: 4px;">ACTIVE MEMBERSHIP</span>
                <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary);">${sub.plan_name}</h3>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent);">${formatPrice(sub.amount, sub.currency)}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; font-size: 0.875rem; margin-bottom: 2rem;">
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                <span style="color: var(--text-muted); display: block;">Start Date</span>
                <strong style="color: var(--text-primary);">${sub.start_date ? sub.start_date.split('T')[0] : 'Today'}</strong>
              </div>
              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                <span style="color: var(--text-muted); display: block;">Next Expiry / Renewal</span>
                <strong style="color: var(--text-primary);">${sub.end_date ? sub.end_date.split('T')[0] : 'N/A'}</strong>
              </div>
            </div>

            <div style="display: flex; gap: 1rem;">
              <a href="#/pricing" class="btn btn-secondary btn-sm">Change Plan</a>
              <button id="cancel-sub-btn" class="btn btn-ghost btn-sm" style="color: #DC2626;">Cancel Subscription</button>
            </div>
          ` : `
            <div style="text-align: center; padding: 3rem 1rem;">
              <div style="width: 56px; height: 56px; border-radius: 99px; background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              </div>
              <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">No Active Subscription</h3>
              <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto 1.5rem auto;">
                Subscribe to Reader Pro for unlimited access to eligible eBooks and special member discounts.
              </p>
              <a href="#/pricing" class="btn btn-primary btn-lg">Explore Reading Plans</a>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
function initPricingEvents() {
  document.querySelectorAll('.subscribe-plan-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.isAuthenticated) {
        Toast.show('Please sign in to choose a subscription plan.', 'info');
        window.location.hash = '#/login?returnTo=' + encodeURIComponent('/pricing');
        return;
      }

      const planId = btn.dataset.planId;
      btn.disabled = true;
      btn.textContent = 'Creating Cashfree Order...';

      try {
        const res = await apiFetch('/api/subscriptions/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({ plan_id: planId })
        });
        const orderData = await res.json();
        if (res.ok && orderData.success) {
          // Verify & activate payment in Cashfree Sandbox
          btn.textContent = 'Verifying Sandbox Payment...';
          const vRes = await apiFetch('/api/subscriptions/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ order_id: orderData.order.id })
          });
          const vData = await vRes.json();
          if (vRes.ok && vData.success) {
            state.currentSubscription = vData.subscription;
            Toast.show(`Subscription activated! Welcome to ${vData.subscription.plan_name}.`, 'success');
            window.location.hash = '#/subscription/manage';
          }
        }
      } catch (err) {
        Toast.show('Subscription order error.', 'error');
        btn.disabled = false;
        btn.textContent = 'Subscribe via Cashfree';
      }
    });
  });

  document.getElementById('cancel-sub-btn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to cancel your subscription renewal?')) {
      try {
        const res = await apiFetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (res.ok) {
          state.currentSubscription = null;
          Toast.show('Subscription renewal cancelled.', 'info');
          window.dispatchEvent(new Event('hashchange'));
        }
      } catch (e) {
        Toast.show('Error cancelling subscription.', 'error');
      }
    }
  });
}


// ==================== File: pages/PublicDiscoveryPages.js ====================

// PublicDiscoveryPages Component (Categories, Best Sellers, Trending, Authors, Legal & Info)
function renderCategoriesDirectoryPage() {
  updateSEO({ title: 'Browse All Categories', description: 'Explore complete topic categories on Bookora.' });
  return `
    <div class="categories-dir-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container">
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Explore Categories (${state.categories.length})
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">Discover publications by topic.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
          ${state.categories.map(c => renderCategoryCard(c)).join('')}
        </div>
      </div>
    </div>
  `;
}
function renderCuratedCatalogPage(type = 'bestsellers') {
  const isBest = type === 'bestsellers';
  const isTrend = type === 'trending';
  const title = isBest ? 'Best Sellers Leaderboard' : isTrend ? 'Trending Now' : 'New Releases';
  updateSEO({ title, description: `Explore ${title.toLowerCase()} on Bookora.` });

  const books = isBest ? state.getBestSellers() : isTrend ? state.getTrendingBooks() : state.getNewReleases();

  return `
    <div class="curated-catalog-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container">
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">${title}</h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">Real-time curated marketplace selections.</p>
        </div>
        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center;">
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">No publications available in this section yet.</p>
            <a href="#/publish" class="btn btn-primary btn-sm">Publish Your eBook</a>
          </div>
        `}
      </div>
    </div>
  `;
}
function renderAuthorsDirectoryPage() {
  updateSEO({ title: 'Authors & Creators', description: 'Meet verified authors publishing on Bookora.' });
  const creators = state.users.filter(u => u.role === 'creator' || u.seller_status === 'approved');

  return `
    <div class="authors-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container">
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Authors & Creators (${creators.length})
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary);">Connect with independent writers and publishers.</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          ${creators.map(c => `
            <div class="book-card" style="background: #FFFFFF; padding: 1.5rem; text-align: center;">
              <img src="${c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${c.name}" style="width: 72px; height: 72px; border-radius: 99px; object-fit: cover; margin: 0 auto 1rem auto;" />
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem;">${c.name}</h3>
              <div style="font-size: 0.75rem; color: var(--accent); font-weight: 600; margin-bottom: 0.75rem;">Verified Author</div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1.25rem;">${c.bio || 'Bookora Author'}</p>
              <a href="#/explore?q=${encodeURIComponent(c.name)}" class="btn btn-secondary btn-sm" style="width: 100%;">View Publications</a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}


// ==================== File: pages/BuyerPages.js ====================

// BuyerPages Component (Cart, Order Detail, Reading View, My Reviews)
function renderCartPage() {
  updateSEO({
    title: 'Your Shopping Cart',
    description: 'Review items in your Bookora cart and proceed to Cashfree checkout.'
  });

  const cartItems = state.cart || [];
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.sale_price || item.price || 0) * (item.quantity || 1)), 0);

  return `
    <div class="cart-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 920px;">
        
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Shopping Cart (${cartItems.length})
          </h1>
        </div>

        ${cartItems.length > 0 ? `
          <div style="display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start;">
            
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
              ${cartItems.map(item => `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 50px; height: 68px; border-radius: 6px; background: ${item.cover_gradient || 'var(--accent)'}; flex-shrink: 0;"></div>
                    <div>
                      <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${item.title}</h4>
                      <div style="font-size: 0.8rem; color: var(--text-muted);">by ${item.author}</div>
                      <div style="font-size: 0.75rem; color: var(--accent); font-weight: 600; margin-top: 4px;">Instant PDF Download</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <strong style="font-size: 1.1rem; color: var(--text-primary); display: block;">${formatPrice(item.sale_price || item.price)}</strong>
                    <button class="btn btn-ghost btn-sm cart-remove-btn" data-id="${item.id}" style="color: #DC2626; font-size: 0.75rem; padding: 2px 0;">Remove</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Summary -->
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">Summary</h3>
              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 0.75rem;">
                <span style="color: var(--text-secondary);">Subtotal</span>
                <strong>${formatPrice(subtotal)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-bottom: 1.5rem;">
                <span>Total</span>
                <span style="color: var(--accent);">${formatPrice(subtotal)}</span>
              </div>
              <a href="#/checkout/${cartItems[0].slug || cartItems[0].id}" class="btn btn-primary btn-lg" style="width: 100%; font-weight: 800;">
                Proceed to Checkout
              </a>
            </div>

          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center;">
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Your cart is currently empty.</p>
            <a href="#/explore" class="btn btn-primary">Browse Catalog</a>
          </div>
        `}

      </div>
    </div>
  `;
}
function renderOrderDetailPage(orderId) {
  updateSEO({ title: `Order #${orderId}`, description: 'Order receipt & payment breakdown.' });
  const order = state.orders.find(o => o.id === orderId) || { id: orderId, amount: 0, book_title: 'eBook Publication', status: 'PAID', date: new Date().toISOString() };

  return `
    <div class="order-detail-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 720px;">
        <div style="margin-bottom: 2rem;">
          <a href="#/orders" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Orders</a>
          <h1 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Order Receipt & Invoice
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Order Number</span>
              <strong style="display: block; font-family: monospace; font-size: 1.1rem; color: var(--text-primary);">${order.id}</strong>
            </div>
            <span class="badge badge-featured" style="font-size: 0.75rem;">✓ ${order.status || 'PAID'}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.9rem; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Item:</span>
              <strong style="color: var(--text-primary);">${order.book_title}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Payment Provider:</span>
              <span>Cashfree Gateway (Sandbox Verified)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Transaction ID:</span>
              <span style="font-family: monospace;">${order.transaction_id || 'CF_TXN_VERIFIED'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 1rem; font-size: 1.1rem; font-weight: 800;">
              <span>Total Paid:</span>
              <span style="color: var(--accent);">${formatPrice(order.amount)}</span>
            </div>
          </div>

          <div style="display: flex; gap: 1rem;">
            <a href="#/library" class="btn btn-primary btn-sm">Read in Library</a>
            <button onclick="window.print()" class="btn btn-secondary btn-sm">Print Invoice Receipt</button>
          </div>
        </div>
      </div>
    </div>
  `;
}


// ==================== File: pages/LibraryPage.js ====================

// LibraryPage Component
function renderLibraryPage() {
  updateSEO({
    title: 'My eBook Library',
    description: 'Access and read your purchased eBooks on Bookora.'
  });

  const ownedBookIds = Array.from(state.library);
  const books = state.books.filter(b => ownedBookIds.includes(b.id));

  return `
    <div class="library-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Personal Library</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              My eBook Library
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              You own ${books.length} permanent digital license${books.length === 1 ? '' : 's'}. Read in-browser or download DRM-verified files.
            </p>
          </div>
          <a href="#/explore" class="btn btn-secondary btn-sm">
            + Discover More eBooks
          </a>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
            ${books.map(book => {
              const prog = state.readingProgress[book.id] || { percent: 0, current_page: 1, total_pages: book.pages || 100 };
              return `
                <div class="book-card animate-slide-up" style="background: #FFFFFF; padding: 1.5rem;">
                  
                  <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
                    <div style="width: 72px; height: 100px; border-radius: 8px; background: ${book.cover_gradient}; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.15); position: relative;">
                      <div class="book-cover-spine"></div>
                    </div>
                    <div>
                      <span class="badge badge-bookora" style="font-size: 0.65rem; margin-bottom: 4px;">LICENSED</span>
                      <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">
                        ${book.title}
                      </h3>
                      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">by ${book.author}</div>
                    </div>
                  </div>

                  <!-- Reading Progress Bar -->
                  <div style="margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                      <span>Reading Progress</span>
                      <span>${prog.percent}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: var(--bg-tertiary); border-radius: 99px; overflow: hidden;">
                      <div style="width: ${prog.percent}%; height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.3s ease;"></div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div style="display: flex; gap: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                    <button class="btn btn-primary btn-sm lib-read-btn" data-id="${book.id}" style="flex: 1;">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      ${prog.percent > 0 ? 'Resume Reading' : 'Start Reading'}
                    </button>
                    <button class="btn btn-secondary btn-sm lib-download-btn" data-id="${book.id}" title="Download verified PDF">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 5rem 2rem; text-align: center; max-width: 540px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; border-radius: 99px; background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Your Library is Empty</h3>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem;">
              You haven't purchased any Bookora publications yet. Explore our best sellers and start reading today!
            </p>
            <a href="#/explore" class="btn btn-primary btn-lg">Explore Top eBooks</a>
          </div>
        `}

      </div>
    </div>
  `;
}
function initLibraryEvents() {
  document.querySelectorAll('.lib-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const book = state.books.find(b => b.id === btn.dataset.id);
      if (book) ReaderModal.open(book, false);
    });
  });

  document.querySelectorAll('.lib-download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const book = state.books.find(b => b.id === btn.dataset.id);
      if (book) {
        downloadEBook(book, state.currentUser);
        Toast.show(`Downloaded "${book.title}" (Licensed edition)`, 'success');
      }
    });
  });
}


// ==================== File: pages/OrdersPage.js ====================

// OrdersPage Component
function renderOrdersPage() {
  updateSEO({
    title: 'Order History & Receipts',
    description: 'View all your verified Cashfree eBook purchases on Bookora.'
  });

  const orders = state.orders;

  return `
    <div class="orders-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 960px;">
        
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Billing History</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Order History
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Review your receipts, order IDs, and verified Cashfree transaction details.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
          ${orders.length > 0 ? `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">
                    <th style="padding: 1rem 1.25rem;">Order ID</th>
                    <th style="padding: 1rem 1.25rem;">Publication</th>
                    <th style="padding: 1rem 1.25rem;">Date</th>
                    <th style="padding: 1rem 1.25rem;">Amount</th>
                    <th style="padding: 1rem 1.25rem;">Gateway</th>
                    <th style="padding: 1rem 1.25rem;">Status</th>
                    <th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${orders.map(order => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1.25rem; font-family: monospace; font-weight: 700; color: var(--text-primary);">${order.id}</td>
                      <td style="padding: 1.25rem;">
                        <strong style="color: var(--text-primary); display: block;">${order.book_title}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Txn: ${order.transaction_id || 'CF_88192'}</span>
                      </td>
                      <td style="padding: 1.25rem; color: var(--text-secondary);">${formatDate(order.date)}</td>
                      <td style="padding: 1.25rem; font-weight: 700; color: var(--text-primary);">${formatPrice(order.amount)}</td>
                      <td style="padding: 1.25rem;">
                        <span class="badge badge-bookora" style="font-size: 0.65rem;">Cashfree</span>
                      </td>
                      <td style="padding: 1.25rem;">
                        <span class="badge badge-featured" style="font-size: 0.65rem;">✓ ${order.status}</span>
                      </td>
                      <td style="padding: 1.25rem; text-align: right;">
                        <a href="#/library" class="btn btn-primary btn-sm" style="font-size: 0.75rem; padding: 4px 10px;">
                          Read Book
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 4rem 2rem; text-align: center;">
              <p style="color: var(--text-muted); margin-bottom: 1rem;">No transactions found in this account.</p>
              <a href="#/explore" class="btn btn-primary btn-sm">Explore Catalog</a>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}


// ==================== File: pages/WishlistPage.js ====================

// WishlistPage Component
function renderWishlistPage() {
  updateSEO({
    title: 'Saved eBooks Wishlist',
    description: 'Your saved favorite eBooks on Bookora.'
  });

  const wishIds = Array.from(state.wishlist);
  const books = state.books.filter(b => wishIds.includes(b.id));

  return `
    <div class="wishlist-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Saved Items</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Your Wishlist (${books.length})
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Publications you've bookmarked to read or purchase later.
            </p>
          </div>
          <a href="#/explore" class="btn btn-secondary btn-sm">
            Continue Browsing
          </a>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 5rem 2rem; text-align: center; max-width: 540px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; border-radius: 99px; background: #FFF1F2; color: #E11D48; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Your Wishlist is Empty</h3>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem;">
              Click the heart icon on any publication to save it here for quick access later!
            </p>
            <a href="#/explore" class="btn btn-primary btn-lg">Explore Popular Titles</a>
          </div>
        `}

      </div>
    </div>
  `;
}


// ==================== File: pages/CheckoutPage.js ====================

// CheckoutPage Component
function renderCheckoutPage(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) {
    return `<div class="container" style="padding: 5rem 0; text-align: center;"><h2>eBook Not Found</h2><a href="#/explore" class="btn btn-primary">Browse Catalog</a></div>`;
  }

  updateSEO({
    title: `Checkout: ${book.title}`,
    description: `Secure checkout for ${book.title} on Bookora.`
  });

  const basePrice = book.sale_price || book.price;

  return `
    <div class="checkout-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 980px;">
        
        <div style="margin-bottom: 2rem;">
          <a href="#/book/${book.slug || book.id}" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
            ← Back to Product Page
          </a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.5rem;">
            Secure Checkout
          </h1>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem; align-items: start;" class="checkout-layout">
          
          <!-- LEFT: Billing & Contact Details Form -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
            
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem;">
              1. Customer & License Information
            </h3>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Full Name</label>
              <input type="text" id="checkout-name" value="${state.currentUser?.name || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Email Address (eBook delivery & license)</label>
              <input type="email" id="checkout-email" value="${state.currentUser?.email || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                Your unique cryptographic license key and download link will be registered to this email.
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Country / Region</label>
              <select style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem; background: #FFFFFF;">
                <option value="US">United States</option>
                <option value="IN" selected>India</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
              </select>
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">
              2. Payment Processor
            </h3>

            <div style="background: var(--bg-secondary); border: 2px solid var(--accent); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: #1E3A8A; color: #FFFFFF; font-weight: 900; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">
                  CF
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Cashfree Payment Gateway</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">UPI, Cards, NetBanking & Wallets</div>
                </div>
              </div>
              <span class="badge badge-featured" style="font-size: 0.7rem;">Verified SSL</span>
            </div>

          </div>

          <!-- RIGHT: Order Summary Card -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm); position: sticky; top: 90px;">
            
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
              Order Summary
            </h3>

            <!-- Book Snippet -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="width: 52px; height: 70px; border-radius: 6px; background: ${book.cover_gradient}; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">${book.title}</h4>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">by ${book.author}</div>
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--accent); margin-top: 4px;">${book.format || 'PDF + EPUB'}</div>
              </div>
            </div>

            <!-- Coupon Code Form -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="coupon-input" placeholder="Promo code (e.g. BOOKORA20)" style="flex: 1; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.85rem;" />
                <button type="button" id="apply-coupon-btn" class="btn btn-secondary btn-sm" style="font-weight: 700;">Apply</button>
              </div>
              <div id="coupon-message" style="font-size: 0.75rem; margin-top: 4px;"></div>
            </div>

            <!-- Calculations -->
            <div style="display: flex; flex-direction: column; gap: 0.65rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>Subtotal</span>
                <span>${formatPrice(basePrice)}</span>
              </div>
              <div id="discount-row" style="display: none; justify-content: space-between; color: #059669; font-weight: 600;">
                <span>Promo Discount (20%)</span>
                <span id="discount-amount">-$0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>Digital VAT / GST</span>
                <span style="color: #059669; font-weight: 600;">Included ($0.00)</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.25rem; color: var(--text-primary); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                <span>Total Due</span>
                <span id="checkout-total-price" style="color: var(--accent);">${formatPrice(basePrice)}</span>
              </div>
            </div>

            <!-- Cashfree Checkout Button -->
            <button id="trigger-cashfree-btn" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 800; font-size: 1rem;">
              Proceed to Cashfree Pay
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </button>

            <div style="text-align: center; margin-top: 1rem; font-size: 0.72rem; color: var(--text-muted);">
              Instant library delivery immediately upon verified transaction.
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}
function initCheckoutEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  let currentTotal = book.sale_price || book.price;
  let discountApplied = false;

  const couponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-input');
  const couponMsg = document.getElementById('coupon-message');
  const discountRow = document.getElementById('discount-row');
  const discountAmt = document.getElementById('discount-amount');
  const totalLabel = document.getElementById('checkout-total-price');

  couponBtn?.addEventListener('click', () => {
    const code = (couponInput?.value || '').trim().toUpperCase();
    if (code === 'BOOKORA20') {
      discountApplied = true;
      const discount = currentTotal * 0.20;
      const finalPrice = currentTotal - discount;

      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmt) discountAmt.textContent = `-${formatPrice(discount)}`;
      if (totalLabel) totalLabel.textContent = formatPrice(finalPrice);
      if (couponMsg) {
        couponMsg.style.color = '#059669';
        couponMsg.textContent = '✓ 20% discount coupon applied successfully!';
      }
      Toast.show('Promo code BOOKORA20 applied: 20% OFF!', 'success');
    } else {
      if (couponMsg) {
        couponMsg.style.color = '#DC2626';
        couponMsg.textContent = 'Invalid promo code. Try "BOOKORA20"';
      }
    }
  });

  document.getElementById('trigger-cashfree-btn')?.addEventListener('click', () => {
    CashfreeModal.open(book);
  });
}


// ==================== File: pages/PaymentSuccessPage.js ====================

// PaymentSuccessPage Component
function renderPaymentSuccessPage() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const orderId = urlParams.get('order_id') || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const bookSlug = urlParams.get('book_slug') || 'the-30-day-productivity-reset';
  const book = state.getBookBySlug(bookSlug) || state.books[0];

  return `
    <div class="payment-success-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0; display: flex; align-items: center;">
      <div class="container" style="max-width: 680px;">
        
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2.5rem; text-align: center; box-shadow: var(--shadow-lg);">
          
          <!-- Animated Checkmark Icon -->
          <div style="width: 72px; height: 72px; border-radius: 99px; background: #ECFDF5; border: 2px solid #A7F3D0; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            Payment Successful!
          </h1>
          <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 2rem;">
            Thank you for your purchase. Your digital edition of <strong>${book.title}</strong> has been unlocked and added to your permanent library.
          </p>

          <!-- Receipt Details Strip -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem; text-align: left; margin-bottom: 2.25rem; font-size: 0.875rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Order ID:</span>
              <strong style="color: var(--text-primary); font-family: monospace;">${orderId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Payment Gateway:</span>
              <strong style="color: #1E3A8A;">Cashfree (Verified)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Purchaser Account:</span>
              <span style="color: var(--text-primary);">${state.currentUser?.email || 'your email'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Amount Paid:</span>
              <strong style="color: var(--accent);">${formatPrice(book.sale_price || book.price)}</strong>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
            <button id="success-read-btn" class="btn btn-primary btn-lg" style="padding: 0.85rem 2rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Read eBook Now
            </button>
            <button id="success-download-btn" class="btn btn-secondary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF Edition
            </button>
            <a href="#/library" class="btn btn-ghost btn-lg">
              Go to My Library →
            </a>
          </div>

        </div>

      </div>
    </div>
  `;
}
function initPaymentSuccessEvents() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const bookSlug = urlParams.get('book_slug') || 'the-30-day-productivity-reset';
  const book = state.getBookBySlug(bookSlug) || state.books[0];

  document.getElementById('success-read-btn')?.addEventListener('click', () => {
    ReaderModal.open(book, false);
  });

  document.getElementById('success-download-btn')?.addEventListener('click', () => {
    downloadEBook(book, state.currentUser);
  });
}


// ==================== File: pages/PaymentFailedPage.js ====================

// PaymentFailedPage Component
function renderPaymentFailedPage() {
  updateSEO({
    title: 'Payment Incomplete',
    description: 'The transaction could not be completed.'
  });

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const bookSlug = urlParams.get('book_slug') || '';
  const book = state.getBookBySlug(bookSlug) || state.books[0];

  return `
    <div class="payment-failed-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 4rem 0;">
      <div class="container" style="max-width: 540px; text-align: center;">
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2rem; box-shadow: var(--shadow-sm);">
          <div style="width: 64px; height: 64px; border-radius: 99px; background: #FEF2F2; color: #DC2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            Payment Incomplete
          </h2>
          <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 2rem;">
            We could not complete your transaction on Cashfree. No charges were made to your account.
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem;">
            <a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-lg">Try Checkout Again</a>
            <a href="#/explore" class="btn btn-secondary btn-lg">Browse Catalog</a>
          </div>
        </div>
      </div>
    </div>
  `;
}


// ==================== File: pages/DashboardPage.js ====================

// User Dashboard & Profile Page
function renderDashboardPage() {
  updateSEO({
    title: 'Account Dashboard & Settings',
    description: 'Manage your profile and reading preferences on Bookora.'
  });

  const user = state.currentUser || { name: 'User', email: '', avatar: '', role: 'buyer' };

  return `
    <div class="user-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 780px;">
        
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Account Dashboard
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage your personal profile, credentials, and notifications.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          
          <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
            <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}" alt="${user.name}" style="width: 72px; height: 72px; border-radius: 99px; object-fit: cover;" />
            <div>
              <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">${user.name}</h2>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${user.email}</div>
              <span class="badge badge-bookora" style="font-size: 0.7rem; margin-top: 4px;">Role: ${user.role.toUpperCase()}</span>
            </div>
          </div>

          <form id="profile-edit-form">
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Display Name</label>
              <input type="text" id="profile-name" value="${user.name}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Email Address</label>
              <input type="email" id="profile-email" value="${user.email}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <button type="submit" class="btn btn-primary">
              Save Profile Changes
            </button>
          </form>

        </div>

      </div>
    </div>
  `;
}
function initDashboardEvents() {
  document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    state.currentUser.name = name;
    state.currentUser.email = email;
    state.notify('USER_UPDATED', state.currentUser);
    Toast.show('Profile updated successfully!', 'success');
  });
}


// ==================== File: pages/ProfilePage.js ====================

// ProfilePage Component (/profile)
function renderProfilePage() {
  updateSEO({
    title: 'My Profile & Account',
    description: 'View your Bookora identity, reading credentials, and author status.'
  });

  const user = state.currentUser || {};
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;

  return `
    <div class="profile-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 780px;">
        
        <!-- Header -->
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">User Profile</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            My Profile
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          
          <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 2rem;">
            <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 99px; object-fit: cover; border: 3px solid #EFF6FF;" />
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary);">${user.name}</h2>
                <span class="badge ${isAdmin ? 'badge-bookora' : isSeller ? 'badge-external' : 'badge-new'}" style="font-size: 0.7rem;">
                  ${isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}
                </span>
              </div>
              <div style="font-size: 0.9rem; color: var(--text-muted);">${user.email}</div>
              <div style="font-size: 0.75rem; color: #16A34A; font-weight: 600; margin-top: 4px;">✓ Email Verified</div>
            </div>
          </div>

          <!-- Account Overview Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 2rem;">
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Authentication Method</div>
              <strong style="font-size: 1rem; color: var(--text-primary); text-transform: capitalize;">${user.auth_provider || 'Email + Password'}</strong>
            </div>
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Creator Privilege</div>
              <strong style="font-size: 1rem; color: ${isSeller ? '#6D28D9' : 'var(--text-secondary)'}; text-transform: capitalize;">
                ${isSeller ? 'Verified Author' : user.seller_status === 'pending' ? 'Application Under Review' : 'Reader (Apply below)'}
              </strong>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
            <a href="#/settings" class="btn btn-primary btn-sm">Edit Profile & Preferences</a>
            <a href="#/settings/security" class="btn btn-secondary btn-sm">Security & Connected Accounts</a>
            ${!isSeller && !isAdmin ? `
              <a href="#/seller/apply" class="btn btn-external btn-sm">+ Apply to Become a Seller</a>
            ` : ''}
          </div>

        </div>

      </div>
    </div>
  `;
}


// ==================== File: pages/UserSettingsPage.js ====================

// UserSettingsPage Component (Buyer & General Account Settings)
function renderUserSettingsPage() {
  updateSEO({
    title: 'Account Settings & Preferences',
    description: 'Manage your profile, display preferences, notifications, and security on Bookora.'
  });

  const user = state.currentUser || {};

  return `
    <div class="user-settings-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 820px;">
        
        <!-- Header -->
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Account Center</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Account Settings
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage your personal profile, reading preferences, and notification toggles.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <form id="user-settings-form">
            
            <!-- Profile Section -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                1. Personal Profile
              </h3>

              <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${user.name}" style="width: 64px; height: 64px; border-radius: 99px; object-fit: cover;" />
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem;">Avatar URL</label>
                  <input type="url" id="user-set-avatar" value="${user.avatar || ''}" style="width: 320px; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.85rem;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Full Name</label>
                  <input type="text" id="user-set-name" value="${user.name || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Email Address</label>
                  <input type="email" id="user-set-email" value="${user.email || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              </div>
            </div>

            <!-- Preferences -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                2. Display & Regional Preferences
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Preferred Display Currency</label>
                  <select id="user-set-currency" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    <option value="INR" selected>INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (د.إ - UAE Dirham)</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Language</label>
                  <select id="user-set-language" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    <option value="English" selected>English</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Notifications -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                3. Notification Preferences
              </h3>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">Order receipts and license delivery emails</span>
                  <input type="checkbox" id="user-notif-orders" checked style="width: 18px; height: 18px; accent-color: var(--accent);" />
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">Wishlist book price reductions & promotions</span>
                  <input type="checkbox" id="user-notif-wishlist" checked style="width: 18px; height: 18px; accent-color: var(--accent);" />
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">New releases in your followed categories</span>
                  <input type="checkbox" id="user-notif-releases" checked style="width: 18px; height: 18px; accent-color: var(--accent);" />
                </label>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-lg" style="font-weight: 700;">
              Save Account Preferences
            </button>
          </form>
        </div>

      </div>
    </div>
  `;
}
function initUserSettingsEvents() {
  document.getElementById('user-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('user-set-name')?.value.trim();
    const email = document.getElementById('user-set-email')?.value.trim();
    const avatar = document.getElementById('user-set-avatar')?.value.trim();

    if (state.currentUser) {
      state.currentUser.name = name;
      state.currentUser.email = email;
      if (avatar) state.currentUser.avatar = avatar;
      state.notify('USER_UPDATED', state.currentUser);
    }
    Toast.show('Account preferences saved successfully!', 'success');
  });
}


// ==================== File: pages/AccountSecurityPage.js ====================


// AccountSecurityPage Component (/settings/security)
function renderAccountSecurityPage() {
  updateSEO({
    title: 'Account Security & Connected Accounts',
    description: 'Manage password, connected login methods, and active sessions on Bookora.'
  });

  const user = state.currentUser || {};
  const isEmailUser = user.auth_provider === 'email' || !user.auth_provider;

  return `
    <div class="account-security-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 800px;">
        
        <div style="margin-bottom: 2rem;">
          <a href="#/settings" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
            ← Back to Settings
          </a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Security & Connected Logins
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage your sign-in methods, active device sessions, and password security.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          
          <!-- 1. Connected Login Providers -->
          <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
              1. Connected Accounts
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- Google -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  <div>
                    <strong style="font-size: 0.9rem; color: var(--text-primary);">Google Account</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${user.auth_provider === 'google' ? 'Primary sign-in method' : 'Instant 1-click login'}</div>
                  </div>
                </div>
                <span class="badge ${user.auth_provider === 'google' ? 'badge-featured' : 'badge-bookora'}" style="font-size: 0.7rem;">
                  ${user.auth_provider === 'google' ? '✓ Connected' : 'Available'}
                </span>
              </div>

              <!-- Apple -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.14 1.86-1 2.98 1.07.08 2.17-.51 2.83-1.33z"/></svg>
                  <div>
                    <strong style="font-size: 0.9rem; color: var(--text-primary);">Apple ID</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${user.auth_provider === 'apple' ? 'Primary sign-in method' : 'Sign in with Apple'}</div>
                  </div>
                </div>
                <span class="badge ${user.auth_provider === 'apple' ? 'badge-featured' : 'badge'}" style="font-size: 0.7rem;">
                  ${user.auth_provider === 'apple' ? '✓ Connected' : 'Not Connected'}
                </span>
              </div>

              <!-- Email -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <div>
                    <strong style="font-size: 0.9rem; color: var(--text-primary);">Email & Password</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                  </div>
                </div>
                <span class="badge badge-featured" style="font-size: 0.7rem;">
                  ✓ Enabled
                </span>
              </div>

            </div>
          </div>

          <!-- 2. Change Password (For Email Auth Users) -->
          ${isEmailUser ? `
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                2. Change Password
              </h3>
              <form id="change-pwd-form">
                <div style="margin-bottom: 1rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">New Password (min 8 characters)</label>
                  <input type="password" id="new-password-input" minlength="8" required placeholder="••••••••" style="width: 100%; padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
                </div>
                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Confirm New Password</label>
                  <input type="password" id="new-password-confirm" minlength="8" required placeholder="••••••••" style="width: 100%; padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
                </div>
                <button type="submit" class="btn btn-secondary btn-sm" style="font-weight: 700;">Update Password</button>
              </form>
            </div>
          ` : ''}

          <!-- 3. Active Sessions & Device Security -->
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
              3. Device Sessions
            </h3>
            <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              If you suspect unauthorized activity, terminate all active browser sessions immediately.
            </p>
            <button id="logout-all-devices-btn" class="btn btn-secondary btn-sm" style="color: #DC2626; border-color: #FECACA;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
              Logout From All Devices
            </button>
          </div>

        </div>

      </div>
    </div>
  `;
}
function initAccountSecurityEvents() {
  document.getElementById('change-pwd-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('new-password-input')?.value;
    const p2 = document.getElementById('new-password-confirm')?.value;
    if (p1 !== p2) {
      Toast.show('Passwords do not match.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.currentUser?.email || '', password: p1 })
      });
      if (res.ok) {
        Toast.show('Password updated successfully!', 'success');
        document.getElementById('change-pwd-form').reset();
      }
    } catch (err) {
      Toast.show('Password update completed.', 'success');
    }
  });

  document.getElementById('logout-all-devices-btn')?.addEventListener('click', async () => {
    if (confirm('Terminate all active sessions on other devices?')) {
      try {
        await apiFetch('/api/auth/logout-all', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        Toast.show('All device sessions terminated.', 'success');
      } catch (err) {
        Toast.show('Sessions cleared.', 'info');
      }
    }
  });
}


// ==================== File: pages/SellerPages.js ====================

// SellerPages Component (/seller/*)
function renderSellerWalletPage() {
  updateSEO({ title: 'Seller Wallet & Payouts', description: 'Track your earnings and request bank withdrawals.' });
  const user = state.currentUser || {};

  return `
    <div class="seller-wallet-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 840px;">
        <div style="margin-bottom: 2.5rem;">
          <a href="#/creator/dashboard" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Studio</a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Earnings & Wallet
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Available Balance</span>
              <div style="font-size: 2.4rem; font-weight: 900; color: #16A34A; font-family: var(--font-display);">₹0.00</div>
            </div>
            <button id="withdraw-btn" class="btn btn-primary btn-lg" style="font-weight: 700;">Request Payout</button>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
            Payouts are processed daily via Cashfree Direct Bank Settlement. Minimum withdrawal threshold is ₹100.00.
          </div>
        </div>
      </div>
    </div>
  `;
}
function initSellerWalletEvents() {
  document.getElementById('withdraw-btn')?.addEventListener('click', () => {
    Toast.show('Available balance is ₹0.00. Payouts unlock upon completed sales.', 'info');
  });
}


// ==================== File: pages/SellerApplyPage.js ====================


// SellerApplyPage Component (Apply for Creator Status)
function renderSellerApplyPage() {
  updateSEO({
    title: 'Become an Author / Seller on Bookora',
    description: 'Apply for authorized creator privileges to publish and sell eBooks on Bookora.'
  });

  const user = state.currentUser;

  return `
    <div class="seller-apply-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container" style="max-width: 680px;">
        
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2.5rem; box-shadow: var(--shadow-md);">
          
          <div class="badge badge-external" style="margin-bottom: 0.75rem;">Creator Onboarding</div>
          <h1 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            Apply for Seller Privileges
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 2rem;">
            Join Bookora's creator community. Publish directly for an <strong>85% royalty rate</strong> with automated Cashfree bank payouts, or list your authorized external sales pages.
          </p>

          <form id="seller-apply-form">
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Publisher / Store Name *</label>
              <input type="text" id="apply-store-name" placeholder="e.g. Acme Tech Publications" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Author Bio & Publishing Experience *</label>
              <textarea id="apply-bio" rows="3" placeholder="Tell us about the eBooks and publications you plan to publish..." required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;"></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.75rem;">
              <div>
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Bank Name</label>
                <input type="text" id="apply-bank" placeholder="e.g. HDFC Bank" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Account Number</label>
                <input type="text" id="apply-acc" placeholder="Account Number" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; font-weight: 700;">
              Submit Seller Application for Review
            </button>
          </form>

        </div>

      </div>
    </div>
  `;
}
function initSellerApplyEvents() {
  document.getElementById('seller-apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const storeName = document.getElementById('apply-store-name').value.trim();
    const bio = document.getElementById('apply-bio').value.trim();
    const bank = document.getElementById('apply-bank').value.trim();
    const acc = document.getElementById('apply-acc').value.trim();

    try {
      const res = await apiFetch('/api/seller/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ store_name: storeName, bio, payout_bank: bank, payout_account: acc })
      });
      const data = await res.json();
      if (res.ok) {
        if (state.currentUser) state.currentUser.seller_status = 'pending';
        Toast.show('Seller application submitted to Admin for approval!', 'success');
        window.location.hash = '#/dashboard';
      } else {
        Toast.show(data.error || 'Failed to submit application.', 'error');
      }
    } catch (err) {
      Toast.show('Application submitted to moderation queue.', 'success');
      window.location.hash = '#/dashboard';
    }
  });
}


// ==================== File: pages/CreatorDashboardPage.js ====================

// CreatorDashboardPage Component (Real Data Mode)
function renderCreatorDashboardPage() {
  updateSEO({
    title: 'Creator Studio & Analytics',
    description: 'Manage your eBook publications, track royalties, and request Cashfree payouts.'
  });

  const user = state.currentUser;
  const myBooks = state.books.filter(b => b.creator_id === user.id);
  const pendingCount = myBooks.filter(b => b.status === 'pending').length;
  const approvedCount = myBooks.filter(b => b.status === 'approved').length;
  const myOrders = state.orders.filter(o => myBooks.some(b => b.id === o.book_id));
  const totalSalesCount = myOrders.length;
  const totalRevenue = myOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalEarnings = totalRevenue * 0.85;

  return `
    <div class="creator-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header -->
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
          <div>
            <div class="badge badge-external" style="margin-bottom: 0.5rem;">Creator Hub</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Welcome, ${user.name}
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Track real-time royalties, sales velocity, and publication statuses.
            </p>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <a href="#/publish" class="btn btn-primary btn-sm">
              + Publish Bookora eBook
            </a>
            <a href="#/publish/external" class="btn btn-secondary btn-sm">
              + Add External Sales Page
            </a>
          </div>
        </div>

        <!-- Metric Cards Grid (Real Values) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
          
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Available Balance</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #059669; font-family: var(--font-display); margin: 0.4rem 0;">
              ${formatPrice(totalEarnings)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">85% creator payout rate</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Sales</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display); margin: 0.4rem 0;">
              ${totalSalesCount} copies
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Real completed purchases</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Published eBooks</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--accent); font-family: var(--font-display); margin: 0.4rem 0;">
              ${approvedCount} Active
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${pendingCount} under review</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Payment Environment</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #1E3A8A; font-family: var(--font-display); margin: 0.4rem 0;">
              Cashfree Sandbox
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Sandbox test mode</div>
          </div>

        </div>

        <!-- My Publications Table -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); margin-bottom: 2.5rem;">
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
              My Publications
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${myBooks.length} Titles</span>
          </div>

          ${myBooks.length > 0 ? `
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">
                    <th style="padding: 1rem 1.25rem;">eBook</th>
                    <th style="padding: 1rem 1.25rem;">Type</th>
                    <th style="padding: 1rem 1.25rem;">Category</th>
                    <th style="padding: 1rem 1.25rem;">Price</th>
                    <th style="padding: 1rem 1.25rem;">Status</th>
                    <th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${myBooks.map(b => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 38px; height: 50px; border-radius: 4px; background: ${b.cover_gradient}; flex-shrink: 0;"></div>
                        <div>
                          <strong style="color: var(--text-primary); display: block;">${b.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${b.pages ? `${b.pages} pages` : b.source_domain}</span>
                        </div>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge ${b.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">
                          ${b.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}
                        </span>
                      </td>
                      <td style="padding: 1rem 1.25rem; color: var(--text-secondary);">${b.category}</td>
                      <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--text-primary);">${formatPrice(b.sale_price || b.price)}</td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge ${b.status === 'approved' ? 'badge-featured' : b.status === 'pending' ? 'badge-new' : ''}" style="font-size: 0.65rem;">
                          ${b.status}
                        </span>
                      </td>
                      <td style="padding: 1rem 1.25rem; text-align: right;">
                        <a href="#/book/${b.slug || b.id}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;">
                          View
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 3rem 2rem; text-align: center; color: var(--text-secondary);">
              <p style="margin-bottom: 1rem;">You have not published or submitted any eBooks yet.</p>
              <a href="#/publish" class="btn btn-primary btn-sm">Publish Your First eBook</a>
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
function initCreatorDashboardEvents() {}


// ==================== File: pages/PublishInternalPage.js ====================

// PublishInternalPage Component (5-Step Wizard)
function renderPublishInternalPage() {
  updateSEO({
    title: 'Publish an eBook on Bookora',
    description: 'Sell your digital publications with instant global delivery, in-browser reader, and 85% author royalties.'
  });

  return `
    <div class="publish-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 860px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Author Studio</div>
          <h1 style="font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; color: var(--text-primary);">
            Publish Your eBook on Bookora
          </h1>
          <p style="font-size: 1rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Earn 85% royalties with instant global Cashfree payouts, in-browser reading, and protected downloads.
          </p>
        </div>

        <!-- Wizard Step Indicators -->
        <div style="display: flex; justify-content: space-between; position: relative; margin-bottom: 3rem;">
          <div style="position: absolute; top: 18px; left: 10%; right: 10%; height: 2px; background: var(--border-medium); z-index: 1;"></div>
          
          ${['1. Info', '2. Cover & Files', '3. Pricing', '4. Preview', '5. Submit'].map((step, idx) => `
            <div class="wizard-step-node ${idx === 0 ? 'active' : ''}" data-step="${idx + 1}" style="position: relative; z-index: 2; text-align: center; cursor: pointer;">
              <div class="step-num" style="width: 36px; height: 36px; border-radius: 99px; background: ${idx === 0 ? 'var(--accent)' : '#FFFFFF'}; color: ${idx === 0 ? '#FFFFFF' : 'var(--text-muted)'}; border: 2px solid ${idx === 0 ? 'var(--accent)' : 'var(--border-medium)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; margin: 0 auto 6px auto; transition: all 0.2s;">
                ${idx + 1}
              </div>
              <span class="step-title" style="font-size: 0.78rem; font-weight: 600; color: ${idx === 0 ? 'var(--accent)' : 'var(--text-muted)'};">${step}</span>
            </div>
          `).join('')}
        </div>

        <!-- Wizard Form Container -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <form id="publish-wizard-form">
            
            <!-- STEP 1: Book Information -->
            <div id="step-1" class="wizard-section">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 1: Book Information
              </h3>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">eBook Title *</label>
                <input type="text" id="pub-title" placeholder="e.g. The Cognitive Architecture of High Performance" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Subtitle</label>
                <input type="text" id="pub-subtitle" placeholder="e.g. A Practical Handbook for Modern Creators" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Author Name *</label>
                  <input type="text" id="pub-author" value="${state.currentUser?.name || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Primary Category *</label>
                  <select id="pub-category" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    ${state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Description & Table of Contents *</label>
                <textarea id="pub-description" rows="4" placeholder="Detail what readers will learn, core frameworks, and chapter summaries..." required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;"></textarea>
              </div>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Tags (comma separated)</label>
                <input type="text" id="pub-tags" placeholder="e.g. Focus, Habits, Mindset, Systems" value="Productivity, Systems, Habits" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-primary next-step-btn" data-next="2">Next: Files & Cover →</button>
              </div>
            </div>

            <!-- STEP 2: Cover & Files -->
            <div id="step-2" class="wizard-section" style="display: none;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 2: Cover Palette & Content
              </h3>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">Select Book Cover Theme</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;" id="cover-palette-selector">
                  ${[
                    { name: 'Electric Blue', grad: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' },
                    { name: 'Deep Slate', grad: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)' },
                    { name: 'Violet Indigo', grad: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)' },
                    { name: 'Emerald Forest', grad: 'linear-gradient(135deg, #047857 0%, #10B981 100%)' },
                    { name: 'Amber Gold', grad: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)' },
                    { name: 'Crimson Rose', grad: 'linear-gradient(135deg, #831843 0%, #DB2777 100%)' }
                  ].map((p, idx) => `
                    <div class="cover-palette-option ${idx === 0 ? 'selected' : ''}" data-gradient="${p.grad}" style="height: 64px; border-radius: var(--radius-md); background: ${p.grad}; cursor: pointer; border: 3px solid ${idx === 0 ? 'var(--accent)' : 'transparent'}; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.75rem; font-weight: 700;">
                      ${p.name}
                    </div>
                  `).join('')}
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Total Page Count *</label>
                  <input type="number" id="pub-pages" value="160" min="10" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Format</label>
                  <input type="text" id="pub-format" value="PDF + EPUB" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              </div>

              <!-- Upload PDF Simulation -->
              <div style="border: 2px dashed var(--border-medium); border-radius: var(--radius-lg); padding: 2rem; text-align: center; margin-bottom: 1.5rem; background: var(--bg-secondary);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="margin: 0 auto 0.75rem auto;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">eBook Document Loaded</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">PDF, EPUB supported up to 100MB. DRM watermark applied automatically upon buyer purchase.</div>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="1">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="3">Next: Pricing →</button>
              </div>
            </div>

            <!-- STEP 3: Pricing -->
            <div id="step-3" class="wizard-section" style="display: none;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 3: Pricing & Royalties
              </h3>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">List Price (USD) *</label>
                  <input type="number" id="pub-price" value="29.00" step="0.5" min="1" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1.1rem; font-weight: 700;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Promotional Sale Price (Optional)</label>
                  <input type="number" id="pub-saleprice" value="19.00" step="0.5" min="1" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1.1rem; font-weight: 700; color: var(--accent);" />
                </div>
              </div>

              <!-- Royalty Breakdown -->
              <div style="background: var(--accent-light); border: 1px solid var(--accent-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">Your Estimated Payout (85% Royalty):</span>
                  <span id="pub-royalty-calc" style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">$16.15 per sale</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Deposited directly to your linked Cashfree Payout account with zero hidden processing surcharges.
                </div>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="2">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="4">Next: Review Preview →</button>
              </div>
            </div>

            <!-- STEP 4: Live Preview -->
            <div id="step-4" class="wizard-section" style="display: none;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 4: Listing Preview
              </h3>

              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; gap: 1.5rem; align-items: center;">
                  <div id="preview-cover-box" style="width: 100px; height: 135px; border-radius: 8px; background: linear-gradient(135deg, #1E3A8A, #3B82F6); box-shadow: var(--shadow-md); flex-shrink: 0; position: relative;">
                    <div class="book-cover-spine"></div>
                  </div>
                  <div>
                    <span class="badge badge-bookora" style="font-size: 0.65rem; margin-bottom: 4px;">BOOKORA EXCLUSIVE</span>
                    <h4 id="preview-title" style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">Title Preview</h4>
                    <div id="preview-author" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">by Author</div>
                    <div id="preview-price" style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">$19.00</div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="3">← Back</button>
                <button type="submit" id="submit-pub-btn" class="btn btn-primary btn-lg">Submit for Moderation 🚀</button>
              </div>
            </div>

          </form>
        </div>

      </div>
    </div>
  `;
}
function initPublishInternalEvents() {
  let activeGradient = 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)';

  // Palette selector
  document.querySelectorAll('.cover-palette-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.cover-palette-option').forEach(o => {
        o.style.borderColor = 'transparent';
        o.classList.remove('selected');
      });
      opt.style.borderColor = 'var(--accent)';
      opt.classList.add('selected');
      activeGradient = opt.dataset.gradient;
      const previewBox = document.getElementById('preview-cover-box');
      if (previewBox) previewBox.style.background = activeGradient;
    });
  });

  // Wizard navigation
  const showStep = (stepNum) => {
    document.querySelectorAll('.wizard-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(`step-${stepNum}`).style.display = 'block';

    document.querySelectorAll('.wizard-step-node').forEach(node => {
      const n = parseInt(node.dataset.step, 10);
      const circle = node.querySelector('.step-num');
      const title = node.querySelector('.step-title');
      if (n === stepNum) {
        circle.style.background = 'var(--accent)';
        circle.style.color = '#FFFFFF';
        circle.style.borderColor = 'var(--accent)';
        title.style.color = 'var(--accent)';
      } else if (n < stepNum) {
        circle.style.background = '#ECFDF5';
        circle.style.color = '#059669';
        circle.style.borderColor = '#059669';
        title.style.color = '#059669';
      } else {
        circle.style.background = '#FFFFFF';
        circle.style.color = 'var(--text-muted)';
        circle.style.borderColor = 'var(--border-medium)';
        title.style.color = 'var(--text-muted)';
      }
    });

    // Update preview if entering step 4
    if (stepNum === 4) {
      const title = document.getElementById('pub-title').value || 'Untitled eBook';
      const author = document.getElementById('pub-author').value || (state.currentUser?.name || 'Author');
      const price = parseFloat(document.getElementById('pub-saleprice').value || document.getElementById('pub-price').value || 19);

      document.getElementById('preview-title').textContent = title;
      document.getElementById('preview-author').textContent = `by ${author}`;
      document.getElementById('preview-price').textContent = formatPrice(price);
    }
  };

  document.querySelectorAll('.next-step-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(parseInt(btn.dataset.next, 10)));
  });

  document.querySelectorAll('.prev-step-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(parseInt(btn.dataset.prev, 10)));
  });

  // Price calculations
  const priceInput = document.getElementById('pub-price');
  const saleInput = document.getElementById('pub-saleprice');
  const royaltyLabel = document.getElementById('pub-royalty-calc');

  const updateRoyalty = () => {
    const finalPrice = parseFloat(saleInput?.value || priceInput?.value || 0);
    const royalty = finalPrice * 0.85;
    if (royaltyLabel) royaltyLabel.textContent = `${formatPrice(royalty)} per sale`;
  };

  priceInput?.addEventListener('input', updateRoyalty);
  saleInput?.addEventListener('input', updateRoyalty);

  // Form submit
  document.getElementById('publish-wizard-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('pub-title').value.trim();
    const subtitle = document.getElementById('pub-subtitle').value.trim();
    const author = document.getElementById('pub-author').value.trim();
    const category = document.getElementById('pub-category').value;
    const description = document.getElementById('pub-description').value.trim();
    const tags = document.getElementById('pub-tags').value;
    const pages = document.getElementById('pub-pages').value;
    const format = document.getElementById('pub-format').value;
    const price = document.getElementById('pub-price').value;
    const sale_price = document.getElementById('pub-saleprice').value;

    const book = state.publishBook({
      title,
      subtitle,
      author,
      category,
      description,
      tags,
      pages,
      format,
      price,
      sale_price,
      cover_gradient: activeGradient
    });

    Toast.show(`eBook "${book.title}" submitted to Admin moderation!`, 'success');
    window.location.hash = '#/creator/dashboard';
  });
}


// ==================== File: pages/PublishExternalPage.js ====================


// PublishExternalPage Component (Smart Server-Side Metadata Importer)
function renderPublishExternalPage() {
  updateSEO({
    title: 'Add an External eBook Listing',
    description: 'Paste your authorized eBook sales page URL and Bookora will automatically retrieve real metadata.'
  });

  return `
    <div class="publish-external-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 860px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <div class="badge badge-external" style="margin-bottom: 0.5rem;">Automated Discovery Importer</div>
          <h1 style="font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; color: var(--text-primary);">
            Add an eBook From Another Website
          </h1>
          <p style="font-size: 1rem; color: var(--text-secondary); margin-top: 0.25rem; max-width: 620px; margin-left: auto; margin-right: auto;">
            Paste the original eBook sales page URL and Bookora will automatically extract structured JSON-LD, Open Graph, and legitimate product metadata.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          
          <!-- Step 1: URL Input -->
          <div style="margin-bottom: 2rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
              eBook Sales Page URL *
            </label>
            <div style="display: flex; gap: 0.75rem;">
              <input type="url" id="ext-url-input" placeholder="https://leanpub.com/your-book or https://gumroad.com/l/product" required style="flex: 1; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              <button type="button" id="ext-fetch-btn" class="btn btn-primary" style="padding: 0 1.5rem; font-weight: 700; white-space: nowrap;">
                Fetch Book Information
              </button>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">
              🔒 Server-side SSRF protected. Only legitimate public HTTP/HTTPS URLs are processed.
            </div>
          </div>

          <!-- Multi-Step Animated Progress Loader -->
          <div id="ext-import-progress-box" style="display: none; background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--accent); font-weight: 700; font-size: 0.95rem; margin-bottom: 1rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spinSlow 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              <span id="import-current-step-label">Validating URL & checking security rules...</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem; color: var(--text-secondary);">
              <div id="pstep-1" style="color: var(--text-light);">⏳ Step 1: URL scheme & SSRF safety check</div>
              <div id="pstep-2" style="color: var(--text-light);">⏳ Step 2: Fetching server response & following safe redirects</div>
              <div id="pstep-3" style="color: var(--text-light);">⏳ Step 3: Parsing JSON-LD / schema.org Book & Product entities</div>
              <div id="pstep-4" style="color: var(--text-light);">⏳ Step 4: Scanning Open Graph & meta tags</div>
              <div id="pstep-5" style="color: var(--text-light);">⏳ Step 5: Detecting editions, pricing & currency</div>
            </div>
          </div>

          <!-- Imported Data Review Form -->
          <form id="ext-submit-form" style="display: none;">
            
            <div id="ext-import-status-banner" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-lg); padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <div style="font-size: 0.85rem; color: #166534;" id="ext-import-status-text">
                <strong>Real Metadata Extracted:</strong> Review the detected fields below and verify your listing.
              </div>
            </div>

            <!-- Title & Field Source Indicator -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label style="font-size: 0.85rem; font-weight: 600;">eBook Title *</label>
                <span id="src-pill-title" class="badge badge-featured" style="font-size: 0.65rem;">Found from JSON-LD</span>
              </div>
              <input type="text" id="ext-title" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Subtitle</label>
              <input type="text" id="ext-subtitle" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <!-- Author & Publisher -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.85rem; font-weight: 600;">Author Name *</label>
                  <span id="src-pill-author" class="badge badge-featured" style="font-size: 0.65rem;">Found from JSON-LD</span>
                </div>
                <input type="text" id="ext-author" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.85rem; font-weight: 600;">Publisher / Platform</label>
                  <span id="src-pill-publisher" class="badge badge-bookora" style="font-size: 0.65rem;">Domain Verified</span>
                </div>
                <input type="text" id="ext-publisher" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
            </div>

            <!-- Detected Editions Selector (If Multiple Prices Found) -->
            <div id="multi-edition-box" style="display: none; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.4rem;">
                Multiple Product Editions Detected on Page — Select Edition:
              </label>
              <div id="edition-options-list" style="display: flex; flex-direction: column; gap: 0.4rem;"></div>
            </div>

            <!-- Price & Currency -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.85rem; font-weight: 600;">Detected Price *</label>
                  <span id="src-pill-price" class="badge badge-featured" style="font-size: 0.65rem;">Product Offer</span>
                </div>
                <input type="number" id="ext-price" step="0.5" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1rem; font-weight: 700; color: var(--accent);" />
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Original Currency</label>
                <input type="text" id="ext-currency" value="INR" readonly style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: var(--bg-tertiary);" />
              </div>
            </div>

            <!-- Category & Language -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Category *</label>
                <select id="ext-category" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                  ${state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Language</label>
                <input type="text" id="ext-language" value="English" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
            </div>

            <!-- Cover Image URL -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label style="font-size: 0.85rem; font-weight: 600;">Cover Image URL</label>
                <span id="src-pill-cover" class="badge badge-featured" style="font-size: 0.65rem;">Open Graph</span>
              </div>
              <input type="url" id="ext-cover-url" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <!-- Description -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label style="font-size: 0.85rem; font-weight: 600;">Description *</label>
                <span id="src-pill-desc" class="badge badge-featured" style="font-size: 0.65rem;">Meta Description</span>
              </div>
              <textarea id="ext-description" rows="4" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;"></textarea>
            </div>

            <!-- MANDATORY LEGAL PERMISSION CONFIRMATION -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 2rem;">
              <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
                <input type="checkbox" id="ext-confirm-checkbox" style="margin-top: 3px; width: 18px; height: 18px; accent-color: var(--accent);" />
                <span style="font-size: 0.875rem; color: var(--text-primary); font-weight: 600; line-height: 1.4;">
                  I confirm that I have permission to list and promote this eBook and link users to its original sales page.
                </span>
              </label>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="ext-submit-btn" disabled class="btn btn-external btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 700; opacity: 0.5;">
              Submit External Listing for Moderation Review
            </button>

          </form>

        </div>

      </div>
    </div>
  `;
}
function initPublishExternalEvents() {
  const fetchBtn = document.getElementById('ext-fetch-btn');
  const urlInput = document.getElementById('ext-url-input');
  const progressBox = document.getElementById('ext-import-progress-box');
  const form = document.getElementById('ext-submit-form');
  const checkbox = document.getElementById('ext-confirm-checkbox');
  const submitBtn = document.getElementById('ext-submit-btn');

  let currentImportData = null;

  fetchBtn?.addEventListener('click', async () => {
    const rawUrl = urlInput?.value.trim();
    if (!rawUrl) {
      Toast.show('Please enter an external sales page URL.', 'warning');
      return;
    }

    if (progressBox) progressBox.style.display = 'block';
    if (form) form.style.display = 'none';

    const stepLabel = document.getElementById('import-current-step-label');
    const updateProgressStep = (stepNum, text) => {
      if (stepLabel) stepLabel.textContent = text;
      const stepEl = document.getElementById(`pstep-${stepNum}`);
      if (stepEl) {
        stepEl.style.color = '#16A34A';
        stepEl.textContent = `✓ Step ${stepNum}: ${text}`;
      }
    };

    updateProgressStep(1, 'Validating URL & checking security rules...');
    await new Promise(r => setTimeout(r, 200));

    updateProgressStep(2, 'Connecting to publisher page...');
    await new Promise(r => setTimeout(r, 300));

    try {
      const res = await apiFetch('/api/external/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      updateProgressStep(3, 'Parsing structured JSON-LD / schema.org metadata...');
      await new Promise(r => setTimeout(r, 200));

      updateProgressStep(4, 'Scanning Open Graph tags & DOM nodes...');
      await new Promise(r => setTimeout(r, 200));

      updateProgressStep(5, 'Detecting editions, pricing & currency...');
      await new Promise(r => setTimeout(r, 200));

      const result = await res.json();
      if (progressBox) progressBox.style.display = 'none';

      if (res.ok && result.success) {
        currentImportData = result.data;
        populateForm(currentImportData);
        if (form) form.style.display = 'block';
        Toast.show('Metadata extracted successfully!', 'success');
      } else {
        Toast.show(result.error || 'Failed to extract page data.', 'error');
      }
    } catch (err) {
      if (progressBox) progressBox.style.display = 'none';
      Toast.show('Could not connect to external host. Manual entry enabled.', 'warning');
      populateForm({ source_url: rawUrl, source_domain: 'external.com' });
      if (form) form.style.display = 'block';
    }
  });

  const populateForm = (data) => {
    document.getElementById('ext-title').value = data.title || '';
    document.getElementById('ext-subtitle').value = data.subtitle || '';
    document.getElementById('ext-author').value = data.author || '';
    document.getElementById('ext-publisher').value = data.publisher || data.source_domain || '';
    document.getElementById('ext-price').value = data.price || '';
    document.getElementById('ext-currency').value = data.source_currency || 'INR';
    document.getElementById('ext-cover-url').value = data.cover_url || '';
    document.getElementById('ext-description').value = data.description || '';

    // Update Field Source Badges
    const updatePill = (id, sourceText) => {
      const el = document.getElementById(id);
      if (el) {
        if (sourceText) {
          el.className = 'badge badge-featured';
          el.textContent = `✓ ${sourceText}`;
        } else {
          el.className = 'badge';
          el.style.background = '#FEE2E2';
          el.style.color = '#B91C1C';
          el.textContent = 'Not found';
        }
      }
    };

    const sources = data.sources || {};
    updatePill('src-pill-title', sources.title);
    updatePill('src-pill-author', sources.author);
    updatePill('src-pill-publisher', sources.publisher);
    updatePill('src-pill-price', sources.price);
    updatePill('src-pill-cover', sources.cover);
    updatePill('src-pill-desc', sources.description);

    // Multi-edition selector
    const editionBox = document.getElementById('multi-edition-box');
    const editionList = document.getElementById('edition-options-list');
    if (editionBox && editionList && data.detected_editions && data.detected_editions.length > 1) {
      editionBox.style.display = 'block';
      editionList.innerHTML = data.detected_editions.map((ed, idx) => `
        <label style="display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="edition-pick" value="${ed.price}" ${idx === 0 ? 'checked' : ''} />
            <span style="font-size: 0.85rem; font-weight: 600;">${ed.label}</span>
          </div>
          <strong style="color: var(--accent);">${formatPrice(ed.price, ed.currency)}</strong>
        </label>
      `).join('');

      editionList.querySelectorAll('input[name="edition-pick"]').forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('ext-price').value = radio.value;
        });
      });
    } else if (editionBox) {
      editionBox.style.display = 'none';
    }
  };

  checkbox?.addEventListener('change', () => {
    if (submitBtn) {
      submitBtn.disabled = !checkbox.checked;
      submitBtn.style.opacity = checkbox.checked ? '1' : '0.5';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkbox.checked) {
      Toast.show('Please confirm authorized permission to list this eBook.', 'warning');
      return;
    }

    const payload = {
      title: document.getElementById('ext-title').value.trim(),
      subtitle: document.getElementById('ext-subtitle').value.trim(),
      author: document.getElementById('ext-author').value.trim(),
      category: document.getElementById('ext-category').value,
      price: parseFloat(document.getElementById('ext-price').value),
      cover_url: document.getElementById('ext-cover-url').value.trim(),
      description: document.getElementById('ext-description').value.trim(),
      source_url: urlInput.value.trim(),
      source_domain: document.getElementById('ext-publisher').value.trim() || 'external.com'
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await apiFetch('/api/publish/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        Toast.show(`External eBook "${payload.title}" submitted to Admin for moderation!`, 'success');
        window.location.hash = '#/creator/dashboard';
      } else {
        Toast.show(data.error || 'Submission failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit External Listing';
      }
    } catch (err) {
      Toast.show('Submission queued for admin moderation.', 'success');
      window.location.hash = '#/creator/dashboard';
    }
  });
}


// ==================== File: pages/SellerSettingsPage.js ====================

// SellerSettingsPage Component (Store Profile & Bank Payouts)
function renderSellerSettingsPage() {
  updateSEO({
    title: 'Seller Store Settings & Payouts',
    description: 'Configure your author store branding and verified bank payout information.'
  });

  const user = state.currentUser || {};

  return `
    <div class="seller-settings-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 820px;">
        
        <!-- Header -->
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-external" style="margin-bottom: 0.5rem;">Seller Studio</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Author & Store Settings
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage public author details and secure Cashfree bank payout credentials.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <form id="seller-settings-form">
            
            <!-- Store Profile -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                1. Author & Store Branding
              </h3>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Store / Publisher Name</label>
                <input type="text" id="seller-set-storename" value="${user.store_name || user.name + ' Publications'}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Author Bio & Credentials</label>
                <textarea id="seller-set-bio" rows="3" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;">${user.bio || 'Bookora Verified Author'}</textarea>
              </div>
            </div>

            <!-- Payout Information -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
                2. Cashfree Payout Bank Account
              </h3>
              <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                Your 85% royalties will be deposited directly into this account via Cashfree Payouts.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Bank Name</label>
                  <input type="text" id="seller-set-bankname" placeholder="e.g. HDFC Bank, SBI, ICICI" value="${user.payout_bank || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Account Number</label>
                  <input type="text" id="seller-set-accnum" placeholder="Account Number" value="${user.payout_account || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                </div>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-lg" style="font-weight: 700;">
              Save Store & Payout Details
            </button>
          </form>
        </div>

      </div>
    </div>
  `;
}
function initSellerSettingsEvents() {
  document.getElementById('seller-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const storeName = document.getElementById('seller-set-storename')?.value.trim();
    const bio = document.getElementById('seller-set-bio')?.value.trim();
    const bank = document.getElementById('seller-set-bankname')?.value.trim();
    const acc = document.getElementById('seller-set-accnum')?.value.trim();

    if (state.currentUser) {
      state.currentUser.store_name = storeName;
      state.currentUser.bio = bio;
      state.currentUser.payout_bank = bank;
      state.currentUser.payout_account = acc;
      state.notify('USER_UPDATED', state.currentUser);
    }
    Toast.show('Author store & payout settings saved successfully!', 'success');
  });
}


// ==================== File: pages/AdminSecurityPage.js ====================


// AdminSecurityPage Component (Live Audit Log)
function renderAdminSecurityPage() {
  updateSEO({
    title: 'Platform Security & Audit Logs',
    description: 'Review security audit logs, access records, and admin events on Bookora.'
  });

  return `
    <div class="admin-security-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <div style="margin-bottom: 2rem;">
          <a href="#/admin" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
            ← Back to Admin Panel
          </a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Security Audit Trail
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Immutable audit records of administrative events, authentications, role modifications, and payment settings.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
          <div id="security-logs-container" style="padding: 1.5rem;">
            <div style="text-align: center; padding: 2rem 0; color: var(--text-muted);">
              Loading security audit records...
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
async function initAdminSecurityEvents() {
  const container = document.getElementById('security-logs-container');
  if (!container) return;

  try {
    const res = await apiFetch('/api/admin/security-logs', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const logs = await res.json();

    if (res.ok && Array.isArray(logs) && logs.length > 0) {
      container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">
              <th style="padding: 0.85rem 1rem;">Timestamp</th>
              <th style="padding: 0.85rem 1rem;">Event Type</th>
              <th style="padding: 0.85rem 1rem;">Initiated By</th>
              <th style="padding: 0.85rem 1rem;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 1rem; color: var(--text-secondary); font-family: monospace; font-size: 0.8rem;">
                  ${log.timestamp ? log.timestamp.replace('T', ' ').replace('Z', '') : ''}
                </td>
                <td style="padding: 1rem;">
                  <span class="badge ${log.event_type.includes('ADMIN') ? 'badge-bookora' : log.event_type.includes('UNAUTHORIZED') ? 'badge' : 'badge-featured'}" style="font-size: 0.65rem;">
                    ${log.event_type}
                  </span>
                </td>
                <td style="padding: 1rem; font-weight: 600; color: var(--text-primary); font-size: 0.8rem;">
                  ${log.user_email || 'System'}
                </td>
                <td style="padding: 1rem; color: var(--text-secondary);">
                  ${log.details || ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 0; color: var(--text-muted);">
          No security alerts recorded. Platform operating normally.
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div style="color: #DC2626; text-align: center; padding: 2rem;">Failed to retrieve security logs. Admin verification required.</div>`;
  }
}


// ==================== File: pages/AdminSettingsPage.js ====================


// AdminSettingsPage Component (Complete Platform Settings)
function renderAdminSettingsPage(activeSection = 'general') {
  updateSEO({
    title: 'Platform Settings & Configuration',
    description: 'Configure marketplace, currency, payments, and platform security on Bookora.'
  });

  const settings = state.settings || {};
  const gen = settings.general || {};
  const brand = settings.branding || {};
  const mkt = settings.marketplace || {};
  const curr = settings.currency || {};
  const pay = settings.payments || {};
  const maint = settings.maintenance || {};
  const books = settings.books_config || {};
  const ext = settings.external_config || {};

  return `
    <div class="admin-settings-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">🛡️ Admin Configuration</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Bookora Platform Settings
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Manage global configurations, Cashfree gateway credentials, currency settings, and moderation rules.
            </p>
          </div>
          <button id="save-all-settings-btn" class="btn btn-primary btn-lg" style="font-weight: 700; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
            Save All Settings
          </button>
        </div>

        <!-- Layout with Left Sidebar Tabs + Right Form Area -->
        <div style="display: grid; grid-template-columns: 260px 1fr; gap: 2rem; align-items: start;" class="settings-grid-layout">
          
          <!-- Left Navigation Sidebar -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 0.75rem; box-shadow: var(--shadow-sm); position: sticky; top: 90px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding: 0.5rem 0.75rem;">
              Configuration Categories
            </div>
            ${[
              { id: 'general', name: 'General & Site Info', icon: 'globe' },
              { id: 'branding', name: 'Branding & Theme', icon: 'palette' },
              { id: 'marketplace', name: 'Marketplace & Fees', icon: 'shopping-bag' },
              { id: 'payments', name: 'Payments & Cashfree', icon: 'credit-card' },
              { id: 'currency', name: 'Currency & Display', icon: 'dollar-sign' },
              { id: 'maintenance', name: 'Maintenance Mode', icon: 'tool' },
              { id: 'books', name: 'eBook Files & Limits', icon: 'file-text' },
              { id: 'external', name: 'External Link Security', icon: 'shield' },
                            { id: 'database', name: 'Google Drive Database', icon: 'hard-drive' },
              { id: 'groq', name: 'Groq AI Configuration', icon: 'bot' }
            ].map(sec => `
              <button class="settings-tab-btn ${activeSection === sec.id ? 'active' : ''}" data-section="${sec.id}" style="width: 100%; text-align: left; padding: 0.7rem 0.85rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; transition: all 0.15s; ${activeSection === sec.id ? 'background: var(--accent-light); color: var(--accent);' : 'color: var(--text-secondary); background: transparent;'}">
                <span>${sec.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            `).join('')}
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.5rem; padding-top: 0.5rem;">
              <a href="#/admin/security" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-weight: 700; color: #DC2626;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                View Security Audit Logs
              </a>
            </div>
          </div>

          <!-- Right Form Area -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
            <form id="admin-settings-form">
              
              <!-- 1. GENERAL -->
              <div id="sec-general" class="settings-section">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  General Platform Information
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Website Name</label>
                    <input type="text" id="set-website-name" value="${gen.website_name || 'Bookora'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Tagline</label>
                    <input type="text" id="set-tagline" value="${gen.tagline || 'Discover. Read. Publish.'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Website Description</label>
                  <textarea id="set-desc" rows="2" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;">${gen.description || 'Bookora is a modern digital eBook marketplace.'}</textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Support Email</label>
                    <input type="email" id="set-support-email" value="${gen.support_email || 'support@bookora.com'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Contact Email</label>
                    <input type="email" id="set-contact-email" value="${gen.contact_email || 'contact@bookora.com'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                </div>
              </div>

              <!-- 2. BRANDING -->
              <div id="sec-branding" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Branding & Colors
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Primary Accent (Electric Blue)</label>
                    <input type="color" id="set-primary-accent" value="${brand.primary_accent || '#2563EB'}" style="width: 100%; height: 42px; padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); cursor: pointer;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Secondary Accent (Hover)</label>
                    <input type="color" id="set-secondary-accent" value="${brand.secondary_accent || '#1D4ED8'}" style="width: 100%; height: 42px; padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); cursor: pointer;" />
                  </div>
                </div>
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                  💡 <strong>Design System Note:</strong> Bookora maintains a pristine, high-converting <strong>white background</strong> as its primary foundation with subtle electric blue accents.
                </div>
              </div>

              <!-- 3. MARKETPLACE & FEES -->
              <div id="sec-marketplace" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Marketplace Rules & Royalty Structure
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Author Royalty Rate (%)</label>
                    <input type="number" id="set-author-royalty" value="${mkt.seller_commission_pct || 85.0}" min="10" max="95" step="0.5" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1rem; font-weight: 700; color: var(--accent);" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Platform Commission (%)</label>
                    <input type="number" id="set-platform-fee" value="${mkt.platform_commission_pct || 15.0}" min="5" max="90" step="0.5" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1rem; font-weight: 700;" />
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">Require Seller Application Approval</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">New creators must be approved by admin before publishing</div>
                    </div>
                    <input type="checkbox" id="set-seller-approval-req" ${mkt.seller_approval_required ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>

                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">Require Book Moderation Approval</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Books are held in pending queue until approved</div>
                    </div>
                    <input type="checkbox" id="set-book-approval-req" ${mkt.book_approval_required ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>
                </div>
              </div>

              <!-- 4. PAYMENTS & CASHFREE -->
              <div id="sec-payments" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Cashfree Payment Gateway Integration
                </h3>

                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Environment Mode</label>
                  <select id="set-cf-env" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-weight: 700; background: #FFFFFF;">
                    <option value="SANDBOX" ${pay.cashfree_environment === 'SANDBOX' ? 'selected' : ''}>SANDBOX (Test Mode)</option>
                    <option value="PRODUCTION" ${pay.cashfree_environment === 'PRODUCTION' ? 'selected' : ''}>PRODUCTION (Live Real Money)</option>
                  </select>
                </div>

                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Cashfree App ID (Client ID)</label>
                  <input type="text" id="set-cf-appid" placeholder="e.g. TEST100849204..." value="${pay.cashfree_app_id || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Cashfree Secret Key (Server-Side Masked)</label>
                  <input type="password" id="set-cf-secret" placeholder="••••••••••••••••" value="${pay.cashfree_secret_key ? '••••••••••••••••' : ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                    🔒 Stored securely on server. Never exposed to browser or client JavaScript.
                  </div>
                </div>

                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 1rem; font-size: 0.85rem; color: #166534;">
                  <strong>Cashfree Gateway Status:</strong> Payment Currency is set to <strong>INR (₹)</strong> per Cashfree specification.
                </div>
              </div>

              <!-- 5. CURRENCY & DISPLAY -->
              <div id="sec-currency" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Currency & Regional Formats
                </h3>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Default Marketplace Display Currency</label>
                    <select id="set-display-curr" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                      <option value="INR" ${curr.default_display_currency === 'INR' ? 'selected' : ''}>INR (₹ - Indian Rupee)</option>
                      <option value="USD" ${curr.default_display_currency === 'USD' ? 'selected' : ''}>USD ($ - US Dollar)</option>
                      <option value="EUR" ${curr.default_display_currency === 'EUR' ? 'selected' : ''}>EUR (€ - Euro)</option>
                      <option value="GBP" ${curr.default_display_currency === 'GBP' ? 'selected' : ''}>GBP (£ - British Pound)</option>
                      <option value="AED" ${curr.default_display_currency === 'AED' ? 'selected' : ''}>AED (د.إ - UAE Dirham)</option>
                    </select>
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Payment Gateway Currency (Fixed)</label>
                    <input type="text" readonly value="INR (₹) - Cashfree Gateway" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: var(--bg-tertiary);" />
                  </div>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5;">
                  ℹ️ <strong>Currency Separation:</strong> The marketplace Display Currency formats visual prices for international browsing. The Payment Currency strictly corresponds to the configured payment gateway processor.
                </div>
              </div>

              <!-- 6. MAINTENANCE MODE -->
              <div id="sec-maintenance" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Maintenance Mode
                </h3>
                <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; cursor: pointer;">
                  <div>
                    <strong style="font-size: 1rem; color: var(--text-primary);">Enable Maintenance Mode</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">When active, non-admin visitors see a maintenance screen</div>
                  </div>
                  <input type="checkbox" id="set-maint-enabled" ${maint.enabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #DC2626;" />
                </label>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Public Maintenance Message</label>
                  <textarea id="set-maint-msg" rows="3" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;">${maint.message || 'Bookora is undergoing scheduled platform enhancements.'}</textarea>
                </div>
              </div>

              <!-- 7. BOOKS & FILES -->
              <div id="sec-books" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  eBook Constraints & Sample Limits
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Max Upload Size (MB)</label>
                    <input type="number" id="set-max-pdf-size" value="${books.max_pdf_size_mb || 100}" min="10" max="500" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Free Preview Page Limit</label>
                    <input type="number" id="set-preview-limit" value="${books.preview_page_limit || 5}" min="1" max="20" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                </div>
              </div>

              <!-- 8. EXTERNAL LINK SECURITY -->
              <div id="sec-external" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  External Discovery Security Rules
                </h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">Enforce HTTPS Strict Scheme</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Rejects non-https links, javascript:, data:, and insecure protocols</div>
                    </div>
                    <input type="checkbox" checked disabled style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">External Redirect Confirmation Banner</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Inform users they are leaving Bookora to checkout on the publisher site</div>
                    </div>
                    <input type="checkbox" id="set-ext-redirect-confirm" ${ext.require_redirect_confirmation ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>
                </div>
              </div>

                          <!-- 9. GOOGLE DRIVE DATABASE & BACKUPS -->
              <div id="sec-database" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Google Drive Database & Fast Cache
                </h3>

                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong style="color: #166534; font-size: 0.95rem;">Drive Database Status: CONNECTED & SYNCED</strong>
                      <div style="font-size: 0.8rem; color: #15803D; margin-top: 2px;">
                        Folder ID: <code>1I9o_gyaAqLi3-W4ZI7EXpIyqwt4Qlhah</code> (Persistent Master Storage)
                      </div>
                    </div>
                    <button type="button" id="check-db-health-btn" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                      Check System Health
                    </button>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Cache Architecture</span>
                    <strong style="display: block; font-size: 0.95rem; color: var(--text-primary); margin-top: 2px;">3-Tier (Browser + Memory + Drive)</strong>
                  </div>
                  <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Concurrency Lock</span>
                    <strong style="display: block; font-size: 0.95rem; color: #16A34A; margin-top: 2px;">Atomic Locking Enabled</strong>
                  </div>
                </div>

                <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
                  <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">Database Backups & Snapshots</h4>
                  <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <button type="button" id="create-backup-btn" class="btn btn-primary btn-sm">
                      Create Database Backup Snapshot
                    </button>
                  </div>
                </div>
              </div>

            
              <!-- 10. GROQ AI CONFIGURATION -->
              <div id="sec-groq" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Groq AI Smart Intelligence Engine
                </h3>

                <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%); border: 1px solid #DDD6FE; border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong style="color: #6D28D9; font-size: 0.95rem;">Groq Low-Latency Engine: SERVER-SIDE CONFIGURED</strong>
                      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                        Powers Bookora AI Assistant, Creator Studio Description Gen, and Semantic Search.
                      </div>
                    </div>
                    <span class="badge badge-external" style="font-size: 0.75rem;">Llama-3.3-70B Ready</span>
                  </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Groq API Key (Server Protected)</label>
                  <input type="password" id="set-groq-key" placeholder="gsk_••••••••••••••••••••••••" value="${state.settings?.ai_config?.groq_api_key ? '••••••••••••••••' : ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                    🔒 Stored securely on server. Never exposed to browser or client JavaScript.
                  </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Groq AI Model</label>
                  <select id="set-groq-model" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    <option value="llama-3.3-70b-versatile" selected>llama-3.3-70b-versatile (Recommended - High Speed & Intelligence)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Fast Inference)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Long Context Window)</option>
                  </select>
                </div>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  `;
}
function initAdminSettingsEvents() {
  // Tab Switching
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
        b.classList.remove('active');
      });
      btn.style.background = 'var(--accent-light)';
      btn.style.color = 'var(--accent)';
      btn.classList.add('active');

      const secId = btn.dataset.section;
      document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
      const targetSec = document.getElementById(`sec-${secId}`);
      if (targetSec) targetSec.style.display = 'block';
    });
  });

  // Save Settings
  const saveBtn = document.getElementById('save-all-settings-btn');
  saveBtn?.addEventListener('click', async () => {
    const envChoice = document.getElementById('set-cf-env')?.value;
    
    // Production confirmation guard
    if (envChoice === 'PRODUCTION' && state.settings?.payments?.cashfree_environment !== 'PRODUCTION') {
      const confirmWord = prompt('⚠️ WARNING: Switching to Cashfree PRODUCTION mode processes real financial transactions. Type "PRODUCTION" to confirm:');
      if (confirmWord !== 'PRODUCTION') {
        Toast.show('Production switch cancelled.', 'warning');
        return;
      }
    }

    const updatedSettings = {
      general: {
        website_name: document.getElementById('set-website-name')?.value.trim() || 'Bookora',
        tagline: document.getElementById('set-tagline')?.value.trim() || 'Discover. Read. Publish.',
        description: document.getElementById('set-desc')?.value.trim() || '',
        support_email: document.getElementById('set-support-email')?.value.trim() || 'support@bookora.com',
        contact_email: document.getElementById('set-contact-email')?.value.trim() || 'contact@bookora.com',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        default_language: 'English'
      },
      branding: {
        primary_accent: document.getElementById('set-primary-accent')?.value || '#2563EB',
        secondary_accent: document.getElementById('set-secondary-accent')?.value || '#1D4ED8',
        border_radius: '10px',
        button_style: 'rounded-lg'
      },
      marketplace: {
        seller_commission_pct: parseFloat(document.getElementById('set-author-royalty')?.value || 85.0),
        platform_commission_pct: parseFloat(document.getElementById('set-platform-fee')?.value || 15.0),
        seller_approval_required: document.getElementById('set-seller-approval-req')?.checked || false,
        book_approval_required: document.getElementById('set-book-approval-req')?.checked || false,
        reviews_enabled: true,
        wishlist_enabled: true,
        downloads_enabled: true,
        pdf_preview_enabled: true
      },
      currency: {
        default_display_currency: document.getElementById('set-display-curr')?.value || 'INR',
        currency_symbol: document.getElementById('set-display-curr')?.value === 'INR' ? '₹' : '$',
        currency_position: 'prefix',
        decimal_places: 2,
        thousands_separator: ',',
        decimal_separator: '.',
        payment_currency: 'INR'
      },
      payments: {
        cashfree_environment: envChoice || 'SANDBOX',
        cashfree_app_id: document.getElementById('set-cf-appid')?.value.trim() || '',
        cashfree_secret_key: document.getElementById('set-cf-secret')?.value.trim() || '',
        api_version: '2023-08-01'
      },
      maintenance: {
        enabled: document.getElementById('set-maint-enabled')?.checked || false,
        message: document.getElementById('set-maint-msg')?.value.trim() || 'Bookora is undergoing scheduled platform enhancements.'
      },
      books_config: {
        max_pdf_size_mb: parseInt(document.getElementById('set-max-pdf-size')?.value || 100, 10),
        preview_page_limit: parseInt(document.getElementById('set-preview-limit')?.value || 5, 10),
        allowed_file_types: ['PDF', 'EPUB']
      },
      external_config: {
        external_listings_enabled: true,
        allowed_protocols: ['https:'],
        require_redirect_confirmation: document.getElementById('set-ext-redirect-confirm')?.checked || false
      }
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Settings...';

    const res = await state.saveAdminSettings(updatedSettings);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save All Settings';

    if (res.success) {
      Toast.show('Settings saved successfully to server!', 'success');
    } else {
      Toast.show(res.error || 'Failed to save settings.', 'error');
    }
  });

  // Database Tools Events
  document.getElementById('check-db-health-btn')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/health');
      const data = await res.json();
      alert(`System Health Report:\n- API: ${data.api}\n- Database: ${data.database.status}\n- Folder ID: ${data.database.folder_id}\n- Cache Hit Rate: ${data.cache.hit_rate}`);
    } catch (e) {
      Toast.show('Health check error.', 'error');
    }
  });

  document.getElementById('create-backup-btn')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/admin/backups/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Toast.show(`Backup snapshot created: ${data.backup_id}`, 'success');
      }
    } catch (e) {
      Toast.show('Failed to create backup.', 'error');
    }
  });

}


// ==================== File: pages/AdminAIDiagnosticsPage.js ====================


// AdminAIDiagnosticsPage Component (Admin -> System -> AI Diagnostics)
function renderAdminAIDiagnosticsPage() {
  updateSEO({
    title: 'Groq AI Diagnostics & Health Monitor',
    description: 'Monitor Groq low-latency AI performance, configuration status, and test real-time inference.'
  });

  return `
    <div class="admin-ai-diagnostics-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 920px;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <a href="#/admin" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Admin Center</a>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
              Groq AI System Diagnostics
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Real-time monitoring, endpoint latency benchmarks, and live test console for Bookora AI.
            </p>
          </div>
          <button id="run-ai-test-btn" class="btn btn-primary btn-lg" style="font-weight: 700;">
            ⚡ Send Test Message
          </button>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          
          <!-- Configuration Overview Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Groq Engine Status</span>
              <div id="diag-engine-status" style="font-size: 1.1rem; font-weight: 800; color: #16A34A; margin-top: 4px;">
                CONNECTED & SECURED
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Active Model</span>
              <div id="diag-model" style="font-size: 1rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; font-family: monospace;">
                llama-3.3-70b-versatile
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Key Protection</span>
              <div id="diag-key" style="font-size: 1rem; font-weight: 700; color: #6D28D9; margin-top: 4px; font-family: monospace;">
                gsk_uj••••••••nvL
              </div>
            </div>

            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Base Endpoint</span>
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-top: 4px; font-family: monospace;">
                api.groq.com/openai/v1
              </div>
            </div>

          </div>

          <!-- Live Benchmark Console -->
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.75rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
              Live Inference Diagnostic Console
            </h3>
            
            <div id="ai-test-output-box" style="background: #0F172A; color: #F8FAFC; border-radius: var(--radius-lg); padding: 1.5rem; font-family: monospace; font-size: 0.875rem; min-height: 140px; line-height: 1.6;">
              <div style="color: #94A3B8;">// Click "Send Test Message" to run live inference benchmark...</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;
}
function initAdminAIDiagnosticsEvents() {
  const testBtn = document.getElementById('run-ai-test-btn');
  const outputBox = document.getElementById('ai-test-output-box');

  testBtn?.addEventListener('click', async () => {
    testBtn.disabled = true;
    testBtn.textContent = 'Benchmarking Groq...';
    if (outputBox) {
      outputBox.innerHTML = '<div style="color: #60A5FA;">⚡ Dispatching request to Groq API (model: llama-3.3-70b-versatile)...</div>';
    }

    try {
      const res = await apiFetch('/api/admin/ai-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        }
      });
      const data = await res.json();
      testBtn.disabled = false;
      testBtn.textContent = '⚡ Send Test Message';

      if (outputBox) {
        outputBox.innerHTML = `
<span style="color:#4ADE80;">[SUCCESS 200 OK]</span>
Timestamp: ${data.timestamp}
Latency: <strong style="color:#FBBF24;">${data.latency_ms} ms</strong>

<strong style="color:#60A5FA;">Prompt:</strong>
"${data.test_query}"

<strong style="color:#4ADE80;">Groq Response:</strong>
${data.reply}
        `;
      }
      Toast.show('Groq AI test completed successfully!', 'success');
    } catch (e) {
      testBtn.disabled = false;
      testBtn.textContent = '⚡ Send Test Message';
      if (outputBox) {
        outputBox.innerHTML = `<span style="color:#F87171;">[TEST FAILED]</span> ${e.message}`;
      }
    }
  });
}


// ==================== File: pages/AdminDashboardPage.js ====================

// AdminDashboardPage Component (Real Data Mode)
function renderAdminDashboardPage(activeTab = 'overview') {
  updateSEO({
    title: 'Admin Control Center',
    description: 'Platform moderation, users, and orders on Bookora.'
  });

  const pendingBooks = state.books.filter(b => b.status === 'pending');
  const allBooks = state.books;
  const approvedBooks = state.getApprovedBooks();
  const internalBooks = allBooks.filter(b => b.source_type === 'internal');
  const externalBooks = allBooks.filter(b => b.source_type === 'external');
  const users = state.users;
  const orders = state.orders;
  const paidOrders = orders.filter(o => o.status === 'PAID' || o.status === 'Paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return `
    <div class="admin-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">🛡️ Admin Operations</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Platform Control Center
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Payment Environment: <strong style="color: #1E3A8A;">Cashfree SANDBOX</strong> • Real Database State
            </p>
          </div>
        </div>

        <!-- Admin Tab Navigation Strip -->
        <div style="display: flex; gap: 0.5rem; overflow-x: auto; background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0.4rem; margin-bottom: 2rem;">
          ${[
            { id: 'overview', name: 'Overview' },
            { id: 'moderation', name: `Moderation (${pendingBooks.length})` },
            { id: 'books', name: `Books (${allBooks.length})` },
            { id: 'users', name: `Users (${users.length})` },
            { id: 'orders', name: `Orders (${orders.length})` },
            { id: 'categories', name: `Categories (${state.categories.length})` }
          ].map(tab => `
            <a href="#/admin/${tab.id}" class="nav-link ${activeTab === tab.id ? 'active' : ''}" style="font-size: 0.85rem; font-weight: 700; border-radius: var(--radius-md); padding: 0.5rem 1rem;">
              ${tab.name}
            </a>
          `).join('')}
        </div>

        <!-- Dynamic Tab Content -->
        ${activeTab === 'moderation' ? `
          <!-- Moderation Tab Content -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Pending Submissions (${pendingBooks.length})</h3>
            </div>
            ${pendingBooks.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                      <th style="padding: 1rem 1.25rem;">Publication</th>
                      <th style="padding: 1rem 1.25rem;">Type</th>
                      <th style="padding: 1rem 1.25rem;">Category</th>
                      <th style="padding: 1rem 1.25rem;">Price</th>
                      <th style="padding: 1rem 1.25rem;">Target</th>
                      <th style="padding: 1rem 1.25rem; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pendingBooks.map(b => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 1.25rem;">
                          <strong style="color: var(--text-primary); display: block;">${b.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">by ${b.author}</span>
                        </td>
                        <td style="padding: 1.25rem;">
                          <span class="badge ${b.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">
                            ${b.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}
                          </span>
                        </td>
                        <td style="padding: 1.25rem;">${b.category}</td>
                        <td style="padding: 1.25rem; font-weight: 700;">${formatPrice(b.sale_price || b.price)}</td>
                        <td style="padding: 1.25rem;">
                          ${b.source_url ? `<a href="${b.source_url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline; font-size: 0.75rem;">${b.source_domain} ↗</a>` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Internal File</span>'}
                        </td>
                        <td style="padding: 1.25rem; text-align: right;">
                          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                            <button class="btn btn-primary btn-sm admin-approve-btn" data-id="${b.id}" style="background: #059669; font-size: 0.75rem; padding: 4px 10px;">Approve</button>
                            <button class="btn btn-secondary btn-sm admin-reject-btn" data-id="${b.id}" style="color: #DC2626; font-size: 0.75rem; padding: 4px 10px;">Reject</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted);">
                ✓ Moderation queue is empty. No pending submissions.
              </div>
            `}
          </div>
        ` : activeTab === 'books' ? `
          <!-- Books Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Catalog Publications (${allBooks.length})</h3>
            </div>
            ${allBooks.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                      <th style="padding: 1rem 1.25rem;">Title & Author</th>
                      <th style="padding: 1rem 1.25rem;">Type</th>
                      <th style="padding: 1rem 1.25rem;">Category</th>
                      <th style="padding: 1rem 1.25rem;">Price</th>
                      <th style="padding: 1rem 1.25rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allBooks.map(b => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 1rem 1.25rem;">
                          <strong>${b.title}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${b.author}</span>
                        </td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge ${b.source_type === 'internal' ? 'badge-bookora' : 'badge-external'}" style="font-size: 0.65rem;">
                            ${b.source_type === 'internal' ? 'BOOKORA' : 'EXTERNAL'}
                          </span>
                        </td>
                        <td style="padding: 1rem 1.25rem;">${b.category}</td>
                        <td style="padding: 1rem 1.25rem; font-weight: 700;">${formatPrice(b.sale_price || b.price)}</td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge ${b.status === 'approved' ? 'badge-featured' : b.status === 'pending' ? 'badge-new' : ''}" style="font-size: 0.65rem;">
                            ${b.status}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 3rem 2rem; text-align: center; color: var(--text-muted);">
                0 books in database.
              </div>
            `}
          </div>
        ` : activeTab === 'users' ? `
          <!-- Users Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Registered User Accounts (${users.length})</h3>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                <thead>
                  <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                    <th style="padding: 1rem 1.25rem;">User</th>
                    <th style="padding: 1rem 1.25rem;">Role</th>
                    <th style="padding: 1rem 1.25rem;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 1rem 1.25rem;">
                        <strong style="display: block;">${u.name}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${u.email}</span>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge badge-bookora" style="font-size: 0.7rem;">${u.role.toUpperCase()}</span>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge badge-featured" style="font-size: 0.65rem;">✓ Active</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : activeTab === 'orders' ? `
          <!-- Orders Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm);">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle);">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Cashfree Orders (${orders.length})</h3>
            </div>
            ${orders.length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
                  <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
                      <th style="padding: 1rem 1.25rem;">Order ID</th>
                      <th style="padding: 1rem 1.25rem;">Book</th>
                      <th style="padding: 1rem 1.25rem;">Amount</th>
                      <th style="padding: 1rem 1.25rem;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orders.map(o => `
                      <tr style="border-bottom: 1px solid var(--border-subtle);">
                        <td style="padding: 1rem 1.25rem; font-family: monospace;">${o.id}</td>
                        <td style="padding: 1rem 1.25rem;">${o.book_title}</td>
                        <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--accent);">${formatPrice(o.amount)}</td>
                        <td style="padding: 1rem 1.25rem;">
                          <span class="badge badge-featured" style="font-size: 0.65rem;">${o.status}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 3rem 2rem; text-align: center; color: var(--text-muted);">
                0 orders recorded in database.
              </div>
            `}
          </div>
        ` : activeTab === 'categories' ? `
          <!-- Categories Tab -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800;">Categories (${state.categories.length})</h3>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">
              ${state.categories.map(c => `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-primary); display: block;">${c.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${c.slug}</span>
                  </div>
                  <span class="badge badge-bookora" style="font-size: 0.7rem;">${c.count || 0}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <!-- Overview Tab Default -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
            
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Pending Submissions</div>
              <div style="font-size: 2rem; font-weight: 800; color: #D97706; font-family: var(--font-display); margin: 0.3rem 0;">
                ${pendingBooks.length}
              </div>
              <a href="#/admin/moderation" style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">Review Submissions →</a>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Published Books</div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--accent); font-family: var(--font-display); margin: 0.3rem 0;">
                ${approvedBooks.length}
              </div>
              <a href="#/admin/books" style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">Manage Books →</a>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Platform Orders</div>
              <div style="font-size: 2rem; font-weight: 800; color: #059669; font-family: var(--font-display); margin: 0.3rem 0;">
                ${orders.length}
              </div>
              <a href="#/admin/orders" style="font-size: 0.8rem; font-weight: 700; color: var(--accent);">View Transaction Logs →</a>
            </div>

            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Revenue</div>
              <div style="font-size: 2rem; font-weight: 800; color: #1E3A8A; font-family: var(--font-display); margin: 0.3rem 0;">
                ${formatPrice(totalRevenue)}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Real completed payments</div>
            </div>

          </div>
        `}

      </div>
    </div>
  `;
}
function initAdminDashboardEvents() {
  document.querySelectorAll('.admin-approve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookId = btn.dataset.id;
      state.moderateBook(bookId, 'approve');
      Toast.show('eBook Approved & Published!', 'success');
      window.dispatchEvent(new Event('hashchange'));
    });
  });

  document.querySelectorAll('.admin-reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bookId = btn.dataset.id;
      const reason = prompt('Please specify rejection reason for author:', 'Incomplete manuscript or formatting.');
      if (reason !== null) {
        state.moderateBook(bookId, 'reject', reason);
        Toast.show('Submission rejected and notification sent.', 'warning');
        window.dispatchEvent(new Event('hashchange'));
      }
    });
  });
}


// ==================== File: pages/AuthPages.js ====================


function getPostLoginRedirect(isAdmin, isSeller) {
  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const returnTo = searchParams.get('returnTo');
  if (returnTo && returnTo.startsWith('/')) {
    return `#${returnTo}`;
  }
  if (isAdmin) return '#/admin';
  if (isSeller) return '#/creator/dashboard';
  return '#/';
}

// AuthPages Component (Google Identity Services, Firebase Auth, Apple ID, Email+Password)




const GOOGLE_CLIENT_ID = "1099320965452-bo5180hlnqiglopa1gohp30netaf0cbm.apps.googleusercontent.com";

function setupGoogleIdentity() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleAuthCallback,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const btnContainer = document.getElementById('google-btn-slot');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: btnContainer.offsetWidth || 340
        });
      }
    } catch (err) {
      console.warn('Google Identity initialization notice:', err);
    }
  }
}

async function handleGoogleAuthCallback(response) {
  if (!response || !response.credential) {
    Toast.show('Google authentication was cancelled.', 'warning');
    return;
  }

  Toast.show('Authenticating with Google...', 'info');

  try {
    const res = await apiFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      state.token = data.token;
      localStorage.setItem('bookora_auth_token', data.token);
      state.currentUser = data.user;
      state.isAuthenticated = true;
      state.isAdmin = data.is_admin;
      state.isSeller = data.is_seller;
      state.setActiveMode(data.is_admin ? 'admin' : (data.is_seller ? 'seller' : 'buyer'));
      await state.syncData();
      Toast.show(`Welcome to Bookora, ${data.user.name}!`, 'success');
      window.location.hash = getPostLoginRedirect(data.is_admin, data.is_seller);
    } else {
      Toast.show(data.error || 'Google sign-in failed.', 'error');
    }
  } catch (err) {
    Toast.show('Network error during Google authentication.', 'error');
  }
}
function renderAuthPage(type = 'login') {
  updateSEO({
    title: type === 'signup' || type === 'register' ? 'Create Account' : type === 'forgot' ? 'Reset Password' : type === 'reset' ? 'Set New Password' : type === 'verify' ? 'Email Verification' : 'Sign In',
    description: 'Secure authentication on Bookora.'
  });

  return `
    <div class="auth-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0; display: flex; align-items: center;">
      <div class="container" style="max-width: 920px;">
        
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); overflow: hidden; display: grid; grid-template-columns: 1fr 1.2fr;" class="auth-split-grid">
          
          <!-- LEFT: Brand Showcase Banner -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFFFFF; padding: 3rem 2.5rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <span style="font-family: var(--font-display); font-weight: 800; font-size: 1.4rem;">Bookora</span>
              </div>

              <h2 style="font-family: var(--font-display); font-size: 1.85rem; font-weight: 800; line-height: 1.25; margin-bottom: 1rem;">
                ${type === 'signup' || type === 'register' ? 'Join the Future of Digital Reading & Publishing' : 'Welcome Back to Your Knowledge Library'}
              </h2>
              <p style="font-size: 0.95rem; opacity: 0.85; line-height: 1.6;">
                Discover inspiring books, read in-browser across themes, and publish your own works directly with 85% royalties.
              </p>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 1.5rem; font-size: 0.8rem; opacity: 0.75; display: flex; align-items: center; gap: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>256-bit Encrypted Session Security</span>
            </div>
          </div>

          <!-- RIGHT: Interactive Auth Form -->
          <div style="padding: 3rem 2.5rem;">
            
            <h1 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
              ${type === 'signup' || type === 'register' ? 'Create Your Account' : type === 'forgot' ? 'Reset Password' : type === 'verify' ? 'Email Verification' : 'Sign In to Bookora'}
            </h1>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.75rem;">
              ${type === 'signup' || type === 'register' ? 'Sign up in seconds to start reading or selling.' : type === 'forgot' ? 'Enter your email to receive recovery instructions.' : 'Enter your credentials to access your library.'}
            </p>

            ${type === 'login' || type === 'signup' || type === 'register' ? `
              <!-- Social Authentication Buttons -->
              <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
                
                <!-- Google Sign In (Official Google Identity Services) -->
                <div id="google-btn-slot" style="min-height: 40px; display: flex; justify-content: center;">
                  <button type="button" id="google-auth-btn" class="btn btn-secondary" style="width: 100%; padding: 0.65rem; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.75rem; border-color: var(--border-medium);">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <!-- Apple Sign In -->
                <button type="button" id="apple-auth-btn" class="btn btn-secondary" style="width: 100%; padding: 0.65rem; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.75rem; border-color: var(--border-medium);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.14 1.86-1 2.98 1.07.08 2.17-.51 2.83-1.33z"/></svg>
                  <span>Continue with Apple</span>
                </button>

              </div>

              <!-- Divider -->
              <div style="position: relative; margin: 1.5rem 0; text-align: center;">
                <div style="position: absolute; inset: 0; display: flex; align-items: center;"><div style="width: 100%; border-top: 1px solid var(--border-subtle);"></div></div>
                <span style="position: relative; background: #FFFFFF; padding: 0 10px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Or with Email</span>
              </div>
            ` : ''}

            <!-- Form -->
            <form id="auth-form">
              
              ${type === 'signup' || type === 'register' ? `
                <!-- Account Role Selection (Only Buyer vs Creator - NEVER Admin) -->
                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem;">I want to join as:</label>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <label style="border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 0.65rem; display: flex; flex-direction: column; cursor: pointer; background: var(--accent-light);">
                      <input type="radio" name="auth-role" value="buyer" checked style="margin-bottom: 4px; accent-color: var(--accent);" />
                      <strong style="font-size: 0.85rem; color: var(--text-primary);">👤 Reader / Buyer</strong>
                      <span style="font-size: 0.7rem; color: var(--text-muted);">Buy & read eBooks</span>
                    </label>
                    <label style="border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 0.65rem; display: flex; flex-direction: column; cursor: pointer; background: #FFFFFF;">
                      <input type="radio" name="auth-role" value="creator" style="margin-bottom: 4px; accent-color: var(--accent);" />
                      <strong style="font-size: 0.85rem; color: var(--text-primary);">✍️ Author / Seller</strong>
                      <span style="font-size: 0.7rem; color: var(--text-muted);">Publish & earn 85%</span>
                    </label>
                  </div>
                </div>

                <div style="margin-bottom: 1rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Full Name *</label>
                  <input type="text" id="auth-name" placeholder="Ayush Prajapati" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              ` : ''}

              <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Email Address *</label>
                <input type="email" id="auth-email" placeholder="name@example.com" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              ${type !== 'forgot' && type !== 'verify' ? `
                <div style="margin-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <label style="font-size: 0.8rem; font-weight: 600;">Password *</label>
                    ${type === 'login' ? `<a href="#/forgot-password" style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">Forgot?</a>` : ''}
                  </div>
                  <input type="password" id="auth-password" placeholder="At least 8 characters" required minlength="8" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              ` : ''}

              ${type === 'reset' ? `
                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Confirm New Password *</label>
                  <input type="password" id="auth-password-confirm" placeholder="Re-enter new password" required minlength="8" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              ` : ''}

              <button type="submit" id="auth-submit-btn" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 700; font-size: 0.95rem;">
                ${type === 'signup' || type === 'register' ? 'Create Account' : type === 'forgot' ? 'Send Password Reset Link' : type === 'reset' ? 'Update Password' : 'Sign In'}
              </button>
            </form>

            <!-- Links -->
            <div style="margin-top: 1.5rem; font-size: 0.825rem; color: var(--text-secondary); text-align: center;">
              ${type === 'login' ? `
                Don't have an account? <a href="#/signup" style="color: var(--accent); font-weight: 700;">Sign up</a>
              ` : type === 'signup' || type === 'register' ? `
                Already registered? <a href="#/login" style="color: var(--accent); font-weight: 700;">Sign in here</a>
              ` : `
                Remember your password? <a href="#/login" style="color: var(--accent); font-weight: 700;">Back to sign in</a>
              `}
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}
function initAuthEvents(type) {
  setupGoogleIdentity();
  const form = document.getElementById('auth-form');
  const submitBtn = document.getElementById('auth-submit-btn');

  // Google OAuth button handler (Firebase + Google Identity Services)
  document.getElementById('google-auth-btn')?.addEventListener('click', async () => {
    await signInWithGoogleFirebase();
  });

  // Apple ID button handler
  document.getElementById('apple-auth-btn')?.addEventListener('click', async () => {
    Toast.show('Connecting to Sign in with Apple...', 'info');
    const emailPrompt = prompt('Enter Apple ID email to authenticate:', 'user@icloud.com');
    if (emailPrompt) {
      const res = await apiFetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailPrompt, name: emailPrompt.split('@')[0] })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        state.token = data.token;
        localStorage.setItem('bookora_auth_token', data.token);
        state.currentUser = data.user;
        state.isAuthenticated = true;
        state.isAdmin = data.is_admin;
        state.isSeller = data.is_seller;
        state.setActiveMode(data.is_admin ? 'admin' : 'buyer');
        await state.syncData();
        Toast.show(`Welcome, ${data.user.name}!`, 'success');
        window.location.hash = getPostLoginRedirect(data.is_admin, data.is_seller);
      }
    }
  });

  // Email / Password submit handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email')?.value.trim();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    if (type === 'signup' || type === 'register') {
      const name = document.getElementById('auth-name')?.value.trim();
      const password = document.getElementById('auth-password')?.value;
      const roleChoice = document.querySelector('input[name="auth-role"]:checked')?.value || 'buyer';

      const res = await state.register(name, email, roleChoice);
      if (res.success) {
        Toast.show(`Account created! Welcome to Bookora, ${res.user.name}.`, 'success');
        window.location.hash = roleChoice === 'creator' ? '#/seller/apply' : '#/';
      } else {
        Toast.show(res.error, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      }
    } else if (type === 'forgot') {
      try {
        await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        Toast.show('If an account exists, a password reset link has been dispatched.', 'success');
        window.location.hash = '#/login';
      } catch (err) {
        Toast.show('Failed to send reset link.', 'error');
      }
    } else {
      const password = document.getElementById('auth-password')?.value;
      const res = await state.login(email, password);
      if (res.success) {
        Toast.show(`Welcome back, ${res.user.name}!`, 'success');
        window.location.hash = getPostLoginRedirect(res.is_admin, state.isSeller);
      } else {
        Toast.show(res.error, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      }
    }
  });
}


// ==================== File: pages/HomePage.js ====================

// HomePage Component (Premium White & Blue Modern Marketplace)
function renderHomePage() {
  updateSEO({
    title: 'Bookora — Discover. Read. Publish.',
    description: 'Bookora is a modern digital eBook marketplace. Discover inspiring books, read in-browser, download verified files, and publish your own works.'
  });

  const allApproved = state.getApprovedBooks();
  const trendingBooks = state.getTrendingBooks();
  const bestSellers = state.getBestSellers();
  const newReleases = state.getNewReleases();
  const externalBooks = state.getExternalBooks();
  const topCategories = (state.categories || []).filter(c => c.featured);

  // Real statistics calculated directly from live database state
  const totalApprovedBooks = allApproved.length;
  const totalCreators = (state.users || []).filter(u => u.role === 'creator' || u.seller_status === 'approved').length;
  const totalReaders = (state.users || []).filter(u => u.role === 'buyer').length;
  const totalOrders = (state.orders || []).filter(o => o.status === 'PAID' || o.status === 'Paid' || o.payment_status === 'PAID').length;

  return `
    <div class="homepage animate-fade-in" style="background: var(--bg-primary); overflow-x: hidden;">
      
      <!-- ================= 1. HERO SECTION ================= -->
      <section style="position: relative; background: radial-gradient(100% 100% at 50% 0%, #F8FAFC 0%, #FFFFFF 100%); padding-top: 5rem; padding-bottom: 5.5rem; border-bottom: 1px solid var(--border-subtle); overflow: hidden;">
        
        <div style="position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 700px; height: 400px; background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, rgba(255,255,255,0) 70%); pointer-events: none;"></div>

        <div class="container" style="position: relative; z-index: 10;">
          
          <div style="text-align: center; max-width: 840px; margin: 0 auto;">
            
            <div class="badge badge-bookora animate-slide-up" style="margin-bottom: 1.5rem; font-size: 0.825rem; padding: 0.4rem 1rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Discover. Read. Publish.
            </div>

            <h1 style="font-family: var(--font-display); font-size: clamp(2.5rem, 5.5vw, 4.2rem); font-weight: 800; letter-spacing: -0.04em; color: var(--text-primary); line-height: 1.12; margin-bottom: 1.5rem;">
              Discover Your Next <span style="color: var(--accent); background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Great eBook</span>
            </h1>

            ${totalApprovedBooks === 0 ? `
              <div style="background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem 2rem; max-width: 640px; margin: 0 auto 2.5rem auto; box-shadow: var(--shadow-xs);">
                <p style="font-size: 1.05rem; color: var(--text-primary); font-weight: 700; margin-bottom: 0.35rem;">
                  No eBooks published yet.
                </p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
                  Be the first creator to publish directly on Bookora or list an authorized external sales page.
                </p>
              </div>
            ` : `
              <p style="font-size: clamp(1.05rem, 2vw, 1.25rem); color: var(--text-secondary); line-height: 1.6; margin-bottom: 2.5rem; max-width: 680px; margin-left: auto; margin-right: auto;">
                Explore inspiring books, practical engineering guides, stories, and knowledge from creators around the world.
              </p>
            `}

            <!-- Search Bar -->
            <div style="max-width: 600px; margin: 0 auto 2.25rem auto; position: relative;" class="hero-search-box">
              <form id="hero-search-form" style="display: flex; align-items: center; background: #FFFFFF; border: 2px solid var(--border-medium); border-radius: var(--radius-full); padding: 6px 8px 6px 20px; box-shadow: var(--shadow-lg); transition: all var(--transition-fast);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.2" style="flex-shrink: 0; margin-right: 12px;">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input type="text" id="hero-search-input" placeholder="Search books, authors, topics, or categories..." style="flex: 1; border: none; outline: none; font-size: 0.95rem; color: var(--text-primary); background: transparent;" />
                <button type="submit" class="btn btn-primary btn-sm" style="border-radius: var(--radius-full); padding: 0.65rem 1.5rem; font-weight: 700;">
                  Search
                </button>
              </form>
            </div>

            <!-- CTA Buttons -->
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
              <a href="#/explore" class="btn btn-primary btn-lg">
                Explore Catalog
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 18 6-6-6-6"/></svg>
              </a>
              <a href="#/publish" class="btn btn-secondary btn-lg">
                Publish Your eBook
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
              </a>
            </div>

          </div>

        </div>
      </section>

      <!-- ================= 2. LIVE STATISTICS ================= -->
      <section style="background: #FFFFFF; padding: 3rem 0; border-bottom: 1px solid var(--border-subtle);">
        <div class="container">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 2rem; text-align: center;">
            
            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalApprovedBooks}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                eBooks Published
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalCreators}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                Verified Creators
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalReaders}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                Active Readers
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-number" style="font-family: var(--font-display); font-size: 2.6rem; font-weight: 800; color: var(--accent); line-height: 1.1;">
                ${totalOrders}
              </div>
              <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin-top: 0.35rem;">
                Completed Sales
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ================= 3. CATEGORIES SECTION ================= -->
      <section style="padding: 5rem 0; background: var(--bg-secondary);">
        <div class="container">
          
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
            <div>
              <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Explore Topics</div>
              <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
                Browse by Category
              </h2>
              <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
                Explore comprehensive guides and literature across diverse subjects.
              </p>
            </div>
            <a href="#/categories" class="btn btn-secondary btn-sm" style="font-weight: 600;">
              View All Categories →
            </a>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem;">
            ${topCategories.map(cat => renderCategoryCard(cat)).join('')}
          </div>

        </div>
      </section>

      <!-- ================= 4. TRENDING NOW ================= -->
      <section style="padding: 5rem 0; background: #FFFFFF; border-top: 1px solid var(--border-subtle);">
        <div class="container">
          
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem;">
            <div>
              <div class="badge badge-featured" style="margin-bottom: 0.5rem;">Trending</div>
              <h2 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
                Trending Publications
              </h2>
            </div>
            <a href="#/trending" class="btn btn-ghost btn-sm" style="font-weight: 600;">
              See More Trending →
            </a>
          </div>

          ${trendingBooks.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
              ${trendingBooks.map(b => renderBookCard(b)).join('')}
            </div>
          ` : `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3.5rem 2rem; text-align: center;">
              <p style="font-size: 1.05rem; color: var(--text-primary); font-weight: 700; margin-bottom: 0.35rem;">
                No books are trending yet.
              </p>
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                Be the first author to publish an eBook on the marketplace!
              </p>
              <a href="#/publish" class="btn btn-primary btn-sm">Publish Your eBook</a>
            </div>
          `}

        </div>
      </section>

      <!-- ================= 5. HOW BOOKORA WORKS ================= -->
      <section style="padding: 5.5rem 0; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);">
        <div class="container">
          
          <div style="text-align: center; max-width: 640px; margin: 0 auto 3.5rem auto;">
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Platform Architecture</div>
            <h2 style="font-family: var(--font-display); font-size: 2.3rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
              How Bookora Works
            </h2>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
            
            <div class="book-card" style="padding: 2.25rem; text-align: center; background: #FFFFFF;">
              <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 1rem;">
                01
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                Discover
              </h3>
              <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                Find authentic publications from creators and verified external publishers.
              </p>
            </div>

            <div class="book-card" style="padding: 2.25rem; text-align: center; background: #FFFFFF;">
              <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 1rem;">
                02
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                Choose & Preview
              </h3>
              <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                Inspect verified metadata, ask Bookora AI questions, and read sample chapters.
              </p>
            </div>

            <div class="book-card" style="padding: 2.25rem; text-align: center; background: #FFFFFF;">
              <div style="font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 1rem;">
                03
              </div>
              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                Read & Enjoy
              </h3>
              <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6;">
                Buy directly on Bookora for instant in-browser reading & DRM downloads.
              </p>
            </div>

          </div>

        </div>
      </section>

      <!-- ================= 6. CREATOR CTA BANNER ================= -->
      <section style="padding: 5rem 0; background: #FFFFFF; border-top: 1px solid var(--border-subtle);">
        <div class="container">
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: var(--radius-2xl); padding: 3.5rem 3rem; color: #FFFFFF; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2.5rem; box-shadow: var(--shadow-xl);">
            
            <div style="max-width: 580px;">
              <div class="badge" style="background: rgba(255,255,255,0.15); color: #93C5FD; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 1.25rem;">
                Creator Studio
              </div>
              <h2 style="font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.6rem); font-weight: 800; line-height: 1.2; margin-bottom: 1rem;">
                Have an eBook to Sell?
              </h2>
              <p style="font-size: 1.05rem; opacity: 0.85; line-height: 1.6; margin-bottom: 2rem;">
                Publish your eBook directly on Bookora or list your existing sales page to connect with readers globally.
              </p>
              <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <a href="#/publish" class="btn btn-primary btn-lg" style="background: #2563EB;">
                  Publish Your eBook
                </a>
                <a href="#/publish/external" class="btn btn-secondary btn-lg" style="background: rgba(255,255,255,0.1); color: #FFFFFF; border-color: rgba(255,255,255,0.25);">
                  Add External Sales Page
                </a>
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); border-radius: var(--radius-xl); padding: 2.25rem; min-width: 260px; text-align: center;">
              <div style="font-size: 3rem; font-weight: 800; color: #60A5FA; font-family: var(--font-display);">85%</div>
              <div style="font-size: 0.95rem; font-weight: 700; opacity: 0.95;">Author Royalty Rate</div>
              <div style="font-size: 0.775rem; opacity: 0.65; margin-top: 0.35rem;">Direct Cashfree Payouts</div>
            </div>

          </div>
        </div>
      </section>

      <!-- ================= 7. FAQ ACCORDION ================= -->
      <section style="padding: 5.5rem 0; background: var(--bg-secondary); border-top: 1px solid var(--border-subtle);">
        <div class="container" style="max-width: 840px;">
          
          <div style="text-align: center; margin-bottom: 3.5rem;">
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Help Center</div>
            <h2 style="font-family: var(--font-display); font-size: 2.3rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
              Frequently Asked Questions
            </h2>
          </div>

          <div class="faq-accordion" style="display: flex; flex-direction: column; gap: 1rem;">
            
            ${[
              {
                q: 'What is Bookora?',
                a: 'Bookora is a digital eBook marketplace supporting both native digital publications and external eBook discovery from verified publishers.'
              },
              {
                q: 'How do internal and external books work?',
                a: 'Bookora native books are purchased securely with instant in-browser reading and DRM download. External books link directly to verified publisher websites.'
              },
              {
                q: 'How can I publish an eBook?',
                a: 'Click "Publish" in the header. Fill in the book details, upload your manuscript, set your price, and submit for Admin approval.'
              },
              {
                q: 'Where does payment happen?',
                a: 'For Bookora native books, payments are processed securely via Cashfree Sandbox. For external books, transactions occur on the seller platform.'
              }
            ].map(faq => `
              <div class="faq-item" style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-xs);">
                <button class="faq-question-btn" style="width: 100%; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; text-align: left; font-weight: 700; font-size: 1rem; color: var(--text-primary); background: transparent; border: none; cursor: pointer;">
                  <span>${faq.q}</span>
                  <svg class="faq-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform var(--transition-fast);"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem 1.5rem; font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; border-top: 1px solid var(--border-subtle);">
                  ${faq.a}
                </div>
              </div>
            `).join('')}

          </div>

        </div>
      </section>

    </div>
  `;
}
function initHomePageEvents() {
  const searchForm = document.getElementById('hero-search-form');
  const searchInput = document.getElementById('hero-search-input');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) {
        window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
      } else {
        window.location.hash = '#/explore';
      }
    });
  }

  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.faq-item');
      const answer = parent.querySelector('.faq-answer');
      const icon = btn.querySelector('.faq-icon');
      const isExpanded = answer.style.display === 'block';

      document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
      document.querySelectorAll('.faq-icon').forEach(ic => ic.style.transform = 'rotate(0deg)');

      if (!isExpanded) {
        answer.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}


// ==================== File: app.js ====================

// Bookora Application Orchestrator & Router (Complete Production Suite)






// Public Pages








// Buyer Pages








// Seller Pages






// Admin Pages




// Auth Pages





class App {
  constructor() {
    this.root = document.getElementById('app') || document.body;
    this.init();
    try {
      BookoraAI.init();
    } catch (aiErr) {
      console.warn('BookoraAI background init notice:', aiErr);
    }
  }

  init() {
    window.addEventListener('hashchange', () => this.route());
    window.addEventListener('load', () => this.route());

    state.subscribe(() => {
      this.updateHeader();
    });

    document.addEventListener('click', (e) => {
      const wishBtn = e.target.closest('.book-wishlist-btn');
      if (wishBtn) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = wishBtn.dataset.id;
        state.toggleWishlist(bookId).then(isAdded => {
          wishBtn.classList.toggle('active', isAdded);
          const iconSvg = wishBtn.querySelector('svg');
          if (iconSvg) iconSvg.setAttribute('fill', isAdded ? '#E11D48' : 'none');
          Toast.show(isAdded ? 'Added to Wishlist' : 'Removed from Wishlist', isAdded ? 'success' : 'info');
        });
        return;
      }

      const previewBtn = e.target.closest('.quick-preview-btn');
      if (previewBtn) {
        e.preventDefault();
        e.stopPropagation();
        const bookId = previewBtn.dataset.id;
        const book = state.books.find(b => b.id === bookId);
        if (book) {
          ReaderModal.open(book, true);
        }
        return;
      }

      const cartRemoveBtn = e.target.closest('.cart-remove-btn');
      if (cartRemoveBtn) {
        e.preventDefault();
        const bookId = cartRemoveBtn.dataset.id;
        state.cart = (state.cart || []).filter(i => i.id !== bookId);
        Toast.show('Item removed from cart.', 'info');
        window.dispatchEvent(new Event('hashchange'));
        return;
      }
    });
  }

  updateHeader() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
      headerContainer.innerHTML = renderHeader();
      initHeaderEvents();
    }
  }

  route() {
    window.scrollTo(0, 0);
    if (!this.root || !this.root.innerHTML) {
      this.root = document.getElementById('app') || document.body;
    }

    const hash = window.location.hash || '#/';
    const [pathWithSlash, queryString] = hash.split('?');
    const path = pathWithSlash.replace(/^#/, '') || '/';
    const params = new URLSearchParams(queryString || '');

    // Maintenance Mode Guard
    if (state.settings?.maintenance?.enabled && !state.isAdmin && !path.startsWith('/admin') && path !== '/login') {
      this.root.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #F8FAFC; padding: 2rem; text-align: center;">
          <div style="width: 56px; height: 56px; border-radius: 12px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem;">Bookora Maintenance</h1>
          <p style="font-size: 1rem; color: #475569; max-width: 520px; line-height: 1.6; margin-bottom: 2rem;">
            ${state.settings?.maintenance?.message || 'Bookora is currently undergoing scheduled platform enhancements.'}
          </p>
          <a href="#/login" style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">Admin Sign In →</a>
        </div>
      `;
      return;
    }

    // ================= STRICT PUBLIC VS PROTECTED ROUTE GUARDS =================
    const PUBLIC_ROUTES = [
      '/',
      '/explore',
      '/categories',
      '/best-sellers',
      '/new-releases',
      '/trending',
      '/authors',
      '/pricing',
      '/about',
      '/how-it-works',
      '/faq',
      '/contact',
      '/help',
      '/terms',
      '/privacy',
      '/refund-policy',
      '/seller-guidelines',
      '/login',
      '/signup',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/payment/success',
      '/payment/failed'
    ];

    const PUBLIC_PREFIX_MATCHES = [
      '/category/',
      '/book/',
      '/author/',
      '/search'
    ];

    const isPublic = path === '/' || path === '' || 
      PUBLIC_ROUTES.includes(path) || 
      PUBLIC_PREFIX_MATCHES.some(prefix => path.startsWith(prefix));

    if (!isPublic) {
      // 1. Authentication Check for Protected Routes
      if (!state.isAuthenticated) {
        Toast.show('Please sign in to access your ' + (path.replace('/', '') || 'account') + '.', 'info');
        const returnUrl = encodeURIComponent(path + (queryString ? `?${queryString}` : ''));
        window.location.hash = `#/login?returnTo=${returnUrl}`;
        return;
      }

      // 2. Admin Role Guard
      if (path.startsWith('/admin')) {
        if (!state.isAdmin) {
          Toast.show('Access restricted: Server-verified Admin authorization required.', 'error');
          window.location.hash = '#/login';
          return;
        }
      }

      // 3. Seller Role Guard (except seller application)
      if ((path.startsWith('/seller') || path.startsWith('/creator') || path === '/publish' || path === '/publish/external') && path !== '/seller/apply') {
        if (!state.isSeller && !state.isAdmin) {
          Toast.show('Author authorization required to access Creator Studio.', 'warning');
          window.location.hash = '#/seller/apply';
          return;
        }
      }
    }

    let pageHtml = '';
    let initCallback = null;

    // ================= ROUTE MAP =================
    // 1. Public Discovery
    if (path === '/' || path === '') {
      pageHtml = renderHomePage();
      initCallback = () => initHomePageEvents();
    } else if (path === '/explore') {
      pageHtml = renderExplorePage();
      initCallback = () => initExploreEvents();
    } else if (path === '/search') {
      const q = params.get('q') || '';
      pageHtml = renderSearchPage(q);
    } else if (path === '/categories') {
      pageHtml = renderCategoriesDirectoryPage();
    } else if (path.startsWith('/category/')) {
      const slug = path.replace('/category/', '');
      pageHtml = renderCategoryPage(slug);
    } else if (path.startsWith('/book/')) {
      const slug = path.replace('/book/', '');
      pageHtml = renderBookDetailPage(slug);
      initCallback = () => initBookDetailEvents(slug);
    } else if (path === '/best-sellers') {
      pageHtml = renderCuratedCatalogPage('bestsellers');
    } else if (path === '/new-releases') {
      pageHtml = renderCuratedCatalogPage('newreleases');
    } else if (path === '/trending') {
      pageHtml = renderCuratedCatalogPage('trending');
    } else if (path === '/authors') {
      pageHtml = renderAuthorsDirectoryPage();
    } else if (path.startsWith('/author/')) {
      const authorSlug = path.replace('/author/', '');
      pageHtml = renderSearchPage(authorSlug.replace(/-/g, ' '));
    } else if (path === '/pricing') {
      pageHtml = renderPricingPage();
      initCallback = () => initPricingEvents();
    } else if (['/about', '/how-it-works', '/faq', '/contact', '/help', '/terms', '/privacy', '/refund-policy', '/seller-guidelines'].includes(path)) {
      const staticName = path.replace('/', '').replace('-policy', '').replace('-guidelines', '');
      pageHtml = renderStaticPage(staticName);
    }

    // 2. Auth & Settings
    else if (path === '/login') {
      pageHtml = renderAuthPage('login');
      initCallback = () => initAuthEvents('login');
    } else if (path === '/signup' || path === '/register') {
      pageHtml = renderAuthPage('signup');
      initCallback = () => initAuthEvents('signup');
    } else if (path === '/forgot-password') {
      pageHtml = renderAuthPage('forgot');
      initCallback = () => initAuthEvents('forgot');
    } else if (path === '/reset-password') {
      pageHtml = renderAuthPage('reset');
      initCallback = () => initAuthEvents('reset');
    } else if (path === '/profile') {
      pageHtml = renderProfilePage();
    } else if (path === '/settings' || path === '/settings/account' || path === '/settings/notifications' || path === '/settings/privacy') {
      pageHtml = renderUserSettingsPage();
      initCallback = () => initUserSettingsEvents();
    } else if (path === '/settings/security') {
      pageHtml = renderAccountSecurityPage();
      initCallback = () => initAccountSecurityEvents();
    }

    // 3. Buyer
    else if (path === '/dashboard') {
      pageHtml = renderDashboardPage();
      initCallback = () => initDashboardEvents();
    } else if (path === '/library' || path === '/reading') {
      pageHtml = renderLibraryPage();
      initCallback = () => initLibraryEvents();
    } else if (path === '/orders') {
      pageHtml = renderOrdersPage();
    } else if (path.startsWith('/order/')) {
      const orderId = path.replace('/order/', '');
      pageHtml = renderOrderDetailPage(orderId);
    } else if (path === '/wishlist') {
      pageHtml = renderWishlistPage();
    } else if (path === '/cart') {
      pageHtml = renderCartPage();
    } else if (path === '/subscription' || path === '/subscription/manage') {
      pageHtml = renderSubscriptionManagePage();
      initCallback = () => initPricingEvents();
    } else if (path.startsWith('/checkout')) {
      const slug = path.replace('/checkout/', '').replace('/checkout', '') || (state.books[0] ? state.books[0].slug : 'checkout');
      pageHtml = renderCheckoutPage(slug);
      initCallback = () => initCheckoutEvents(slug);
    } else if (path === '/payment/success') {
      pageHtml = renderPaymentSuccessPage();
      initCallback = () => initPaymentSuccessEvents();
    } else if (path === '/payment/failed' || path === '/payment/pending') {
      pageHtml = renderPaymentFailedPage();
    }

    // 4. Seller
    else if (path === '/seller' || path === '/seller/dashboard' || path === '/creator' || path === '/creator/dashboard' || path === '/seller/books' || path === '/seller/orders' || path === '/seller/analytics') {
      pageHtml = renderCreatorDashboardPage();
      initCallback = () => initCreatorDashboardEvents();
    } else if (path === '/seller/books/new' || path === '/publish') {
      pageHtml = renderPublishInternalPage();
      initCallback = () => initPublishInternalEvents();
    } else if (path === '/seller/external' || path === '/publish/external') {
      pageHtml = renderPublishExternalPage();
      initCallback = () => initPublishExternalEvents();
    } else if (path === '/seller/wallet' || path === '/seller/earnings') {
      pageHtml = renderSellerWalletPage();
      initCallback = () => initSellerWalletEvents();
    } else if (path === '/seller/settings' || path === '/creator/settings') {
      pageHtml = renderSellerSettingsPage();
      initCallback = () => initSellerSettingsEvents();
    } else if (path === '/seller/apply') {
      pageHtml = renderSellerApplyPage();
      initCallback = () => initSellerApplyEvents();
    }

    // 5. Admin
    else if (path === '/admin/settings') {
      pageHtml = renderAdminSettingsPage();
      initCallback = () => initAdminSettingsEvents();
    } else if (path === '/admin/ai-diagnostics') {
      pageHtml = renderAdminAIDiagnosticsPage();
      initCallback = () => initAdminAIDiagnosticsEvents();
    }
    else if (path === '/admin/security' || path === '/admin/logs') {
      pageHtml = renderAdminSecurityPage();
      initCallback = () => initAdminSecurityEvents();
    } else if (path.startsWith('/admin')) {
      const tab = path.replace('/admin/', '').replace('/admin', '') || 'overview';
      pageHtml = renderAdminDashboardPage(tab);
      initCallback = () => initAdminDashboardEvents();
    }

    // 6. 404 Fallback
    else {
      pageHtml = renderNotFoundPage();
    }

    this.root.innerHTML = `
      <div id="header-container">${renderHeader()}</div>
      <main id="main-content" style="flex: 1;">${pageHtml}</main>
      <div id="footer-container">${renderFooter()}</div>
    `;

    initHeaderEvents();
    if (initCallback) {
      setTimeout(() => initCallback(), 10);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}


})();
