/* ═══════════════════════════════════════════════════════════════
   MAISON AURÉA — CORE JS
   Cursor · Nav · Scroll Effects · Parallax · Counter · Utils
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── UTILS ──────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const map = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));

// ── PAGE LOADER ─────────────────────────────────────────────────
const initLoader = () => {
  const loader = $('#page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('loaded'), 2800);
  });
};

// ── CUSTOM CURSOR ───────────────────────────────────────────────
const initCursor = () => {
  const dot  = $('#cursor-dot');
  const ring = $('#cursor-ring');
  const lbl  = $('#cursor-label');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let animId;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

  const update = () => {
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    rx = lerp(rx, mx, .13);
    ry = lerp(ry, my, .13);
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    if (lbl) { lbl.style.left = rx + 'px'; lbl.style.top = ry + 'px'; }
    animId = requestAnimationFrame(update);
  };
  update();

  // Cursor states
  const setCursorState = (state, label = '') => {
    document.body.className = document.body.className
      .replace(/cursor-\w+/g, '').trim();
    if (state) document.body.classList.add('cursor-' + state);
    if (lbl) lbl.textContent = label;
  };

  $$('a, button, .nav-icon-btn, .mega-link, .footer-links a').forEach(el => {
    el.addEventListener('mouseenter', () => setCursorState('link'));
    el.addEventListener('mouseleave', () => setCursorState(''));
  });

  $$('.pc').forEach(el => {
    el.addEventListener('mouseenter', () => setCursorState('product', 'View'));
    el.addEventListener('mouseleave', () => setCursorState(''));
  });

  // Cursor card glow
  $$('.pc').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });
};

// ── ANNOUNCE BAR ────────────────────────────────────────────────
const initAnnounceBar = () => {
  const bar   = $('.announce-bar');
  const close = $('.announce-close');
  const nav   = $('#main-nav');
  if (!bar || !close || !nav) return;

  nav.classList.add('has-bar');
  close.addEventListener('click', () => {
    bar.style.maxHeight = bar.scrollHeight + 'px';
    requestAnimationFrame(() => {
      bar.style.transition = 'max-height .5s, opacity .4s, padding .5s';
      bar.style.maxHeight  = '0';
      bar.style.opacity    = '0';
      bar.style.padding    = '0';
    });
    setTimeout(() => {
      bar.remove();
      nav.classList.remove('has-bar');
      nav.style.top = '0';
    }, 520);
  });
};

// ── NAV SCROLL BEHAVIOUR ────────────────────────────────────────
const initNavScroll = () => {
  const nav = $('#main-nav');
  if (!nav) return;

  let lastY = 0, ticking = false;

  const update = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);
    // Hide nav on scroll down, show on scroll up
    if (y > 300) {
      nav.classList.toggle('hidden', y > lastY + 10);
      if (y < lastY - 5) nav.classList.remove('hidden');
    } else {
      nav.classList.remove('hidden');
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
};

// ── MOBILE MENU ─────────────────────────────────────────────────
const initMobileMenu = () => {
  const burger = $('.hamburger');
  const menu   = $('#mobile-menu');
  if (!burger || !menu) return;

  let open = false;
  burger.addEventListener('click', () => {
    open = !open;
    burger.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.mobile-nav-link', menu).forEach(link => {
    link.addEventListener('click', () => {
      open = false; burger.classList.remove('open');
      menu.classList.remove('open'); document.body.style.overflow = '';
    });
  });
};

// ── SEARCH OVERLAY ──────────────────────────────────────────────
const initSearch = () => {
  const overlay = $('#search-overlay');
  const input   = $('.search-input', overlay);
  const openBtn = $('#search-open');
  const closeEl = $('.search-close', overlay);
  if (!overlay) return;

  const open  = () => { overlay.classList.add('open'); setTimeout(() => input?.focus(), 300); document.body.style.overflow = 'hidden'; };
  const close = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; };

  openBtn?.addEventListener('click', open);
  closeEl?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
};

// ── CART DRAWER ─────────────────────────────────────────────────
const Cart = (() => {
  let items = [];

  const save  = () => localStorage.setItem('aurea_cart', JSON.stringify(items));
  const load  = () => { try { items = JSON.parse(localStorage.getItem('aurea_cart') || '[]'); } catch { items = []; } };

  const add = (product) => {
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) items[idx].qty++;
    else items.push({ ...product, qty: 1 });
    save(); render(); showToast('Added to bag', '✦'); updateBadge();
  };

  const remove = (id) => { items = items.filter(i => i.id !== id); save(); render(); updateBadge(); };
  const updateQty = (id, delta) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) remove(id); else { save(); render(); }
    updateBadge();
  };

  const total = () => items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = () => items.reduce((s, i) => s + i.qty, 0);

  const updateBadge = () => {
    const badge = $('.cart-badge');
    const n = count();
    if (badge) { badge.textContent = n; badge.classList.toggle('show', n > 0); }
  };

  const render = () => {
    const list    = $('#cart-items');
    const empty   = $('#cart-empty');
    const footer  = $('#cart-footer');
    const subtotal= $('#cart-subtotal-price');
    const countLbl= $('#cart-count-label');
    if (!list) return;

    const n = count();
    if (countLbl) countLbl.textContent = n + (n === 1 ? ' item' : ' items');

    if (items.length === 0) {
      list.innerHTML = '';
      empty?.classList.remove('hidden');
      footer?.classList.add('hidden');
      return;
    }
    empty?.classList.add('hidden');
    footer?.classList.remove('hidden');
    if (subtotal) subtotal.textContent = '$' + total().toFixed(0);

    list.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img">${item.icon || '✦'}</div>
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-variant">${item.variant || 'Standard'}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
            <button class="cart-item-remove" data-id="${item.id}" style="margin-left:10px">✕</button>
          </div>
        </div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(0)}</div>
      </div>
    `).join('');

    $$('.qty-btn', list).forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.id, btn.dataset.action === 'inc' ? 1 : -1));
    });
    $$('.cart-item-remove', list).forEach(btn => {
      btn.addEventListener('click', () => remove(btn.dataset.id));
    });
  };

  const open  = () => { $('#cart-drawer')?.classList.add('open'); $('#cart-overlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { $('#cart-drawer')?.classList.remove('open'); $('#cart-overlay')?.classList.remove('open'); document.body.style.overflow = ''; };

  const init = () => {
    load(); render(); updateBadge();
    $('#cart-btn')?.addEventListener('click', open);
    $('#cart-close')?.addEventListener('click', close);
    $('#cart-overlay')?.addEventListener('click', close);
    $$('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => add({
        id:      btn.dataset.id,
        name:    btn.dataset.name,
        price:   parseFloat(btn.dataset.price),
        variant: btn.dataset.variant,
        icon:    btn.dataset.icon,
      }));
    });
  };

  return { init, add, open, close };
})();

// ── WISHLIST ─────────────────────────────────────────────────────
const Wishlist = (() => {
  let items = new Set(JSON.parse(localStorage.getItem('aurea_wish') || '[]'));

  const save = () => localStorage.setItem('aurea_wish', JSON.stringify([...items]));

  const toggle = (id, btn) => {
    if (items.has(id)) { items.delete(id); btn?.classList.remove('wished'); showToast('Removed from wishlist', '♡'); }
    else { items.add(id); btn?.classList.add('wished'); showToast('Added to wishlist', '♡'); }
    save();
  };

  const init = () => {
    $$('.pc-wishlist').forEach(btn => {
      const id = btn.dataset.id;
      if (items.has(id)) btn.classList.add('wished');
      btn.addEventListener('click', e => { e.stopPropagation(); toggle(id, btn); });
    });
  };

  return { init };
})();

// ── TOAST ────────────────────────────────────────────────────────
let toastTimer;
const showToast = (msg, icon = '✦') => {
  let toast = $('#aurea-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aurea-toast'; toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon"></span><span class="toast-msg"></span><span class="toast-close">✕</span>`;
    document.body.appendChild(toast);
    $('.toast-close', toast)?.addEventListener('click', () => toast.classList.remove('show'));
  }
  $('.toast-icon', toast).textContent = icon;
  $('.toast-msg', toast).textContent  = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
};

// ── SCROLL REVEAL ────────────────────────────────────────────────
const initReveal = () => {
  const els = $$('[data-reveal]');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => obs.observe(el));

  // Stagger containers
  $$('.stagger-children').forEach(container => {
    const contObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { container.classList.add('revealed'); contObs.unobserve(container); }
    }, { threshold: 0.1 });
    contObs.observe(container);
  });
};

// ── SMOOTH SCROLL PROGRESS ───────────────────────────────────────
const initScrollProgress = () => {
  const bar = $('#scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = clamp(pct, 0, 100) + '%';
  }, { passive: true });
};

// ── BACK TO TOP ──────────────────────────────────────────────────
const initBackTop = () => {
  const btn = $('#back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 600), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
};

// ── PARALLAX ─────────────────────────────────────────────────────
const initParallax = () => {
  const orbs = $$('.hero-orb');
  if (!orbs.length) return;

  let rafId;
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const tick = () => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const dx = (mx - cx) / cx, dy = (my - cy) / cy;
    orbs.forEach((o, i) => {
      const f = (i + 1) * 18;
      o.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
    });
    rafId = requestAnimationFrame(tick);
  };
  tick();
};

// ── COUNT-UP ANIMATION ───────────────────────────────────────────
const initCountUp = () => {
  $$('.count-up').forEach(el => {
    const target = parseFloat(el.dataset.target || el.textContent);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const dur    = parseInt(el.dataset.dur || 1800);
    let started  = false;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const start = performance.now();
      const step = (now) => {
        const t = clamp((now - start) / dur, 0, 1);
        const ease = 1 - Math.pow(1 - t, 4); // easeOutQuart
        const val = target * ease;
        el.textContent = prefix + (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .5 });
    obs.observe(el);
  });
};

// ── NEWSLETTER ───────────────────────────────────────────────────
const initNewsletter = () => {
  $$('.nl-form, .footer-newsletter-mini').forEach(form => {
    const input = form.querySelector('input[type="email"]');
    const btn   = form.querySelector('button');
    if (!input || !btn) return;

    btn.addEventListener('click', () => {
      if (!input.value.includes('@') || !input.value.includes('.')) {
        input.style.borderColor = 'rgba(200,120,96,.6)';
        input.focus();
        setTimeout(() => { input.style.borderColor = ''; }, 1800);
        return;
      }
      btn.textContent = '✦ Subscribed';
      btn.style.background = 'var(--sage)';
      input.value = '';
      showToast('Welcome to the Auréa Circle!', '✦');
      setTimeout(() => { btn.textContent = 'Subscribe'; btn.style.background = ''; }, 4000);
    });
  });
};

// ── SMOOTH ANCHOR SCROLL ─────────────────────────────────────────
const initSmoothScroll = () => {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = $('#main-nav')?.offsetHeight || 80;
        window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
      }
    });
  });
};

// ── LOCATION DETECT ──────────────────────────────────────────────
const initLocation = () => {
  const locEl = $('.nav-location-text');
  if (!locEl) return;
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(d => { if (d.city) locEl.textContent = d.city + ', ' + d.country_code; })
    .catch(() => {});
};

// ── CURSOR MAGNETIC ──────────────────────────────────────────────
const initMagnetic = () => {
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * .25;
      const dy = (e.clientY - cy) * .25;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .5s var(--ease-spring)';
      el.style.transform  = '';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
};

// ── INIT ALL ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursor();
  initAnnounceBar();
  initNavScroll();
  initMobileMenu();
  initSearch();
  Cart.init();
  Wishlist.init();
  initReveal();
  initScrollProgress();
  initBackTop();
  initParallax();
  initCountUp();
  initNewsletter();
  initSmoothScroll();
  initLocation();
  initMagnetic();
});
