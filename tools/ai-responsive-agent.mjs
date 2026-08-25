import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BOOKORA_BASE_URL || 'https://ayush56379.github.io/Bookora/';
const outDir = process.env.RESPONSIVE_REPORT_DIR || 'responsive-report';
const cssPath = 'css/ai-responsive-overrides.css';
const aiEndpoint = process.env.BOOKORA_RESPONSIVE_AI_URL || 'https://bookora-backend-x08l.onrender.com/api/ai/responsive-patch';

// Test the complete site from tiny phones through 4K/LED displays.
const viewports = [
  { name: 'tiny-phone', width: 280, height: 600 },
  { name: 'small-phone', width: 320, height: 568 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'large-phone', width: 414, height: 896 },
  { name: 'small-tablet', width: 600, height: 960 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'desktop-wide', width: 1440, height: 900 },
  { name: 'large-desktop', width: 1920, height: 1080 },
  { name: 'led-4k', width: 2560, height: 1440 },
  { name: 'led-4k-wide', width: 3840, height: 2160 },
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
    const textProblems = [];
    const tinyElements = [];
    const viewportProblems = [];

    for (const el of all) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width <= 0 || r.height <= 0) continue;
      const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();

      if (r.right > vw + 2 || r.left < -2) {
        overflow.push({ tag:el.tagName,id:el.id||'',cls:String(el.className||'').slice(0,160),left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),width:Math.round(r.width),display:cs.display,position:cs.position,text:text.slice(0,160) });
      }

      const interactive = ['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(el.tagName) || el.getAttribute('role') === 'button';
      if (interactive && (r.width < 36 || r.height < 32)) {
        tinyElements.push({tag:el.tagName,id:el.id||'',cls:String(el.className||'').slice(0,120),width:Math.round(r.width),height:Math.round(r.height),text:text.slice(0,100)});
      }

      if (text && r.width > 80 && r.height > 15 && r.right <= vw + 2 && /^(visible|clip)$/.test(cs.overflowX) && cs.whiteSpace !== 'nowrap') {
        const words = text.split(/\s+/);
        const longWord = words.some(w => w.length >= 22 && !/[./_-]/.test(w));
        const cramped = r.width < 180 && parseFloat(cs.fontSize) >= 22;
        const clipped = el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2;
        if (longWord || cramped || clipped) textProblems.push({tag:el.tagName,id:el.id||'',cls:String(el.className||'').slice(0,160),width:Math.round(r.width),fontSize:cs.fontSize,lineHeight:cs.lineHeight,whiteSpace:cs.whiteSpace,overflowX:cs.overflowX,text:text.slice(0,180),longWord,cramped,clipped});
      }
    }

    // Large screens must use available space intentionally instead of becoming a tiny centered strip.
    if (vw >= 1920) {
      const blocks = all.map(el => el.getBoundingClientRect()).filter(r => r.width > 300 && r.height > 120 && r.bottom > 0);
      const maxBlock = Math.max(...blocks.map(r => r.width), 0);
      if (maxBlock > 0 && maxBlock < vw * 0.42) viewportProblems.push({type:'large-screen-underuse',viewport:vw,maxUsefulBlock:Math.round(maxBlock)});
    }

    // Audit both homepage All eBooks and Featured eBooks as real catalog components.
    const roots = [...document.querySelectorAll('#bookora-home-all-books, #bookora-home-featured-books, [data-book-section="all"], [data-book-section="featured"]')];
    const homepageEbooks = {present:roots.length>0,sections:[],incomplete:false,reasons:[]};
    for (const root of roots) {
      const grid = root.querySelector('.kdp-book-grid');
      const items = grid ? [...grid.querySelectorAll(':scope > .kdp-book-item')] : [];
      const section = {id:root.id||'',count:items.length,grid:null,cards:[],reasons:[]};
      if (grid) {
        const gr=grid.getBoundingClientRect(), gc=getComputedStyle(grid);
        section.grid={width:Math.round(gr.width),height:Math.round(gr.height),columns:gc.gridTemplateColumns,gap:gc.gap};
      } else section.reasons.push('missing ebook grid');
      for (const item of items.slice(0,30)) {
        const card=item.querySelector('.book-card, .book-card-premium');
        const cover=item.querySelector('.book-cover-premium, .book-cover-container, .book-cover-image');
        const info=item.querySelector('.book-card-info');
        const cr=card?.getBoundingClientRect(), vr=cover?.getBoundingClientRect(), ir=info?.getBoundingClientRect();
        section.cards.push({cardWidth:Math.round(cr?.width||0),cardHeight:Math.round(cr?.height||0),coverWidth:Math.round(vr?.width||0),coverHeight:Math.round(vr?.height||0),infoWidth:Math.round(ir?.width||0),coverRatio:vr?.width?Number((vr.height/vr.width).toFixed(2)):0,cardPresent:!!card,coverPresent:!!cover,infoPresent:!!info});
      }
      const minCardWidth = vw <= 360 ? 240 : vw <= 600 ? 150 : vw <= 900 ? 190 : 210;
      section.cards.forEach((c,i)=>{
        if(!c.cardPresent) section.reasons.push(`card ${i+1} missing`);
        if(!c.coverPresent) section.reasons.push(`card ${i+1} cover missing`);
        if(!c.infoPresent) section.reasons.push(`card ${i+1} content missing`);
        if(c.cardWidth && c.cardWidth < minCardWidth) section.reasons.push(`card ${i+1} collapsed to ${c.cardWidth}px`);
        if(c.coverWidth && c.coverRatio < 1.25) section.reasons.push(`card ${i+1} cover ratio invalid`);
      });
      section.incomplete=section.reasons.length>0;
      homepageEbooks.sections.push(section);
      homepageEbooks.reasons.push(...section.reasons.map(x=>`${section.id||'catalog'}: ${x}`));
    }
    homepageEbooks.incomplete=homepageEbooks.reasons.length>0;

    const horizontalOverflow = document.documentElement.scrollWidth > vw + 2;
    const fixedBottomProblems = all.filter(el=>{
      const r=el.getBoundingClientRect();
      return r.width>80 && r.height>20 && r.bottom>vh+4 && getComputedStyle(el).position==='fixed';
    }).map(el=>({tag:el.tagName,id:el.id||'',cls:String(el.className||'').slice(0,120)}));

    return {vw,vh,scrollWidth:document.documentElement.scrollWidth,horizontalOverflow,overflow:overflow.slice(0,60),textProblems:textProblems.slice(0,60),tinyElements:tinyElements.slice(0,40),viewportProblems,homepageEbooks,fixedBottomProblems};
  });
}

async function scan(browser, patch='') {
  const results=[];
  for(const route of routes) for(const viewport of viewports){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
    const page=await context.newPage();
    const consoleErrors=[];
    page.on('pageerror',e=>consoleErrors.push(String(e.message).slice(0,300)));
    await page.goto(routeUrl(route),{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
    await page.waitForTimeout(2200);
    if(patch) await page.addStyleTag({content:patch}).catch(()=>{});
    const diagnostics=await inspect(page);
    const safeName=route.replace(/[^a-z0-9]+/gi,'_')||'home';
    const screenshot=`${outDir}/${safeName}-${viewport.name}-${viewport.width}.png`;
    await page.screenshot({path:screenshot,fullPage:true}).catch(()=>{});
    results.push({route,viewport,diagnostics,consoleErrors,screenshot});
    await context.close();
  }
  return results;
}

async function callGroqBackend(css,evidence){
  const response=await fetch(aiEndpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({
    css:css.slice(0,18000),
    evidence:evidence.slice(0,60),
    instructions:`You are Bookora's production responsive UI repair engine. Fix the ENTIRE WEBSITE, not just the homepage and not just eBook cards.

NON-NEGOTIABLE RESPONSIVE CONTRACT:
1. The complete website must remain usable and visually complete at EVERY tested viewport from 280px phone to 3840px 4K/LED.
2. Never solve mobile problems by hiding important content. Preserve important navigation, content, cards, actions, prices, forms, images and sections; reflow them instead.
3. Never allow application-caused horizontal overflow. Use fluid widths, grid/flex wrapping, min-width:0, max-width:100%, sensible breakpoints, clamp(), and vertical stacking.
4. Phones: clean one/two-column layouts as space permits, readable text and usable buttons. Tablets: use available width efficiently. Desktops and very large/LED screens: do NOT leave the whole site as a tiny narrow strip; use sensible fluid containers, wider grids and intentional spacing.
5. Do not stretch tiny controls/text to absurd sizes on large displays. Preserve Bookora's existing visual language.
6. Fixed/sticky UI must remain inside the viewport and must not cover important content.
7. Text must wrap rather than clip. Buttons, inputs and navigation must remain accessible.
8. Images/covers must preserve intended aspect ratio and remain visible.
9. Do not change JavaScript, routing, Firebase, authentication, payments, orders, data loading, links, API calls or existing functionality. CSS-only repair.
10. Scope selectors carefully so unrelated pages are not damaged.

EBOOK CATALOG CONTRACT:
- #bookora-home-all-books and Featured eBook sections are real catalogs.
- Every rendered book card needs normal visible width, portrait cover around 2:3, readable title/author/price and usable action button.
- Desktop/tablet: multiple useful columns. Normal phones: 2 columns when readable. Very narrow phones: 1 column when required.
- Never collapse an eBook into a tiny thumbnail, zero-width card, clipped cover, missing content or empty-looking grid.

LARGE SCREEN CONTRACT:
- At 1920/2560/3840px, make the main website visually intentional and complete. Use responsive containers/grids rather than leaving most of the screen unused.
- Do not invent fake content/cards merely to fill space.

Return CSS ONLY. No Markdown, JavaScript or explanation.`
  })});
  const text=await response.text();
  let data={}; try{data=JSON.parse(text);}catch(_){ }
  if(!response.ok || !data.success) throw new Error(data.error || `Responsive AI endpoint HTTP ${response.status}`);
  return String(data.patch||'');
}

function validateCssPatch(patch){
  const css=String(patch||'').trim();
  if(!css || css.length>18000) return false;
  if(!/@media|clamp\(|font-size|line-height|overflow|width|max-width|min-width|grid|flex|gap|padding|margin|word-break|overflow-wrap|white-space|aspect-ratio/i.test(css)) return false;
  if(/<script|javascript:|fetch\(|XMLHttpRequest|document\.|window\.|@import/i.test(css)) return false;
  return true;
}

await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const report={baseUrl,aiEndpoint,generatedAt:new Date().toISOString(),routes,viewports,initial:null,afterPatch:null,aiApplied:false,verification:'NOT_VERIFIED'};
try{
  report.initial=await scan(browser);
  const isFailure=x=>x.diagnostics.horizontalOverflow || x.diagnostics.overflow.length || x.diagnostics.textProblems.length || x.diagnostics.homepageEbooks.incomplete || x.diagnostics.tinyElements.length || x.diagnostics.viewportProblems.length || x.diagnostics.fixedBottomProblems.length || x.consoleErrors.length;
  const failures=report.initial.filter(isFailure);
  if(failures.length){
    const css=await fs.readFile(cssPath,'utf8').catch(()=>'');
    try{
      const patch=await callGroqBackend(css,failures);
      if(!validateCssPatch(patch)) throw new Error('Groq returned an invalid or unsafe CSS-only patch.');
      await fs.appendFile(cssPath,`\n\n/* AI production responsive pass ${new Date().toISOString()} */\n${patch}\n`);
      report.aiApplied=true;
      report.aiPatch=patch;
      report.afterPatch=await scan(browser,patch);
    }catch(error){report.aiError=String(error.message||error).slice(0,500);}
  }else report.afterPatch=report.initial;

  const finalFailures=(report.afterPatch||[]).filter(isFailure);
  report.finalFailureCount=finalFailures.length;
  report.verification=finalFailures.length===0?'PASS':'FAIL';
  await fs.writeFile(`${outDir}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({tested:report.initial.length,initialFailures:failures.length,aiApplied:report.aiApplied,finalFailures:finalFailures.length,verification:report.verification,aiError:report.aiError||null},null,2));
  if(report.verification!=='PASS') process.exitCode=1;
}finally{await browser.close();}
