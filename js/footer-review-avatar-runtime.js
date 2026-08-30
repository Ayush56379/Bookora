// Runtime CSS fallback for the footer review avatars/rating.
export function ensureFooterReviewStyles(){
  if(document.getElementById('bookora-footer-review-runtime-css')) return;
  const link=document.createElement('link');
  link.id='bookora-footer-review-runtime-css';
  link.rel='stylesheet';
  link.href='css/footer-review-avatar-fix.css?v=20260830-2';
  document.head.appendChild(link);
}