// Home and Buy: the screens on the critical path. Others load on demand.
import { $, $$, esc, inr, lakh, num, emi, emiFrom, RATE, store, loadListings, hueFor, fuelOf, metaLine, nextDays, SLOTS, slotOpenToday,
  submitLead, resultHTML, toast, sheet, closeSheet, confetti, fieldError, checkNamePhone, nameValue, phoneValue, validReg, normReg, prettyReg, validPhone, waLink } from './core.js';
import { spring, tween, countUp, stagger, splitText, flip, flipFrom, haptic, reduced } from './motion.js';
import { TOWNS, icon, vehSvg, ringHTML, animateRings, revealOnScroll, wish, heartToggle, flipStore, bindCardFlip, greeting, firstName, dayPickerHTML, slotPickerHTML, bindSlots, nameFields, consent, runSubmit, showResult, skelCard } from './ui.js';

// ================= HOME =================
export const home = {
  title: 'Chekd Cars',
  html: () => `
    <div class="hello rv"><p>${greeting()}${firstName() ? ', ' + esc(firstName()) : ''}</p><span class="live-pill"><i class="live-dot"></i>Live in Bengaluru</span></div>
    <h1 class="hero-h kinetic" id="home-h">Every car, checked. Every rupee, trusted.</h1>
    <p class="lead-p rv">Buy, sell and service pre-owned cars and bikes. Every one passes a 200-point Chekd Check first.</p>
    <div class="quick" role="list">
      <a class="qa rv" role="listitem" href="#/buy" data-ripple><span class="qa-ic">${icon('search')}</span><span><b>Buy</b><small>Chekd cars &amp; bikes</small></span></a>
      <a class="qa rv" role="listitem" href="#/sell" data-ripple><span class="qa-ic">${icon('tag')}</span><span><b>Sell in 30 min</b><small>Offer on WhatsApp</small></span></a>
      <a class="qa rv" role="listitem" href="#/doorstep" data-ripple><span class="qa-ic">${icon('door')}</span><span><b>Doorstep</b><small>We come to you</small></span></a>
      <a class="qa rv" role="listitem" href="#/passport" data-ripple><span class="qa-ic">${icon('shield')}</span><span><b>Passport</b><small>Your car's full record</small></span></a>
    </div>
    <div id="install-slot"></div>
    <section class="section" aria-labelledby="picks-h">
      <div class="section-head"><h2 id="picks-h">Chekd picks</h2><a href="#/buy">See all</a></div>
      <div class="carousel" id="picks" tabindex="0" aria-label="Chekd picks, scroll sideways">${'<div class="pick skel" style="height:236px"></div>'.repeat(3)}</div>
    </section>
    <a class="promo rv" href="#/sell" data-ripple>
      <picture><source srcset="img/hero.webp" type="image/webp"><img src="img/hero.jpg" alt="" loading="lazy" decoding="async" width="1080" height="603"></picture>
      <div class="promo-body"><span class="eyebrow" style="color:#3fd0c2">Sell with Chekd</span><h3>Get an offer in 30 minutes.</h3><p>Free inspection at your door. Money in your account the same day.</p><span class="promo-cta">Start selling ${icon('arrow')}</span></div>
    </a>
    <section class="section" aria-labelledby="promise-h">
      <div class="section-head"><h2 id="promise-h">The Chekd promise</h2></div>
      <div class="stats" id="stats">
        <div class="stat rv"><b><span data-to="200">0</span></b><span>point Chekd Check</span></div>
        <div class="stat rv"><b><span data-to="7">0</span><sup>day</sup></b><span>money-back, no questions</span></div>
        <div class="stat rv"><b><span data-to="1">0</span><sup>yr</sup></b><span>engine &amp; gearbox warranty</span></div>
      </div>
    </section>
    <section class="section" aria-labelledby="door-h">
      <a class="feature rv" href="#/doorstep" data-ripple>
        <picture><source srcset="img/doorstep.webp" type="image/webp"><img src="img/doorstep.jpg" alt="A Chekd Captain handing over car keys at a customer's gate" loading="lazy" decoding="async" width="1080" height="315"></picture>
        <div class="feature-body"><span class="eyebrow">Doorstep</span><h3 id="door-h">Test drives, service and help, at your gate.</h3><p>Pick a slot. A Chekd Captain arrives on time, from ₹299 for on-demand help.</p></div>
      </a>
    </section>
    <div class="marquee" aria-label="Towns: live in Bengaluru. Coming soon to Hubballi, Dharwad, Belagavi, Mysuru and Mangaluru.">
      <div class="marquee-track">${[0, 1].map((k) => `<div style="display:flex"${k ? ' aria-hidden="true"' : ''}>${TOWNS.map((t) => `<span class="marquee-item${t.live ? ' live' : ''}">${t.name}<small>${t.live ? 'Live' : 'Soon'}</small></span>`).join('')}</div>`).join('')}</div>
    </div>
    <p class="foot-tag">Checked. Trusted. <b>Wow.</b></p>`,
  async mount(el, _p, ctx) {
    splitText($('#home-h', el), { letters: false });
    // colour the key words after splitting
    $$('#home-h .sw', el).forEach((w) => { if (/checked/i.test(w.textContent)) w.classList.add('red'); if (/trusted/i.test(w.textContent)) w.classList.add('teal'); });
    revealOnScroll(el);
    ctx.renderInstall($('#install-slot', el));
    // stats count up once visible
    const st = $('#stats', el);
    const io = new IntersectionObserver((e) => { if (!e[0].isIntersecting) return; io.disconnect(); $$('[data-to]', st).forEach((s, i) => setTimeout(() => countUp(s, +s.dataset.to, { duration: 1200 }), i * 120)); }, { root: el, threshold: 0.4 });
    io.observe(st);
    // promo parallax
    const promoImg = $('.promo img', el), car = $('#picks', el);
    let ticking = false;
    const onScroll = () => {
      if (ticking || reduced()) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const r = promoImg.parentElement.parentElement.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        promoImg.style.transform = `translate3d(0,${(p * -40).toFixed(1)}px,0)`;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    bindCardFlip(el);
    try {
      const list = await loadListings();
      const picks = [...list].sort((a, b) => b.score - a.score).slice(0, 5);
      car.innerHTML = picks.map((l) => `
        <a class="pick" href="#/car/${esc(l.id)}" data-car="${esc(l.id)}" aria-label="${esc(l.name)}, ${esc(lakh(l.price))}, ChekdScore ${l.score}">
          <div class="art" style="--h:${hueFor(l.id)}">${vehSvg(l.type)}${l.passport ? `<span class="art-tag">${icon('shield')}Passport</span>` : ''}${ringHTML(l.score)}</div>
          <div class="pick-body"><h3><span class="nm">${esc(l.name)}</span></h3><p class="small-meta">${esc(metaLine(l))}</p>
          <div class="pick-row"><span class="price">${esc(lakh(l.price))}</span><span class="small-meta">EMI ${esc(inr(emiFrom(l.price)))}/mo</span></div></div></a>`).join('');
      animateRings(car);
      // parallax art inside the snapping carousel
      const arts = $$('.veh', car); let tk = false;
      const par = () => {
        if (tk || reduced()) return; tk = true;
        requestAnimationFrame(() => {
          tk = false; const cw = car.clientWidth;
          arts.forEach((a) => { const r = a.parentElement.getBoundingClientRect(); const off = (r.left + r.width / 2 - cw / 2) / cw; a.style.transform = `translate3d(${(off * -36).toFixed(1)}px,0,0)`; });
        });
      };
      car.addEventListener('scroll', par, { passive: true }); par();
    } catch (e) { car.innerHTML = `<p class="muted">Couldn't load picks. Pull down on Buy to try again.</p>`; }
  },
};

// ================= BUY =================
export const buyState = { q: '', type: '', price: '', fuel: '', city: '', sort: 'rec', scroll: 0, loaded: false };
const SORTS = [['rec', 'Recommended'], ['score', 'Highest ChekdScore'], ['plh', 'Price: low to high'], ['phl', 'Price: high to low'], ['new', 'Newest first'], ['km', 'Lowest kilometres']];
const PRICE = { u5: [0, 5e5], '5to10': [5e5, 1e6], o10: [1e6, Infinity] };
const chip = (g, v, label) => `<button class="chip" type="button" data-g="${g}" data-v="${v}" aria-pressed="${buyState[g] === v}">${label}</button>`;
function cardHTML(l) {
  const on = wish.has(l.id);
  return `<article class="card" data-id="${esc(l.id)}">
    <a class="card-link" href="#/car/${esc(l.id)}" data-car="${esc(l.id)}" aria-label="${esc(l.name)}, ${esc(lakh(l.price))}">
      <div class="art" style="--h:${hueFor(l.id)}">${vehSvg(l.type)}${l.passport ? `<span class="art-tag">${icon('shield')}Chekd Passport</span>` : ''}${ringHTML(l.score)}</div>
      <div class="card-body"><h3><span class="nm">${esc(l.name)}</span></h3><p class="small-meta">${esc(metaLine(l))}</p>
        <div class="card-foot"><span class="price">${esc(lakh(l.price))}</span><span class="emi-note">EMI from<br><b>${esc(inr(emiFrom(l.price)))}</b>/mo</span></div></div>
    </a>
    <button class="heart" type="button" data-heart="${esc(l.id)}" aria-pressed="${on}" aria-label="${on ? 'Remove' : 'Save'} ${esc(l.name)} ${on ? 'from' : 'to'} wishlist">${icon('heart')}</button>
  </article>`;
}
function applyFilters(list) {
  const s = buyState, q = s.q.trim().toLowerCase();
  let out = list.filter((l) => (!s.type || l.type === s.type)
    && (!s.price || (l.price >= PRICE[s.price][0] && l.price < PRICE[s.price][1]))
    && (!s.fuel || fuelOf(l).toLowerCase().startsWith(s.fuel.toLowerCase()))
    && (!s.city || l.city === s.city)
    && (!q || `${l.name} ${l.city} ${l.fuel} ${l.year} ${l.type === 'bike' ? 'bike motorcycle scooter' : 'car'}`.toLowerCase().includes(q)));
  const by = { rec: (a, b) => b.score * 1e7 - a.score * 1e7 + (a.km - b.km), score: (a, b) => b.score - a.score, plh: (a, b) => a.price - b.price, phl: (a, b) => b.price - a.price, new: (a, b) => b.year - a.year, km: (a, b) => a.km - b.km }[s.sort];
  return out.sort(by);
}
export const buy = {
  title: 'Buy · Chekd Cars',
  html: () => `
    <div class="ptr" aria-hidden="true"><svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" stroke-dasharray="48 100" pathLength="63"/></svg></div>
    <div class="ptr-content">
    <span class="eyebrow rv">Every vehicle Chekd</span>
    <h1 class="page-title rv">Find your next <em>ride</em>.</h1>
    <label class="search rv">${icon('search')}<span class="vh">Search vehicles</span><input class="input" id="buy-q" type="search" placeholder="Search Swift, Creta, Ather…" autocomplete="off" enterkeyhint="search" value="${esc(buyState.q)}"></label>
    <div class="filters rv">
      <div class="chips" role="group" aria-label="Type and price">${chip('type', 'car', 'Cars')}${chip('type', 'bike', 'Bikes')}<span class="chip-sep"></span>${chip('price', 'u5', 'Under ₹5 L')}${chip('price', '5to10', '₹5–10 L')}${chip('price', 'o10', 'Above ₹10 L')}</div>
      <div class="chips" role="group" aria-label="Fuel and city">${chip('fuel', 'Petrol', 'Petrol')}${chip('fuel', 'Diesel', 'Diesel')}${chip('fuel', 'EV', 'Electric')}<span class="chip-sep"></span>${['Bengaluru', 'Hubballi', 'Mysuru', 'Belagavi'].map((c) => chip('city', c, c)).join('')}</div>
    </div>
    <div class="buy-tools"><p class="count" id="buy-count" aria-live="polite">Loading…</p><button class="sort-btn" type="button" id="sort-btn" aria-haspopup="dialog">${icon('sort')}<span>${SORTS.find((s) => s[0] === buyState.sort)[1]}</span></button></div>
    <div class="grid" id="grid">${buyState.loaded ? '' : skelCard().repeat(3)}</div>
    </div>`,
  async mount(el, _p, ctx) {
    revealOnScroll(el);
    bindCardFlip(el);
    const grid = $('#grid', el), count = $('#buy-count', el);
    let list = [], nodes = new Map();
    const render = (animate) => {
      const shown = applyFilters(list);
      const ids = new Set(shown.map((l) => l.id));
      const doIt = () => {
        shown.forEach((l) => {
          let n = nodes.get(l.id);
          if (!n) { const t = document.createElement('div'); t.innerHTML = cardHTML(l); n = t.firstElementChild; nodes.set(l.id, n); n.classList.add('is-enter'); }
          else if (n.classList.contains('is-hidden')) { n.classList.remove('is-hidden'); n.classList.remove('is-enter'); void n.offsetWidth; n.classList.add('is-enter'); }
          grid.appendChild(n); // re-append in sorted order
        });
        nodes.forEach((n, id) => { if (!ids.has(id)) n.classList.add('is-hidden'); });
        let empty = $('.empty', grid);
        if (!shown.length) { if (!empty) grid.insertAdjacentHTML('beforeend', `<div class="empty">${vehSvg('car')}<b>No matches yet</b>Try fewer filters. New Chekd cars arrive every week.<br><button class="btn btn-ghost" type="button" id="clear-f" style="margin-top:16px">Clear filters</button></div>`); }
        else if (empty) empty.remove();
      };
      const visible = () => [...nodes.values()].filter((n) => !n.classList.contains('is-hidden'));
      if (animate) flip(visible, doIt); else doIt();
      animateRings(grid);
      count.textContent = `${shown.length} Chekd ${shown.length === 1 ? 'vehicle' : 'vehicles'}`;
    };
    const load = async (fresh) => {
      const t0 = performance.now();
      try {
        list = await loadListings(fresh);
        const wait = buyState.loaded && !fresh ? 0 : Math.max(0, 450 - (performance.now() - t0));
        await new Promise((r) => setTimeout(r, wait));
        if (!el.isConnected) return;
        if (!buyState.loaded || fresh) { grid.innerHTML = ''; nodes = new Map(); }
        buyState.loaded = true; render(false);
      } catch (e) {
        grid.innerHTML = `<div class="empty"><b>You're offline</b>We couldn't load listings. Pull down to try again.</div>`; count.textContent = '';
      }
    };
    await load(false);
    if (buyState.scroll) el.scrollTop = buyState.scroll;
    el.addEventListener('scroll', () => { buyState.scroll = el.scrollTop; }, { passive: true });

    // search (debounced)
    let tm; $('#buy-q', el).addEventListener('input', (e) => { clearTimeout(tm); tm = setTimeout(() => { buyState.q = e.target.value; render(true); }, 160); });
    // chips
    el.addEventListener('click', (e) => {
      const c = e.target.closest('.chip[data-g]');
      if (c) {
        const g = c.dataset.g, v = c.dataset.v; buyState[g] = buyState[g] === v ? '' : v; haptic(5);
        $$(`.chip[data-g="${g}"]`, el).forEach((x) => x.setAttribute('aria-pressed', String(buyState[g] === x.dataset.v)));
        render(true); return;
      }
      if (e.target.closest('#clear-f')) { Object.assign(buyState, { q: '', type: '', price: '', fuel: '', city: '' }); $('#buy-q', el).value = ''; $$('.chip[data-g]', el).forEach((x) => x.setAttribute('aria-pressed', 'false')); render(true); return; }
      const h = e.target.closest('[data-heart]');
      if (h) { e.preventDefault(); const l = list.find((x) => x.id === h.dataset.heart); heartToggle(h, h.dataset.heart, l ? l.name : 'vehicle'); ctx.updateBadge(); }
    });
    // sort sheet
    $('#sort-btn', el).addEventListener('click', () => {
      haptic(6);
      const s = sheet(`<div class="sort-list" role="radiogroup" aria-label="Sort by">${SORTS.map(([k, label]) => `<button class="sort-opt" type="button" role="radio" aria-checked="${buyState.sort === k}" data-sort="${k}">${label}${icon('check')}</button>`).join('')}</div>`, { title: 'Sort by' });
      s.body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-sort]'); if (!b) return;
        buyState.sort = b.dataset.sort; $$('[data-sort]', s.body).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        $('#sort-btn span', el).textContent = SORTS.find((x) => x[0] === buyState.sort)[1]; haptic(6);
        setTimeout(() => { s.close(); render(true); }, 160);
      });
    });
    // pull to refresh
    const ptr = $('.ptr', el), content = $('.ptr-content', el), arc = $('.ptr circle', el);
    let y0 = null, dy = 0, busy = false;
    const paint = (d) => {
      const p = Math.min(1, d / 80);
      ptr.style.opacity = String(p); ptr.style.transform = `translateY(${-60 + d * 0.9}px) rotate(${d * 3}deg)`;
      arc.setAttribute('stroke-dasharray', `${(p * 48).toFixed(1)} 100`);
      content.style.transform = d ? `translateY(${d * 0.45}px)` : '';
    };
    el.addEventListener('touchstart', (e) => { if (el.scrollTop <= 0 && !busy) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (y0 == null) return; const d = e.touches[0].clientY - y0;
      if (d <= 0 || el.scrollTop > 0) { if (dy) paint(0); dy = 0; return; }
      dy = Math.min(140, d * 0.6); paint(dy);
      if (dy >= 80 && !ptr.dataset.ready) { ptr.dataset.ready = '1'; haptic(10); }
    }, { passive: true });
    el.addEventListener('touchend', async () => {
      if (y0 == null) return; y0 = null; delete ptr.dataset.ready;
      if (dy >= 80) {
        busy = true; ptr.classList.add('is-spin');
        spring({ from: dy, to: 64, stiffness: 300, damping: 26, onUpdate: paint });
        grid.innerHTML = skelCard().repeat(3); nodes = new Map();
        await load(true);
        ptr.classList.remove('is-spin'); toast('Listings up to date');
        spring({ from: 64, to: 0, stiffness: 300, damping: 28, onUpdate: paint, onComplete: () => { busy = false; paint(0); } });
      } else if (dy) spring({ from: dy, to: 0, stiffness: 400, damping: 30, onUpdate: paint });
      dy = 0;
    }, { passive: true });
  },
};

