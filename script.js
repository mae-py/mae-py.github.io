// script.js
// tiny typewriter + reveal effect (respects prefers-reduced-motion)
// + hyperspeed starfield (canvas) appended
document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('card');
  // reveal card
  requestAnimationFrame(() => card.classList.add('is-loaded'));

  // set updated time
  const updatedEl = document.getElementById('updated');
  if (updatedEl) updatedEl.textContent = new Date().toLocaleDateString();

  // typed words now target #lead-line (exists in your HTML)
  const leadEl = document.getElementById('lead-line');

  // personal / bio-style phrases (edit as you like)
  const phrases = [
    'they / them',
    'music nerd',
    'cozy vr explorer',
    'playlist hoarder',
    'soft-level designer'
  ];

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (leadEl && !prefersReduced) {
    // typewriter implementation that pauses when tab is hidden
    let idx = 0;
    const TYPING_SPEED = 60;   // ms per char
    const DELETING_SPEED = 30; // ms per char
    const PAUSE = 1400;        // pause after full phrase

    async function waitForUnhide() {
      if (!document.hidden) return;
      await new Promise(resolve => {
        const onVis = () => {
          if (!document.hidden) {
            document.removeEventListener('visibilitychange', onVis);
            resolve();
          }
        };
        document.addEventListener('visibilitychange', onVis);
      });
    }

    async function typePhrase(phrase) {
      let i = 0;
      while (i <= phrase.length) {
        if (document.hidden) await waitForUnhide();
        leadEl.textContent = phrase.slice(0, i);
        i++;
        await new Promise(r => setTimeout(r, TYPING_SPEED));
      }
      await new Promise(r => setTimeout(r, PAUSE));
    }

    async function deletePhrase(phrase) {
      let i = phrase.length;
      while (i >= 0) {
        if (document.hidden) await waitForUnhide();
        leadEl.textContent = phrase.slice(0, i);
        i--;
        await new Promise(r => setTimeout(r, DELETING_SPEED));
      }
      await new Promise(r => setTimeout(r, 120));
    }

    (async function loop() {
      while (true) {
        const phrase = phrases[idx % phrases.length];
        await typePhrase(phrase);
        await deletePhrase(phrase);
        idx++;
      }
    })();
  } else if (leadEl) {
    // reduced motion or no animation preference: show first phrase statically
    leadEl.textContent = phrases[0];
  }
});

// ------------------------------
// hyperspeed starfield - vanilla canvas, efficient and pause-aware
// appended as an IIFE so it runs alongside the rest of your script
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, cx = 0, cy = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const MAX_Z = 1000;
  let stars = [];
  let starCount = window.innerWidth > 900 ? 380 : 120; // adjust for perf
  let last = performance.now();
  let speed = 420; // visual speed; tweak lower if you want calmer
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.floor(window.innerWidth));
    h = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;

    // lower star count for very small viewports
    starCount = w > 1200 ? 480 : (w > 900 ? 380 : (w > 600 ? 220 : 120));
    initStars();
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() * 2 - 1) * w,
        y: (Math.random() * 2 - 1) * h,
        z: Math.random() * MAX_Z + 1,
        pz: null
      });
    }
  }

  // pause when hidden — polite and saves CPU
  let isHidden = document.hidden;
  document.addEventListener('visibilitychange', () => { isHidden = document.hidden; });

  function draw(now) {
    if (reduced) { // if user prefers reduced motion, keep background static subtle
      ctx.clearRect(0, 0, w, h);
      // subtle static stars (single frame)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < Math.min(80, starCount); i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillRect(x, y, 1, 1);
      }
      return requestAnimationFrame(draw);
    }

    if (isHidden) {
      last = now;
      return requestAnimationFrame(draw); // keep loop but skip heavy work
    }

    const dt = Math.min(50, now - last) / 1000; // cap dt for frame spikes
    last = now;

    // gentle fade for trails
    ctx.fillStyle = 'rgba(6,10,18,0.22)'; // slightly darken each frame
    ctx.fillRect(0, 0, w, h);

    // draw stars
    const perspective = (w * 0.6);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= speed * dt;
      if (s.z <= 1) {
        s.x = (Math.random() * 2 - 1) * w;
        s.y = (Math.random() * 2 - 1) * h;
        s.z = MAX_Z;
        s.pz = null;
      }

      const sx = (s.x / s.z) * perspective + cx;
      const sy = (s.y / s.z) * perspective + cy;
      const r = Math.max(0.3, (1 - s.z / MAX_Z) * 3.8);
      const alpha = Math.min(1, (1 - s.z / MAX_Z) * 1.1);

      // draw streak from previous projected pos to current — gives hyperspeed streaks
      if (s.pz) {
        const px = (s.x / s.pz) * perspective + cx;
        const py = (s.y / s.pz) * perspective + cy;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(247,198,217,${alpha * 0.28})`; // soft pink streak
        ctx.lineWidth = Math.max(1, r);
        ctx.stroke();
      }

      // star core
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      s.pz = s.z;
    }

    requestAnimationFrame(draw);
  }

  // init
  resize();
  window.addEventListener('resize', () => {
    // debounce resize a bit
    clearTimeout(window._hb_resize);
    window._hb_resize = setTimeout(resize, 120);
  });

  // start loop after a frame to let layout settle
  requestAnimationFrame((t) => { last = t; requestAnimationFrame(draw); });
})();
