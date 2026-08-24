import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BOOKORA_BASE_URL || 'https://ayush56379.github.io/Bookora/';
const outDir = process.env.RESPONSIVE_REPORT_DIR || 'responsive-report';
const cssPath = 'css/ai-responsive-overrides.css';
const aiEndpoint = process.env.BOOKORA_RESPONSIVE_AI_URL || 'https://bookora-backend-x08l.onrender.com/api/ai/responsive-patch';

const viewports = [
  { name: 'small-phone', width: 320, height: 568 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'large-phone', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'large-desktop', width: 1920, height: 1080 },
];

const routes = (process.env.BOOKORA_ROUTES || '/,/explore,/categories,/pricing,/login,/signup,/library,/orders,/profile,/support,/seller,/admin')
  .split(',').map(s => s.trim()).filter(Boolean);

const routeUrl = route => `${baseUrl.replace(/\/$/, '')}/#${route.startsWith('/') ? route : `/${route}`}`;

async function inspect(page) {
  return page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const overflow = [];
    for (const el of all) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.right > vw + 2 || r.left < -2 || r.bottom > document.documentElement.scrollHeight + 2) {
        overflow.push({ tag: el.tagName, id: el.id || '', cls: String(el.className || '').slice(0, 160), left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width), display: cs.display, position: cs.position, text: String(el.textContent || '').replace(/\s+/g, ' ').slice(0, 120) });
      }
    }
    const horizontalOverflow = document.documentElement.scrollWidth > vw + 2;
    const fixed = all.filter(el => getComputedStyle(el).position === 'fixed').map(el => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, id: el.id || '', cls: String(el.className || '').slice(0,120), left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
    }).slice(0, 30);
    return { vw, vh, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, horizontalOverflow, overflow: overflow.slice(0, 40), fixed };
  });
}

async function callGroqBackend(css, evidence) {
  const response = await fetch(aiEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ css: css.slice(0, 18000), evidence: evidence.slice(0, 24) })
  });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) {}
  if (!response.ok || !data.success) throw new Error(data.error || `Responsive AI endpoint HTTP ${response.status}`);
  return String(data.patch || '');
}

function validateCssPatch(patch) {
  const css = String(patch || '').trim();
  if (!css || css.length > 16000) return false;
  if (!/@media|overflow|width|max-width|min-width|grid|flex/i.test(css)) return false;
  if (/<script|javascript:|fetch\(|XMLHttpRequest|document\.|window\./i.test(css)) return false;
  return true;
}

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { baseUrl, aiEndpoint, generatedAt: new Date().toISOString(), routes: [], aiApplied: false };

try {
  for (const route of routes) {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('pageerror', e => consoleErrors.push(String(e.message).slice(0, 300)));
      await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      await page.waitForTimeout(2200);
      const diagnostics = await inspect(page);
      const screenshotPath = `${outDir}/${route.replace(/[^a-z0-9]+/gi, '_') || 'home'}-${viewport.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      report.routes.push({ route, viewport, diagnostics, consoleErrors, screenshot: screenshotPath });
      await context.close();
    }
  }

  const failures = report.routes.filter(x => x.diagnostics.horizontalOverflow || x.diagnostics.overflow.length || x.consoleErrors.length);
  if (failures.length) {
    const css = await fs.readFile(cssPath, 'utf8').catch(() => '');
    try {
      const patch = await callGroqBackend(css, failures);
      if (validateCssPatch(patch)) {
        await fs.appendFile(cssPath, `\n\n/* Groq AI responsive pass ${new Date().toISOString()} */\n${patch}\n`);
        report.aiApplied = true;
        report.aiPatch = patch;
      } else {
        report.aiError = 'Groq returned an invalid or unsafe CSS-only patch.';
      }
    } catch (error) {
      report.aiError = String(error.message || error).slice(0, 500);
    }
  }

  await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
  const summary = { tested: report.routes.length, failures: report.routes.filter(x => x.diagnostics.horizontalOverflow || x.diagnostics.overflow.length).length, aiApplied: report.aiApplied, aiEndpoint: report.aiEndpoint, aiError: report.aiError || null };
  console.log(JSON.stringify(summary, null, 2));
  if (report.routes.length === 0) process.exitCode = 2;
} finally {
  await browser.close();
}
