/* ═══════════════════════════════════════════════════════════════
   MAISON AURÉA — CHECKOUT ENGINE
   Multi-step · Validation · Order Summary · Payment UI
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── CHECKOUT STATE ────────────────────────────────────────────────
const Checkout = (() => {
  let step  = 1;
  const TOTAL_STEPS = 3;

  const data = {
    contact: {},
    shipping: {},
    payment:  {},
  };

  // ── STEP NAVIGATION ──
  const goTo = (n) => {
    if (n < 1 || n > TOTAL_STEPS) return;

    // validate current before proceeding
    if (n > step && !validateStep(step)) return;

    step = n;
    document.querySelectorAll('.co-step-panel').forEach((panel, i) => {
      panel.classList.toggle('active', i + 1 === step);
      panel.style.display = i + 1 === step ? 'block' : 'none';
    });

    // breadcrumb
    document.querySelectorAll('.co-breadcrumb-step').forEach((s, i) => {
      s.classList.toggle('done',    i + 1 < step);
      s.classList.toggle('active',  i + 1 === step);
      s.classList.toggle('future',  i + 1 > step);
    });

    // update summary
    renderSummary();

    // scroll top
    document.querySelector('.checkout-main')?.scrollTo({ top:0, behavior:'smooth' });

    // animate in
    const panel = document.querySelector(`.co-step-panel:nth-child(${step})`);
    if (panel) {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        panel.style.transition = 'opacity .5s var(--ease-out), transform .5s var(--ease-out)';
        panel.style.opacity = '1';
        panel.style.transform = 'none';
      });
    }
  };

  // ── VALIDATION ──
  const validateStep = (n) => {
    const panel = document.querySelectorAll('.co-step-panel')[n - 1];
    if (!panel) return true;
    let valid = true;

    panel.querySelectorAll('[required]').forEach(field => {
      field.classList.remove('field-error');
      if (!field.value.trim()) {
        field.classList.add('field-error');
        field.style.borderColor = 'rgba(200,120,96,.7)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    // Email validation
    const email = panel.querySelector('[type="email"]');
    if (email && email.value && !/\S+@\S+\.\S+/.test(email.value)) {
      email.classList.add('field-error');
      email.style.borderColor = 'rgba(200,120,96,.7)';
      valid = false;
    }

    if (!valid && typeof showToast !== 'undefined') {
      showToast('Please fill in all required fields.', '⚠');
    }
    return valid;
  };

  // ── ORDER SUMMARY ──
  const renderSummary = () => {
    const list = document.getElementById('co-items');
    const sub  = document.getElementById('co-subtotal');
    const ship = document.getElementById('co-shipping');
    const tax  = document.getElementById('co-tax');
    const tot  = document.getElementById('co-total');
    if (!list) return;

    // get cart items from localStorage
    let items = [];
    try { items = JSON.parse(localStorage.getItem('aurea_cart') || '[]'); } catch {}

    if (!items.length) {
      list.innerHTML = `<p style="font-family:var(--font-serif);font-style:italic;font-size:14px;color:rgba(240,232,220,.3);text-align:center;padding:20px 0">Your bag is empty.</p>`;
      return;
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shippingCost = subtotal >= 150 ? 0 : 12;
    const taxAmount    = subtotal * 0.08;
    const total        = subtotal + shippingCost + taxAmount;

    list.innerHTML = items.map(item => `
      <div class="co-item">
        <div class="co-item-img">${item.icon || '✦'}</div>
        <div class="co-item-info">
          <span class="co-item-name">${item.name}</span>
          ${item.variant ? `<span class="co-item-variant">${item.variant}</span>` : ''}
          <span class="co-item-qty">Qty: ${item.qty}</span>
        </div>
        <span class="co-item-price">$${(item.price * item.qty).toFixed(0)}</span>
      </div>
    `).join('');

    if (sub)  sub.textContent  = '$' + subtotal.toFixed(2);
    if (ship) ship.textContent = shippingCost === 0 ? 'Free' : '$' + shippingCost.toFixed(2);
    if (tax)  tax.textContent  = '$' + taxAmount.toFixed(2);
    if (tot)  tot.textContent  = '$' + total.toFixed(2);
  };

  // ── COUPON ──
  const initCoupon = () => {
    const btn   = document.getElementById('coupon-apply');
    const input = document.getElementById('coupon-input');
    const msg   = document.getElementById('coupon-msg');
    const CODES = { 'AUREA10': 10, 'WELCOME15': 15, 'BEAUTY20': 20 };

    btn?.addEventListener('click', () => {
      const code = input?.value.trim().toUpperCase();
      if (CODES[code]) {
        if (msg) { msg.textContent = `✓ ${CODES[code]}% discount applied!`; msg.style.color = 'var(--sage)'; }
        if (typeof showToast !== 'undefined') showToast(`${CODES[code]}% discount applied!`, '✦');
      } else {
        if (msg) { msg.textContent = 'Invalid code. Try AUREA10'; msg.style.color = 'var(--rose)'; }
      }
    });
  };

  // ── CARD INPUT FORMATTING ──
  const initCardFormatting = () => {
    const cardNum = document.getElementById('card-number');
    const cardExp = document.getElementById('card-expiry');
    const cardCvv = document.getElementById('card-cvv');

    cardNum?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
      // detect card type
      const ct = document.getElementById('card-type');
      if (ct) {
        if (/^4/.test(v))      ct.textContent = 'VISA';
        else if (/^5/.test(v)) ct.textContent = 'MC';
        else if (/^3[47]/.test(v)) ct.textContent = 'AMEX';
        else ct.textContent = '';
      }
    });

    cardExp?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
      e.target.value = v;
    });

    cardCvv?.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  };

  // ── PAYMENT METHODS ──
  const initPaymentMethods = () => {
    const methods     = document.querySelectorAll('.pay-method-btn');
    const cardForm    = document.getElementById('card-form');
    const paypalForm  = document.getElementById('paypal-form');

    methods.forEach(btn => {
      btn.addEventListener('click', () => {
        methods.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (cardForm)   cardForm.style.display   = btn.dataset.method === 'card'   ? 'block' : 'none';
        if (paypalForm) paypalForm.style.display  = btn.dataset.method === 'paypal' ? 'block' : 'none';
      });
    });
  };

  // ── PLACE ORDER ──
  const placeOrder = () => {
    if (!validateStep(3)) return;

    const btn = document.getElementById('place-order-btn');
    if (btn) {
      btn.textContent = 'Processing…';
      btn.disabled = true;
      btn.style.background = 'var(--dust)';
    }

    setTimeout(() => {
      // clear cart
      localStorage.removeItem('aurea_cart');
      // show success
      document.querySelector('.checkout-main')?.style.setProperty('display', 'none');
      const success = document.getElementById('order-success');
      if (success) {
        success.style.display = 'flex';
        const num = 'AUR-' + Date.now().toString().slice(-6);
        const el  = document.getElementById('order-number');
        if (el) el.textContent = num;
      }
    }, 2200);
  };

  // ── INIT ──
  const init = () => {
    renderSummary();
    initCoupon();
    initCardFormatting();
    initPaymentMethods();

    // Next / Back buttons
    document.querySelectorAll('[data-co-next]').forEach(btn => {
      btn.addEventListener('click', () => goTo(parseInt(btn.dataset.coNext)));
    });
    document.querySelectorAll('[data-co-back]').forEach(btn => {
      btn.addEventListener('click', () => goTo(parseInt(btn.dataset.coBack)));
    });
    document.querySelectorAll('.co-breadcrumb-step.done, .co-breadcrumb-step.active').forEach((s, i) => {
      s.addEventListener('click', () => goTo(i + 1));
    });

    // Place order
    document.getElementById('place-order-btn')?.addEventListener('click', placeOrder);

    // shipping method switch
    document.querySelectorAll('[name="shipping-method"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const shipEl = document.getElementById('co-shipping');
        if (shipEl) shipEl.textContent = radio.value === 'express' ? '$24.00' : (radio.value === 'overnight' ? '$38.00' : 'Free');
      });
    });

    // show first step
    goTo(1);
  };

  return { init, goTo };
})();

document.addEventListener('DOMContentLoaded', Checkout.init);
