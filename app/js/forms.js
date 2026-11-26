// Sell, Doorstep, Passport and Profile screens.
import { $, $$, esc, inr, lakh, num, emi, emiFrom, RATE, store, loadListings, hueFor, fuelOf, metaLine, nextDays, SLOTS, slotOpenToday,
  submitLead, resultHTML, toast, sheet, closeSheet, confetti, fieldError, checkNamePhone, nameValue, phoneValue, validReg, normReg, prettyReg, validPhone, waLink } from './core.js';
import { spring, tween, countUp, stagger, splitText, flip, flipFrom, haptic, reduced } from './motion.js';
import { TOWNS, icon, vehSvg, ringHTML, animateRings, revealOnScroll, wish, heartToggle, flipStore, bindCardFlip, greeting, firstName, dayPickerHTML, slotPickerHTML, bindSlots, nameFields, consent, runSubmit, showResult, skelCard } from './ui.js';

// ================= SELL =================
const sellState = { step: 0, type: 'car', reg: '', model: '', year: '', km: '', city: 'Bengaluru' };
function estimate({ type, year, km }) {
  const nowY = new Date().getFullYear(), age = Math.max(0, nowY - (+year || nowY - 5));
  const base = type === 'bike' ? 140000 : 850000;
  const kmF = Math.max(0.55, 1 - (+km || 0) / (type === 'bike' ? 160000 : 320000));
  const v = base * Math.pow(0.86, age) * kmF;
  const r5 = (x) => Math.max(10000, Math.round(x / 5000) * 5000);
  return [r5(v * 0.9), r5(v * 1.08)];
}
export const sell = {
  title: 'Sell · Chekd Cars',
  html: () => {
    const nowY = new Date().getFullYear();
    return `<span class="eyebrow rv">Sell with Chekd</span>
    <h1 class="page-title rv">Sell in <em>30 minutes</em>.</h1>
    <p class="lead-p rv">Three quick steps. Free inspection at your door, offer on WhatsApp, money the same day.</p>
    <div class="progress rv" role="progressbar" aria-label="Sell steps" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1"><i id="sell-bar"></i></div>
    <div class="progress-lbl rv"><span id="sell-lbl">Step 1 of 3 · Your vehicle</span><span id="sell-pct">33%</span></div>
    <form class="steps" id="sell-f" novalidate>
      <div class="step" data-step="0">
        <div class="field"><span class="field-label" id="sell-type-l">What are you selling?</span>
          <div class="seg" role="radiogroup" aria-labelledby="sell-type-l" data-v="${sellState.type === 'bike' ? 1 : 0}"><span class="seg-pill"></span>
            <label><input type="radio" name="type" value="car" ${sellState.type === 'car' ? 'checked' : ''}><span>Car</span></label>
            <label><input type="radio" name="type" value="bike" ${sellState.type === 'bike' ? 'checked' : ''}><span>Bike</span></label></div></div>
        <div class="field"><label for="s-reg">Registration number</label><input class="input input-reg" id="s-reg" name="reg" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="KA 01 AB 1234" maxlength="14" value="${esc(sellState.reg)}"></div>
        <div class="field"><label for="s-model">Make and model</label><input class="input" id="s-model" name="model" placeholder="e.g. Maruti Swift VXi" value="${esc(sellState.model)}"></div>
        <div class="field"><label for="s-year">Year of registration</label><select class="input" id="s-year" name="year">${Array.from({ length: 18 }, (_, i) => nowY - i).map((y) => `<option${String(y) === String(sellState.year || nowY - 4) ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
        <div class="step-actions"><button class="btn btn-block" type="button" data-next data-ripple>Continue ${icon('arrow')}</button></div>
      </div>
      <div class="step" data-step="1" hidden>
        <div class="field"><label for="s-km">Kilometres driven</label><input class="input" id="s-km" name="km" type="text" inputmode="numeric" placeholder="e.g. 35,000" value="${esc(sellState.km)}"></div>
        <div class="km-quick" aria-label="Quick picks">${[15000, 30000, 50000, 80000].map((k) => `<button class="chip" type="button" data-km="${k}">${num(k)}</button>`).join('')}</div>
        <div class="field"><label for="s-city">City</label><select class="input" id="s-city" name="city">${TOWNS.map((t) => `<option${t.name === sellState.city ? ' selected' : ''}>${t.name}</option>`).join('')}</select>
          <p class="field-hint">Doorstep inspection is live in Bengaluru. In other towns we'll WhatsApp you an offer and the launch date.</p></div>
        <div class="step-actions"><button class="btn btn-ghost" type="button" data-prev aria-label="Back to step 1">${icon('back')}</button><button class="btn" type="button" data-next data-ripple>Continue ${icon('arrow')}</button></div>
      </div>
      <div class="step" data-step="2" hidden>
        ${nameFields('s-')}${consent}
        <div class="step-actions"><button class="btn btn-ghost" type="button" data-prev aria-label="Back to step 2">${icon('back')}</button><button class="btn" type="button" data-est data-ripple>See my estimate</button></div>
      </div>
      <div class="step" data-step="3" hidden><div id="sell-est"></div></div>
    </form>
    <section class="section rv"><a class="feature" href="#/doorstep"><picture><source srcset="img/mechanic.webp" type="image/webp"><img src="img/mechanic.jpg" alt="A Chekd technician inspecting an engine bay" loading="lazy" decoding="async" width="1080" height="724" style="height:180px"></picture>
      <div class="feature-body"><span class="eyebrow">How it works</span><h3>Inspect, offer, paid.</h3><p>A Chekd Captain runs the 200-point check at your place. You get a firm offer and the paperwork is on us.</p></div></a></section>`;
  },
  mount(el) {
    revealOnScroll(el);
    const f = $('#sell-f', el), steps = $$('.step', f), bar = $('#sell-bar', el);
    const labels = ['Your vehicle', 'Usage and city', 'Your details', 'Your estimate'];
    const reg = f.elements.reg;
    reg.addEventListener('input', () => { const p = reg.selectionStart === reg.value.length; reg.value = reg.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''); if (p) reg.setSelectionRange(reg.value.length, reg.value.length); });
    reg.addEventListener('blur', () => { if (validReg(reg.value)) reg.value = prettyReg(reg.value); });
    const km = f.elements.km;
    km.addEventListener('input', () => { const d = km.value.replace(/\D/g, '').slice(0, 7); km.value = d ? num(+d) : ''; });
    f.addEventListener('change', (e) => { if (e.target.name === 'type') { $('.seg', f).dataset.v = e.target.value === 'bike' ? 1 : 0; haptic(5); } });
    f.addEventListener('click', (e) => { const k = e.target.closest('[data-km]'); if (k) { km.value = num(+k.dataset.km); haptic(4); fieldError(km, ''); } });
    const save = () => Object.assign(sellState, { type: f.elements.type.value, reg: reg.value, model: f.elements.model.value, year: f.elements.year.value, km: km.value, city: f.elements.city.value });
    const go = (to, dir) => {
      const from = sellState.step, a = steps[from], b = steps[to]; sellState.step = to; save();
      const p = (Math.min(to, 2) + 1) / 3;
      bar.style.setProperty('--p', p); bar.parentElement.setAttribute('aria-valuenow', String(Math.min(to, 2) + 1));
      $('#sell-lbl', el).textContent = to < 3 ? `Step ${to + 1} of 3 · ${labels[to]}` : 'Done · Your estimate'; $('#sell-pct', el).textContent = `${Math.round(p * 100)}%`;
      a.hidden = true; b.hidden = false;
      spring({ from: 1, to: 0, stiffness: 300, damping: 28, onUpdate: (x) => { b.style.transform = x ? `translateX(${x * dir * 48}px)` : ''; b.style.opacity = String(1 - x); } });
      const first = b.querySelector('input:not([type=radio]), select'); if (first && to < 3) setTimeout(() => first.focus({ preventScroll: true }), 50);
      const top = $('.progress', el).getBoundingClientRect().top; if (top < 0) el.scrollBy({ top: top - 96, behavior: reduced() ? 'auto' : 'smooth' });
      haptic(6);
    };
    if (sellState.step && sellState.step < 3) { steps[0].hidden = true; steps[sellState.step].hidden = false; go(sellState.step, 1); }
    else sellState.step = 0;
    f.addEventListener('click', (e) => {
      if (e.target.closest('[data-prev]')) return go(sellState.step - 1, -1);
      if (e.target.closest('[data-next]')) {
        if (sellState.step === 0) {
          const okR = fieldError(reg, validReg(reg.value) ? '' : 'Enter a valid number, like KA 01 AB 1234.');
          const okM = fieldError(f.elements.model, f.elements.model.value.trim().length >= 2 ? '' : 'Which make and model is it?');
          if (!okR) return reg.focus(); if (!okM) return f.elements.model.focus();
          reg.value = prettyReg(reg.value);
        }
        if (sellState.step === 1) { const n = +km.value.replace(/\D/g, ''); if (!fieldError(km, n > 0 && n < 1500000 ? '' : 'Roughly how many km has it done?')) return km.focus(); }
        return go(sellState.step + 1, 1);
      }
      if (e.target.closest('[data-est]')) {
        if (!checkNamePhone(f)) return; save(); go(3, 1); showEstimate();
      }
    });
    f.addEventListener('submit', (e) => e.preventDefault());

    function showEstimate() {
      const kmN = +km.value.replace(/\D/g, ''), [lo, hi] = estimate({ type: sellState.type, year: sellState.year, km: kmN });
      const box = $('#sell-est', el), max = sellState.type === 'bike' ? 200000 : 1200000;
      box.innerHTML = `<div class="est" aria-live="polite">
        <div class="gauge" aria-hidden="true"><svg viewBox="0 0 240 132"><defs><linearGradient id="g-grad"><stop offset="0" stop-color="#e8412c"/><stop offset="1" stop-color="#12b5a6"/></linearGradient></defs>
          <path class="g-bg" d="M20 120a100 100 0 0 1 200 0"/><path class="g-fg" d="M20 120a100 100 0 0 1 200 0" pathLength="1"/>
          <g class="g-needle"><line x1="120" y1="120" x2="120" y2="40"/><circle cx="120" cy="120" r="8" fill="currentColor"/></g></svg></div>
        <p class="est-lbl" id="est-scan">Checking ${esc(sellState.year)} ${esc(sellState.model.trim())} prices in ${esc(sellState.city)}…</p>
        <p class="est-range"><span id="est-lo">₹0</span><i>to</i><span id="est-hi">₹0</span></p>
        <div class="est-band"><i style="left:${(lo / max) * 100}%;width:${Math.max(4, ((hi - lo) / max) * 100)}%"></i></div>
        <div class="est-scale"><span>₹0</span><span>${esc(lakh(max))}+</span></div>
        <span class="est-tag">Indicative estimate</span>
        <p class="panel-note" style="margin-top:8px">Based only on age and kilometres. Your firm offer comes after the free 200-point Chekd Check, usually within 30 minutes.</p>
        <div class="form-actions"><button class="btn btn-block" type="button" id="sell-go" data-ripple>Get my firm offer</button>
        <button class="link-quiet" type="button" id="sell-edit" style="background:none;border:0;margin:8px auto 0;display:flex">Edit details</button></div></div>`;
      const fg = $('.g-fg', box), nd = $('.g-needle', box), target = Math.min(0.98, (lo + hi) / 2 / max);
      spring({ from: 0, to: target, stiffness: 70, damping: 11, onUpdate: (x) => { fg.style.strokeDashoffset = String(1 - Math.max(0, x)); nd.style.transform = `rotate(${-90 + x * 180}deg)`; } });
      setTimeout(() => {
        countUp($('#est-lo', box), lo, { format: inr, duration: 900 }); countUp($('#est-hi', box), hi, { format: inr, duration: 1100 });
        $('#est-scan', box).textContent = `${sellState.model.trim()} · ${sellState.year} · ${km.value} km`; box.firstElementChild.classList.add('is-in');
      }, reduced() ? 0 : 500);
      $('#sell-edit', box).addEventListener('click', () => go(0, -1));
      $('#sell-go', box).addEventListener('click', async (e) => {
        const reg = prettyReg(sellState.reg), model = sellState.model.trim();
        const res = await runSubmit(e.currentTarget, () => submitLead({
          type: 'Sell', name: f.elements.name.value.trim(), phone: f.elements.phone.value, car: `${model} · ${reg}`, town: sellState.city, area: '',
          interest: `Sell ${sellState.type} · Reg ${reg} · ${sellState.year} · ${km.value} km · indicative ${lakh(lo)}–${lakh(hi)}`,
        }, `I want to sell my ${sellState.type}.\nReg: ${reg}\nModel: ${model} (${sellState.year})\nKm: ${km.value}\nCity: ${sellState.city}\nApp estimate: ${inr(lo)} to ${inr(hi)}`));
        showResult(box, res, { title: res.ok ? 'Offer on its way' : 'One tap to finish', okText: `We'll WhatsApp you a firm offer within 30 minutes and book your free inspection in ${sellState.city}.` });
        sellState.step = 0;
      });
    }
  },
};

// ================= DOORSTEP =================
const SERVICES = [
  ['Doorstep test drive', 'steer', 'Any Chekd car, at your gate'],
  ['Service pickup and drop', 'truck', 'We collect, service and return it'],
  ['Chekd Check and offer', 'clip', '200-point inspection with an instant offer'],
  ['Home delivery', 'door', 'Your new car, delivered with paperwork'],
  ['On-demand help', 'bolt', 'Jump-start, flat tyre, small fixes. From ₹299'],
];
export const doorstep = {
  title: 'Doorstep · Chekd Cars',
  html: () => `<span class="eyebrow rv">Doorstep</span>
    <h1 class="page-title rv">We come <em>to you</em>.</h1>
    <p class="lead-p rv">Pick a service and a slot. A Chekd Captain arrives on time, with everything needed.</p>
    <form id="ds" novalidate>
      <h2 class="step-h rv"><span>1</span>Choose a service</h2>
      <div class="svcs" role="radiogroup" aria-label="Service">${SERVICES.map(([n, ic, d], i) => `
        <label class="rv"><input class="pick-in" type="radio" name="svc" value="${esc(n)}" ${i === 0 ? 'checked' : ''}>
        <span class="svc"><span class="svc-ic">${icon(ic)}</span><span><b>${esc(n)}</b><small>${esc(d)}</small></span><span class="svc-dot"></span></span></label>`).join('')}</div>
      <h2 class="step-h rv"><span>2</span>Pick a day</h2>
      <div class="rv">${dayPickerHTML('ds-day')}</div>
      <h2 class="step-h rv"><span>3</span>Pick a time</h2>
      <div class="rv">${slotPickerHTML('ds-slot')}</div>
      <h2 class="step-h rv"><span>4</span>Where and who</h2>
      <div class="field rv"><label for="ds-addr">Address</label><textarea class="input" id="ds-addr" name="address" autocomplete="street-address" placeholder="House, street, area. e.g. 12, 5th Cross, Indiranagar" required></textarea></div>
      <div class="field rv"><label for="ds-car">Your car or bike (optional)</label><input class="input" id="ds-car" name="car" placeholder="e.g. Honda City 2019"></div>
      <div class="rv">${nameFields('ds-')}</div>
      <div class="note-box rv">${icon('pin')}<span>Doorstep is live across Bengaluru. Hubballi, Dharwad, Belagavi, Mysuru and Mangaluru are next.</span></div>
      ${consent}
      <div class="form-actions"><button class="btn btn-block" type="submit" data-ripple>Book my slot</button></div>
    </form>
    <div id="ds-done"></div>`,
  mount(el) {
    revealOnScroll(el);
    const f = $('#ds', el);
    bindSlots(f, 'ds-day', 'ds-slot');
    f.addEventListener('change', (e) => { if (e.target.name === 'svc') haptic(5); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ad = f.elements.address;
      if (!fieldError(ad, ad.value.trim().length >= 6 ? '' : 'Add your address so the Captain can find you.')) return ad.focus();
      if (!checkNamePhone(f)) return;
      const svc = f.querySelector('[name=svc]:checked').value, day = (f.querySelector('[name="ds-day"]:checked') || {}).value, slot = (f.querySelector('[name="ds-slot"]:checked') || {}).value;
      if (!day || !slot) return toast('Pick a day and time', { kind: 'error' });
      const when = `${day}, ${slot}`, car = f.elements.car.value.trim();
      const res = await runSubmit(f.querySelector('[type=submit]'), () => submitLead({
        type: 'Doorstep', name: f.elements.name.value.trim(), phone: f.elements.phone.value, car: car || svc, area: ad.value.trim(), town: 'Bengaluru', interest: `${svc} · ${when}`,
      }, `I'd like to book: ${svc}, ${when}.${car ? '\nVehicle: ' + car : ''}\nAddress: ${ad.value.trim()}`));
      f.hidden = true;
      showResult($('#ds-done', el), res, { title: res.ok ? "You're booked" : 'Almost booked', okText: `${svc}, ${when}. We'll WhatsApp you the Captain's name before the visit.` });
      el.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    });
  },
};

// ================= PASSPORT =================
export const passport = {
  title: 'Passport · Chekd Cars',
  html: () => `<span class="eyebrow rv">Chekd Passport</span>
    <h1 class="page-title rv">Your car's <em>whole story</em>, verified.</h1>
    <p class="lead-p rv">Inspections, services, insurance and PUC in one record that travels with your car. Free for every Chekd owner.</p>
    <div class="pp-stage rv">
      <button class="pp-card" id="pp" type="button" aria-label="Sample Chekd Passport. Tap to flip and see the service timeline." aria-pressed="false">
        <div class="pp-face pp-front">
          <div class="pp-top"><b>chekd<i> passport</i></b><span class="pp-ver">${icon('check')}Verified</span></div>
          <p class="pp-model">Maruti Swift VXi · 2021 · Petrol</p>
          <svg class="veh" viewBox="0 0 120 56" aria-hidden="true"><use href="#v-car"/></svg>
          <div class="pp-reg"><small>Registration</small><b>KA 05 •• 4821</b></div>
          <div class="pp-score"><b>92</b>ChekdScore</div>
        </div>
        <div class="pp-face pp-back">
          <div class="pp-top"><b>Timeline</b><span class="pp-ver">${icon('shield')}Tamper-proof</span></div>
          <ul class="pp-tl">
            <li><small>Mar 2026</small>Chekd Check · 200 points, score 92</li>
            <li><small>Jun 2026</small>Service + brake pads replaced</li>
            <li><small>Aug 2026</small>Insurance renewed</li>
            <li class="due"><small>Dec 2026 · due</small>PUC certificate renewal</li>
          </ul>
        </div>
      </button>
    </div>
    <p class="pp-hint rv">${icon('rotate')}Tap the card to flip · tilt your phone</p>
    <div class="perks">
      <div class="perk rv">${icon('clip')}<div><b>Every check, signed</b><small>Your 200-point Chekd Check report, kept forever.</small></div></div>
      <div class="perk rv">${icon('bolt')}<div><b>Reminders before it's due</b><small>Insurance, PUC and service nudges on WhatsApp.</small></div></div>
      <div class="perk rv">${icon('tag')}<div><b>Sells faster, for more</b><small>Buyers trust a verified history. So do we.</small></div></div>
    </div>
    <section class="panel rv" aria-labelledby="pp-form-h"><h2 id="pp-form-h">Get your free Passport</h2>
      <form id="ppf" novalidate>
        <div class="field"><label for="pp-reg">Registration number</label><input class="input input-reg" id="pp-reg" name="reg" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="KA 05 MN 4821" maxlength="14"></div>
        ${nameFields('pp-')}${consent}
        <div class="form-actions"><button class="btn btn-block btn-teal" type="submit" data-ripple>Request my Passport</button></div>
      </form><div id="pp-done"></div></section>`,
  mount(el, _p, ctx) {
    revealOnScroll(el);
    const card = $('#pp', el); let flipA = 0, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, stopF = () => {};
    const paint = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      card.style.transform = `rotateX(${cy.toFixed(2)}deg) rotateY(${(flipA + cx).toFixed(2)}deg)`;
      card.style.setProperty('--gx', `${50 + cx * 3}%`); card.style.setProperty('--gy', `${30 - cy * 3}%`);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(paint); else raf = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const setTilt = (x, y) => { if (reduced()) return; tx = Math.max(-14, Math.min(14, x)); ty = Math.max(-12, Math.min(12, y)); kick(); };
    card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); setTilt(((e.clientX - r.left) / r.width - 0.5) * 22, -((e.clientY - r.top) / r.height - 0.5) * 18); }, { passive: true });
    card.addEventListener('pointerleave', () => setTilt(0, 0));
    card.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') setTimeout(() => setTilt(0, 0), 300); });
    card.addEventListener('click', () => {
      haptic(10); const to = Math.round(flipA / 180) * 180 + 180, from = flipA;
      card.setAttribute('aria-pressed', String((to / 180) % 2 === 1));
      stopF(); stopF = spring({ from, to, stiffness: 140, damping: 16, onUpdate: (a) => { flipA = a; card.style.transform = `rotateX(${cy}deg) rotateY(${(a + cx).toFixed(2)}deg)`; }, onComplete: kick });
    });
    // gyro tilt where the browser offers it without a permission prompt
    const onOri = (e) => { if (e.gamma == null) return; setTilt(e.gamma * 0.5, (e.beta - 45) * -0.35); };
    if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      addEventListener('deviceorientation', onOri, { passive: true });
      ctx.track({ destroy: () => removeEventListener('deviceorientation', onOri) });
    }
    ctx.track({ destroy: () => cancelAnimationFrame(raf) });
    paint();

    const f = $('#ppf', el), reg = f.elements.reg;
    reg.addEventListener('input', () => { reg.value = reg.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!fieldError(reg, validReg(reg.value) ? '' : 'Enter a valid number, like KA 05 MN 4821.')) return reg.focus();
      if (!checkNamePhone(f)) return;
      const r = prettyReg(reg.value);
      const res = await runSubmit(f.querySelector('[type=submit]'), () => submitLead({ type: 'Passport', name: f.elements.name.value.trim(), phone: f.elements.phone.value, car: r, interest: 'Free Chekd Passport', town: '', area: '' },
        `please send my free Chekd Passport.\nVehicle: ${r}`));
      f.hidden = true;
      showResult($('#pp-done', el), res, { title: res.ok ? 'Passport requested' : 'One tap to finish', okText: `We'll WhatsApp you to set up the Passport for ${r}.` });
    });
  },
};

// ================= PROFILE =================
const TYPE_IC = { Doorstep: 'door', Sell: 'tag', Passport: 'shield', 'Buy enquiry': 'help', 'Test drive': 'steer' };
export const profile = {
  sub: true,
  title: 'Profile · Chekd Cars',
  html: () => {
    const me = store.get('me', {}), reqs = store.get('requests', []);
    const theme = document.documentElement.dataset.theme;
    return `<header class="sub-head"><button class="icon-btn" type="button" data-back aria-label="Back">${icon('back')}</button><h1>Profile</h1></header>
    <div class="me rv"><span class="me-av" aria-hidden="true">${esc((me.name || 'C').trim().charAt(0).toUpperCase())}</span><div><h2>${esc(me.name || 'Welcome to Chekd')}</h2><p>${me.phone ? '+91 ' + esc(me.phone.replace(/(\d{5})(\d{5})/, '$1 $2')) : 'Your requests and saved vehicles live on this phone.'}</p></div></div>
    <section class="section rv"><div class="section-head"><h2>My requests</h2></div>
      <div class="list" id="reqs">${reqs.length ? reqs.map((r) => `<div class="row"><span class="row-ic">${icon(TYPE_IC[r.type] || 'doc')}</span>
        <span class="row-main"><b>${esc(r.type)}</b><small>${esc(r.car || r.interest)}</small><small>${esc(r.date)}</small></span>
        ${r.sent ? '<span class="status ok">Sent</span>' : `<a class="status wait" href="${esc(r.wa)}" target="_blank" rel="noopener" aria-label="Send ${esc(r.type)} request on WhatsApp">${icon('wa')}Send</a>`}</div>`).join('')
        : `<p class="mini-empty">No requests yet. <a href="#/doorstep">Book a doorstep slot</a> or <a href="#/sell">get a sell offer</a>.</p>`}</div></section>
    <section class="section rv"><div class="section-head"><h2>Wishlist</h2></div><div class="list" id="wish"><p class="mini-empty">Loading…</p></div></section>
    <section class="section rv"><div class="section-head"><h2>Settings</h2></div><div class="list">
      <div class="row"><span class="row-ic">${icon(theme === 'dark' ? 'moon' : 'sun')}</span><span class="row-main"><b id="theme-lbl">Dark theme</b><small>Easy on the eyes at night</small></span>
        <button class="switch" type="button" role="switch" id="theme-sw" aria-checked="${theme === 'dark'}" aria-labelledby="theme-lbl"></button></div>
      <div id="install-row"></div>
    </div></section>
    <section class="section rv"><div class="section-head"><h2>Help</h2></div><div class="list">
      <a class="row" href="${esc(waLink('Hi Chekd Cars, I need some help with the app.'))}" target="_blank" rel="noopener"><span class="row-ic">${icon('wa')}</span><span class="row-main"><b>WhatsApp support</b><small>+91 90190 88160 · replies in minutes</small></span><span class="row-end">${icon('arrow')}</span></a>
      <a class="row" href="../web-app/privacy.html"><span class="row-ic">${icon('shield')}</span><span class="row-main"><b>Privacy Policy</b></span><span class="row-end">${icon('arrow')}</span></a>
      <a class="row" href="../web-app/terms.html"><span class="row-ic">${icon('doc')}</span><span class="row-main"><b>Terms of use</b></span><span class="row-end">${icon('arrow')}</span></a>
      <a class="row" href="../web-app/"><span class="row-ic">${icon('home')}</span><span class="row-main"><b>Chekd Cars website</b></span><span class="row-end">${icon('arrow')}</span></a>
      <button class="row" type="button" id="clear-data"><span class="row-ic">${icon('close')}</span><span class="row-main"><b>Clear data on this phone</b><small>Removes saved requests, wishlist and details</small></span></button>
    </div></section>
    <p class="ver">Chekd Cars app v1.0.0 · Checked. Trusted. Wow.</p>`;
  },
  async mount(el, _p, ctx) {
    revealOnScroll(el);
    ctx.renderInstall($('#install-row', el), 'row');
    const sw = $('#theme-sw', el);
    sw.addEventListener('click', () => { const dark = sw.getAttribute('aria-checked') !== 'true'; ctx.setTheme(dark ? 'dark' : 'light'); sw.setAttribute('aria-checked', String(dark)); haptic(6); });
    $('#clear-data', el).addEventListener('click', () => {
      const s = sheet(`<p class="muted">This removes your saved requests, wishlist and contact details from this phone. Requests already sent to Chekd are not affected.</p>
        <div class="form-actions" style="display:grid;gap:8px"><button class="btn btn-block" type="button" id="cd-yes">Clear my data</button><button class="btn btn-ghost btn-block" type="button" data-close>Keep it</button></div>`, { title: 'Clear data?' });
      $('#cd-yes', s.body).addEventListener('click', () => { ['requests', 'wish', 'me'].forEach((k) => localStorage.removeItem('chekd.' + k)); s.close(); toast('Cleared'); ctx.updateBadge(); ctx.refresh(); });
    });
    const box = $('#wish', el), ids = store.get('wish', []);
    let list = []; try { list = await loadListings(); } catch (e) { /* offline */ }
    const items = ids.map((id) => list.find((l) => l.id === id)).filter(Boolean);
    box.innerHTML = items.length ? items.map((l) => `<a class="row" href="#/car/${esc(l.id)}"><span class="art wish-art" style="--h:${hueFor(l.id)}">${vehSvg(l.type)}</span><span class="row-main"><b>${esc(l.name)}</b><small>${esc(metaLine(l))}</small></span><span class="price" style="font-size:15px">${esc(lakh(l.price))}</span></a>`).join('')
      : `<p class="mini-empty">Tap the heart on any vehicle to save it here. <a href="#/buy">Browse vehicles</a></p>`;
  },
};
