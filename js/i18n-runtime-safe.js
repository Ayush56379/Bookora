// Bookora safe i18n runtime.
// IMPORTANT: This module never mutates the DOM from inside its own observer in a way
// that causes another settings/select rewrite loop. Existing business data is untouched.
import { state } from './state.js';

const STORAGE_KEY='bookora_language';
const DEFAULT_LANGUAGE='en';
export const BOOKORA_LANGUAGES={
  en:{name:'English',native:'English'},hi:{name:'Hindi',native:'हिन्दी'},gu:{name:'Gujarati',native:'ગુજરાતી'},mr:{name:'Marathi',native:'मराठी'},bn:{name:'Bengali',native:'বাংলা'},ta:{name:'Tamil',native:'தமிழ்'},te:{name:'Telugu',native:'తెలుగు'},kn:{name:'Kannada',native:'ಕನ್ನಡ'},ml:{name:'Malayalam',native:'മലയാളം'},pa:{name:'Punjabi',native:'ਪੰਜਾਬੀ'},ur:{name:'Urdu',native:'اردو'},es:{name:'Spanish',native:'Español'},fr:{name:'French',native:'Français'},de:{name:'German',native:'Deutsch'},pt:{name:'Portuguese',native:'Português'},ar:{name:'Arabic',native:'العربية'},ja:{name:'Japanese',native:'日本語'},ko:{name:'Korean',native:'한국어'},zh:{name:'Chinese',native:'中文'},ru:{name:'Russian',native:'Русский'}
};

const COMMON={
'Home':{hi:'होम',gu:'હોમ',mr:'मुख्यपृष्ठ',es:'Inicio',fr:'Accueil',de:'Startseite',pt:'Início',ar:'الرئيسية',ja:'ホーム',ko:'홈',zh:'首页',ru:'Главная'},
'Explore':{hi:'एक्सप्लोर',gu:'એક્સપ્લોર',mr:'एक्सप्लोर',es:'Explorar',fr:'Explorer',de:'Entdecken',pt:'Explorar',ar:'استكشف',ja:'探索',ko:'탐색',zh:'探索',ru:'Обзор'},
'Categories':{hi:'श्रेणियाँ',gu:'શ્રેણીઓ',mr:'श्रेणी',es:'Categorías',fr:'Catégories',de:'Kategorien',pt:'Categorias',ar:'الفئات',ja:'カテゴリー',ko:'카테고리',zh:'分类',ru:'Категории'},
'Best Sellers':{hi:'बेस्ट सेलर',gu:'બેસ્ટ સેલર',mr:'बेस्ट सेलर',es:'Más vendidos',fr:'Meilleures ventes',de:'Bestseller',pt:'Mais vendidos',ar:'الأكثر مبيعًا',ja:'ベストセラー',ko:'베스트셀러',zh:'畅销书',ru:'Бестселлеры'},
'New Releases':{hi:'नई रिलीज़',gu:'નવી રિલીઝ',mr:'नवीन प्रकाशने',es:'Novedades',fr:'Nouveautés',de:'Neuerscheinungen',pt:'Novidades',ar:'الإصدارات الجديدة',ja:'新着',ko:'신간',zh:'新书',ru:'Новинки'},
'Trending':{hi:'ट्रेंडिंग',gu:'ટ્રેન્ડિંગ',mr:'ट्रेंडिंग',es:'Tendencias',fr:'Tendances',de:'Trends',pt:'Tendências',ar:'الرائج',ja:'トレンド',ko:'트렌드',zh:'热门',ru:'В тренде'},
'Authors':{hi:'लेखक',gu:'લેખકો',mr:'लेखक',es:'Autores',fr:'Auteurs',de:'Autoren',pt:'Autores',ar:'المؤلفون',ja:'著者',ko:'작가',zh:'作者',ru:'Авторы'},
'Pricing':{hi:'कीमतें',gu:'કિંમતો',mr:'किंमत',es:'Precios',fr:'Tarifs',de:'Preise',pt:'Preços',ar:'الأسعار',ja:'料金',ko:'가격',zh:'价格',ru:'Цены'},
'Subscription':{hi:'सब्सक्रिप्शन',gu:'સબ્સ્ક્રિપ્શન',mr:'सबस्क्रिप्शन',es:'Suscripción',fr:'Abonnement',de:'Abonnement',pt:'Assinatura',ar:'الاشتراك',ja:'サブスクリプション',ko:'구독',zh:'订阅',ru:'Подписка'},
'About':{hi:'हमारे बारे में',gu:'અમારા વિશે',mr:'आमच्याबद्दल',es:'Acerca de',fr:'À propos',de:'Über uns',pt:'Sobre nós',ar:'من نحن',ja:'概要',ko:'소개',zh:'关于我们',ru:'О нас'},
'Contact':{hi:'संपर्क',gu:'સંપર્ક',mr:'संपर्क',es:'Contacto',fr:'Contact',de:'Kontakt',pt:'Contato',ar:'اتصل بنا',ja:'お問い合わせ',ko:'연락처',zh:'联系我们',ru:'Контакты'},
'Help':{hi:'सहायता',gu:'મદદ',mr:'मदत',es:'Ayuda',fr:'Aide',de:'Hilfe',pt:'Ajuda',ar:'المساعدة',ja:'ヘルプ',ko:'도움말',zh:'帮助',ru:'Помощь'},
'Login':{hi:'लॉग इन',gu:'લૉગિન',mr:'लॉगिन',es:'Iniciar sesión',fr:'Connexion',de:'Anmelden',pt:'Entrar',ar:'تسجيل الدخول',ja:'ログイン',ko:'로그인',zh:'登录',ru:'Войти'},
'Sign Up':{hi:'साइन अप',gu:'સાઇન અપ',mr:'साइन अप',es:'Registrarse',fr:'Créer un compte',de:'Registrieren',pt:'Cadastrar',ar:'إنشاء حساب',ja:'新規登録',ko:'회원가입',zh:'注册',ru:'Регистрация'},
'Logout':{hi:'लॉग आउट',gu:'લૉગઆઉટ',mr:'लॉगआउट',es:'Cerrar sesión',fr:'Déconnexion',de:'Abmelden',pt:'Sair',ar:'تسجيل الخروج',ja:'ログアウト',ko:'로그아웃',zh:'退出登录',ru:'Выйти'},
'Profile':{hi:'प्रोफ़ाइल',gu:'પ્રોફાઇલ',mr:'प्रोफाइल',es:'Perfil',fr:'Profil',de:'Profil',pt:'Perfil',ar:'الملف الشخصي',ja:'プロフィール',ko:'프로필',zh:'个人资料',ru:'Профиль'},
'Settings':{hi:'सेटिंग्स',gu:'સેટિંગ્સ',mr:'सेटिंग्ज',es:'Configuración',fr:'Paramètres',de:'Einstellungen',pt:'Configurações',ar:'الإعدادات',ja:'設定',ko:'설정',zh:'设置',ru:'Настройки'},
'Language':{hi:'भाषा',gu:'ભાષા',mr:'भाषा',es:'Idioma',fr:'Langue',de:'Sprache',pt:'Idioma',ar:'اللغة',ja:'言語',ko:'언어',zh:'语言',ru:'Язык'},
'Account Settings':{hi:'अकाउंट सेटिंग्स',gu:'એકાઉન્ટ સેટિંગ્સ',mr:'खाते सेटिंग्ज',es:'Configuración de cuenta',fr:'Paramètres du compte',de:'Kontoeinstellungen',pt:'Configurações da conta',ar:'إعدادات الحساب',ja:'アカウント設定',ko:'계정 설정',zh:'账户设置',ru:'Настройки аккаунта'},
'Full Name':{hi:'पूरा नाम',gu:'પૂરું નામ',mr:'पूर्ण नाव',es:'Nombre completo',fr:'Nom complet',de:'Vollständiger Name',pt:'Nome completo',ar:'الاسم الكامل',ja:'氏名',ko:'전체 이름',zh:'姓名',ru:'Полное имя'},
'Email Address':{hi:'ईमेल पता',gu:'ઇમેઇલ સરનામું',mr:'ईमेल पत्ता',es:'Correo electrónico',fr:'Adresse e-mail',de:'E-Mail-Adresse',pt:'Endereço de e-mail',ar:'عنوان البريد الإلكتروني',ja:'メールアドレス',ko:'이메일 주소',zh:'电子邮件地址',ru:'Электронная почта'},
'Country / Region':{hi:'देश / क्षेत्र',gu:'દેશ / પ્રદેશ',mr:'देश / प्रदेश',es:'País / Región',fr:'Pays / Région',de:'Land / Region',pt:'País / Região',ar:'الدولة / المنطقة',ja:'国 / 地域',ko:'국가 / 지역',zh:'国家/地区',ru:'Страна / регион'},
'Your Currency':{hi:'आपकी मुद्रा',gu:'તમારી ચલણ',mr:'तुमचे चलन',es:'Tu moneda',fr:'Votre devise',de:'Ihre Währung',pt:'Sua moeda',ar:'عملتك',ja:'通貨',ko:'통화',zh:'您的货币',ru:'Ваша валюта'},
'Detect My Region':{hi:'मेरा क्षेत्र पहचानें',gu:'મારો પ્રદેશ શોધો',mr:'माझा प्रदेश शोधा',es:'Detectar mi región',fr:'Détecter ma région',de:'Meine Region erkennen',pt:'Detectar minha região',ar:'اكتشاف منطقتي',ja:'地域を検出',ko:'지역 감지',zh:'检测我的地区',ru:'Определить мой регион'},
'Read Free Sample':{hi:'फ्री सैंपल पढ़ें',gu:'મફત સેમ્પલ વાંચો',mr:'मोफत नमुना वाचा',es:'Leer muestra gratis',fr:'Lire un extrait gratuit',de:'Kostenlose Leseprobe',pt:'Ler amostra grátis',ar:'قراءة عينة مجانية',ja:'無料サンプルを読む',ko:'무료 샘플 읽기',zh:'阅读免费样章',ru:'Читать бесплатный образец'},
'Buy Now':{hi:'अभी खरीदें',gu:'હમણાં ખરીદો',mr:'आता खरेदी करा',es:'Comprar ahora',fr:'Acheter maintenant',de:'Jetzt kaufen',pt:'Comprar agora',ar:'اشتر الآن',ja:'今すぐ購入',ko:'지금 구매',zh:'立即购买',ru:'Купить сейчас'},
'Add to Cart':{hi:'कार्ट में जोड़ें',gu:'કાર્ટમાં ઉમેરો',mr:'कार्टमध्ये जोडा',es:'Añadir al carrito',fr:'Ajouter au panier',de:'In den Warenkorb',pt:'Adicionar ao carrinho',ar:'أضف إلى السلة',ja:'カートに追加',ko:'장바구니에 추가',zh:'加入购物车',ru:'Добавить в корзину'},
'Download':{hi:'डाउनलोड',gu:'ડાઉનલોડ',mr:'डाउनलोड',es:'Descargar',fr:'Télécharger',de:'Herunterladen',pt:'Baixar',ar:'تنزيل',ja:'ダウンロード',ko:'다운로드',zh:'下载',ru:'Скачать'},
'Read':{hi:'पढ़ें',gu:'વાંચો',mr:'वाचा',es:'Leer',fr:'Lire',de:'Lesen',pt:'Ler',ar:'قراءة',ja:'読む',ko:'읽기',zh:'阅读',ru:'Читать'},
'Search':{hi:'खोजें',gu:'શોધો',mr:'शोधा',es:'Buscar',fr:'Rechercher',de:'Suchen',pt:'Pesquisar',ar:'بحث',ja:'検索',ko:'검색',zh:'搜索',ru:'Поиск'},
'Save':{hi:'सेव करें',gu:'સાચવો',mr:'जतन करा',es:'Guardar',fr:'Enregistrer',de:'Speichern',pt:'Salvar',ar:'حفظ',ja:'保存',ko:'저장',zh:'保存',ru:'Сохранить'},
'Cancel':{hi:'रद्द करें',gu:'રદ કરો',mr:'रद्द करा',es:'Cancelar',fr:'Annuler',de:'Abbrechen',pt:'Cancelar',ar:'إلغاء',ja:'キャンセル',ko:'취소',zh:'取消',ru:'Отмена'},
'Continue':{hi:'जारी रखें',gu:'ચાલુ રાખો',mr:'सुरू ठेवा',es:'Continuar',fr:'Continuer',de:'Weiter',pt:'Continuar',ar:'متابعة',ja:'続行',ko:'계속',zh:'继续',ru:'Продолжить'},
'Back':{hi:'वापस',gu:'પાછળ',mr:'मागे',es:'Atrás',fr:'Retour',de:'Zurück',pt:'Voltar',ar:'رجوع',ja:'戻る',ko:'뒤로',zh:'返回',ru:'Назад'},
'Next':{hi:'आगे',gu:'આગળ',mr:'पुढे',es:'Siguiente',fr:'Suivant',de:'Weiter',pt:'Próximo',ar:'التالي',ja:'次へ',ko:'다음',zh:'下一步',ru:'Далее'},
'Close':{hi:'बंद करें',gu:'બંધ કરો',mr:'बंद करा',es:'Cerrar',fr:'Fermer',de:'Schließen',pt:'Fechar',ar:'إغلاق',ja:'閉じる',ko:'닫기',zh:'关闭',ru:'Закрыть'},
'Loading...':{hi:'लोड हो रहा है...',gu:'લોડ થઈ રહ્યું છે...',mr:'लोड होत आहे...',es:'Cargando...',fr:'Chargement...',de:'Wird geladen...',pt:'Carregando...',ar:'جارٍ التحميل...',ja:'読み込み中...',ko:'로드 중...',zh:'加载中...',ru:'Загрузка...'}
};

let currentLanguage=DEFAULT_LANGUAGE;
const originals=new WeakMap();
let observer=null;
let applying=false;

function normalize(v){const x=String(v||'').toLowerCase().split('-')[0];return BOOKORA_LANGUAGES[x]?x:DEFAULT_LANGUAGE;}
function translated(text){const raw=String(text??'');const key=raw.trim();if(!key||currentLanguage==='en')return raw;const row=COMMON[key];const out=row?.[currentLanguage];return out?raw.replace(key,out):raw;}
function skip(n){const p=n.parentElement;return !p||['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA'].includes(p.tagName)||!!p.closest('[data-i18n-ignore]');}
function translateRoot(root){if(!root||applying)return;applying=true;try{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const list=[];let n;while((n=w.nextNode()))list.push(n);for(const t of list){if(skip(t))continue;if(!originals.has(t))originals.set(t,t.nodeValue);const next=translated(originals.get(t));if(t.nodeValue!==next)t.nodeValue=next;}}finally{applying=false;}}

function ensureLanguageSelect(root=document){root.querySelectorAll?.('#user-set-language').forEach(select=>{if(select.dataset.i18nReady==='1'){select.value=currentLanguage;return;}select.dataset.i18nReady='1';select.innerHTML=Object.entries(BOOKORA_LANGUAGES).map(([code,x])=>`<option value="${code}">${x.native} — ${x.name}</option>`).join('');select.value=currentLanguage;select.addEventListener('change',()=>setLanguage(select.value));});}

async function setLanguage(value){
  currentLanguage=normalize(value);localStorage.setItem(STORAGE_KEY,currentLanguage);
  document.documentElement.lang=currentLanguage;document.documentElement.dir=(currentLanguage==='ar'||currentLanguage==='ur')?'rtl':'ltr';
  if(state.currentUser?.uid){try{const {db}=await state.getFirebase();await db.collection('users').doc(state.currentUser.uid).set({language:currentLanguage,languageUpdatedAt:new Date().toISOString()},{merge:true});state.currentUser={...state.currentUser,language:currentLanguage};localStorage.setItem('bookora_user_profile',JSON.stringify(state.currentUser));}catch(e){console.warn('[i18n] language save failed:',e.message);}}
  const app=document.getElementById('app');translateRoot(app);ensureLanguageSelect(app||document);
}

async function restoreLanguage(){
  let saved=localStorage.getItem(STORAGE_KEY)||'';
  if(state.currentUser?.language)saved=state.currentUser.language;
  else if(state.currentUser?.uid){try{const {db}=await state.getFirebase();const snap=await db.collection('users').doc(state.currentUser.uid).get();if(snap.exists&&snap.data()?.language)saved=snap.data().language;}catch(e){console.warn('[i18n] language load skipped:',e.message);}}
  currentLanguage=normalize(saved||navigator.language||DEFAULT_LANGUAGE);localStorage.setItem(STORAGE_KEY,currentLanguage);document.documentElement.lang=currentLanguage;document.documentElement.dir=(currentLanguage==='ar'||currentLanguage==='ur')?'rtl':'ltr';
  const app=document.getElementById('app');translateRoot(app);ensureLanguageSelect(app||document);
}

function init(){if(observer)return;const app=document.getElementById('app');if(!app)return;observer=new MutationObserver(ms=>{if(applying)return;for(const m of ms){for(const node of m.addedNodes||[]){if(node.nodeType!==Node.ELEMENT_NODE)continue;translateRoot(node);ensureLanguageSelect(node);}}});observer.observe(app,{childList:true,subtree:true});restoreLanguage();}
state.subscribe((event)=>{if(event==='USER_LOGGED_IN')restoreLanguage();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.BookoraI18n={languages:BOOKORA_LANGUAGES,getLanguage:()=>currentLanguage,setLanguage};
