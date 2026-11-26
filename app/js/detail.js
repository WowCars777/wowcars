// Vehicle detail: shared-element entry, 360° view, ChekdScore, EMI, test-drive booking.
import { $, $$, esc, inr, lakh, num, emi, emiFrom, RATE, store, loadListings, hueFor, fuelOf, metaLine, nextDays, SLOTS, slotOpenToday,
  submitLead, resultHTML, toast, sheet, closeSheet, confetti, fieldError, checkNamePhone, nameValue, phoneValue, validReg, normReg, prettyReg, validPhone, waLink } from './core.js';
import { spring, tween, countUp, stagger, splitText, flip, flipFrom, haptic, reduced } from './motion.js';
import { TOWNS, icon, vehSvg, ringHTML, animateRings, revealOnScroll, wish, heartToggle, flipStore, bindCardFlip, greeting, firstName, dayPickerHTML, slotPickerHTML, bindSlots, nameFields, consent, runSubmit, showResult, skelCard } from './ui.js';
import { Spin360 } from './spin.js';

// ================= DETAIL =================
function breakdown(score) {
  const off = [3, -2, 1, -4, 2, 5];
  return ['Engine', 'Body', 'Interior', 'Tyres', 'Electricals', 'Documents'].map((k, i) => [k, Math.max(60, Math.min(100, score + off[i]))]);
}
export const detail = {
  sub: true,
  title: 'Vehicle · Chekd Cars',
  html: (id) => `<div class="d-wrap" data-id="${esc(id)}">${skelCard()}</div>`,
  async mount(el, id, ctx) {
    let list; try { list = await loadListings(); } catch (e) { list = []; }
    if (!el.isConnected) return;
    const l = list.find((x) => x.id === id);
    const wrap = $('.d-wrap', el);
    if (!l) {
      wrap.innerHTML = `<header class="sub-head"><button class="icon-btn" type="button" data-back aria-label="Back">${icon('back')}</button><h1>Not found</h1></header>
        <div class="empty">${vehSvg('car')}<b>This vehicle has been sold or moved</b>Browse the latest Chekd vehicles instead.<br><a class="btn" style="margin-top:16px" href="#/buy">See all vehicles</a></div>`;
      return;
    }
    document.title = `${l.name} · Chekd Cars`;
    const on = wish.has(l.id), down0 = Math.round((l.price * 0.2) / 5000) * 5000;
    const others = list.filter((x) => x.id !== l.id && x.type === l.type).sort((a, b) => Math.abs(a.price - l.price) - Math.abs(b.price - l.price)).slice(0, 2);
    const specs = [['Year', l.year], ['Kilometres', num(l.km) + ' km'], ['Fuel', l.fuel || '—'], ['City', l.city], ['Type', l.type === 'bike' ? 'Two-wheeler' : 'Car'], ['Chekd Passport', l.passport ? 'Included' : 'On request']];
    wrap.innerHTML = `
      <div class="d-hero">
        <div class="art" style="--h:${hueFor(l.id)}">${vehSvg(l.type)}</div>
        <div class="d-bar"><button class="glass-btn" type="button" data-back aria-label="Back">${icon('back')}</button>
          <div><button class="glass-btn" type="button" id="d-share" aria-label="Share this ${l.type}">${icon('share')}</button>
          <button class="glass-btn" type="button" id="d-heart" aria-pressed="${on}" aria-label="${on ? 'Remove from' : 'Save to'} wishlist">${icon('heart')}</button></div></div>
      </div>
      <div class="d-title">
        <h1><span class="nm">${esc(l.name)}</span></h1>
        <div class="d-meta rv">${[l.year, num(l.km) + ' km', l.fuel, l.city].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('')}</div>
        <div class="d-price rv"><div><span class="price">${esc(inr(l.price))}</span><small>${esc(lakh(l.price))} · EMI from ${esc(inr(emiFrom(l.price)))}/mo</small></div><a href="#" id="d-callback">Request a callback</a></div>
        <div class="badges rv"><div class="badge">${icon('shield')}Chekd Passport</div><div class="badge">${icon('rotate')}7-day money-back</div><div class="badge">${icon('doc')}1-year warranty</div></div>
      </div>
      <section class="panel rv" aria-labelledby="spin-h"><div class="panel-head"><h2 id="spin-h">360° view</h2></div>
        <p class="panel-note">Real photo spin added after inspection.</p><div id="spin"></div></section>
      <section class="panel rv" aria-labelledby="spec-h"><h2 id="spec-h">Key specs</h2>
        <div class="specs">${specs.map(([k, v]) => `<div class="spec"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div></section>
      <section class="panel rv" aria-labelledby="score-h">
        <div class="score-top">${ringHTML(l.score, { big: true })}<div><h2 id="score-h">ChekdScore ${l.score}/100</h2><p class="panel-note">From our 200-point Chekd Check. Sample breakdown; the full signed report comes with your test drive.</p></div></div>
        <div class="bars" id="bars">${breakdown(l.score).map(([k, v], i) => `<div class="bar-row"><span>${k}</span><span class="bar"><i style="--v:${v / 100};--d:${i * 90}ms"></i></span><b>${v}</b></div>`).join('')}</div>
      </section>
      <section class="panel rv" aria-labelledby="emi-h"><h2 id="emi-h">EMI calculator</h2>
        <div class="emi-out" aria-live="polite"><b id="emi-v">${esc(inr(emi(l.price - down0, 60)))}</b><span>per month at ${RATE}% p.a.</span></div>
        <div class="range"><div class="range-top"><label for="emi-down">Down payment</label><output id="emi-down-o" for="emi-down">${esc(inr(down0))}</output></div>
          <input type="range" id="emi-down" min="0" max="${Math.floor((l.price * 0.8) / 5000) * 5000}" step="5000" value="${down0}"></div>
        <div class="range"><div class="range-top"><label for="emi-ten">Tenure</label><output id="emi-ten-o" for="emi-ten">60 months</output></div>
          <input type="range" id="emi-ten" min="12" max="84" step="6" value="60"></div>
        <div class="emi-split"><div><small>Loan amount</small><b id="emi-loan">${esc(inr(l.price - down0))}</b></div><div><small>Total interest</small><b id="emi-int">—</b></div></div>
        <p class="panel-note" style="margin-top:12px">Indicative. Final rate depends on the lender and your credit profile.</p>
      </section>
      <section class="panel rv" aria-labelledby="why-h"><h2 id="why-h">Why buy through Chekd</h2>
        <ul class="why"><li>${icon('check')}<span>Inspected on 200 points by a Chekd Captain before listing.</span></li>
        <li>${icon('check')}<span>Change your mind within 7 days and get your money back.</span></li>
        <li>${icon('check')}<span>1-year engine and gearbox warranty included.</span></li>
        <li>${icon('check')}<span>Service history, insurance and PUC tracked in your Chekd Passport.</span></li></ul></section>
      ${others.length ? `<section class="section rv"><div class="section-head"><h2>Similar Chekd ${l.type === 'bike' ? 'bikes' : 'cars'}</h2></div><div class="list">${others.map((o) => `
        <a class="row" href="#/car/${esc(o.id)}"><span class="art wish-art" style="--h:${hueFor(o.id)}">${vehSvg(o.type)}</span><span class="row-main"><b>${esc(o.name)}</b><small>${esc(metaLine(o))}</small></span><span class="price" style="font-size:15px">${esc(lakh(o.price))}</span></a>`).join('')}</div></section>` : ''}
      <div class="cta-tpl" hidden><a class="btn btn-wa" href="${esc(waLink(`Hi Chekd Cars, I'm interested in the ${l.name} (${lakh(l.price)}, ${l.year}, ${l.city}). Is it available?`))}" target="_blank" rel="noopener" aria-label="Ask about this ${l.type} on WhatsApp" data-ripple>${icon('wa')}</a>
        <button class="btn" type="button" id="d-book" data-ripple>${icon('steer')}Book test drive</button></div>`;

    // sticky CTA lives outside the scrolling view so position:fixed is truly fixed
    const tpl = $('.cta-tpl', wrap), bar = document.createElement('div');
    bar.className = 'cta-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Book or ask about this vehicle'); bar.innerHTML = tpl.innerHTML; tpl.remove(); document.body.appendChild(bar);
    ctx.track({ destroy: () => { bar.style.transition = 'transform 260ms cubic-bezier(.16,1,.3,1)'; bar.style.transform = 'translateY(110%)'; setTimeout(() => bar.remove(), 280); } });

    // shared-element transition from the tapped card
    if (flipStore.id === l.id && flipStore.rect) {
      const art = $('.d-hero .art', wrap), nm = $('.d-title .nm', wrap);
      nm.style.display = 'inline-block';
      flipFrom(art, flipStore.rect, { inner: $('.veh', art) });
      if (flipStore.title) flipFrom(nm, flipStore.title, { uniform: true });
    }
    flipStore.id = null;
    revealOnScroll(el);
    animateRings(wrap);
    const bars = $('#bars', wrap);
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { bars.classList.add('is-in'); io.disconnect(); } }, { root: el, threshold: 0.3 }); io.observe(bars);
    ctx.track(new Spin360($('#spin', wrap), { frames: [], kind: l.type, label: l.name }));

    // EMI with live animated number
    const dEl = $('#emi-down', wrap), tEl = $('#emi-ten', wrap), out = $('#emi-v', wrap);
    let shown = emi(l.price - down0, 60), stopT = () => {};
    const fill = (r) => r.style.setProperty('--p', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
    const upd = () => {
      const D = +dEl.value, N = +tEl.value, P = l.price - D, m = emi(P, N);
      $('#emi-down-o', wrap).textContent = inr(D); $('#emi-ten-o', wrap).textContent = `${N} months (${(N / 12).toFixed(N % 12 ? 1 : 0)} yr)`;
      $('#emi-loan', wrap).textContent = inr(P); $('#emi-int', wrap).textContent = inr(Math.max(0, m * N - P));
      fill(dEl); fill(tEl); stopT();
      const from = shown; stopT = tween({ from, to: m, duration: 380, onUpdate: (v) => { shown = v; out.textContent = inr(v); } });
    };
    dEl.addEventListener('input', upd); tEl.addEventListener('input', upd);
    let lastStep = 0; tEl.addEventListener('input', () => { if (tEl.value !== lastStep) { lastStep = tEl.value; haptic(3); } });
    upd();

    $('#d-heart', wrap).addEventListener('click', (e) => { heartToggle(e.currentTarget, l.id, l.name); ctx.updateBadge(); });
    $('#d-share', wrap).addEventListener('click', async () => {
      const url = location.href, text = `${l.name}, ${lakh(l.price)} on Chekd Cars`;
      try { if (navigator.share) await navigator.share({ title: l.name, text, url }); else { await navigator.clipboard.writeText(url); toast('Link copied'); } } catch (e) { /* share cancelled */ }
    });
    $('#d-book', bar).addEventListener('click', () => { haptic(10); bookSheet(l, 'Test drive'); });
    $('#d-callback', wrap).addEventListener('click', (e) => { e.preventDefault(); bookSheet(l, 'Buy enquiry'); });
  },
};

function bookSheet(l, type) {
  const td = type === 'Test drive';
  const s = sheet(`<form id="bk" novalidate>
      <p class="muted" style="font-size:14px">${esc(l.name)} · ${esc(lakh(l.price))} · ${esc(l.city)}</p>
      ${td ? `<p class="field-label" style="margin-top:16px">Pick a day</p>${dayPickerHTML('bk-day')}
      <p class="field-label" style="margin-top:16px">Pick a time</p>${slotPickerHTML('bk-slot')}
      <div class="field"><label for="bk-area">Where should we bring it?</label><input class="input" id="bk-area" name="area" autocomplete="street-address" placeholder="Area or address, e.g. HSR Layout" required></div>`
      : `<div class="field"><label for="bk-q">What would you like to know? (optional)</label><input class="input" id="bk-q" name="q" placeholder="Loan options, exchange, service history…"></div>`}
      ${nameFields('bk-')}${consent}
      <div class="form-actions"><button class="btn btn-block" type="submit" data-ripple>${td ? 'Confirm test drive' : 'Request callback'}</button></div>
    </form>`, { title: td ? 'Book a test drive' : 'Get a callback' });
  const f = $('#bk', s.body);
  if (td) bindSlots(f, 'bk-day', 'bk-slot');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (td && !fieldError(f.elements.area, f.elements.area.value.trim().length > 2 ? '' : 'Tell us where to bring it.')) { f.elements.area.focus(); return; }
    if (!checkNamePhone(f)) return;
    const day = td ? (f.querySelector('[name="bk-day"]:checked') || {}).value : '', slot = td ? (f.querySelector('[name="bk-slot"]:checked') || {}).value : '';
    if (td && (!day || !slot)) { toast('Pick a day and time', { kind: 'error' }); return; }
    const when = td ? `${day}, ${slot}` : '';
    const res = await runSubmit(f.querySelector('[type=submit]'), () => submitLead({
      type, name: f.elements.name.value.trim(), phone: f.elements.phone.value, car: l.name, area: td ? f.elements.area.value.trim() : '', town: l.city,
      interest: td ? `Test drive · ${when} · ${lakh(l.price)}` : `Callback about ${l.name} (${lakh(l.price)})${f.elements.q.value.trim() ? ' · ' + f.elements.q.value.trim() : ''}`,
    }, td ? `I'd like a test drive of the ${l.name} (${lakh(l.price)}).\nWhen: ${when}\nWhere: ${f.elements.area.value.trim()}` : `please call me about the ${l.name} (${lakh(l.price)}).${f.elements.q.value.trim() ? '\nQuestion: ' + f.elements.q.value.trim() : ''}`));
    showResult(s.body, res, td ? { title: 'Test drive booked', okText: `We'll WhatsApp you to confirm ${when}. Your Chekd Captain brings the car and the full inspection report.` }
      : { title: 'Callback requested', okText: 'A Chekd advisor will call you within 30 minutes during working hours.' });
  });
}

