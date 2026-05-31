/* ═══════════════════════════════════════════════════════════════
   MAISON AURÉA — PRODUCT PAGE JS
   Gallery · Zoom · Shade Selector · Size · Reviews · Related
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── GALLERY ───────────────────────────────────────────────────────
const Gallery = (() => {
  let current = 0;
  const imgs  = [];

  const init = () => {
    const thumbs = document.querySelectorAll('.gallery-thumb');
    const main   = document.getElementById('gallery-main');
    if (!thumbs.length || !main) return;

    thumbs.forEach((thumb, i) => {
      imgs.push({ bg: thumb.dataset.bg, icon: thumb.dataset.icon });
      thumb.addEventListener('click', () => setActive(i));
    });
    setActive(0);

    // Keyboard nav
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  setActive(Math.max(0, current-1));
      if (e.key === 'ArrowRight') setActive(Math.min(imgs.length-1, current+1));
    });

    // Zoom on hover
    main.addEventListener('mousemove', e => {
      const rect = main.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      main.style.setProperty('--zoom-x', x + '%');
      main.style.setProperty('--zoom-y', y + '%');
      main.classList.add('zoomed');
    });
    main.addEventListener('mouseleave', () => main.classList.remove('zoomed'));
  };

  const setActive = (i) => {
    current = i;
    const thumbs = document.querySelectorAll('.gallery-thumb');
    thumbs.forEach((t, idx) => t.classList.toggle('active', idx === i));

    const main = document.getElementById('gallery-main');
    if (main) {
      main.style.opacity = '0';
      main.style.transform = 'scale(.98)';
      setTimeout(() => {
        main.style.transition = 'opacity .4s var(--ease-out), transform .4s var(--ease-out)';
        main.style.opacity = '1';
        main.style.transform = 'scale(1)';
      }, 50);
    }
  };

  return { init };
})();

// ── SHADE SELECTOR ────────────────────────────────────────────────
const ShadeSelector = (() => {
  let selected = null;

  const init = () => {
    const swatches  = document.querySelectorAll('.shade-sw');
    const nameEl    = document.getElementById('shade-name');
    const addBtn    = document.getElementById('add-to-bag-btn');

    swatches.forEach(sw => {
      sw.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        selected = sw.dataset.shade;
        if (nameEl) nameEl.textContent = selected;
        if (addBtn) {
          addBtn.dataset.variant = selected;
          addBtn.querySelector('span').textContent = 'Add to Bag';
        }
      });
    });
  };

  return { init, getSelected: () => selected };
})();

// ── QUANTITY SELECTOR ─────────────────────────────────────────────
const QtySelector = (() => {
  let qty = 1;

  const init = () => {
    const dec = document.getElementById('qty-dec');
    const inc = document.getElementById('qty-inc');
    const num = document.getElementById('qty-num');
    if (!dec || !inc || !num) return;

    dec.addEventListener('click', () => { qty = Math.max(1, qty - 1); num.textContent = qty; });
    inc.addEventListener('click', () => { qty = Math.min(10, qty + 1); num.textContent = qty; });
  };

  return { init, getQty: () => qty };
})();

// ── TAB SWITCHER ──────────────────────────────────────────────────
const ProductTabs = (() => {
  const init = () => {
    const tabs    = document.querySelectorAll('.ptab');
    const panels  = document.querySelectorAll('.ptab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
        tab.classList.add('active');
        const target = document.getElementById('ptab-' + tab.dataset.tab);
        if (target) { target.classList.add('active'); target.style.display = 'block'; }
      });
    });
  };

  return { init };
})();

// ── REVIEWS ───────────────────────────────────────────────────────
const Reviews = (() => {
  const MOCK_REVIEWS = [
    { name:'Sophia L.', rating:5, date:'March 2025', title:'Absolutely transformed my skin', body:'I\'ve been using the Sérum d\'Or for three months now and the results are nothing short of remarkable. My skin is brighter, firmer, and people keep asking what I\'ve changed. Worth every single penny.', verified:true },
    { name:'Mia T.',    rating:5, date:'February 2025', title:'The most luxurious texture', body:'The way this serum absorbs is just incredible. No stickiness, no heaviness — just immediate plumpness. I\'ve converted six friends already.', verified:true },
    { name:'Aisha C.',  rating:5, date:'January 2025',  title:'Makeup artist approved', body:'I use this on all my clients before shoots. The glow it gives is unmatched by any other serum at this or any price point. A permanent fixture in my kit.', verified:true },
    { name:'Jade R.',   rating:4, date:'January 2025',  title:'Beautiful but pricey', body:'The product is genuinely excellent and the packaging is stunning. The only reason I\'m giving four stars instead of five is the price — but if you can afford it, it\'s completely worth it.', verified:true },
    { name:'Elena M.',  rating:5, date:'December 2024', title:'Holy grail serum', body:'After years of searching I finally found my holy grail. The gold peptides are clearly doing something remarkable — my fine lines have visibly softened in just four weeks.', verified:false },
    { name:'Priya S.',  rating:5, date:'December 2024', title:'Life-changing routine', body:'Combined with the Rich Night Balm this has completely transformed my skincare routine. I feel genuinely excited to do my skincare every morning and evening now.', verified:true },
  ];

  const render = () => {
    const grid = document.getElementById('reviews-grid');
    if (!grid) return;

    grid.innerHTML = MOCK_REVIEWS.map(r => `
      <div class="review-card">
        <div class="review-top">
          <div class="review-av">${r.name.charAt(0)}</div>
          <div>
            <span class="review-name">${r.name}</span>
            <span class="review-date">${r.date}</span>
          </div>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        </div>
        <h4 class="review-title">${r.title}</h4>
        <p class="review-body">${r.body}</p>
        ${r.verified ? '<span class="review-verified">✓ Verified Purchase</span>' : ''}
      </div>
    `).join('');
  };

  const initForm = () => {
    const form   = document.getElementById('review-form');
    const stars  = document.querySelectorAll('.star-rate');
    let ratingVal = 0;

    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        stars.forEach(s => s.style.color = parseInt(s.dataset.val) <= parseInt(star.dataset.val) ? 'var(--gold)' : 'rgba(240,232,220,.2)');
      });
      star.addEventListener('mouseleave', () => {
        stars.forEach(s => s.style.color = parseInt(s.dataset.val) <= ratingVal ? 'var(--gold)' : 'rgba(240,232,220,.2)');
      });
      star.addEventListener('click', () => {
        ratingVal = parseInt(star.dataset.val);
        stars.forEach(s => s.style.color = parseInt(s.dataset.val) <= ratingVal ? 'var(--gold)' : 'rgba(240,232,220,.2)');
      });
    });

    form?.addEventListener('submit', e => {
      e.preventDefault();
      if (typeof showToast !== 'undefined') showToast('Thank you! Your review has been submitted for moderation.', '✦');
      form.reset();
      ratingVal = 0;
      stars.forEach(s => s.style.color = '');
    });
  };

  return { init: () => { render(); initForm(); } };
})();

// ── STICKY ADD TO BAG ─────────────────────────────────────────────
const StickyBar = (() => {
  const init = () => {
    const trigger = document.getElementById('product-cta');
    const bar     = document.getElementById('sticky-bar');
    if (!trigger || !bar) return;

    const obs = new IntersectionObserver(([e]) => {
      bar.classList.toggle('show', !e.isIntersecting);
    }, { threshold: 0 });
    obs.observe(trigger);
  };
  return { init };
})();

// ── RECENTLY VIEWED ───────────────────────────────────────────────
const RecentlyViewed = (() => {
  const KEY = 'aurea_viewed';

  const add = (id) => {
    let viewed = JSON.parse(localStorage.getItem(KEY) || '[]');
    viewed = [id, ...viewed.filter(x => x !== id)].slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(viewed));
  };

  return { add };
})();

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Gallery.init();
  ShadeSelector.init();
  QtySelector.init();
  ProductTabs.init();
  Reviews.init();
  StickyBar.init();

  // get product id from URL
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  if (id) RecentlyViewed.add(id);

  // add to bag main button
  document.getElementById('add-to-bag-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('add-to-bag-btn');
    if (typeof Cart !== 'undefined') {
      Cart.add({
        id:      btn.dataset.id,
        name:    btn.dataset.name,
        price:   parseFloat(btn.dataset.price),
        variant: ShadeSelector.getSelected(),
        qty:     QtySelector.getQty(),
        icon:    '✦'
      });
    }
  });

  // image dots on mobile
  document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => Gallery.setActive?.(i));
  });
});
