import { state } from './state.js';
import { renderWalletPage, initWalletPageEvents } from './pages/WalletPage.js';
import './wallet-cashfree-payout.js';

const isWalletRoute=()=>((window.location.hash||'').split('?')[0]==='#/seller/wallet');
let rendering=false;

async function renderSellerWallet(){
  if(!isWalletRoute()||rendering)return;
  rendering=true;
  try{
    if(!state.isAuthenticated){window.location.hash='#/login?returnTo=%2Fseller%2Fwallet';return;}
    if(!state.isSeller&&!state.isAdmin){window.location.hash='#/seller/apply';return;}
    const app=document.getElementById('app'); if(!app)return;
    const header=app.querySelector('#header-container')?.outerHTML||'';
    const footer=app.querySelector('#footer-container')?.outerHTML||'';
    app.innerHTML=`${header}<main id="main-content" style="flex:1">${await renderWalletPage()}</main>${footer}`;
    initWalletPageEvents();
    setTimeout(()=>window.dispatchEvent(new Event('bookora:wallet-rendered')),0);
  }catch(e){console.error('Seller wallet route error:',e);}
  finally{rendering=false;}
}

// Wallet must not take ownership of SPA navigation. When the user leaves
// Wallet, explicitly hand routing back to the core SPA router so every
// header/menu option opens normally instead of leaving Wallet rendered.
function handleWalletNavigation(){
  if(isWalletRoute()){
    setTimeout(renderSellerWallet,0);
    return;
  }
  setTimeout(()=>{
    try{ window.__BOOKORA_APP_INSTANCE__?.route?.(true,true); }
    catch(e){ console.warn('Wallet navigation handoff skipped:',e); }
  },0);
}

window.addEventListener('hashchange',handleWalletNavigation);
state.subscribe((event)=>{if(['USER_LOGGED_IN','DATA_SYNCED','MODE_CHANGED'].includes(event)&&isWalletRoute())setTimeout(renderSellerWallet,0);});
setTimeout(renderSellerWallet,0);
