// Chekd Cars app shell: router, page transitions, tab pill, theme, install, service worker.
import { spring, reduced, haptic, installRipple } from './js/motion.js';
import { $, $$, store, toast, closeSheet, sheetOpen } from './js/core.js';
import * as V from './js/views.js';
import { flipStore } from './js/ui.js';

const TABS = ['home', 'buy', 'sell', 'doorstep', 'passport'];
// Home and Buy ship in the first load; the rest load on demand (and are prefetched when the phone is idle).
const forms = () => import('./js/forms.js'), det = () => import('./js/detail.js');
const ROUTES = {
  home: { sub: false, load: async () => V.home }, buy: { sub: false, load: async () => V.buy },
  sell: { sub: false, load: () => forms().then((m) => m.sell) }, doorstep: { sub: false, load: () => forms().then((m) => m.doorstep) },
  passport: { sub: false, load: () => forms().then((m) => m.passport) }, profile: { sub: true, load: () => forms().then((m) => m.profile) },
  car: { sub: true, load: () => det().then((m) => m.detail) },
};
const viewsEl = $('#views'), tabbar = $('#tabbar'), pill = $('.tab-pill', tabbar);
const stack = [];
let current = null; // { name, param, el, cleanups }
let running = null; // in-flight transition finisher
let gestureX = 0;   // where an edge-swipe back left the page
let first = true;

const parse = (h) => {
  const m = (h || '').replace(/^#\/?/, '').split('/');
  const name = ROUTES[m[0]] ? m[0] : 'home';
  return { name, param: m[1] ? decodeURIComponent(m[1]) : '' };
};
const level = (n) => (ROUTES[n].sub ? 1 : 0);

// ---------- context handed to views ----------
const ctx = {
  track(o) { current && current.cleanups.push(o); },
  setTheme, updateBadge, renderInstall,
  refresh() { navigate(true); },
};

// ---------- router ----------
let navSeq = 0;
async function navigate(replaceOnly = false) {
  const hash = location.hash || '#/home';
  const r = parse(hash);
  let dir = 'push';
  if (!replaceOnly) {
    if (stack.length > 1 && stack[stack.length - 2] === hash) { stack.pop(); dir = 'back'; } else if (stack[stack.length - 1] !== hash) stack.push(hash);
  }
  if (sheetOpen()) closeSheet();
  const seq = ++navSeq;
  let def;
  try { def = await ROUTES[r.name].load(); }
  catch (e) { toast("Couldn't open that screen. Check your connection.", { kind: 'error' }); return; }
  if (seq !== navSeq) return; // a newer navigation won
  if (running) running();

  const prev = current;
  const el = document.createElement('section');
  el.className = 'view' + (def.sub ? ' is-sub' : '');
  el.dataset.route = r.name;
  el.setAttribute('aria-label', def.title.split(' · ')[0]);
  el.innerHTML = def.html(r.param);
  document.title = def.title;
  document.body.classList.toggle('is-sub', !!def.sub);
  current = { ...r, el, cleanups: [] };

  // decide the motion
  let kind = 'none';
  if (prev && !first) {
    const a = level(prev.name), b = level(r.name);
    if (a === 0 && b === 0) kind = 'tab';
    else if (b > a) kind = 'push';
    else if (b < a) kind = 'pop';
    else kind = dir === 'back' ? 'pop' : 'push';
    if (dir === 'back' && kind === 'push') kind = 'pop';
  }
  if (kind === 'pop') viewsEl.insertBefore(el, prev.el); else viewsEl.appendChild(el);
  movePill(r.name, !first);
  $$('.tab', tabbar).forEach((t) => t.toggleAttribute('aria-current', false));
  const tab = $(`.tab[data-tab="${r.name}"]`, tabbar); if (tab) tab.setAttribute('aria-current', 'page');

  const flipping = kind === 'push' && r.name === 'car' && flipStore.id === r.param && flipStore.rect;
  def.mount(el, r.param, ctx);
  if (prev) prev.cleanups.forEach((c) => { try { c.destroy(); } catch (e) { /* ignore */ } });
  if (prev && replaceOnly) { prev.el.remove(); return; }
  if (prev) animate(prev.el, el, flipping ? 'flip' : kind, prev.name, r.name);
  if (!first) { el.focus && setTimeout(() => { const h = el.querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }, 60); }
  first = false;
}

function animate(oldEl, newEl, kind, fromName, toName) {
  oldEl.classList.add('is-leaving');
  oldEl.style.willChange = newEl.style.willChange = 'transform, opacity';
  const W = innerWidth;
  const done = () => { running = null; oldEl.remove(); newEl.style.transform = ''; newEl.style.opacity = ''; newEl.style.willChange = ''; };
  if (kind === 'none') return done();
  if (reduced()) { // calm cross-fade only
    newEl.style.opacity = '0';
    requestAnimationFrame(() => { newEl.style.transition = 'opacity 160ms'; newEl.style.opacity = '1'; });
    const t = setTimeout(() => { newEl.style.transition = ''; done(); }, 180);
    running = () => { clearTimeout(t); newEl.style.transition = ''; done(); };
    return;
  }
  let stop;
  if (kind === 'tab') {
    const d = TABS.indexOf(toName) > TABS.indexOf(fromName) ? 1 : -1;
    newEl.style.opacity = '0';
    stop = spring({ from: 0, to: 1, stiffness: 340, damping: 32, onUpdate: (p) => {
      newEl.style.transform = `translate3d(${(1 - p) * d * 56}px,0,0)`; newEl.style.opacity = String(Math.min(1, p * 1.4));
      oldEl.style.transform = `translate3d(${-p * d * 40}px,0,0)`; oldEl.style.opacity = String(Math.max(0, 1 - p * 1.8));
    }, onComplete: done });
  } else if (kind === 'flip') {
    newEl.style.opacity = '1';
    stop = spring({ from: 0, to: 1, stiffness: 300, damping: 30, onUpdate: (p) => { oldEl.style.opacity = String(1 - p); oldEl.style.transform = `scale(${1 - p * 0.04})`; }, onComplete: done });
  } else if (kind === 'push') {
    stop = spring({ from: 0, to: 1, stiffness: 300, damping: 31, onUpdate: (p) => {
      newEl.style.transform = `translate3d(${(1 - p) * W}px,0,0)`; oldEl.style.transform = `translate3d(${-p * W * 0.28}px,0,0)`; oldEl.style.opacity = String(1 - p * 0.5);
    }, onComplete: done });
  } else { // pop: old slides away to the right, revealing the new one underneath
    const start = gestureX / W; gestureX = 0;
    stop = spring({ from: start, to: 1, stiffness: 300, damping: 32, onUpdate: (p) => {
      oldEl.style.transform = `translate3d(${p * W}px,0,0)`; newEl.style.transform = `translate3d(${(1 - p) * -W * 0.28}px,0,0)`; newEl.style.opacity = String(0.5 + p * 0.5);
    }, onComplete: done });
  }
  running = () => { stop(); done(); };
}

function goBack() {
  haptic(6);
  if (stack.length > 1) history.back();
  else location.hash = current && current.name === 'car' ? '#/buy' : '#/home';
}

// ---------- tab pill ----------
let pillX = 0, pillStop = () => {};
function movePill(name, anim) {
  const i = TABS.indexOf(name); if (i < 0) return;
  const tab = $$('.tab', tabbar)[i];
  const to = tab.offsetLeft, w = tab.offsetWidth;
  pill.style.width = w + 'px';
  pillStop();
  if (!anim || reduced()) { pillX = to; pill.style.transform = `translateX(${to}px)`; return; }
  const from = pillX;
  pillStop = spring({ from, to, stiffness: 420, damping: 30, onUpdate: (x) => { pillX = x; const stretch = 1 + Math.min(0.35, Math.abs(to - x) / w * 0.35); pill.style.transform = `translateX(${x}px) scaleX(${stretch.toFixed(3)})`; } });
}
tabbar.addEventListener('click', (e) => { if (e.target.closest('.tab')) haptic(8); });
addEventListener('resize', () => current && movePill(current.name, false), { passive: true });

// ---------- back: buttons, Escape, edge swipe ----------
document.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) { e.preventDefault(); goBack(); } });
let ex = null, ey = 0, edx = 0, et = 0;
viewsEl.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  if (!current || !ROUTES[current.name].sub || t.clientX > 24 || sheetOpen()) return;
  ex = t.clientX; ey = t.clientY; edx = 0; et = performance.now();
}, { passive: true });
viewsEl.addEventListener('touchmove', (e) => {
  if (ex == null) return; const t = e.touches[0];
  if (Math.abs(t.clientY - ey) > 30 && edx < 10) { ex = null; current.el.style.transform = ''; return; }
  edx = Math.max(0, t.clientX - ex); current.el.style.transform = `translate3d(${edx}px,0,0)`;
}, { passive: true });
viewsEl.addEventListener('touchend', () => {
  if (ex == null) return; ex = null;
  const v = edx / Math.max(1, performance.now() - et);
  if (edx > innerWidth * 0.33 || v > 0.6) { gestureX = edx; goBack(); }
  else { const el = current.el, from = edx; spring({ from, to: 0, stiffness: 400, damping: 32, onUpdate: (x) => { el.style.transform = x ? `translate3d(${x}px,0,0)` : ''; } }); }
}, { passive: true });

// ---------- theme ----------
function setTheme(t) {
  const apply = () => {
    document.documentElement.dataset.theme = t; store.set('theme', t);
    try { localStorage.setItem('chekd.theme', t); } catch (e) { /* ignore */ }
    $('#meta-theme').content = t === 'light' ? '#f4f1ea' : '#0d1117';
    const q = $('#theme-quick'); q.setAttribute('aria-label', `Switch to ${t === 'light' ? 'dark' : 'light'} theme`);
    $('use', q).setAttribute('href', t === 'light' ? '#i-moon' : '#i-sun');
  };
  if (document.startViewTransition && !reduced()) document.startViewTransition(apply); else apply();
}
$('#theme-quick').addEventListener('click', () => { haptic(6); setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'); });
setThemeIcon();
function setThemeIcon() { const t = document.documentElement.dataset.theme; $('use', $('#theme-quick')).setAttribute('href', t === 'light' ? '#i-moon' : '#i-sun'); $('#theme-quick').setAttribute('aria-label', `Switch to ${t === 'light' ? 'dark' : 'light'} theme`); }

// ---------- badge on avatar when a request still needs WhatsApp ----------
function updateBadge() { $('.avatar-dot').hidden = !store.get('requests', []).some((r) => !r.sent); }
document.addEventListener('chekd:requests', updateBadge);

// ---------- install prompt ----------
let deferred = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; const s = $('#install-slot'); if (s) renderInstall(s); const r = $('#install-row'); if (r) renderInstall(r, 'row'); });
addEventListener('appinstalled', () => { deferred = null; toast('Chekd is on your home screen'); $$('#install-slot, #install-row').forEach((s) => { s.innerHTML = ''; }); });
function renderInstall(slot, mode = 'card') {
  if (!slot || standalone()) return;
  if (mode === 'card' && store.get('installDismissed', false)) return;
  const ios = isIOS && !deferred;
  if (!deferred && !ios) { slot.innerHTML = ''; return; }
  const sub = ios ? 'Tap Share, then “Add to Home Screen”.' : 'One tap away. Works offline, no app store.';
  slot.innerHTML = mode === 'row'
    ? `<button class="row" type="button" id="inst-go"><span class="row-ic"><svg class="i"><use href="#i-download"/></svg></span><span class="row-main"><b>Install the app</b><small>${sub}</small></span></button>`
    : `<div class="install-card"><img src="icons/icon-192.png" alt="" width="48" height="48"><div><b>Add Chekd to your home screen</b><p>${sub}</p></div>
       ${ios ? '' : '<button class="btn" type="button" id="inst-go" data-ripple>Install</button>'}<button class="icon-btn" type="button" id="inst-x" aria-label="Dismiss"><svg class="i"><use href="#i-close"/></svg></button></div>`;
  const go = $('#inst-go', slot);
  if (go) go.addEventListener('click', async () => {
    if (deferred) { deferred.prompt(); const c = await deferred.userChoice.catch(() => ({})); deferred = null; if (c.outcome === 'accepted') slot.innerHTML = ''; }
    else toast('On iPhone: tap Share, then “Add to Home Screen”');
  });
  const x = $('#inst-x', slot);
  if (x) x.addEventListener('click', () => { store.set('installDismissed', true); slot.innerHTML = ''; });
}

// ---------- boot ----------
installRipple();
updateBadge();
addEventListener('hashchange', () => navigate());
addEventListener('offline', () => toast("You're offline. Saved screens still work.", { kind: 'error' }));
addEventListener('online', () => toast('Back online'));
if (!location.hash) history.replaceState(null, '', '#/home');
navigate();
// warm the on-demand screens once the first screen has settled
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
idle(() => { forms(); det(); import('./js/spin.js'); }, { timeout: 3000 });

const splash = $('#splash');
if (splash && !document.documentElement.classList.contains('no-splash')) {
  try { sessionStorage.setItem('chekd.splash', '1'); } catch (e) { /* ignore */ }
  setTimeout(() => { splash.classList.add('is-gone'); setTimeout(() => splash.remove(), 400); }, reduced() ? 150 : 1150);
} else if (splash) splash.remove();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* non-fatal */ }));
}
