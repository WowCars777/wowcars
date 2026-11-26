// Spin360: drag/swipe to rotate with inertia.
// Generic: pass `frames` (image URLs, evenly spaced around 360°) for a real photo spin.
// Without frames it drives a CSS 3D turntable of the vehicle line art.
import { spring, reduced, haptic } from './motion.js';

export class Spin360 {
  constructor(root, { frames = [], kind = 'car', label = 'vehicle' } = {}) {
    this.root = root; this.frames = frames; this.angle = 0; this.v = 0; this.raf = 0;
    root.classList.add('spin');
    root.tabIndex = 0;
    root.setAttribute('role', 'slider');
    root.setAttribute('aria-label', `360° view of ${label}. Drag or use arrow keys to rotate.`);
    root.setAttribute('aria-valuemin', '0'); root.setAttribute('aria-valuemax', '359'); root.setAttribute('aria-valuenow', '0');
    root.setAttribute('aria-valuetext', '0 degrees');
    if (frames.length) {
      root.innerHTML = `<img class="spin-frames" alt="" draggable="false" decoding="async" src="${frames[0]}">`;
      this.img = root.firstElementChild;
      frames.forEach((f) => { const i = new Image(); i.src = f; }); // warm the cache
    } else {
      const side = kind === 'bike' ? 'v-bike' : 'v-car', front = kind === 'bike' ? 'v-bike-front' : 'v-car-front';
      root.innerHTML = `<div class="spin-floor"></div><div class="spin-shadow"></div>
        <div class="spin-stage">
          <div class="spin-face spin-side"><svg viewBox="0 0 120 56"><use href="#${side}"/></svg></div>
          <div class="spin-face spin-front ${kind === 'bike' ? 'is-bike' : ''}"><svg viewBox="0 0 64 56"><use href="#${front}"/></svg></div>
        </div>`;
      this.stage = root.querySelector('.spin-stage');
    }
    root.insertAdjacentHTML('beforeend', `<span class="spin-hint">Drag to rotate</span>
      <div class="spin-hud"><span><svg class="i"><use href="#i-rotate"/></svg>360° view</span><span class="spin-deg">0°</span></div>`);
    this.deg = root.querySelector('.spin-deg');
    this.bind();
    this.paint();
    if (!reduced()) setTimeout(() => this.nudge(), 500);
  }
  paint() {
    const a = this.angle, norm = ((Math.round(a) % 360) + 360) % 360;
    if (this.stage) {
      this.stage.style.transform = `rotateX(-10deg) rotateY(${a}deg)`;
      this.root.style.setProperty('--a', `${-a}deg`);
      this.root.style.setProperty('--sx', (0.5 + 0.5 * Math.abs(Math.cos((a * Math.PI) / 180))).toFixed(3));
    } else if (this.img) {
      const n = this.frames.length, idx = ((Math.round((a / 360) * n) % n) + n) % n;
      if (this.idx !== idx) { this.idx = idx; this.img.src = this.frames[idx]; }
    }
    if (this.deg.textContent !== norm + '°') {
      this.deg.textContent = norm + '°';
      this.root.setAttribute('aria-valuenow', String(norm)); this.root.setAttribute('aria-valuetext', `${norm} degrees`);
    }
  }
  nudge() { // a little hint wobble so people know it moves
    if (this.touched) return;
    spring({ from: 0, to: 1, stiffness: 60, damping: 7, onUpdate: (p) => { if (!this.touched) { this.angle = Math.sin(p * Math.PI) * -28; this.paint(); } } });
  }
  bind() {
    const r = this.root; let x0 = 0, lastX = 0, lastT = 0, down = false;
    r.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      down = true; this.touched = true; x0 = lastX = e.clientX; lastT = performance.now(); this.v = 0;
      cancelAnimationFrame(this.raf); r.setPointerCapture(e.pointerId);
    });
    r.addEventListener('pointermove', (e) => {
      if (!down) return;
      const now = performance.now(), dx = e.clientX - lastX, dt = Math.max(1, now - lastT);
      this.v = this.v * 0.6 + (dx * 0.55 / dt) * 0.4; // deg per ms, smoothed
      this.angle += dx * 0.55; lastX = e.clientX; lastT = now;
      if (Math.abs(e.clientX - x0) > 8) r.classList.add('was-dragged');
      this.paint();
    });
    const up = () => {
      if (!down) return; down = false;
      if (performance.now() - lastT > 80) this.v = 0;
      this.coast();
    };
    r.addEventListener('pointerup', up); r.addEventListener('pointercancel', up);
    r.addEventListener('keydown', (e) => {
      const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!k) return; e.preventDefault(); this.touched = true; haptic(4);
      const from = this.angle; spring({ from, to: from + k * 30, stiffness: 200, damping: 22, onUpdate: (a) => { this.angle = a; this.paint(); } });
    });
  }
  coast() {
    if (reduced()) { this.v = 0; return; }
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(48, now - last); last = now;
      this.angle += this.v * dt; this.v *= Math.pow(0.9955, dt); // ~0.93 per 16ms frame
      this.paint();
      if (Math.abs(this.v) > 0.004) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  destroy() { cancelAnimationFrame(this.raf); }
}
