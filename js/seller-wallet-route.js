import { state } from './state.js';
import { renderWalletPage, initWalletPageEvents } from './pages/WalletPage.js';

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
  }catch(e){console.error('Seller wallet route error:',e);}
  finally{rendering=false;}
}
window.addEventListener('hashchange',()=>setTimeout(renderSellerWallet,0));
state.subscribe((event)=>{if(['USER_LOGGED_IN','DATA_SYNCED','MODE_CHANGED'].includes(event)&&isWalletRoute())setTimeout(renderSellerWallet,0);});
setTimeout(renderSellerWallet,0);
