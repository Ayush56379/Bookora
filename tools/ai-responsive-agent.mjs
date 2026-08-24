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
    const overflow = [];
    const textProblems = [];
    for (const el of all) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width <= 0 || r.height <= 0) continue;
      const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (r.right > vw + 2 || r.left < -2) {
        overflow.push({ tag: el.tagName, id: el.id || '', cls: String(el.className || '').slice(0,160), left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width), display: cs.display, position: cs.position, text: text.slice(0,160) });
      }
      if (text && r.width > 80 && r.height > 15 && r.right <= vw + 2 && /^(visible|clip)$/.test(cs.overflowX) && cs.whiteSpace !== 'nowrap') {
        const words = text.split(/\s+/);
        const longWord = words.some(w => w.length >= 22 && !/[./_-]/.test(w));
        const cramped = r.width < 180 && parseFloat(cs.fontSize) >= 22;
        const clipped = el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
        if (longWord || cramped || clipped) textProblems.push({ tag: el.tagName, id: el.id || '', cls: String(el.className || '').slice(0,160), width: Math.round(r.width), fontSize: cs.fontSize, lineHeight: cs.lineHeight, whiteSpace: cs.whiteSpace, overflowX: cs.overflowX, text: text.slice(0,180), longWord, cramped, clipped });
      }
    }
    const horizontalOverflow = document.documentElement.scrollWidth > vw + 2;
    const fixed = all.filter(el => getComputedStyle(el).position === 'fixed').map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, id: el.id || '', cls: String(el.className || '').slice(0,120), left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; }).slice(0,30);
    return { vw, scrollWidth: document.documentElement.scrollWidth, horizontalOverflow, overflow: overflow.slice(0,50), textProblems: textProblems.slice(0,50), fixed };
  });
}

async function scan(browser, patch = '') {
  const results = [];
  for (const route of routes) for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', e => consoleErrors.push(String(e.message).slice(0,300)));
    await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2200);
    if (patch) await page.addStyleTag({ content: patch }).catch(() => {});
    const diagnostics = await inspect(page);
    const safeName = route.replace(/[^a-z0-9]+/gi, '_') || 'home';
    const screenshot = `${outDir}/${safeName}-${viewport.name}.png`;
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    results.push({ route, viewport, diagnostics, consoleErrors, screenshot });
    await context.close();
  }
  return results;
}

async function callGroqBackend(css, evidence) {
  const response = await fetch(aiEndpoint, { method:'POST', headers:{'content-type':'application/json',accept:'application/json'}, body:JSON.stringify({ css:css.slice(0,18000), evidence:evidence.slice(0,40), instructions:'Fix responsive layout AND typography for every viewport. Preserve visual design. You may use @media queries, clamp(), flex/grid wrapping, max-width:100%, min-width:0, overflow-wrap:anywhere, word-break, white-space, responsive font-size/line-height/padding/gap, table/card/button/header adjustments. Return CSS only. Never change application logic, links, payments, auth, data, or JavaScript.' }) });
  const text = await response.text();
  let data = {}; try { data = JSON.parse(text); } catch (_) {}
  if (!response.ok || !data.success) throw new Error(data.error || `Responsive AI endpoint HTTP ${response.status}`);
  return String(data.patch || '');
}

function validateCssPatch(patch) {
  const css = String(patch || '').trim();
  if (!css || css.length > 16000) return false;
  if (!/@media|clamp\(|font-size|line-height|overflow|width|max-width|min-width|grid|flex|gap|padding|margin|word-break|overflow-wrap|white-space/i.test(css)) return false;
  if (/<script|javascript:|fetch\(|XMLHttpRequest|document\.|window\.|@import/i.test(css)) return false;
  return true;
}

await fs.mkdir(outDir, { recursive:true });
const browser = await chromium.launch({ headless:true });
const report = { baseUrl, aiEndpoint, generatedAt:new Date().toISOString(), routes, viewports, initial:null, afterPatch:null, aiApplied:false, verification:'NOT_VERIFIED' };
try {
  report.initial = await scan(browser);
  let failures = report.initial.filter(x => x.diagnostics.horizontalOverflow || x.diagnostics.overflow.length || x.diagnostics.textProblems.length || x.consoleErrors.length);
  if (failures.length) {
    const css = await fs.readFile(cssPath,'utf8').catch(()=>'');
    try {
      const patch = await callGroqBackend(css, failures);
      if (!validateCssPatch(patch)) throw new Error('Groq returned an invalid or unsafe CSS-only patch.');
      await fs.appendFile(cssPath, `\n\n/* Groq AI responsive + typography pass ${new Date().toISOString()} */\n${patch}\n`);
      report.aiApplied = true;
      report.aiPatch = patch;
      report.afterPatch = await scan(browser, patch);
    } catch (error) { report.aiError = String(error.message || error).slice(0,500); }
  } else {
    report.afterPatch = report.initial;
  }

  const finalFailures = (report.afterPatch || []).filter(x => x.diagnostics.horizontalOverflow || x.diagnostics.overflow.length || x.diagnostics.textProblems.length || x.consoleErrors.length);
  report.finalFailureCount = finalFailures.length;
  report.verification = finalFailures.length === 0 ? 'PASS' : 'FAIL';
  await fs.writeFile(`${outDir}/report.json`, JSON.stringify(report,null,2));
  console.log(JSON.stringify({ tested:report.initial.length, initialFailures:failures.length, aiApplied:report.aiApplied, finalFailures:finalFailures.length, verification:report.verification, aiError:report.aiError || null },null,2));
  if (report.verification !== 'PASS') process.exitCode = 1;
} finally { await browser.close(); }
