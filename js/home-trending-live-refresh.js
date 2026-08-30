// Refresh the permanent homepage Trending + All eBooks cards when Firebase syncs.
import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

function approved() {
  return (state.getApprovedBooks?.() || []).map(b => state.normalizeBook(b)).filter(Boolean).filter(b => String(b.status || '').toLowerCase() === 'approved');
}
function time(b) { return Date.parse(b?.createdAt || b?.created_at || b?.publishedAt || b?.published_at || '') || 0; }
function sales(b) { const f=['purchaseCount','purchase_count','purchases','salesCount','sales_count','soldCount','sold_count','totalSales','total_sales','ordersCount','orders_count','orderCount','order_count','buyCount','buy_count','unitsSold','units_sold']; return Math.max(0,...f.map(k=>Number(b?.[k] ?? 0)).filter(Number.isFinite)); }
function rating(b) { return Number(b?.rating ?? b?.averageRating ?? b?.average_rating ?? 0) || 0; }
function trending(books) {
  const flagged=books.filter(b=>b.is_trending===true||b.is_trending==='true'||b.isTrending===true);
  const source=flagged.length>=6?flagged:books;
  return [...source].sort((a,b)=>(sales(b)*20+rating(b)*8+(b.is_bestseller?10:0)+(b.is_trending?25:0))-(sales(a)*20+rating(a)*8+(a.is_bestseller?10:0)+(a.is_trending?25:0))||time(b)-time(a)).slice(0,6);
}
function latest(books) { return [...books].sort((a,b)=>time(b)-time(a)).slice(0,6); }
function fill(grid, books) { if(!grid) return; grid.innerHTML=books.map(book=>`<div class="bookora-home-catalog-item">${renderBookCard(book)}</div>`).join(''); }
function refresh() {
  if((window.location.hash||'#/').split('?')[0] !== '#/') return;
  const root=document.getElementById('bookora-home-catalog-v2');
  if(!root) return;
  const books=approved();
  const blocks=root.querySelectorAll('.bookora-home-catalog-block');
  fill(blocks[0]?.querySelector('.bookora-home-grid'),trending(books));
  fill(blocks[1]?.querySelector('.bookora-home-grid'),latest(books));
}
window.addEventListener('bookora:catalog-updated',()=>setTimeout(refresh,0));
window.addEventListener('bookora:fast-catalog',()=>setTimeout(refresh,0));
window.addEventListener('hashchange',()=>setTimeout(refresh,50));
