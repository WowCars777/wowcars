// Chekd core: escaping, formatting, storage, leads, toasts, sheets, confetti.
import { spring, reduced, haptic } from './motion.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);

// ---------- Indian formatting ----------
const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const inr = (n) => '₹' + nf.format(Math.round(n));
export const num = (n) => nf.format(Math.round(n));
export function lakh(n) {
  if (n >= 1e7) return '₹' + trim(n / 1e7) + ' Cr';
  if (n >= 1e5) return '₹' + trim(n / 1e5) + ' L';
  return inr(n);
}
const trim = (x) => x.toFixed(2).replace(/\.?0+$/, '');

export const RATE = 9.5;
export function emi(principal, months, rate = RATE) {
  if (principal <= 0) return 0;
  const r = rate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}
/** Default "EMI from" uses 20% down over 60 months. */
export const emiFrom = (price) => emi(price * 0.8, 60);

// ---------- Storage ----------
export const store = {
  get(k, d) { try { const v = localStorage.getItem('chekd.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('chekd.' + k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
};

// ---------- Listings ----------
let listingsP = null;
export function loadListings(fresh = false) {
  if (!listingsP || fresh) {
    listingsP = fetch('data/listings.json', { cache: fresh ? 'reload' : 'default', credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error('listings ' + r.status); return r.json(); })
      .catch((e) => { listingsP = null; throw e; });
  }
  return listingsP;
}
export function hueFor(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
export const fuelOf = (l) => (l.fuel || '').split(',')[0].trim();
export const metaLine = (l) => [l.year, num(l.km) + ' km', l.fuel ? fuelOf(l) : '', l.city].filter(Boolean).join(' · ');

// ---------- Dates ----------
export function nextDays(n = 7) {
  const out = [], now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      top: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: d.getDate(),
      mon: d.toLocaleDateString('en-IN', { month: 'short' }),
      label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      today: i === 0,
    });
  }
  return out;
}
export const SLOTS = [
  { id: '9-11', label: '9–11 am', end: 11 },
  { id: '11-1', label: '11 am–1 pm', end: 13 },
  { id: '2-4', label: '2–4 pm', end: 16 },
  { id: '4-6', label: '4–6 pm', end: 18 },
];
/** A slot is bookable today only if it starts at least an hour from now. */
export const slotOpenToday = (s) => { const n = new Date(); return n.getHours() + n.getMinutes() / 60 + 1 <= s.end - 2; };
export const stamp = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });

// ---------- Validation ----------
export function cleanPhone(p) { let d = String(p).replace(/\D/g, ''); if (d.length === 12 && d.startsWith('91')) d = d.slice(2); if (d.length === 11 && d.startsWith('0')) d = d.slice(1); return d; }
export const validPhone = (p) => /^[6-9]\d{9}$/.test(cleanPhone(p));
export const normReg = (r) => String(r).toUpperCase().replace(/[^A-Z0-9]/g, '');
export const validReg = (r) => /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(normReg(r)) || /^\d{2}BH\d{4}[A-Z]{1,2}$/.test(normReg(r));
export function prettyReg(r) {
  const n = normReg(r); const m = n.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/);
  return m ? [m[1], m[2].padStart(2, '0'), m[3], m[4]].filter(Boolean).join(' ') : n;
}

// ---------- Leads: Supabase first, WhatsApp fallback, always kept on the phone ----------
const SB_URL = 'https://yjxwiibpcuukucwvlkwq.supabase.co/rest/v1/leads';
const SB_KEY = 'sb_publishable_TRVnPURKF2tOgQ8vab4ySQ_bKIvcvL2';
export const WA = '919019088160';
export const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

export async function submitLead(fields, waText) {
  const row = {
    name: fields.name || 'App user', phone: cleanPhone(fields.phone || ''), source: 'App', status: 'New',
    type: fields.type, car: fields.car || '', area: fields.area || '', town: fields.town || '', interest: fields.interest || '', date: stamp(),
  };
  const text = `Hi Chekd Cars, ${waText}\nName: ${row.name}\nPhone: ${row.phone}`;
  const rec = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now(), ...row, sent: false, wa: waLink(text) };
  const list = store.get('requests', []); list.unshift(rec); store.set('requests', list.slice(0, 50));
  if (fields.name) store.set('me', { name: fields.name, phone: row.phone });
  let ok = false;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
    const r = await fetch(SB_URL, { method: 'POST', signal: ctl.signal, headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
    clearTimeout(t); ok = r.ok;
  } catch (e) { ok = false; }
  if (ok) {
    const l2 = store.get('requests', []); const it = l2.find((x) => x.id === rec.id); if (it) { it.sent = true; store.set('requests', l2); }
  }
  document.dispatchEvent(new CustomEvent('chekd:requests'));
  return { ok, wa: rec.wa, rec };
}

/** The result panel shown after any form. Never a dead end. */
export function resultHTML({ ok, wa }, { title, okText, sub = '' }) {
  return `<div class="result ${ok ? 'is-ok' : 'is-pending'}" tabindex="-1">
    <svg class="result-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23" pathLength="1"/><path d="M15 27l7.5 7.5L38 19" pathLength="1"/></svg>
    <h3>${esc(title)}</h3>
    <p>${ok ? esc(okText) : 'Saved on your phone. Tap below to send it to us on WhatsApp and we\'ll confirm right away.'}</p>
    ${sub ? `<p class="result-sub">${sub}</p>` : ''}
    <a class="btn ${ok ? 'btn-ghost' : 'btn-wa'}" href="${esc(wa)}" target="_blank" rel="noopener" data-ripple><svg class="i"><use href="#i-wa"/></svg>${ok ? 'Chat with us on WhatsApp' : 'Send on WhatsApp'}</a>
    <a class="link-quiet" href="#/profile">See all my requests</a>
  </div>`;
}

// ---------- Toasts ----------
export function toast(msg, { kind = 'info', ms = 2800 } = {}) {
  const root = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast toast-' + kind;
  el.innerHTML = `<svg class="i"><use href="#i-${kind === 'error' ? 'close' : 'check'}"/></svg><span>${esc(msg)}</span>`;
  root.appendChild(el);
  spring({ from: 1, to: 0, stiffness: 380, damping: 24, onUpdate: (p) => { el.style.transform = `translateY(${p * 120}%)`; el.style.opacity = String(1 - p); } });
  setTimeout(() => {
    spring({ from: 0, to: 1, stiffness: 300, damping: 30, onUpdate: (p) => { el.style.transform = `translateY(${p * 120}%)`; el.style.opacity = String(1 - p); }, onComplete: () => el.remove() });
  }, ms);
}

// ---------- Bottom sheet with drag-to-dismiss ----------
let openSheet = null;
export function sheet(html, { title = '', label = '' } = {}) {
  if (openSheet) openSheet.close(true);
  const root = $('#sheet-root');
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label || title)}">
      <div class="sheet-grab"><span></span></div>
      <header class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" type="button" data-close aria-label="Close"><svg class="i"><use href="#i-close"/></svg></button></header>
      <div class="sheet-body">${html}</div>
    </section>`;
  root.appendChild(wrap);
  const panel = $('.sheet', wrap), bd = $('.sheet-backdrop', wrap), body = $('.sheet-body', wrap);
  const prevFocus = document.activeElement;
  let y = 1, stop = () => {}, closed = false;
  const paint = (p) => { y = p; panel.style.transform = `translateY(${p * 100}%)`; bd.style.opacity = String(Math.max(0, 1 - p)); };
  paint(1);
  const animTo = (to, v = 0, done) => { stop(); stop = spring({ from: y, to, velocity: v, stiffness: 340, damping: 32, onUpdate: paint, onComplete: done }); };
  animTo(0);
  const api = {
    el: wrap, body,
    close(instant) {
      if (closed) return; closed = true; openSheet = null;
      document.removeEventListener('keydown', onKey);
      const fin = () => { wrap.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true }); };
      if (instant) fin(); else animTo(1, 0, fin);
    },
  };
  const onKey = (e) => {
    if (e.key === 'Escape') api.close();
    if (e.key === 'Tab') { // keep focus inside the sheet
      const f = $$('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])', panel).filter((n) => !n.disabled);
      if (!f.length) return; const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    }
  };
  document.addEventListener('keydown', onKey);
  bd.addEventListener('click', () => api.close());
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) api.close(); });

  // drag to dismiss: from the grab handle/header anywhere, or from the body when scrolled to top
  let startY = 0, lastY = 0, lastT = 0, vel = 0, dragging = false, h = 1;
  panel.addEventListener('pointerdown', (e) => {
    const onHandle = e.target.closest('.sheet-grab, .sheet-head');
    if (!onHandle && (body.scrollTop > 0 || e.target.closest('input, select, textarea, button, a, [data-nodrag]'))) return;
    dragging = true; startY = lastY = e.clientY; lastT = performance.now(); vel = 0; h = panel.offsetHeight; stop();
    panel.setPointerCapture(e.pointerId);
  });
  panel.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(); vel = (e.clientY - lastY) / Math.max(1, now - lastT); lastY = e.clientY; lastT = now;
    const dy = e.clientY - startY;
    paint(dy > 0 ? dy / h : (dy / h) * 0.15);
  });
  const end = () => {
    if (!dragging) return; dragging = false;
    if (y > 0.3 || vel > 0.7) { haptic(6); api.close(); } else animTo(0, -vel * 2);
  };
  panel.addEventListener('pointerup', end); panel.addEventListener('pointercancel', end);

  openSheet = api;
  setTimeout(() => { const f = $('[autofocus], .sheet-body button, .sheet-body input', panel) || $('[data-close]', panel); f && f.focus({ preventScroll: true }); }, 60);
  return api;
}
export const closeSheet = () => openSheet && openSheet.close();
export const sheetOpen = () => !!openSheet;

// ---------- Confetti-lite ----------
export function confetti() {
  if (reduced()) return;
  const c = $('#confetti'), ctx = c.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; c.style.display = 'block'; ctx.scale(dpr, dpr);
  const cols = ['#e8412c', '#12b5a6', '#ff6b57', '#3fd0c2', '#f4f1ea', '#ffc857'];
  const P = Array.from({ length: 70 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 60, y: H * 0.42, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 11 - 4,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, w: 5 + Math.random() * 5, h: 3 + Math.random() * 4, c: cols[(Math.random() * cols.length) | 0],
  }));
  const t0 = performance.now();
  const step = (now) => {
    const t = now - t0; ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 1400); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (t < 1400) requestAnimationFrame(step); else { ctx.clearRect(0, 0, W, H); c.style.display = 'none'; }
  };
  requestAnimationFrame(step);
}

// ---------- Form helpers ----------
export function fieldError(input, msg) {
  const f = input.closest('.field') || input.parentElement;
  let e = f.querySelector('.field-err');
  if (!msg) { input.removeAttribute('aria-invalid'); if (e) e.textContent = ''; return true; }
  if (!e) { e = document.createElement('p'); e.className = 'field-err'; e.id = (input.id || input.name) + '-err'; f.appendChild(e); }
  e.textContent = msg; input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', e.id);
  f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
  return false;
}
export function checkNamePhone(form) {
  const n = form.elements.name, p = form.elements.phone;
  const a = fieldError(n, n.value.trim().length >= 2 ? '' : 'Please tell us your name.');
  const b = fieldError(p, validPhone(p.value) ? '' : 'Enter a 10-digit Indian mobile number.');
  if (!a) n.focus(); else if (!b) p.focus();
  return a && b;
}
export const nameValue = () => (store.get('me', {}).name || '');
export const phoneValue = () => (store.get('me', {}).phone || '');
