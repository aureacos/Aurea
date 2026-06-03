/* ================================================================
   REAL REVIEW SYSTEM
   Reviews are saved locally (IndexedDB / localStorage).
   When you add your Supabase credentials in config.js,
   reviews automatically sync to the cloud permanently.
================================================================ */

'use strict';

const ReviewSystem = (() => {

  const STORAGE_KEY = 'store_reviews_v1';

  // ── LOAD ALL REVIEWS ──────────────────────────────────────────
  const loadAll = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  };

  // ── SAVE ALL REVIEWS ──────────────────────────────────────────
  const saveAll = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // ── GET REVIEWS FOR ONE PRODUCT ───────────────────────────────
  const getForProduct = (productId) => {
    const all = loadAll();
    return (all[productId] || []).sort((a, b) => b.timestamp - a.timestamp);
  };

  // ── ADD A REVIEW ──────────────────────────────────────────────
  const addReview = async (productId, reviewData) => {
    // Validate
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) throw new Error('Rating required');
    if (!reviewData.name?.trim()) throw new Error('Name required');
    if (!reviewData.email?.trim() || !reviewData.email.includes('@')) throw new Error('Valid email required');
    if (!reviewData.body?.trim() || reviewData.body.trim().length < 20) throw new Error('Review must be at least 20 characters');

    const review = {
      id:          'rv-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
      productId,
      name:        reviewData.name.trim(),
      email:       reviewData.email.trim(), // stored but not displayed
      title:       reviewData.title?.trim() || '',
      body:        reviewData.body.trim(),
      rating:      parseInt(reviewData.rating),
      verified:    false,          // becomes true after order confirmed
      helpful:     0,
      timestamp:   Date.now(),
      dateDisplay: new Date().toLocaleDateString('en-US', { year:'numeric', month:'long' }),
      avatar:      reviewData.name.trim().charAt(0).toUpperCase(),
    };

    // Save locally first (always works)
    const all = loadAll();
    if (!all[productId]) all[productId] = [];
    all[productId].unshift(review);
    saveAll(all);

    // Sync to Supabase if configured
    if (typeof STORE !== 'undefined' && STORE.SUPABASE_URL && STORE.SUPABASE_KEY) {
      try {
        await syncToSupabase(review);
        review.synced = true;
        saveAll(all);
      } catch (err) {
        console.warn('Supabase sync failed — review saved locally:', err.message);
      }
    }

    return review;
  };

  // ── MARK HELPFUL ──────────────────────────────────────────────
  const markHelpful = (productId, reviewId) => {
    const all = loadAll();
    const list = all[productId] || [];
    const review = list.find(r => r.id === reviewId);
    if (review) {
      // Prevent double-voting (stored in session)
      const voted = JSON.parse(sessionStorage.getItem('voted_helpful') || '[]');
      if (voted.includes(reviewId)) return false;
      review.helpful = (review.helpful || 0) + 1;
      saveAll(all);
      voted.push(reviewId);
      sessionStorage.setItem('voted_helpful', JSON.stringify(voted));
      return true;
    }
    return false;
  };

  // ── SUPABASE SYNC ─────────────────────────────────────────────
  const syncToSupabase = async (review) => {
    if (typeof STORE === 'undefined' || !STORE.SUPABASE_URL) return;
    const res = await fetch(`${STORE.SUPABASE_URL}/rest/v1/reviews`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        STORE.SUPABASE_KEY,
        'Authorization': 'Bearer ' + STORE.SUPABASE_KEY,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        product_id:   review.productId,
        reviewer_name: review.name,
        title:        review.title,
        body:         review.body,
        rating:       review.rating,
        verified:     review.verified,
        helpful:      review.helpful,
        created_at:   new Date(review.timestamp).toISOString(),
      }),
    });
    if (!res.ok) throw new Error('Supabase error: ' + res.status);
  };

  // ── LOAD FROM SUPABASE (on page load if configured) ──────────
  const loadFromSupabase = async (productId) => {
    if (typeof STORE === 'undefined' || !STORE.SUPABASE_URL) return null;
    try {
      const res = await fetch(
        `${STORE.SUPABASE_URL}/rest/v1/reviews?product_id=eq.${productId}&order=created_at.desc`,
        {
          headers: {
            'apikey':        STORE.SUPABASE_KEY,
            'Authorization': 'Bearer ' + STORE.SUPABASE_KEY,
          },
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      // merge into local
      const all = loadAll();
      all[productId] = data.map(r => ({
        id:          r.id,
        productId:   r.product_id,
        name:        r.reviewer_name,
        title:       r.title,
        body:        r.body,
        rating:      r.rating,
        verified:    r.verified,
        helpful:     r.helpful,
        timestamp:   new Date(r.created_at).getTime(),
        dateDisplay: new Date(r.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long' }),
        avatar:      (r.reviewer_name || 'A').charAt(0).toUpperCase(),
        synced:      true,
      }));
      saveAll(all);
      return all[productId];
    } catch { return null; }
  };

  // ── COMPUTE STATS ─────────────────────────────────────────────
  const getStats = (productId) => {
    const reviews = getForProduct(productId);
    if (!reviews.length) return { average: 0, count: 0, distribution: [0,0,0,0,0] };
    const total = reviews.reduce((s, r) => s + r.rating, 0);
    const dist  = [0,0,0,0,0];
    reviews.forEach(r => dist[r.rating - 1]++);
    return {
      average:      Math.round((total / reviews.length) * 10) / 10,
      count:        reviews.length,
      distribution: dist.reverse(), // [5★, 4★, 3★, 2★, 1★]
    };
  };

  // ── RENDER REVIEW CARD ────────────────────────────────────────
  const renderCard = (r, productId) => {
    const voted = JSON.parse(sessionStorage.getItem('voted_helpful') || '[]');
    const alreadyVoted = voted.includes(r.id);
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    return `
      <div class="review-card" data-review-id="${r.id}">
        <div class="rc-header">
          <div class="rc-avatar">${r.avatar}</div>
          <div class="rc-meta">
            <span class="rc-name">${escHtml(r.name)}</span>
            <span class="rc-date">${r.dateDisplay}</span>
          </div>
          <div class="rc-stars">${stars}</div>
          ${r.verified ? '<span class="rc-verified">✓ Verified Purchase</span>' : ''}
        </div>
        ${r.title ? `<h4 class="rc-title">${escHtml(r.title)}</h4>` : ''}
        <p class="rc-body">${escHtml(r.body)}</p>
        <div class="rc-footer">
          <span class="rc-helpful-label">Helpful?</span>
          <button class="rc-helpful-btn ${alreadyVoted ? 'voted' : ''}"
            onclick="ReviewSystem.handleHelpful('${productId}','${r.id}',this)"
            ${alreadyVoted ? 'disabled' : ''}>
            👍 ${r.helpful || 0}
          </button>
        </div>
      </div>
    `;
  };

  // ── HELPFUL HANDLER (called from HTML) ────────────────────────
  const handleHelpful = (productId, reviewId, btn) => {
    if (markHelpful(productId, reviewId)) {
      const n = parseInt(btn.textContent.replace(/\D/g,'')) + 1;
      btn.textContent = '👍 ' + n;
      btn.classList.add('voted');
      btn.disabled = true;
    }
  };

  // ── RENDER FULL REVIEW SECTION ────────────────────────────────
  const renderSection = async (productId, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="reviews-loading">Loading reviews…</div>`;

    // Try Supabase first
    await loadFromSupabase(productId);
    const reviews = getForProduct(productId);
    const stats   = getStats(productId);

    const pct = (n, total) => total ? Math.round((n / total) * 100) : 0;

    container.innerHTML = `
      <div class="reviews-summary-row">
        <div class="rs-score-block">
          <span class="rs-big-num">${stats.average || '—'}</span>
          <div class="rs-stars">${stats.average ? '★'.repeat(Math.round(stats.average)) + '☆'.repeat(5-Math.round(stats.average)) : '☆☆☆☆☆'}</div>
          <span class="rs-count">${stats.count} ${stats.count === 1 ? 'review' : 'reviews'}</span>
        </div>
        <div class="rs-bars">
          ${[5,4,3,2,1].map((star, i) => `
            <div class="rs-bar-row">
              <span class="rs-bar-label">${star} ★</span>
              <div class="rs-bar-track"><div class="rs-bar-fill" style="width:${pct(stats.distribution[i], stats.count)}%"></div></div>
              <span class="rs-bar-num">${stats.distribution[i]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div id="reviews-list">
        ${reviews.length
          ? reviews.map(r => renderCard(r, productId)).join('')
          : `<div class="reviews-empty">
               <p>No reviews yet. Be the first to share your experience!</p>
             </div>`
        }
      </div>

      <!-- WRITE A REVIEW FORM -->
      <div class="review-form-wrap" id="review-form-wrap">
        <h3 class="rf-title">Write a <em>Review</em></h3>
        <p class="rf-subtitle">Share your honest experience to help others make informed choices.</p>
        <form id="review-submit-form" data-product-id="${productId}">
          <div class="rf-stars-row">
            <label class="rf-label">Your Rating *</label>
            <div class="rf-star-input" id="rf-stars">
              ${[1,2,3,4,5].map(n => `<button type="button" class="rf-star" data-val="${n}" aria-label="${n} stars">★</button>`).join('')}
            </div>
            <input type="hidden" id="rf-rating" value="0">
          </div>
          <div class="rf-fields">
            <div class="rf-row">
              <div class="rf-field">
                <label class="rf-label" for="rf-name">Your Name *</label>
                <input type="text" id="rf-name" class="rf-input" placeholder="First name or initials" required maxlength="60">
              </div>
              <div class="rf-field">
                <label class="rf-label" for="rf-email">Email *</label>
                <input type="email" id="rf-email" class="rf-input" placeholder="Not shown publicly" required>
              </div>
            </div>
            <div class="rf-field">
              <label class="rf-label" for="rf-title">Review Title</label>
              <input type="text" id="rf-title" class="rf-input" placeholder="Summarise your experience" maxlength="100">
            </div>
            <div class="rf-field">
              <label class="rf-label" for="rf-body">Your Review * <span class="rf-chars" id="rf-chars">0 / 1000</span></label>
              <textarea id="rf-body" class="rf-textarea" placeholder="Tell us what you really think — good or bad. Minimum 20 characters." required minlength="20" maxlength="1000"></textarea>
            </div>
          </div>
          <div id="rf-error" class="rf-error" style="display:none"></div>
          <button type="submit" class="rf-submit" id="rf-submit-btn">
            <span>Submit Review</span>
          </button>
          <p class="rf-note">Reviews are published immediately and stored locally. When you connect a database in config.js, they sync permanently.</p>
        </form>
        <div id="rf-success" class="rf-success" style="display:none">
          <div class="rf-success-icon">✦</div>
          <h4>Thank you for your review!</h4>
          <p>Your experience helps other customers make better decisions.</p>
          <button onclick="document.getElementById('rf-success').style.display='none';document.getElementById('review-submit-form').style.display='block'">Write another</button>
        </div>
      </div>
    `;

    // Star rating interaction
    let selectedRating = 0;
    const starBtns = container.querySelectorAll('.rf-star');
    const ratingInput = container.querySelector('#rf-rating');

    starBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        const val = parseInt(btn.dataset.val);
        starBtns.forEach(s => s.classList.toggle('hover', parseInt(s.dataset.val) <= val));
      });
      btn.addEventListener('mouseleave', () => {
        starBtns.forEach(s => s.classList.remove('hover'));
      });
      btn.addEventListener('click', () => {
        selectedRating = parseInt(btn.dataset.val);
        ratingInput.value = selectedRating;
        starBtns.forEach(s => s.classList.toggle('selected', parseInt(s.dataset.val) <= selectedRating));
      });
    });

    // Char counter
    const bodyArea = container.querySelector('#rf-body');
    const charCount = container.querySelector('#rf-chars');
    bodyArea?.addEventListener('input', () => {
      if (charCount) charCount.textContent = bodyArea.value.length + ' / 1000';
    });

    // Form submission
    const form = container.querySelector('#review-submit-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = container.querySelector('#rf-error');
      const btn   = container.querySelector('#rf-submit-btn');

      const data = {
        rating: parseInt(container.querySelector('#rf-rating').value),
        name:   container.querySelector('#rf-name').value,
        email:  container.querySelector('#rf-email').value,
        title:  container.querySelector('#rf-title').value,
        body:   container.querySelector('#rf-body').value,
      };

      btn.textContent = 'Submitting…';
      btn.disabled    = true;
      if (errEl) errEl.style.display = 'none';

      try {
        await addReview(productId, data);
        form.style.display = 'none';
        const success = container.querySelector('#rf-success');
        if (success) success.style.display = 'flex';
        // Refresh list
        setTimeout(() => renderSection(productId, containerId), 500);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        btn.textContent = 'Submit Review';
        btn.disabled    = false;
      }
    });
  };

  // ── ESCAPE HTML ───────────────────────────────────────────────
  const escHtml = (s) => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  return { getForProduct, addReview, getStats, renderSection, handleHelpful, markHelpful };
})();
