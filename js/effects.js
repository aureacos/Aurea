/* ═══════════════════════════════════════════════════════════════
   MAISON AURÉA — EFFECTS ENGINE
   Parallax · Particles · Smooth Scroll · Magnetic · Tilt · Lenis
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── SMOOTH SCROLL (Lenis-style) ───────────────────────────────────
const SmoothScroll = (() => {
  let current = 0, target = 0, ease = 0.09, raf;
  let enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const init = () => {
    if (!enabled || 'ontouchstart' in window) return; // skip on mobile/reduced motion
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const scroller = document.createElement('div');
    scroller.id = 'smooth-scroller';
    scroller.style.cssText = 'position:fixed;top:0;left:0;width:100%;will-change:transform;';
    while (document.body.firstChild) scroller.appendChild(document.body.firstChild);
    document.body.appendChild(scroller);

    const setHeight = () => {
      document.body.style.height = scroller.scrollHeight + 'px';
    };
    setHeight();
    new ResizeObserver(setHeight).observe(scroller);

    window.addEventListener('scroll', () => { target = window.scrollY; }, { passive: true });

    const tick = () => {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.1) current = target;
      scroller.style.transform = `translateY(${-current}px)`;

      // update scroll progress bar
      const bar = document.getElementById('scroll-progress');
      if (bar) {
        const h = document.documentElement;
        const pct = (target / (document.body.scrollHeight - window.innerHeight)) * 100;
        bar.style.width = Math.min(pct, 100) + '%';
      }

      raf = requestAnimationFrame(tick);
    };
    tick();
  };

  const scrollTo = (y, duration = 800) => {
    const start = window.scrollY;
    const diff  = y - start;
    let startTime;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      window.scrollTo(0, start + diff * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return { init, scrollTo };
})();

// ── PARTICLE SYSTEM ───────────────────────────────────────────────
const Particles = (() => {
  let canvas, ctx, particles = [], raf;

  const CONFIG = {
    count: 28,
    color: 'rgba(196,160,96,',
    minSize: 0.6,
    maxSize: 2.2,
    minSpeed: 0.12,
    maxSpeed: 0.38,
    minOpacity: 0.06,
    maxOpacity: 0.22,
  };

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * canvas.width;
      this.y  = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed;
      this.vy = -Math.random() * CONFIG.maxSpeed - CONFIG.minSpeed;
      this.r  = Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize;
      this.op = Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity) + CONFIG.minOpacity;
      this.life = 0;
      this.maxLife = 200 + Math.random() * 200;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
        this.reset();
        this.y = canvas.height + 10;
      }
    }
    draw() {
      const fade = Math.min(this.life / 40, 1) * Math.min((this.maxLife - this.life) / 40, 1);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.color + (this.op * fade) + ')';
      ctx.fill();
    }
  }

  const init = (containerId = 'hero') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;';
    container.style.position = 'relative';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    new ResizeObserver(resize).observe(container);

    for (let i = 0; i < CONFIG.count; i++) {
      const p = new Particle();
      p.y = Math.random() * canvas.height; // distribute on load
      particles.push(p);
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      raf = requestAnimationFrame(tick);
    };
    tick();
  };

  return { init };
})();

// ── PARALLAX LAYERS ───────────────────────────────────────────────
const ParallaxLayers = (() => {
  const layers = [];

  const register = (el, speed = 0.15) => {
    layers.push({ el, speed, y: 0 });
  };

  const init = () => {
    document.querySelectorAll('[data-parallax]').forEach(el => {
      register(el, parseFloat(el.dataset.parallax) || 0.15);
    });

    if (!layers.length) return;

    let ticking = false;
    const update = () => {
      const scrollY = window.scrollY;
      layers.forEach(layer => {
        const rect = layer.el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 + scrollY;
        const offset = (scrollY - center + window.innerHeight / 2) * layer.speed;
        layer.el.style.transform = `translateY(${offset}px)`;
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  };

  return { init, register };
})();

// ── TILT EFFECT ON PRODUCT CARDS ─────────────────────────────────
const Tilt = (() => {
  const MAX_TILT = 6;

  const init = (selector = '.pc') => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${-y * MAX_TILT}deg) rotateY(${x * MAX_TILT}deg) translateY(-4px)`;
        el.style.transition = 'transform .1s';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform .6s var(--ease-out)';
      });
    });
  };

  return { init };
})();

// ── MAGNETIC ELEMENTS ─────────────────────────────────────────────
const Magnetic = (() => {
  const init = (selector = '.magnetic') => {
    document.querySelectorAll(selector).forEach(el => {
      let rect, animId;

      el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', e => {
        if (!rect) return;
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * 0.28;
        const dy = (e.clientY - cy) * 0.28;
        el.style.transform  = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'transform .15s';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform  = '';
        el.style.transition = 'transform .6s var(--ease-spring)';
        rect = null;
      });
    });
  };

  return { init };
})();

// ── TEXT SPLIT ANIMATION ──────────────────────────────────────────
const TextSplit = (() => {
  const init = (selector = '[data-split]') => {
    document.querySelectorAll(selector).forEach(el => {
      const text  = el.textContent;
      const words = text.split(' ');
      el.innerHTML = words.map((w, i) =>
        `<span style="display:inline-block;overflow:hidden"><span style="display:inline-block;transform:translateY(100%);transition:transform .7s var(--ease-out);transition-delay:${i * 0.06}s">${w}</span></span>`
      ).join(' ');

      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll('span span').forEach(s => s.style.transform = 'translateY(0)');
          obs.unobserve(el);
        }
      }, { threshold: 0.1 });
      obs.observe(el);
    });
  };

  return { init };
})();

// ── NUMBER TICKER ─────────────────────────────────────────────────
const NumberTicker = (() => {
  const lerp = (a, b, t) => a + (b - a) * t;

  const init = (selector = '.ticker-num') => {
    document.querySelectorAll(selector).forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      let current  = 0, started = false;

      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        const start = performance.now();
        const dur   = parseInt(el.dataset.dur || 2000);

        const step = (now) => {
          const t    = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 4);
          const val  = target * ease;
          el.textContent = prefix + (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      obs.observe(el);
    });
  };

  return { init };
})();

// ── CURSOR TRAIL ─────────────────────────────────────────────────
const CursorTrail = (() => {
  const TRAIL_LENGTH = 8;
  const trail = [];

  const init = () => {
    if ('ontouchstart' in window) return;

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position:fixed;pointer-events:none;z-index:8998;
        width:${4 - i * 0.3}px;height:${4 - i * 0.3}px;
        border-radius:50%;
        background:rgba(196,160,96,${0.15 - i * 0.015});
        transform:translate(-50%,-50%);
        transition:none;
        will-change:transform;
      `;
      document.body.appendChild(dot);
      trail.push({ el: dot, x: 0, y: 0 });
    }

    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    const tick = () => {
      let px = mx, py = my;
      trail.forEach((t, i) => {
        t.x += (px - t.x) * (0.35 - i * 0.025);
        t.y += (py - t.y) * (0.35 - i * 0.025);
        t.el.style.left = t.x + 'px';
        t.el.style.top  = t.y + 'px';
        px = t.x; py = t.y;
      });
      requestAnimationFrame(tick);
    };
    tick();
  };

  return { init };
})();

// ── SCROLL-TRIGGERED COUNTERS ─────────────────────────────────────
const CounterObserver = (() => {
  const init = () => {
    document.querySelectorAll('.count-up').forEach(el => {
      const target = parseFloat(el.dataset.target || el.textContent.replace(/[^0-9.]/g, ''));
      const suffix = el.dataset.suffix || '';
      const dur    = parseInt(el.dataset.dur || 1800);
      let done     = false;

      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting || done) return;
        done = true;
        const start = performance.now();
        const step  = (now) => {
          const t   = Math.min((now - start) / dur, 1);
          const val = target * (1 - Math.pow(1 - t, 4));
          el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.unobserve(el);
      }, { threshold: 0.6 });
      obs.observe(el);
    });
  };

  return { init };
})();

// ── PAGE TRANSITION ───────────────────────────────────────────────
const PageTransition = (() => {
  const init = () => {
    const overlay = document.getElementById('page-transition');
    if (!overlay) return;

    // Animate in on load
    overlay.style.transform    = 'scaleY(1)';
    overlay.style.transformOrigin = 'top';
    requestAnimationFrame(() => {
      overlay.style.transition = 'transform .7s var(--ease-inout)';
      overlay.style.transform  = 'scaleY(0)';
    });

    // Animate out on link click
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel') || a.target === '_blank') return;

      a.addEventListener('click', e => {
        e.preventDefault();
        overlay.style.transformOrigin = 'bottom';
        overlay.style.transform  = 'scaleY(1)';
        setTimeout(() => { window.location.href = href; }, 650);
      });
    });
  };

  return { init };
})();

// ── MARQUEE PAUSE ON HOVER ────────────────────────────────────────
const MarqueePause = (() => {
  const init = () => {
    document.querySelectorAll('.marquee-row, .ticker-track').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.animationPlayState = 'paused');
      el.addEventListener('mouseleave', () => el.style.animationPlayState = 'running');
    });
  };
  return { init };
})();

// ── INIT ALL EFFECTS ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Only init smooth scroll on desktop
  if (window.innerWidth > 1024) SmoothScroll.init();

  Particles.init('hero');
  ParallaxLayers.init();
  Tilt.init('.pc');
  Magnetic.init('.magnetic');
  TextSplit.init('[data-split]');
  NumberTicker.init('.ticker-num');
  CursorTrail.init();
  CounterObserver.init();
  PageTransition.init();
  MarqueePause.init();
});
