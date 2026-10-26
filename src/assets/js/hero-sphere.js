// Hero graphic: colour words on a slowly turning 3D sphere, mostly in the "wrong" ink.
// Drag or swipe to spin it; hover a word to see its word/ink clash. Pure canvas, no libraries.
import { INKS } from './stroop-core.js';

const NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RGB = Object.fromEntries(NAMES.map((n) => [n, hexToRgb(INKS[n].hex)]));

export function mountSphere(el) {
  const canvas = el.querySelector('canvas');
  const probe = el.querySelector('.sphere__probe');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 30;
  const golden = Math.PI * (3 - Math.sqrt(5));

  const pts = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const word = NAMES[i % NAMES.length];
    let ink = NAMES[(i * 7 + 3) % NAMES.length];
    if (i % 5 === 0) ink = word; // a few matching words, like a real test
    return { x: Math.cos(golden * i) * r, y, z: Math.sin(golden * i) * r, word, ink, rgb: RGB[ink].slice(), pulse: 0 };
  });

  let W = 0;
  let H = 0;
  let dpr = 1;
  let rotY = 0.4;
  let rotX = -0.25;
  let velY = reduce ? 0 : 0.0035;
  let velX = 0;
  let drag = null;
  let hover = null;
  let tiltX = 0;
  let tiltY = 0;
  let running = true;
  let looping = false;
  let visible = true;
  let last = performance.now();
  let swapAt = last + 1200;

  function resize() {
    const rect = el.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(p) {
    const cy = Math.cos(rotY + tiltY);
    const sy = Math.sin(rotY + tiltY);
    const cx = Math.cos(rotX + tiltX);
    const sx = Math.sin(rotX + tiltX);
    const x1 = p.x * cy - p.z * sy;
    const z1 = p.x * sy + p.z * cy;
    const y1 = p.y * cx - z1 * sx;
    const z2 = p.y * sx + z1 * cx;
    const R = Math.min(W, H) * (W < 480 ? 0.33 : 0.4);
    const f = 2.6;
    const s = f / (f - z2);
    return { sx: W / 2 + x1 * R * s, sy: H / 2 + y1 * R * s, s, z: z2 };
  }

  function frame(now) {
    const dt = Math.min(now - last, 50);
    last = now;
    if (!drag) {
      rotY += velY * (dt / 16);
      rotX += velX * (dt / 16);
      velX *= 0.95;
      if (!reduce) velY += (0.0035 - velY) * 0.02;
      rotX += (-0.25 - rotX) * 0.01;
    }
    // Every so often one word swaps to a new clashing ink, fading between colours.
    if (!reduce && now > swapAt) {
      const p = pts[Math.floor(Math.random() * N)];
      const options = NAMES.filter((n) => n !== p.word && n !== p.ink);
      p.ink = options[Math.floor(Math.random() * options.length)];
      p.pulse = 1;
      swapAt = now + 700 + Math.random() * 900;
    }

    ctx.clearRect(0, 0, W, H);
    // soft globe behind the words
    const R = Math.min(W, H) * 0.36;
    const g = ctx.createRadialGradient(W / 2 - R * 0.3, H / 2 - R * 0.35, R * 0.1, W / 2, H / 2, R * 1.25);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.7, 'rgba(226,240,247,0.55)');
    g.addColorStop(1, 'rgba(226,240,247,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R * 1.25, 0, Math.PI * 2);
    ctx.fill();

    // orbit ring
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.35);
    ctx.scale(1, 0.28);
    ctx.strokeStyle = 'rgba(13,148,136,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 10]);
    ctx.lineDashOffset = -now / 60;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const projected = pts.map((p) => ({ p, ...project(p) })).sort((a, b) => a.z - b.z);
    let best = null;
    for (const q of projected) {
      const p = q.p;
      const target = RGB[p.ink];
      for (let k = 0; k < 3; k++) p.rgb[k] += (target[k] - p.rgb[k]) * 0.08;
      p.pulse *= 0.94;
      const depth = (q.z + 1) / 2; // 0 back, 1 front
      const size = (8 + 17 * depth) * q.s * Math.min(1, Math.max(0.62, W / 540)) * (1 + p.pulse * 0.35) * (p === hover ? 1.25 : 1);
      ctx.globalAlpha = 0.12 + depth * depth * 0.88;
      ctx.font = `800 ${size.toFixed(1)}px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgb(${p.rgb.map((v) => v | 0).join(',')})`;
      if (depth > 0.75) {
        ctx.shadowColor = `rgba(${p.rgb.map((v) => v | 0).join(',')},0.35)`;
        ctx.shadowBlur = 12 * depth;
      } else ctx.shadowBlur = 0;
      ctx.fillText(p.word, q.sx, q.sy);
      if (pointer && depth > 0.55) {
        const d = Math.hypot(pointer.x - q.sx, pointer.y - q.sy);
        if (d < size * 1.6 && (!best || d < best.d)) best = { d, p };
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    setHover(best ? best.p : null);
    if (running && visible) requestAnimationFrame(frame);
    else looping = false;
  }

  let pointer = null;
  function setHover(p) {
    if (p === hover) return;
    hover = p;
    if (!probe) return;
    if (p) {
      probe.innerHTML =
        p.word === p.ink
          ? `Word <b>${p.word}</b> · ink <b>${p.ink.toLowerCase()}</b> · matching`
          : `Word <b>${p.word}</b> · ink <b>${p.ink.toLowerCase()}</b> · clash!`;
      probe.classList.add('is-on');
    } else probe.classList.remove('is-on');
  }

  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  el.addEventListener('pointerdown', (e) => {
    drag = { ...local(e), t: performance.now() };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    pointer = local(e);
    if (drag) {
      const dx = pointer.x - drag.x;
      const dy = pointer.y - drag.y;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      velY = dx * 0.002;
      velX = dy * 0.002;
      drag.x = pointer.x;
      drag.y = pointer.y;
    } else if (e.pointerType === 'mouse') {
      tiltY = ((pointer.x / W) - 0.5) * 0.25;
      tiltX = ((pointer.y / H) - 0.5) * -0.2;
    }
  });
  const end = () => {
    drag = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => {
    pointer = null;
    tiltX = tiltY = 0;
  });
  el.addEventListener('click', () => hover && (hover.pulse = 1));

  const start = () => {
    if (running && visible && !looping) {
      looping = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  };
  // Stop drawing when off-screen, in a hidden tab, or while the timed test is running.
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was) start();
  }).observe(el);
  document.addEventListener('stroop:running', (e) => {
    const was = running;
    running = !e.detail;
    if (running && !was) start();
  });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden && !document.querySelector('.app.is-running');
    start();
  });
  new ResizeObserver(resize).observe(el);
  resize();
  start();
}

const el = document.querySelector('[data-sphere]');
if (el) mountSphere(el);
