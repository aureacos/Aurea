/* ================================================================
   STORE ENGINE — Cart · Wishlist · Auth · Loyalty · Toast
================================================================ */
'use strict';

/* ══════════════════════════════════════════════
   CART
══════════════════════════════════════════════ */
const Cart = (() => {
  const KEY = 'store_cart_v1';

  let items = [];

  const load = () => {
    try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { items = []; }
  };

  const save = () => localStorage.setItem(KEY, JSON.stringify(items));

  const add = (product, qty = 1) => {
    const existing = items.find(i => i.id === product.id && i.variant === (product.variant || null) && i.size === (product.size || null));
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      items.push({
        id:       product.id,
        name:     product.name,
        price:    product.price,
        image:    product.image || null,
        variant:  product.variant || null,
        size:     product.size || null,
        qty:      Math.min(qty, 10),
      });
    }
    save();
    _renderDrawer();
    _updateBadge();
    _toast('Added to bag — ' + product.name, '🛍');
    open();
  };

  const remove = (id, variant = null, size = null) => {
    items = items.filter(i => !(i.id === id && i.variant === variant && i.size === size));
    save(); _renderDrawer(); _updateBadge();
  };

  const updateQty = (id, delta, variant = null, size = null) => {
    const item = items.find(i => i.id === id && i.variant === variant && i.size === size);
    if (!item) return;
    item.qty = Math.max(1, Math.min(item.qty + delta, 10));
    save(); _renderDrawer(); _updateBadge();
  };

  const clear = () => { items = []; save(); _renderDrawer(); _updateBadge(); };

  const getItems  = () => [...items];
  const getCount  = () => items.reduce((s, i) => s + i.qty, 0);
  const getTotal  = () => items.reduce((s, i) => s + i.price * i.qty, 0);

  const open  = () => {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  const _updateBadge = () => {
    const n = getCount();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = n;
      el.classList.toggle('show', n > 0);
    });
  };

  const _renderDrawer = () => {
    const list      = document.getElementById('cart-items-list');
    const emptyEl   = document.getElementById('cart-empty-state');
    const footerEl  = document.getElementById('cart-footer');
    const totalEl   = document.getElementById('cart-total-price');
    const countLbl  = document.getElementById('cart-count-lbl');
    if (!list) return;

    const n = getCount();
    if (countLbl) countLbl.textContent = n + (n === 1 ? ' item' : ' items');

    if (!items.length) {
      list.innerHTML    = '';
      if (emptyEl)  emptyEl.style.display  = 'flex';
      if (footerEl) footerEl.style.display = 'none';
      return;
    }
    if (emptyEl)  emptyEl.style.display  = 'none';
    if (footerEl) footerEl.style.display = 'block';

    const sym = (typeof STORE !== 'undefined') ? STORE.CURRENCY_SYMBOL : '$';
    if (totalEl) totalEl.textContent = sym + getTotal().toFixed(2);

    list.innerHTML = items.map(item => `
      <div class="ci" data-id="${item.id}" data-variant="${item.variant||''}" data-size="${item.size||''}">
        <div class="ci-img">${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : '<span>✦</span>'}</div>
        <div class="ci-info">
          <span class="ci-name">${item.name}</span>
          ${item.variant ? `<span class="ci-meta">${item.variant}</span>` : ''}
          ${item.size    ? `<span class="ci-meta">${item.size}</span>` : ''}
          <div class="ci-qty">
            <button class="ci-qty-btn" onclick="Cart.updateQty('${item.id}',-1,'${item.variant||null}','${item.size||null}')">−</button>
            <span class="ci-qty-num">${item.qty}</span>
            <button class="ci-qty-btn" onclick="Cart.updateQty('${item.id}',1,'${item.variant||null}','${item.size||null}')">+</button>
          </div>
        </div>
        <div class="ci-right">
          <span class="ci-price">${sym}${(item.price * item.qty).toFixed(2)}</span>
          <button class="ci-remove" onclick="Cart.remove('${item.id}','${item.variant||null}','${item.size||null}')" aria-label="Remove">✕</button>
        </div>
      </div>
    `).join('');
  };

  const init = () => {
    load(); _renderDrawer(); _updateBadge();
    document.getElementById('cart-btn')?.addEventListener('click', open);
    document.getElementById('cart-close-btn')?.addEventListener('click', close);
    document.getElementById('cart-overlay')?.addEventListener('click', close);
    document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
      window.location.href = 'pages/checkout.html';
    });
  };

  return { init, add, remove, updateQty, clear, open, close, getItems, getCount, getTotal };
})();

/* ══════════════════════════════════════════════
   WISHLIST
══════════════════════════════════════════════ */
const Wishlist = (() => {
  const KEY = 'store_wishlist_v1';
  let items = new Set();

  const load = () => {
    try { items = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
    catch { items = new Set(); }
  };
  const save = () => localStorage.setItem(KEY, JSON.stringify([...items]));

  const has    = (id) => items.has(id);
  const add    = (id) => { items.add(id);    save(); _sync(); };
  const remove = (id) => { items.delete(id); save(); _sync(); };
  const toggle = (id, btn) => {
    if (has(id)) { remove(id); if (btn) { btn.textContent='♡'; btn.classList.remove('wished'); } _toast('Removed from wishlist', '♡'); }
    else          { add(id);    if (btn) { btn.textContent='♥'; btn.classList.add('wished');   } _toast('Saved to wishlist', '♥'); }
  };
  const getAll = () => [...items];

  const _sync = () => {
    const n = items.size;
    document.querySelectorAll('.wishlist-badge').forEach(el => {
      el.textContent = n;
      el.classList.toggle('show', n > 0);
    });
    // sync all wishlist buttons on page
    document.querySelectorAll('[data-wl-id]').forEach(btn => {
      const id = btn.dataset.wlId;
      btn.textContent = has(id) ? '♥' : '♡';
      btn.classList.toggle('wished', has(id));
    });
  };

  const init = () => { load(); _sync(); };

  return { init, has, add, remove, toggle, getAll };
})();

/* ══════════════════════════════════════════════
   AUTH (Local + Google OAuth hook)
══════════════════════════════════════════════ */
const Auth = (() => {
  const KEY = 'store_user_v1';
  let user = null;

  const load = () => {
    try { user = JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch { user = null; }
  };
  const save = (u) => { user = u; localStorage.setItem(KEY, JSON.stringify(u)); };
  const clear = () => { user = null; localStorage.removeItem(KEY); };

  const isLoggedIn = () => !!user;
  const getUser    = () => user;

  // Local email/password login (no server — suitable for prototype)
  const loginLocal = (email, password) => {
    // In production: replace with real API call
    const u = {
      id:       'usr-' + Date.now(),
      email,
      name:     email.split('@')[0].replace(/[^a-zA-Z]/g, ''),
      provider: 'local',
      points:   0,
      tier:     'Silver',
      joinedAt: Date.now(),
    };
    save(u);
    _updateUI();
    return u;
  };

  // Google OAuth login
  const loginGoogle = () => {
    if (typeof STORE === 'undefined' || !STORE.GOOGLE_CLIENT_ID) {
      alert('Google login requires a Google Client ID.\n\nAdd your GOOGLE_CLIENT_ID to js/config.js\n\nGet one free at: console.cloud.google.com');
      return;
    }
    const redirectUri = encodeURIComponent(window.location.origin + '/pages/login.html');
    const scope       = encodeURIComponent('openid email profile');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${STORE.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    window.location.href = url;
  };

  // Handle Google OAuth callback
  const handleGoogleCallback = () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token  = params.get('access_token');
    if (!token) return false;

    // Fetch Google user info
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(info => {
      const u = {
        id:       info.sub,
        email:    info.email,
        name:     info.name || info.email.split('@')[0],
        avatar:   info.picture,
        provider: 'google',
        points:   0,
        tier:     'Silver',
        joinedAt: Date.now(),
      };
      save(u);
      _updateUI();
      window.history.replaceState({}, '', window.location.pathname);
      window.location.href = 'login.html'; // redirect to dashboard
    })
    .catch(console.error);
    return true;
  };

  const logout = () => {
    clear();
    _updateUI();
    window.location.reload();
  };

  // Earn loyalty points
  const earnPoints = (amount) => {
    if (!user) return;
    const ppp = (typeof STORE !== 'undefined') ? STORE.POINTS_PER_DOLLAR : 1;
    user.points = (user.points || 0) + Math.floor(amount * ppp);
    // Update tier
    if (typeof STORE !== 'undefined') {
      const tiers = [...STORE.LOYALTY_TIERS].reverse();
      for (const tier of tiers) {
        if (user.points >= tier.min) { user.tier = tier.name; break; }
      }
    }
    save(user);
  };

  const _updateUI = () => {
    const u = user;
    document.querySelectorAll('.auth-name').forEach(el => el.textContent = u ? u.name : 'Account');
    document.querySelectorAll('.auth-avatar').forEach(el => {
      el.textContent = u ? u.name.charAt(0).toUpperCase() : '👤';
      if (u?.avatar) { el.style.backgroundImage = `url(${u.avatar})`; el.textContent = ''; }
    });
    document.querySelectorAll('.auth-show-loggedin').forEach(el => el.style.display = u ? 'block' : 'none');
    document.querySelectorAll('.auth-show-loggedout').forEach(el => el.style.display = u ? 'none'  : 'block');
    document.querySelectorAll('.auth-points').forEach(el => el.textContent = (u?.points || 0).toLocaleString());
    document.querySelectorAll('.auth-tier').forEach(el => el.textContent = u?.tier || '');
  };

  const init = () => { load(); handleGoogleCallback(); _updateUI(); };

  return { init, isLoggedIn, getUser, loginLocal, loginGoogle, logout, earnPoints };
})();

/* ══════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════ */
let _toastTimer;
const _toast = (msg, icon = '✦') => {
  let el = document.getElementById('store-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'store-toast';
    el.innerHTML = `<span class="toast-icon"></span><span class="toast-msg"></span><button class="toast-x" onclick="this.parentElement.classList.remove('show')">✕</button>`;
    document.body.appendChild(el);
  }
  el.querySelector('.toast-icon').textContent = icon;
  el.querySelector('.toast-msg').textContent  = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
};
const showToast = _toast;

/* ══════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════ */
const Search = (() => {
  const open = () => {
    document.getElementById('search-overlay')?.classList.add('open');
    setTimeout(() => document.querySelector('.search-input')?.focus(), 150);
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    document.getElementById('search-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  const init = () => {
    document.getElementById('search-open-btn')?.addEventListener('click', open);
    document.getElementById('search-close-btn')?.addEventListener('click', close);
    document.getElementById('search-overlay')?.addEventListener('click', e => { if (e.target.id === 'search-overlay') close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    const input = document.querySelector('.search-input');
    input?.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q || typeof PRODUCTS_DB === 'undefined') return;
      const results = PRODUCTS_DB.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags?.some(t => t.includes(q))
      ).slice(0, 5);
      renderResults(results, q);
    });
  };

  const renderResults = (results, q) => {
    const container = document.getElementById('search-results');
    if (!container) return;
    if (!results.length) { container.innerHTML = `<p class="search-no-results">No products found for "${q}"</p>`; return; }
    container.innerHTML = results.map(p => `
      <a href="pages/product.html?id=${p.id}" class="search-result-item">
        <span class="sri-name">${p.name}</span>
        <span class="sri-cat">${p.category}</span>
        <span class="sri-price">${typeof STORE !== 'undefined' ? STORE.CURRENCY_SYMBOL : '$'}${p.price.toFixed(2)}</span>
      </a>
    `).join('');
  };

  return { init, open, close };
})();

/* ══════════════════════════════════════════════
   INIT ALL
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
  Wishlist.init();
  Auth.init();
  Search.init();
});
