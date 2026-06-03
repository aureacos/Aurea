/* ================================================================
   STORE CONFIG — Edit this file to customise your entire store.
   Change BRAND_NAME and everything updates automatically.
================================================================ */
const STORE = {
  // ── BRAND ──────────────────────────────────────────────────────
  BRAND_NAME:    'YOUR BRAND',          // ← Change this
  BRAND_TAGLINE: 'Haute Cosmétique',    // ← Change this
  BRAND_CITY:    'Paris',               // ← Change this
  BRAND_EST:     '2025',                // ← Change this
  BRAND_EMAIL:   'hello@yourbrand.com', // ← Change this
  BRAND_PHONE:   '+1 (000) 000-0000',   // ← Change this
  BRAND_ADDRESS: 'Your Address Here',   // ← Change this
  BRAND_SOCIAL: {
    instagram: 'https://instagram.com/yourbrand',
    tiktok:    'https://tiktok.com/@yourbrand',
    pinterest: 'https://pinterest.com/yourbrand',
    youtube:   '',
  },

  // ── SHIPPING ───────────────────────────────────────────────────
  FREE_SHIPPING_THRESHOLD: 150,  // free shipping above this $
  TAX_RATE: 0.08,                // 8% — change to your rate

  // ── CURRENCY ───────────────────────────────────────────────────
  CURRENCY_SYMBOL: '$',
  CURRENCY_CODE:   'USD',

  // ── FEATURES ───────────────────────────────────────────────────
  ENABLE_REVIEWS:   true,   // customer reviews enabled
  ENABLE_WISHLIST:  true,   // wishlist feature
  ENABLE_LOYALTY:   true,   // loyalty points
  POINTS_PER_DOLLAR: 1,     // 1 point per $1 spent
  LOYALTY_TIERS: [
    { name:'Silver', min:0,    discount:0  },
    { name:'Gold',   min:500,  discount:5  },  // 5% off
    { name:'Platinum',min:2000,discount:10 },  // 10% off
  ],

  // ── COUPON CODES ───────────────────────────────────────────────
  // Add your real discount codes here
  COUPONS: {
    'WELCOME10': { type:'percent', value:10, desc:'10% welcome discount' },
    'SAVE15':    { type:'percent', value:15, desc:'15% off' },
    'FREESHIP':  { type:'shipping', value:0, desc:'Free shipping' },
  },

  // ── GOOGLE OAUTH (fill in when you have your Google Console keys) ──
  GOOGLE_CLIENT_ID: '',   // ← paste your Google Client ID here
  // How to get it: console.cloud.google.com → Create project → OAuth → Web client
  // Redirect URI: https://yourdomain.com/pages/login.html

  // ── SUPABASE (for permanent reviews + user accounts) ──
  SUPABASE_URL: '',       // ← paste from supabase.com dashboard
  SUPABASE_KEY: '',       // ← paste anon/public key

  // ── STRIPE (for real payments) ──
  STRIPE_PUBLIC_KEY: '',  // ← paste from stripe.com dashboard
};

// Apply brand name everywhere on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-brand]').forEach(el => {
    el.textContent = STORE.BRAND_NAME;
  });
  document.querySelectorAll('[data-brand-tagline]').forEach(el => {
    el.textContent = STORE.BRAND_TAGLINE;
  });
  document.querySelectorAll('[data-brand-email]').forEach(el => {
    el.textContent = STORE.BRAND_EMAIL;
    if (el.tagName === 'A') el.href = 'mailto:' + STORE.BRAND_EMAIL;
  });
  // Update page title
  if (document.title.includes('|')) {
    document.title = document.title.split('|')[0].trim() + ' | ' + STORE.BRAND_NAME;
  }
});

if (typeof module !== 'undefined') module.exports = STORE;
