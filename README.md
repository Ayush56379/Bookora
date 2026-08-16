# Bookora — Frontend Client Application

This repository contains the complete, responsive Single Page Application (SPA) for the Bookora eBook marketplace.

---

## Key Features

* **Universal Responsive UI**: Engineered for 320px Mobile, Tablet, and Desktop (1920px) viewports with zero horizontal overflow.
* **In-Browser eBook Reader**: Day, Sepia, and Night reading themes, font scaling, and reading progress synchronization.
* **Groq AI Assistant (`BookoraAI.js`)**: Real-time floating marketplace assistant.
* **Authentication**: Firebase Authentication & Google Identity Services SDK integration.
* **Zero Private Secrets**: Safe for public hosting on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or AWS S3.

---

## Local Development

1. Launch a static HTTP server:
   ```bash
   # Using Python 3
   python3 -m http.server 5500
   
   # Or using VS Code Live Server
   # Open index.html and click 'Go Live' (http://127.0.0.1:5500)
   ```
2. By default, local frontend automatically connects to the backend running at `http://localhost:3000`.

---

## GitHub Pages / Production Deployment

1. Commit and push the `frontend/` directory to your GitHub repository (e.g. `your-username/bookora`).
2. Go to **Repository Settings → Pages → Build and deployment → Branch: main / (root)**.
3. In `frontend/js/config.js`, update `API_BASE_URL` with your deployed backend server URL (e.g., `https://api.yourdomain.com`).
