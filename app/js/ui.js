// Shared UI pieces used by every screen.
import { $, $$, esc, inr, lakh, num, emi, emiFrom, RATE, store, loadListings, hueFor, fuelOf, metaLine, nextDays, SLOTS, slotOpenToday,
  submitLead, resultHTML, toast, sheet, closeSheet, confetti, fieldError, checkNamePhone, nameValue, phoneValue, validReg, normReg, prettyReg, validPhone, waLink } from './core.js';
import { spring, tween, countUp, stagger, splitText, flip, flipFrom, haptic, reduced } from './motion.js';

export const TOWNS = [
  { name: 'Bengaluru', live: true }, { name: 'Hubballi' }, { name: 'Dharwad' }, { name: 'Belagavi' }, { name: 'Mysuru' }, { name: 'Mangaluru' },
];

// ---------- shared bits ----------
export const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
export const vehSvg = (type) => `<svg class="veh" viewBox="0 0 120 56" aria-hidden="true"><use href="#v-${type === 'bike' ? 'bike' : 'car'}"/></svg>`;
export function ringHTML(score, { big = false, d = 0 } = {}) {
  return `<div class="ring${big ? ' big' : ''}" style="--off:${(1 - score / 100).toFixed(3)};--d:${d}ms" aria-label="ChekdScore ${score} out of 100" role="img">
    <svg viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="21"/><circle class="fg" cx="24" cy="24" r="21" pathLength="1"/></svg>
    <b data-count="${score}">0</b><small>SCORE</small></div>`;
}
export function animateRings(scope) {
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    e.target.classList.add('is-in'); const b = e.target.querySelector('[data-count]');
    if (b) countUp(b, +b.dataset.count, { duration: 1100 });
  }), { threshold: 0.3 });
  $$('.ring:not(.is-in)', scope).forEach((r) => io.observe(r));
}
export function revealOnScroll(scope) {
  const els = $$('.rv:not(.is-in)', scope);
  if (!('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('is-in'));
  const io = new IntersectionObserver((ents) => {
    const vis = ents.filter((e) => e.isIntersecting).map((e) => e.target);
    vis.forEach((el) => io.unobserve(el));
    stagger(vis, { step: 60 });
  }, { root: scope, rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach((e) => io.observe(e));
}
export const wish = { get: () => store.get('wish', []), has: (id) => store.get('wish', []).includes(id),
  toggle(id) { const w = store.get('wish', []); const i = w.indexOf(id); if (i >= 0) w.splice(i, 1); else w.unshift(id); store.set('wish', w); return i < 0; } };

export function heartToggle(btn, id, name) {
  const on = wish.toggle(id);
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${name} ${on ? 'from' : 'to'} wishlist`);
  haptic(on ? 12 : 6);
  if (on && !reduced()) {
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    for (let k = 0; k < 8; k++) { const s = document.createElement('i'); s.className = 'burst'; s.style.setProperty('--a', `${k * 45}deg`); btn.appendChild(s); setTimeout(() => s.remove(), 560); }
  }
  toast(on ? 'Saved to your wishlist' : 'Removed from wishlist');
}
/** Remember the card's art/title box for the shared-element transition into detail. */
export const flipStore = { rect: null, title: null, id: null };
export function bindCardFlip(scope) {
  scope.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-car]'); if (!a) return;
    const art = a.querySelector('.art'), nm = a.querySelector('.nm');
    flipStore.id = a.dataset.car; flipStore.rect = art && art.getBoundingClientRect(); flipStore.title = nm && nm.getBoundingClientRect();
    haptic(6);
  });
}
export function greeting() { const h = new Date().getHours(); return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
export const firstName = () => (nameValue().split(/\s+/)[0] || '');

export function dayPickerHTML(name) {
  const anyToday = SLOTS.some(slotOpenToday);
  return `<div class="days" role="radiogroup" aria-label="Choose a date">${nextDays(7).map((d, i) => `
    <label><input class="pick-in" type="radio" name="${name}" value="${esc(d.label)}" data-today="${d.today ? 1 : 0}" ${d.today && !anyToday ? 'disabled' : ''} ${(!anyToday && i === 1) || (anyToday && i === 0) ? 'checked' : ''}>
    <span class="day"><small>${esc(d.top)}</small><b>${d.day}</b><small>${esc(d.mon)}</small></span></label>`).join('')}</div>`;
}
export function slotPickerHTML(name) {
  return `<div class="slots" role="radiogroup" aria-label="Choose a time">${SLOTS.map((s) => `
    <label><input class="pick-in" type="radio" name="${name}" value="${esc(s.label)}" data-slot="${s.id}"><span class="slot">${esc(s.label)}</span></label>`).join('')}</div>`;
}
/** Disable today's past slots whenever "Today" is picked. */
export function bindSlots(form, dayName, slotName) {
  const sync = () => {
    const d = form.querySelector(`input[name="${dayName}"]:checked`); const isToday = d && d.dataset.today === '1';
    $$(`input[name="${slotName}"]`, form).forEach((s) => {
      const def = SLOTS.find((x) => x.id === s.dataset.slot);
      s.disabled = isToday && !slotOpenToday(def);
      if (s.disabled && s.checked) s.checked = false;
    });
    if (!form.querySelector(`input[name="${slotName}"]:checked`)) { const f = form.querySelector(`input[name="${slotName}"]:not(:disabled)`); if (f) f.checked = true; }
  };
  form.addEventListener('change', (e) => { if (e.target.name === dayName) { sync(); haptic(4); } if (e.target.name === slotName) haptic(4); });
  sync();
}
export const nameFields = (prefix = '') => `
  <div class="field"><label for="${prefix}name">Your name</label><input class="input" id="${prefix}name" name="name" autocomplete="name" placeholder="e.g. Ananya Rao" value="${esc(nameValue())}" required></div>
  <div class="field"><label for="${prefix}phone">Mobile number</label><input class="input" id="${prefix}phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="98765 43210" value="${esc(phoneValue())}" required></div>`;
export const consent = `<p class="consent">We'll only use this to reply about your request. <a href="../web-app/privacy.html">Privacy</a> · <a href="../web-app/terms.html">Terms</a></p>`;
export async function runSubmit(btn, fn) {
  btn.classList.add('is-loading'); btn.disabled = true; btn.setAttribute('aria-busy', 'true');
  try { return await fn(); } finally { btn.classList.remove('is-loading'); btn.disabled = false; btn.removeAttribute('aria-busy'); }
}
export function showResult(container, res, copy) {
  container.innerHTML = resultHTML(res, copy);
  const r = container.querySelector('.result'); r && r.focus({ preventScroll: true });
  haptic(res.ok ? 20 : 10);
  if (res.ok) confetti();
  toast(res.ok ? 'Request sent' : 'Saved on your phone', { kind: res.ok ? 'info' : 'info' });
}
export const skelCard = () => `<div class="skel" aria-hidden="true"><div class="s" style="height:184px;border-radius:0"></div><div style="padding:16px;display:grid;gap:10px"><div class="s" style="height:20px;width:70%"></div><div class="s" style="height:14px;width:55%"></div><div class="s" style="height:24px;width:40%"></div></div></div>`;

