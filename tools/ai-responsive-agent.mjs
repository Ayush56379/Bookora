import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BOOKORA_BASE_URL || 'https://ayush56379.github.io/Bookora/';
const outDir = process.env.RESPONSIVE_REPORT_DIR || 'responsive-report';
const cssPath = 'css/ai-responsive-overrides.css';
const aiKey = process.env.OPENAI_API_KEY || '';
const model = process.env.OPENAI_MODEL || 'gpt-5.6-mini';

const viewports = [
  { name: 'small-phone', width: 320, height: 568 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'large-phone', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'large-desktop', width: 1920, height: 1080 },
];

// Routes are hash routes so the SPA can be inspected without requiring server rewrites.
const routes = (process.env.BOOKORA_ROUTES || '/,/explore,/categories,/pricing,/login,/signup,/library,/orders,/profile,/support,/seller,/admin')
  .split(',').map(s => s.trim()).filter(Boolean);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const routeUrl = route => `${baseUrl.replace(/\/$/, '')}/#${route.startsWith('/') ? route : `/${route}`}`;

function visibleTextSample(page) {
  return page.locator('body').innerText().catch(() => '').then(t => t.replace(/\s+/g, ' ').slice(0, 1800));
}

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
        overflow.push({
          tag: el.tagName,
          id: el.id || '',
          cls: String(el.className || '').slice(0, 160),
          left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top),
          width: Math.round(r.width), display: cs.display, position: cs.position,
          text: String(el.textContent || '').replace(/\s+/g, ' ').slice(0, 120)
        });
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

async function callAi(prompt) {
  if (!aiKey) return null;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${aiKey}` },
    body: JSON.stringify({ model, input: prompt, temperature: 0.1 })
  });
  if (!response.ok) throw new Error(`AI API ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.output_text || data.output?.flatMap(x => x.content || []).map(x => x.text || '').join('') || '';
}

function extractCss(text) {
  const fenced = text.match(/```css\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('@media');
  if (start >= 0) return text.slice(start).trim();
  return '';
}

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { baseUrl, generatedAt: new Date().toISOString(), routes: [], aiApplied: false };

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
  if (failures.length && aiKey) {
    const css = await fs.readFile(cssPath, 'utf8').catch(() => '');
    const evidence = failures.slice(0, 24).map(x => ({ route: x.route, viewport: x.viewport, diagnostics: x.diagnostics, consoleErrors: x.consoleErrors })).
      map(x => JSON.stringify(x)).join('\n');
    const prompt = `You are Bookora's responsive UI engineer. Fix ONLY responsive presentation problems. Do not change application logic, routes, authentication, Firebase, payments, API calls, data, or functionality.\n\nCurrent responsive override CSS:\n${css}\n\nDiagnostics from real browser viewport tests:\n${evidence}\n\nReturn ONLY a CSS patch suitable for appending to css/ai-responsive-overrides.css. Use media queries, fluid sizing, flex/grid minmax, max-width, overflow containment, and safe wrapping. Do not use JavaScript. Do not hide essential content. Do not use !important unless necessary to override an existing fixed width. Keep the existing visual identity. Make the patch general enough to work at unusual phone, tablet, desktop and TV widths.`;
    const aiText = await callAi(prompt);
    const patch = extractCss(aiText || '');
    if (patch && patch.length < 16000 && /@media|overflow|width|max-width|min-width|grid|flex/i.test(patch)) {
      await fs.appendFile(cssPath, `\n\n/* AI responsive pass ${new Date().toISOString()} */\n${patch}\n`);
      report.aiApplied = true;
      report.aiPatch = patch;
    }
  }

  await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));
  const summary = { tested: report.routes.length, failures: report.routes.filter(x => x.diagnostics.horizontalOverflow || x.diagnostics.overflow.length).length, aiApplied: report.aiApplied };
  console.log(JSON.stringify(summary, null, 2));
  if (report.routes.length === 0) process.exitCode = 2;
} finally {
  await browser.close();
}
