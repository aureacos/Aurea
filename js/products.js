/* ================================================================
   PRODUCTS DATABASE
   Add YOUR real products here. Each product becomes a full page.
   Instructions: fill in name, price, description, ingredients etc.
================================================================ */

const PRODUCTS_DB = [
  // ─────────────────────────────────────────────────────────────
  // TEMPLATE — Copy this block to add a new product
  // ─────────────────────────────────────────────────────────────
  {
    id:          'product-1',           // unique ID, no spaces
    name:        'Your Product Name',   // ← your product name
    subtitle:    'Short tagline here',  // ← one-line description
    category:    'skincare',            // skincare|makeup|fragrance|body|sets
    price:       0,                     // ← your price (number)
    salePrice:   null,                  // ← sale price or null
    new:         true,                  // show "New" badge?
    bestseller:  false,                 // show "Bestseller" badge?
    inStock:     true,
    stockCount:  50,
    sku:         'SKU-001',
    weight:      '30ml',               // ← size/weight
    // Description shown on product page
    description: 'Write your full product description here. Tell customers what makes this product special, what it does, and why they need it in their life.',
    // Short version for cards
    shortDesc:   'Short version for product cards — one or two sentences.',
    // What results to expect
    benefits: [
      'Benefit one — what it does',
      'Benefit two — what it does',
      'Benefit three — what it does',
    ],
    // Full ingredient list
    ingredients: 'Aqua, [your full INCI ingredient list here]',
    // Key ingredients shown as pills
    keyIngredients: ['Ingredient 1', 'Ingredient 2', 'Ingredient 3'],
    // How to use
    howToUse: [
      'Step 1 — how to apply',
      'Step 2 — how to apply',
      'Step 3 — results timeline',
    ],
    // Available shades/variants (empty array if none)
    shades: [
      // { id: 'shade-1', name: 'Shade Name', color: '#hexcolor' },
    ],
    // Available sizes (empty array if just one size)
    sizes: [
      // { id: 'size-30', label: '30ml', price: 0 },
      // { id: 'size-50', label: '50ml', price: 0 },
    ],
    // Skin type compatibility
    skinTypes: ['All Skin Types'],      // Dry|Oily|Combination|Sensitive|All Skin Types
    // Tags for filtering
    tags: ['vegan', 'cruelty-free'],
    // Visual theme colour (used for product card background gradient)
    themeColor: '#1e0c08',             // dark colour for card background
    themeColor2: '#3a1810',            // second gradient colour
    // Product images (add real image paths when you have photos)
    images: [
      // 'assets/images/product-1-main.jpg',
      // 'assets/images/product-1-angle.jpg',
      // 'assets/images/product-1-texture.jpg',
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ADD YOUR SECOND PRODUCT HERE (copy the block above)
  // ─────────────────────────────────────────────────────────────
  {
    id:          'product-2',
    name:        'Your Second Product',
    subtitle:    'Tagline for product two',
    category:    'makeup',
    price:       0,
    salePrice:   null,
    new:         false,
    bestseller:  false,
    inStock:     true,
    stockCount:  30,
    sku:         'SKU-002',
    weight:      '15ml',
    description: 'Description for your second product.',
    shortDesc:   'Short description for cards.',
    benefits:    ['Benefit one', 'Benefit two'],
    ingredients: 'Your ingredient list here',
    keyIngredients: ['Key ingredient 1', 'Key ingredient 2'],
    howToUse:    ['Step 1', 'Step 2'],
    shades:      [],
    sizes:       [],
    skinTypes:   ['All Skin Types'],
    tags:        ['vegan'],
    themeColor:  '#0c140e',
    themeColor2: '#162814',
    images:      [],
  },

  // ─────────────────────────────────────────────────────────────
  // ADD MORE PRODUCTS BELOW (keep copying the template block)
  // ─────────────────────────────────────────────────────────────
];

/* ── HELPERS ── */

// Get all products
function getAllProducts()      { return PRODUCTS_DB; }

// Get product by id
function getProductById(id)    { return PRODUCTS_DB.find(p => p.id === id) || null; }

// Get products by category
function getByCategory(cat)    { return cat === 'all' ? PRODUCTS_DB : PRODUCTS_DB.filter(p => p.category === cat); }

// Filter products
function filterProducts({ category='all', minPrice=0, maxPrice=99999, tags=[], skinTypes=[], search='' } = {}) {
  return PRODUCTS_DB.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (p.price < minPrice || p.price > maxPrice) return false;
    if (tags.length && !tags.every(t => p.tags.includes(t))) return false;
    if (skinTypes.length && !skinTypes.some(s => p.skinTypes.includes(s) || p.skinTypes.includes('All Skin Types'))) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some(t => t.includes(q))) return false;
    }
    return true;
  });
}

// Sort products
function sortProducts(list, method='featured') {
  const sorted = [...list];
  switch (method) {
    case 'price-asc':  return sorted.sort((a,b) => a.price - b.price);
    case 'price-desc': return sorted.sort((a,b) => b.price - a.price);
    case 'newest':     return sorted.sort((a,b) => b.new - a.new);
    case 'name-asc':   return sorted.sort((a,b) => a.name.localeCompare(b.name));
    default:           return sorted;
  }
}

// Get categories with counts
function getCategories() {
  const cats = {};
  PRODUCTS_DB.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
  return cats;
}

// Format price
function formatPrice(n) {
  if (typeof STORE !== 'undefined') return STORE.CURRENCY_SYMBOL + Number(n).toFixed(2);
  return '$' + Number(n).toFixed(2);
}

if (typeof module !== 'undefined') module.exports = { PRODUCTS_DB, getAllProducts, getProductById, getByCategory, filterProducts, sortProducts, getCategories, formatPrice };
