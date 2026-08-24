from pathlib import Path

P=Path(__file__).parent/'js'/'app-safe.js'
s=P.read_text(encoding='utf-8')
MARK='// REVIEW_SUPPORT_ROUTE_V1'
if MARK in s:
    print('already patched; nothing to do')
    raise SystemExit(0)
needle="    if (path === '/pricing' || path === '/subscription') {"
insert="""    // REVIEW_SUPPORT_ROUTE_V1
    if (path === '/review-support') {
      const m = await safeImport('./pages/ReviewSupportPage.js');
      return { html: m.renderReviewSupportPage(), init: m.initReviewSupportEvents };
    }
"""
s=s.replace(needle,insert+'\n'+needle,1)
s=s.replace("'/payment/success','/payment/failed']", "'/payment/success','/payment/failed','/review-support']",1)
P.write_text(s,encoding='utf-8')
print('patched',P)
