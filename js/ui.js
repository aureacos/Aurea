/* ================================================================
   UI ENGINE — Cursor · Nav · Scroll · Reveal · Parallax · Effects
================================================================ */
'use strict';

/* ── CUSTOM CURSOR ─────────────────────────────────────────────── */
const Cursor = (() => {
  let dot, ring, mx = 0, my = 0, rx = 0, ry = 0;

  const init = () => {
    if ('ontouchstart' in window) return; // skip on touch devices
    dot  = document.getElementById('cursor-dot');
    ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

    (function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(loop);
    })();

    // States
    const setMode = (mode) => document.body.dataset.cursor = mode;

    document.querySelectorAll('a, button, [role=button], .clickable').forEach(el => {
      el.addEventListener('mouseenter', () => setMode('pointer'));
      el.addEventListener('mouseleave', () => setMode(''));
    });
    document.querySelectorAll('.product-card, .pc, .shop-pc').forEach(el => {
      el.addEventListener('mouseenter', () => setMode('view'));
      el.addEventListener('mouseleave', () => setMode(''));
    });
    document.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => setMode('text'));
      el.addEventListener('mouseleave', () => setMode(''));
    });
  };

  return { init };
})();

/* ── NAVIGATION ────────────────────────────────────────────────── */
const Nav = (() => {
  let lastY = 0;

  const init = () => {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    // Announce bar offset
    const bar = document.getElementById('announce-bar');
    if (bar) {
      const setOffset = () => { nav.style.top = bar.offsetHeight + 'px'; };
      setOffset();
      document.getElementById('announce-close')?.addEventListener('click', () => {
        bar.style.maxHeight = bar.scrollHeight + 'px';
        requestAnimationFrame(() => {
          bar.style.transition = 'max-height .5s ease, opacity .4s, padding .4s';
          bar.style.maxHeight = '0'; bar.style.opacity = '0'; bar.style.padding = '0';
        });
        setTimeout(() => { bar.remove(); nav.style.top = '0'; }, 520);
      });
    }

    // Scroll behaviour
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 60);
        // Hide on scroll down, show on scroll up
        if (y > 400 && y > lastY + 8) nav.classList.add('nav-hidden');
        else if (y < lastY - 5) nav.classList.remove('nav-hidden');
        lastY = y;
        ticking = false;
      });
    }, { passive: true });

    // Mobile menu
    const burger = document.getElementById('hamburger');
    const mMenu  = document.getElementById('mobile-menu');
    burger?.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      mMenu?.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      burger.setAttribute('aria-expanded', open);
    });
    mMenu?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger?.classList.remove('open');
        mMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  };

  return { init };
})();

/* ── SCROLL REVEAL ─────────────────────────────────────────────── */
const Reveal = (() => {
  const init = () => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));

    // Stagger children
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('stagger-go');
          staggerObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.stagger').forEach(el => staggerObs.observe(el));
  };

  return { init };
})();

/* ── PARALLAX ──────────────────────────────────────────────────── */
const Parallax = (() => {
  const init = () => {
    const orbs = document.querySelectorAll('.hero-orb, .parallax-el');
    if (!orbs.length) return;

    document.addEventListener('mousemove', e => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      orbs.forEach((orb, i) => {
        const f = (parseFloat(orb.dataset.parallaxStrength) || (i + 1)) * 14;
        orb.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
      });
    });
  };

  return { init };
})();

/* ── SCROLL PROGRESS BAR ───────────────────────────────────────── */
const ScrollProgress = (() => {
  const init = () => {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const h   = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  };
  return { init };
})();

/* ── BACK TO TOP ───────────────────────────────────────────────── */
const BackTop = (() => {
  const init = () => {
    const btn = document.getElementById('back-top');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 600), { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };
  return { init };
})();

/* ── COUNT UP ──────────────────────────────────────────────────── */
const CountUp = (() => {
  const init = () => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el     = e.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const dur    = parseInt(el.dataset.dur || 1600);
        const start  = performance.now();
        const step   = (now) => {
          const t   = Math.min((now - start) / dur, 1);
          const val = target * (1 - Math.pow(1 - t, 4));
          el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.count-up').forEach(el => obs.observe(el));
  };
  return { init };
})();

/* ── MAGNETIC BUTTONS ──────────────────────────────────────────── */
const Magnetic = (() => {
  const init = () => {
    document.querySelectorAll('.magnetic').forEach(el => {
      let rect;
      el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', e => {
        if (!rect) return;
        const dx = (e.clientX - rect.left - rect.width  / 2) * 0.25;
        const dy = (e.clientY - rect.top  - rect.height / 2) * 0.25;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'transform .1s';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform  = '';
        el.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)';
        rect = null;
      });
    });
  };
  return { init };
})();

/* ── CARD HOVER GLOW ───────────────────────────────────────────── */
const CardGlow = (() => {
  const init = () => {
    document.querySelectorAll('.product-card, .pc, .shop-pc').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--glow-x', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--glow-y', (e.clientY - rect.top)  + 'px');
      });
    });
  };
  return { init };
})();

/* ── TICKER / MARQUEE PAUSE ────────────────────────────────────── */
const MarqueePause = (() => {
  const init = () => {
    document.querySelectorAll('.ticker-track, .marquee-row').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.animationPlayState = 'paused');
      el.addEventListener('mouseleave', () => el.style.animationPlayState = 'running');
    });
  };
  return { init };
})();

/* ── NEWSLETTER FORM ───────────────────────────────────────────── */
const NewsletterForm = (() => {
  const init = () => {
    document.querySelectorAll('.newsletter-form').forEach(form => {
      const input = form.querySelector('input[type=email]');
      const btn   = form.querySelector('button[type=submit], .nl-btn');
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (!input?.value.includes('@')) {
          input?.classList.add('field-error');
          setTimeout(() => input?.classList.remove('field-error'), 1800);
          return;
        }
        const original = btn?.textContent;
        if (btn) { btn.textContent = '✦ Subscribed!'; btn.style.background = 'var(--sage,#7a9070)'; }
        showToast('Welcome! Check your inbox for a confirmation.', '✦');
        input.value = '';
        setTimeout(() => { if (btn) { btn.textContent = original; btn.style.background = ''; } }, 5000);
      });
    });
  };
  return { init };
})();

/* ── LOADER ────────────────────────────────────────────────────── */
const Loader = (() => {
  const init = () => {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('loaded'), 1800);
    });
  };
  return { init };
})();

/* ── SMOOTH ANCHOR SCROLL ──────────────────────────────────────── */
const SmoothAnchor = (() => {
  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = (document.getElementById('main-nav')?.offsetHeight || 72) + 12;
          window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        }
      });
    });
  };
  return { init };
})();

/* ── LOCATION DETECT ───────────────────────────────────────────── */
const Location = (() => {
  const init = () => {
    const els = document.querySelectorAll('.nav-location-text, .location-display');
    if (!els.length) return;
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (d.city) els.forEach(el => el.textContent = d.city + ', ' + d.country_code); })
      .catch(() => {});
  };
  return { init };
})();

/* ── INIT ALL ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Loader.init();
  Cursor.init();
  Nav.init();
  Reveal.init();
  Parallax.init();
  ScrollProgress.init();
  BackTop.init();
  CountUp.init();
  Magnetic.init();
  CardGlow.init();
  MarqueePause.init();
  NewsletterForm.init();
  SmoothAnchor.init();
  Location.init();
});
