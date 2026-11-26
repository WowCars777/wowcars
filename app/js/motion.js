// Chekd motion kit: springs, stagger, count-up, split-text, FLIP, haptics.
// Everything animates transform/opacity only and runs on requestAnimationFrame.

const mq = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => mq.matches;

/** Damped spring from `from` to `to`. Returns a stop() function. */
export function spring({ from = 0, to = 1, stiffness = 260, damping = 26, mass = 1, velocity = 0, onUpdate, onComplete, precision = 0.001 }) {
  if (reduced()) { onUpdate && onUpdate(to, 1); onComplete && onComplete(); return () => {}; }
  let x = from, v = velocity, raf = 0, last = performance.now(), done = false;
  const range = Math.abs(to - from) || 1;
  const step = (now) => {
    let dt = Math.min(0.064, (now - last) / 1000); last = now;
    // sub-step for stability on slow frames
    const n = Math.ceil(dt / 0.008); dt /= n;
    for (let i = 0; i < n; i++) {
      const f = -stiffness * (x - to) - damping * v;
      v += (f / mass) * dt; x += v * dt;
    }
    const settled = Math.abs(v) < precision * range * 10 && Math.abs(x - to) < precision * range;
    if (settled) x = to;
    onUpdate && onUpdate(x, (x - from) / ((to - from) || 1));
    if (settled) { done = true; onComplete && onComplete(); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { if (!done) cancelAnimationFrame(raf); done = true; };
}

/** Time-based tween with an easing curve. */
export const easeOut = (t) => 1 - Math.pow(1 - t, 4);
export function tween({ from = 0, to = 1, duration = 600, ease = easeOut, onUpdate, onComplete }) {
  if (reduced()) duration = Math.min(duration, 120);
  const t0 = performance.now(); let raf;
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    onUpdate(from + (to - from) * ease(t));
    if (t < 1) raf = requestAnimationFrame(step); else onComplete && onComplete();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Count a number up inside an element, formatting each frame. */
export function countUp(el, to, { duration = 1100, format = (n) => Math.round(n).toLocaleString('en-IN'), from = 0 } = {}) {
  return tween({ from, to, duration, onUpdate: (n) => { el.textContent = format(n); } });
}

/** Stagger children in: sets --i for CSS-driven delays and toggles .is-in. */
export function stagger(nodes, { step = 45, start = 0, cls = 'is-in' } = {}) {
  [...nodes].forEach((n, i) => {
    n.style.setProperty('--d', `${start + i * (reduced() ? 0 : step)}ms`);
    requestAnimationFrame(() => requestAnimationFrame(() => n.classList.add(cls)));
  });
}

/** Split an element's text into word (and optional letter) spans for kinetic reveals. */
export function splitText(el, { letters = false } = {}) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  let i = 0;
  text.split(/\s+/).forEach((word, wi, arr) => {
    const w = document.createElement('span');
    w.className = 'sw'; w.setAttribute('aria-hidden', 'true');
    if (letters) {
      for (const ch of word) {
        const c = document.createElement('span'); c.className = 'sl'; c.textContent = ch;
        c.style.setProperty('--i', i++); w.appendChild(c);
      }
    } else { w.textContent = word; w.style.setProperty('--i', i++); }
    el.appendChild(w);
    if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
  });
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-split-in')));
  return el;
}

/** FLIP: measure → mutate → invert → play with a spring. keyFn maps node→key. */
export function flip(nodes, mutate, { stiffness = 320, damping = 30 } = {}) {
  const first = new Map();
  nodes().forEach((n) => first.set(n, n.getBoundingClientRect()));
  mutate();
  if (reduced()) return;
  nodes().forEach((n) => {
    const a = first.get(n); if (!a) return;
    const b = n.getBoundingClientRect();
    if (!b.width) return;
    const dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    n.style.transform = `translate(${dx}px,${dy}px)`;
    spring({ from: 1, to: 0, stiffness, damping, onUpdate: (p) => { n.style.transform = `translate(${dx * p}px,${dy * p}px)`; }, onComplete: () => { n.style.transform = ''; } });
  });
}

/** Animate an element from a stored rect into its current box (shared-element transition).
 *  opts.uniform keeps the aspect (text); opts.inner gets a counter-scale so art isn't squashed. */
export function flipFrom(el, rect, opts = {}) {
  if (!el || !rect || reduced()) return;
  const b = el.getBoundingClientRect();
  if (!b.width || !b.height) return;
  let sx = rect.width / b.width, sy = rect.height / b.height;
  if (opts.uniform) sy = sx;
  const dx = rect.left - b.left, dy = rect.top - b.top, inner = opts.inner;
  el.style.transformOrigin = '0 0'; el.style.willChange = 'transform';
  const set = (p) => {
    const ax = 1 + (sx - 1) * p, ay = 1 + (sy - 1) * p;
    el.style.transform = `translate(${dx * p}px,${dy * p}px) scale(${ax},${ay})`;
    if (inner) inner.style.transform = `scale(1,${(ax / ay).toFixed(4)})`;
  };
  set(1);
  spring({ from: 1, to: 0, stiffness: opts.stiffness || 210, damping: opts.damping || 25, onUpdate: set,
    onComplete: () => { el.style.transform = ''; el.style.willChange = ''; el.style.transformOrigin = ''; if (inner) inner.style.transform = ''; } });
}

export function haptic(ms = 8) { try { if (navigator.vibrate && !reduced()) navigator.vibrate(ms); } catch (e) { /* unsupported */ } }

/** Material-ish ripple on pointerdown for any [data-ripple] element. */
export function installRipple(root = document) {
  root.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('[data-ripple]');
    if (!t || reduced()) return;
    const r = t.getBoundingClientRect();
    const s = Math.max(r.width, r.height) * 2;
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    t.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }, { passive: true });
}
