/**
 * AURA FRAGRANCES — LUXURY HAUTE PARFUMERIE LOGIC
 * Dynamic Cart, Currency Switcher, Scent Quiz, Quick View, Discovery Builder
 */

// Application State (Native Currency: PKR - Affordable Luxury)
const state = {
  currency: 'PKR',
  cart: JSON.parse(localStorage.getItem('aura_cart_v1') || localStorage.getItem('rangwani_cart_v2') || '[]'),
  discount: 0,
  promoCodeApplied: null,
  activeFilter: 'all',
  discoverySlots: [null, null, null],
  currentQuizStep: 0,
  quizAnswers: []
};

// Web Audio API Synthetic Perfume Spray Sound Effect
function playLuxurySpraySound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 0.35; // 350ms spray
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.12));
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {
    // Audio synthesis fallback
  }
}

// Format Price according to current currency (Base: PKR)
function formatPrice(amountInPKR) {
  const curr = CURRENCIES[state.currency] || CURRENCIES.PKR;
  const converted = Math.round(amountInPKR * curr.rate);
  return `${curr.symbol}${converted.toLocaleString()}`;
}

// Toast Notification
function showToast(message) {
  let toast = document.getElementById('aura-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aura-toast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✨</span> ${message}`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderProducts();
  renderCandles();
  renderDiscoveryBuilder();
  renderStoryBubbles();
  renderInfluencerReels();
  updateCartUI();
});

// Event Listeners
function initEventListeners() {
  // Currency Selector
  const currSelect = document.getElementById('currency-selector');
  if (currSelect) {
    currSelect.value = state.currency;
    currSelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      renderProducts();
      renderCandles();
      renderDiscoveryBuilder();
      updateCartUI();
      showToast(`Currency changed to ${state.currency}`);
    });
  }

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter;
      renderProducts();
    });
  });

  // Mobile Drawer
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const closeDrawer = document.getElementById('close-drawer-btn');

  if (menuBtn && drawer && overlay) {
    const toggleMenu = (open) => {
      drawer.classList.toggle('active', open);
      overlay.classList.toggle('active', open);
    };
    menuBtn.addEventListener('click', () => toggleMenu(true));
    if (closeDrawer) closeDrawer.addEventListener('click', () => toggleMenu(false));
    overlay.addEventListener('click', () => toggleMenu(false));
  }

  // Cart Drawer
  const cartBtn = document.getElementById('cart-toggle-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart-btn');

  if (cartBtn && cartDrawer && cartOverlay) {
    const toggleCart = (open) => {
      cartDrawer.classList.toggle('active', open);
      cartOverlay.classList.toggle('active', open);
    };
    cartBtn.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    cartOverlay.addEventListener('click', () => toggleCart(false));
  }

  // Search Modal
  const searchBtn = document.getElementById('search-toggle-btn');
  const searchModal = document.getElementById('search-modal');
  const closeSearchBtn = document.getElementById('close-search-btn');
  const searchInput = document.getElementById('search-input');

  if (searchBtn && searchModal) {
    const toggleSearch = (open) => {
      searchModal.classList.toggle('active', open);
      if (open && searchInput) {
        setTimeout(() => searchInput.focus(), 200);
      }
    };
    searchBtn.addEventListener('click', () => toggleSearch(true));
    if (closeSearchBtn) closeSearchBtn.addEventListener('click', () => toggleSearch(false));
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
      });
    }
  }

  // Scent Quiz Modal Triggers
  const openQuizBtns = document.querySelectorAll('.open-quiz-trigger');
  const quizModal = document.getElementById('quiz-modal');
  const closeQuizBtn = document.getElementById('close-quiz-btn');

  openQuizBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      startQuiz();
      if (quizModal) quizModal.classList.add('active');
    });
  });
  if (closeQuizBtn && quizModal) {
    closeQuizBtn.addEventListener('click', () => quizModal.classList.remove('active'));
  }

  // Quick View Close
  const qvModal = document.getElementById('quickview-modal');
  const closeQvBtn = document.getElementById('close-quickview-btn');
  if (closeQvBtn && qvModal) {
    closeQvBtn.addEventListener('click', () => qvModal.classList.remove('active'));
  }

  // Promo Code in Cart
  const applyPromoBtn = document.getElementById('apply-promo-btn');
  const promoInput = document.getElementById('promo-input');
  if (applyPromoBtn && promoInput) {
    applyPromoBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'ROYAL20' || code === 'RANGWANI20') {
        state.discount = 0.20;
        state.promoCodeApplied = code;
        updateCartUI();
        showToast(`Promo code ${code} applied! 20% royal discount granted.`);
      } else if (code === '') {
        showToast('Please enter a voucher code.');
      } else {
        showToast('Invalid code. Use ROYAL20 for 20% off!');
      }
    });
  }

  // Checkout Button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}

// Render Products Grid
function renderProducts() {
  const container = document.getElementById('perfumes-grid');
  if (!container) return;

  let filtered = PRODUCTS_DATA;
  if (state.activeFilter === 'men') {
    filtered = PRODUCTS_DATA.filter(p => p.gender === 'men' || p.gender === 'unisex');
  } else if (state.activeFilter === 'women') {
    filtered = PRODUCTS_DATA.filter(p => p.gender === 'women' || p.gender === 'unisex');
  } else if (state.activeFilter === 'unisex') {
    filtered = PRODUCTS_DATA.filter(p => p.gender === 'unisex');
  } else if (state.activeFilter === 'bestseller') {
    filtered = PRODUCTS_DATA.filter(p => p.isBestSeller);
  }

  container.innerHTML = filtered.map(product => {
    const ingredientsHtml = product.ingredients.map(ing => `
      <div class="ingredient-chip" title="${ing.name} from ${ing.origin}">
        <span>${ing.icon}</span>
        <span>${ing.name}</span>
      </div>
    `).join('');

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-visual-wrap">
          <img src="${product.image}" alt="${product.name} Extrait de Parfum" class="product-img" loading="lazy">
          <span class="product-badge">${product.badge}</span>
          
          <!-- Side Ingredients Visual Overlay -->
          <div class="product-ingredients-strip">
            ${ingredientsHtml}
          </div>

          <button class="product-quick-view-btn" onclick="openQuickView('${product.id}')">
            Quick View
          </button>
        </div>

        <div class="product-body">
          <div class="product-category-gender">
            <span class="product-category">${product.family}</span>
            <div class="product-rating">
              <span>★</span>
              <span>${product.rating}</span>
              <span style="color: var(--text-muted); font-size: 0.7rem;">(${product.reviewsCount})</span>
            </div>
          </div>

          <h3 class="product-name">${product.name}</h3>
          <p class="product-tagline">"${product.tagline}"</p>

          <div class="product-notes-preview">
            <div class="notes-label">Key Olfactory Accords:</div>
            <div class="notes-list">${product.topNotes.slice(0, 2).join(' • ')} • ${product.baseNotes.slice(0, 1).join('')}</div>
          </div>

          <div class="product-footer">
            <div class="product-pricing">
              <span class="price-current">${formatPrice(product.price)}</span>
              <span class="price-original">${formatPrice(product.originalPrice)}</span>
            </div>
            <button class="btn-add-bag" onclick="addToCart('${product.id}', 'perfume')">
              <span>+</span> Add to Bag
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Candles Grid
function renderCandles() {
  const container = document.getElementById('candles-grid');
  if (!container) return;

  container.innerHTML = CANDLES_DATA.map(candle => `
    <div class="product-card" data-id="${candle.id}">
      <div class="product-visual-wrap" style="aspect-ratio: 1.2 / 1;">
        <img src="${candle.image}" alt="${candle.name}" class="product-img" loading="lazy">
        <span class="product-badge">Artisan Candle</span>
        <button class="product-quick-view-btn" onclick="openCandleQuickView('${candle.id}')">
          View Details
        </button>
      </div>

      <div class="product-body">
        <div class="product-category-gender">
          <span class="product-category">Pure Soy Wax & Wooden Wick</span>
          <div class="product-rating">
            <span>★</span>
            <span>${candle.rating}</span>
          </div>
        </div>

        <h3 class="product-name">${candle.name}</h3>
        <p class="product-tagline">"${candle.tagline}"</p>

        <div class="product-notes-preview">
          <div class="notes-label">Burn Time & Vessel:</div>
          <div class="notes-list">${candle.burnTime} • ${candle.weight}</div>
        </div>

        <div class="product-footer">
          <div class="product-pricing">
            <span class="price-current">${formatPrice(candle.price)}</span>
            <span class="price-original">${formatPrice(candle.originalPrice)}</span>
          </div>
          <button class="btn-add-bag" onclick="addToCart('${candle.id}', 'candle')">
            <span>+</span> Add to Bag
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Render Instagram Story Bubbles Bar
function renderStoryBubbles() {
  const container = document.getElementById('story-bubbles-container');
  if (!container || typeof INFLUENCER_REVIEWS === 'undefined') return;

  container.innerHTML = INFLUENCER_REVIEWS.map(rev => `
    <div class="story-bubble" onclick="openInfluencerStoryModal('${rev.id}')" title="Watch ${rev.name}'s Story">
      <div class="story-bubble-ring">
        <img src="${rev.avatar || rev.image}" alt="${rev.name}" class="story-bubble-img" loading="lazy">
        <span class="story-bubble-badge">★</span>
      </div>
      <span class="story-bubble-name">${rev.name.split(' ')[0]}</span>
    </div>
  `).join('');
}

// Auto-Sliding Infinite Carousel State & Controls ("jo aisa apna ap chlay")
let autoSlideInterval = null;
let autoSlideHovered = false;

function scrollReels(direction) {
  const track = document.getElementById('influencer-reels-container');
  if (!track) return;
  autoSlideHovered = true;
  const scrollAmount = 320 * direction;
  track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  setTimeout(() => { autoSlideHovered = false; }, 3000);
}

// Render Celebrity & Influencer Instagram Reels (Matching User Reference Image)
function renderInfluencerReels() {
  const container = document.getElementById('influencer-reels-container');
  if (!container || typeof INFLUENCER_REVIEWS === 'undefined') return;

  // Duplicate list for seamless infinite loop
  const allReels = [...INFLUENCER_REVIEWS, ...INFLUENCER_REVIEWS];

  container.innerHTML = allReels.map((rev, idx) => `
    <div class="reel-card-reference" style="--card-theme: ${rev.themeColor || '#d4af37'};" onclick="openInfluencerStoryModal('${rev.id}')">
      <!-- Top Header with Influencer Name, Role & Clapperboard (Matching Screenshot) -->
      <div class="reel-ref-header">
        <div class="reel-ref-title-wrap">
          <div class="reel-ref-name">${rev.name.toUpperCase()}</div>
          <div class="reel-ref-role">${rev.role}</div>
        </div>
        <div class="reel-ref-clapper" title="Verified Video Story">🎬</div>
      </div>

      <!-- Main Video Screen with Influencer Holding Aura Perfume Bottle -->
      <div class="reel-ref-screen">
        <img src="${rev.image}" alt="${rev.name} holding Aura Fragrance" class="reel-ref-img" loading="lazy">
        <div class="reel-ref-screen-overlay"></div>

        <!-- Floating Instagram Social Pill (Matching Screenshot) -->
        <div class="reel-ref-floating-tag">
          <img src="${rev.avatar || rev.image}" alt="${rev.name}" class="reel-ref-avatar-micro">
          <span class="reel-ref-handle-text">${rev.handle}</span>
          <span class="reel-ref-audio-icon">🎙️</span>
        </div>

        <!-- Center Hover Play Button -->
        <div class="reel-center-play">
          <span>▶</span>
        </div>

        <!-- Bottom Inside Screen: True Story Pill Badge with Heart (Matching Screenshot) -->
        <div class="reel-ref-truestory-pill">
          <span>TRUE STORY</span>
          <span class="reel-ref-heart">❤️</span>
        </div>
      </div>

      <!-- Bottom Card Footer with 5 Stars and Website Link (Matching Screenshot) -->
      <div class="reel-ref-footer">
        <div class="reel-ref-stars">★★★★★</div>
        <div class="reel-ref-domain">aurafragrances.pk</div>
      </div>
    </div>
  `).join('');

  initReelAutoSlider();
}

function initReelAutoSlider() {
  const track = document.getElementById('influencer-reels-container');
  if (!track) return;

  if (autoSlideInterval) {
    clearInterval(autoSlideInterval);
  }

  // Smooth continuous auto-gliding animation
  autoSlideInterval = setInterval(() => {
    if (!autoSlideHovered) {
      track.scrollLeft += 1.2;
      // Seamless loop when reaching halfway of duplicated items
      if (track.scrollLeft >= (track.scrollWidth / 2)) {
        track.scrollLeft = 0;
      }
    }
  }, 22);

  track.addEventListener('mouseenter', () => { autoSlideHovered = true; });
  track.addEventListener('mouseleave', () => { autoSlideHovered = false; });
  track.addEventListener('touchstart', () => { autoSlideHovered = true; }, { passive: true });
  track.addEventListener('touchend', () => {
    setTimeout(() => { autoSlideHovered = false; }, 2000);
  }, { passive: true });
}

// Open Celebrity Video Story Modal
function openInfluencerStoryModal(reviewId) {
  const review = INFLUENCER_REVIEWS.find(r => r.id === reviewId);
  if (!review) return;

  const product = PRODUCTS_DATA.find(p => p.id === review.perfumeId) || PRODUCTS_DATA[0];

  const modal = document.getElementById('quickview-modal');
  const body = document.getElementById('quickview-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="story-reel-modal-body">
      <!-- Left: Story Phone Frame Simulation -->
      <div class="story-reel-player-box">
        <img src="${review.image}" alt="${review.name}">
        <div class="reel-card-overlay"></div>

        <!-- Simulated Story Progress Bars -->
        <div style="position: absolute; top: 12px; left: 14px; right: 14px; display: flex; gap: 4px; z-index: 5;">
          <div style="height: 3px; background: rgba(255,255,255,0.9); flex: 1; border-radius: 2px;"></div>
          <div style="height: 3px; background: rgba(255,255,255,0.3); flex: 1; border-radius: 2px;"></div>
        </div>

        <div style="position: absolute; top: 24px; left: 14px; right: 14px; display: flex; justify-content: space-between; align-items: center; z-index: 5;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-family: var(--font-serif); font-size: 0.85rem; font-weight: 700; color: #fff;">${review.name}</div>
            <span style="color: var(--gold-light); font-size: 0.7rem; background: rgba(212,175,55,0.25); border: 1px solid var(--border-gold); padding: 2px 6px; border-radius: 10px;">✔ Verified</span>
          </div>
          <span style="color: var(--gold-light); font-size: 0.72rem; font-family: monospace;">${review.videoDuration}</span>
        </div>

        <!-- Simulated Audio Waveform & Likes -->
        <div style="position: absolute; bottom: 20px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center; z-index: 5;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="sound-waveform-anim">
              <span class="sound-waveform-bar"></span>
              <span class="sound-waveform-bar"></span>
              <span class="sound-waveform-bar"></span>
              <span class="sound-waveform-bar"></span>
              <span class="sound-waveform-bar"></span>
              <span class="sound-waveform-bar"></span>
            </div>
            <span style="font-size: 0.72rem; color: var(--gold-light);">Original Audio • Aura Fragrances</span>
          </div>
          <div style="color: #ff4757; font-size: 0.75rem; font-weight: 600;">❤️ ${review.likes}</div>
        </div>
      </div>

      <!-- Right: Celebrity Review & Product Card -->
      <div style="padding: 10px 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span class="reel-true-story-pill">★ ${review.badge}</span>
          <span style="font-size: 0.75rem; color: var(--gold-light);">${review.handle}</span>
        </div>

        <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: #fff; margin-bottom: 4px;">
          ${review.name}
        </h2>
        <p style="font-size: 0.82rem; color: var(--gold-light); margin-bottom: 16px;">
          ${review.role} • Verified Aura Patron
        </p>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-gold); border-radius: 10px; padding: 18px; margin-bottom: 20px;">
          <div style="color: #f7d050; font-size: 0.9rem; margin-bottom: 8px;">★★★★★ 5.0 Rating</div>
          <div style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--gold-light); font-weight: 600; margin-bottom: 8px;">
            "${review.headline}"
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.7; font-style: italic;">
            "${review.quote}"
          </p>
        </div>

        <!-- Featured Perfume Mini-Card -->
        <div style="display: flex; align-items: center; gap: 14px; background: rgba(20,20,24,0.8); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; margin-bottom: 24px;">
          <img src="${product.image}" alt="${product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-gold);">
          <div style="flex: 1;">
            <div style="font-family: var(--font-serif); font-size: 0.95rem; color: #fff; font-weight: 700;">${product.name}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${product.concentration}</div>
            <div style="font-size: 0.85rem; color: var(--gold-light); font-weight: 600; margin-top: 2px;">${formatPrice(product.price)}</div>
          </div>
        </div>

        <button class="btn-checkout" onclick="addToCart('${product.id}', 'perfume'); document.getElementById('quickview-modal').classList.remove('active');">
          Shop ${review.name.split(' ')[0]}'s Scent • ${formatPrice(product.price)}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Quick View Modal Logic
function openQuickView(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('quickview-modal');
  const body = document.getElementById('quickview-modal-body');
  if (!modal || !body) return;

  const ingredientsDetails = product.ingredients.map(ing => `
    <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-subtle);">
      <span>${ing.icon}</span>
      <div>
        <strong style="color: #fff;">${ing.name}</strong>
        <div style="font-size: 0.7rem; color: var(--gold-light);">Origin: ${ing.origin}</div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <div class="quickview-grid">
      <div class="quickview-media">
        <img src="${product.image}" alt="${product.name}">
        <span class="product-badge" style="top: 20px; left: 20px;">${product.concentration}</span>
      </div>

      <div class="quickview-content">
        <span class="qv-category">${product.gender.toUpperCase()} • ${product.family} • MAISON AURA</span>
        <h2 class="qv-title">${product.name}</h2>
        <p class="qv-tagline">"${product.tagline}"</p>

        <div class="qv-price-row">
          <span class="qv-price">${formatPrice(product.price)}</span>
          <span class="qv-orig-price">${formatPrice(product.originalPrice)}</span>
          <span style="font-size: 0.75rem; color: var(--gold-primary); margin-left: 10px;">${product.size}</span>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 24px;">
          ${product.description}
        </p>

        <!-- 3-Tier Olfactory Pyramid -->
        <div class="olfactory-pyramid">
          <div class="pyramid-level">
            <div class="pyramid-header">▲ Top Notes (First 15 Mins)</div>
            <div class="pyramid-notes">${product.topNotes.join(' • ')}</div>
          </div>
          <div class="pyramid-level">
            <div class="pyramid-header">◆ Heart Notes (Hours 1 - 6)</div>
            <div class="pyramid-notes">${product.heartNotes.join(' • ')}</div>
          </div>
          <div class="pyramid-level">
            <div class="pyramid-header">▼ Base Notes (Hours 6 - 24)</div>
            <div class="pyramid-notes">${product.baseNotes.join(' • ')}</div>
          </div>
        </div>

        <!-- Longevity & Sillage Performance Meters -->
        <div class="meters-grid">
          <div class="meter-box">
            <div class="meter-label">Longevity on Skin</div>
            <div class="meter-val">⏳ ${product.longevity}</div>
          </div>
          <div class="meter-box">
            <div class="meter-label">Projection & Sillage</div>
            <div class="meter-val">💨 ${product.sillage}</div>
          </div>
        </div>

        <!-- Raw Ingredients Spotlight -->
        <div style="margin-bottom: 28px;">
          <div style="font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 10px; font-weight: 600;">
            Precious Raw Botanicals:
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${ingredientsDetails}
          </div>
        </div>

        <button class="btn-checkout" onclick="addToCart('${product.id}', 'perfume'); document.getElementById('quickview-modal').classList.remove('active');">
          Add ${product.name} to Bag • ${formatPrice(product.price)}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Candle Quick View
function openCandleQuickView(candleId) {
  const candle = CANDLES_DATA.find(c => c.id === candleId);
  if (!candle) return;

  const modal = document.getElementById('quickview-modal');
  const body = document.getElementById('quickview-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="quickview-grid">
      <div class="quickview-media">
        <img src="${candle.image}" alt="${candle.name}">
      </div>
      <div class="quickview-content">
        <span class="qv-category">ARTISAN SCENTED CANDLE</span>
        <h2 class="qv-title">${candle.name}</h2>
        <p class="qv-tagline">"${candle.tagline}"</p>

        <div class="qv-price-row">
          <span class="qv-price">${formatPrice(candle.price)}</span>
          <span class="qv-orig-price">${formatPrice(candle.originalPrice)}</span>
        </div>

        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 24px;">
          ${candle.description}
        </p>

        <div class="olfactory-pyramid">
          <div class="pyramid-level">
            <div class="pyramid-header">Scent Profile</div>
            <div class="pyramid-notes">${candle.notes}</div>
          </div>
          <div class="pyramid-level">
            <div class="pyramid-header">Wax & Wick Composition</div>
            <div class="pyramid-notes">${candle.wax}</div>
          </div>
          <div class="pyramid-level">
            <div class="pyramid-header">Luxury Vessel</div>
            <div class="pyramid-notes">${candle.vessel}</div>
          </div>
        </div>

        <button class="btn-checkout" onclick="addToCart('${candle.id}', 'candle'); document.getElementById('quickview-modal').classList.remove('active');">
          Add ${candle.name} to Bag • ${formatPrice(candle.price)}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Shopping Bag / Cart Actions
function addToCart(itemId, type) {
  playLuxurySpraySound();

  let itemData = null;
  if (type === 'perfume') {
    itemData = PRODUCTS_DATA.find(p => p.id === itemId);
  } else if (type === 'candle') {
    itemData = CANDLES_DATA.find(c => c.id === itemId);
  } else if (type === 'discovery_set') {
    itemData = itemId; // custom object
  }

  if (!itemData) return;

  const existingIndex = state.cart.findIndex(i => i.id === itemData.id);
  if (existingIndex > -1) {
    state.cart[existingIndex].qty += 1;
  } else {
    state.cart.push({
      id: itemData.id,
      name: itemData.name,
      price: itemData.price,
      image: itemData.image,
      size: itemData.size || itemData.weight || 'Discovery 3x10ml',
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${itemData.name} to your Aura Fragrance Bag.`);

  // Auto-open drawer
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  if (cartDrawer && cartOverlay) {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
  }
}

function updateQty(id, delta) {
  const index = state.cart.findIndex(i => i.id === id);
  if (index === -1) return;
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  showToast('Item removed from shopping bag.');
}

function saveCart() {
  localStorage.setItem('aura_cart_v1', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, i) => sum + i.qty, 0);
  const badge = document.getElementById('cart-badge-count');
  if (badge) badge.textContent = totalCount;

  const container = document.getElementById('cart-items-container');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4;">🛍️</div>
        <p style="font-family: var(--font-serif); font-size: 1.1rem; color: #fff; margin-bottom: 6px;">Your Shopping Bag is Empty</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 20px;">Explore the 15 signature creations by Maison Aura.</p>
        <button class="btn-gold" style="font-size: 0.75rem; padding: 12px 24px;" onclick="document.getElementById('cart-drawer').classList.remove('active'); document.getElementById('cart-overlay').classList.remove('active');">
          Explore Fragrances
        </button>
      </div>
    `;
  } else {
    container.innerHTML = state.cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;">${item.size}</div>
          <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
          <div class="cart-item-controls">
            <div class="qty-control">
              <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
            <span class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Subtotal & Shipping calculation (Base: PKR)
  const subtotalPKR = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const discountPKR = subtotalPKR * state.discount;
  const finalTotalPKR = Math.max(0, subtotalPKR - discountPKR);

  const subtotalEl = document.getElementById('cart-subtotal');
  const discountEl = document.getElementById('cart-discount-row');
  const totalEl = document.getElementById('cart-final-total');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotalPKR);
  if (totalEl) totalEl.textContent = formatPrice(finalTotalPKR);

  if (discountEl) {
    if (state.discount > 0) {
      discountEl.style.display = 'flex';
      document.getElementById('cart-discount-val').textContent = `-${formatPrice(discountPKR)} (20% OFF)`;
    } else {
      discountEl.style.display = 'none';
    }
  }

  // Free shipping progress meter (Target: Rs. 4,000 PKR)
  const freeThresholdPKR = 4000;
  const progressFill = document.getElementById('shipping-progress-fill');
  const progressMsg = document.getElementById('shipping-progress-msg');

  if (progressFill && progressMsg) {
    if (subtotalPKR >= freeThresholdPKR) {
      progressFill.style.width = '100%';
      progressMsg.innerHTML = '✦ You qualify for <strong>Free Luxury Shipping across Pakistan!</strong>';
    } else {
      const remaining = freeThresholdPKR - subtotalPKR;
      const pct = Math.min(100, Math.round((subtotalPKR / freeThresholdPKR) * 100));
      progressFill.style.width = `${pct}%`;
      progressMsg.innerHTML = `Add <strong>${formatPrice(remaining)}</strong> more to unlock Free Luxury Delivery.`;
    }
  }
}

// Discovery Box Builder Logic
function renderDiscoveryBuilder() {
  const container = document.getElementById('sample-buttons-container');
  if (!container) return;

  container.innerHTML = DISCOVERY_SAMPLES.map(sample => {
    const isSelected = state.discoverySlots.includes(sample.id);
    return `
      <button class="sample-btn ${isSelected ? 'selected' : ''}" onclick="toggleSampleInBox('${sample.id}')">
        <span>${isSelected ? '✓' : '+'}</span>
        <span>${sample.name}</span>
      </button>
    `;
  }).join('');

  updateDiscoverySlotsUI();
}

function toggleSampleInBox(sampleId) {
  const existingIdx = state.discoverySlots.indexOf(sampleId);
  if (existingIdx > -1) {
    state.discoverySlots[existingIdx] = null;
    showToast('Removed sample from Discovery Box.');
  } else {
    const emptyIdx = state.discoverySlots.indexOf(null);
    if (emptyIdx > -1) {
      state.discoverySlots[emptyIdx] = sampleId;
      showToast('Added sample to Discovery Box!');
    } else {
      showToast('Your Discovery Box holds 3 signature samples. Remove one to swap!');
    }
  }
  renderDiscoveryBuilder();
}

function updateDiscoverySlotsUI() {
  for (let i = 0; i < 3; i++) {
    const slotEl = document.getElementById(`box-slot-${i + 1}`);
    if (!slotEl) continue;

    const sampleId = state.discoverySlots[i];
    if (sampleId) {
      const sample = DISCOVERY_SAMPLES.find(s => s.id === sampleId);
      slotEl.className = 'box-slot filled';
      slotEl.innerHTML = `
        <img src="${sample.img}" alt="${sample.name}" class="slot-img">
        <div class="slot-name">${sample.name}</div>
        <div style="font-size: 0.65rem; color: var(--gold-light);">${sample.notes}</div>
        <span class="slot-remove" onclick="toggleSampleInBox('${sample.id}')">✕ Remove</span>
      `;
    } else {
      slotEl.className = 'box-slot';
      slotEl.innerHTML = `
        <div style="font-size: 1.8rem; color: rgba(212,175,55,0.4); margin-bottom: 6px;">+</div>
        <div class="slot-name" style="color: var(--text-muted);">Slot ${i + 1}</div>
        <div style="font-size: 0.68rem; color: var(--text-muted);">Choose a Sample</div>
      `;
    }
  }

  const addBoxBtn = document.getElementById('add-discovery-box-btn');
  const filledCount = state.discoverySlots.filter(s => s !== null).length;
  if (addBoxBtn) {
    if (filledCount === 3) {
      addBoxBtn.disabled = false;
      addBoxBtn.innerHTML = `Add Custom Set to Bag • ${formatPrice(1450)}`;
      addBoxBtn.style.opacity = '1';
    } else {
      addBoxBtn.disabled = true;
      addBoxBtn.innerHTML = `Select ${3 - filledCount} More Sample${3 - filledCount > 1 ? 's' : ''}`;
      addBoxBtn.style.opacity = '0.6';
    }
  }
}

function addDiscoveryBoxToCart() {
  const selectedSamples = state.discoverySlots
    .filter(s => s !== null)
    .map(id => DISCOVERY_SAMPLES.find(s => s.id === id).name)
    .join(', ');

  addToCart({
    id: `custom-box-${Date.now()}`,
    name: 'Aura Discovery Vault (3x10ml Coffret)',
    price: 1450,
    size: selectedSamples,
    image: 'assets/images/perfumes/the_one.jpg'
  }, 'discovery_set');

  state.discoverySlots = [null, null, null];
  renderDiscoveryBuilder();
}

// Scent Quiz Logic
function startQuiz() {
  state.currentQuizStep = 0;
  state.quizAnswers = [];
  renderQuizStep();
}

function renderQuizStep() {
  const container = document.getElementById('quiz-step-container');
  const progressFill = document.getElementById('quiz-progress-fill');
  if (!container) return;

  const currentQ = SCENT_QUIZ[state.currentQuizStep];
  const total = SCENT_QUIZ.length;
  const pct = Math.round(((state.currentQuizStep + 1) / total) * 100);

  if (progressFill) progressFill.style.width = `${pct}%`;

  container.innerHTML = `
    <div class="quiz-q-num">Question ${state.currentQuizStep + 1} of ${total}</div>
    <h3 class="quiz-question">${currentQ.question}</h3>
    <div class="quiz-options">
      ${currentQ.options.map((opt, idx) => `
        <button class="quiz-option-btn" onclick="selectQuizAnswer(${idx})">
          ${opt.text}
        </button>
      `).join('')}
    </div>
  `;
}

function selectQuizAnswer(optIdx) {
  const currentQ = SCENT_QUIZ[state.currentQuizStep];
  const choice = currentQ.options[optIdx];
  state.quizAnswers.push(choice);

  if (state.currentQuizStep < SCENT_QUIZ.length - 1) {
    state.currentQuizStep++;
    renderQuizStep();
  } else {
    calculateQuizResult();
  }
}

function calculateQuizResult() {
  const container = document.getElementById('quiz-step-container');
  if (!container) return;

  const recId = state.quizAnswers[state.quizAnswers.length - 1].recommendation || 'perfume-the-one';
  const recProduct = PRODUCTS_DATA.find(p => p.id === recId) || PRODUCTS_DATA[0];

  container.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div style="font-size: 2.5rem; margin-bottom: 10px;">👑</div>
      <span class="section-tag">Your Signature Olfactory Match</span>
      <h2 style="font-family: var(--font-serif); font-size: 2.2rem; color: var(--gold-light); margin-bottom: 8px;">${recProduct.name}</h2>
      <p style="font-style: italic; color: var(--text-secondary); margin-bottom: 24px;">"${recProduct.tagline}"</p>

      <div style="max-width: 300px; margin: 0 auto 24px auto; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-gold);">
        <img src="${recProduct.image}" alt="${recProduct.name}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover;">
      </div>

      <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 500px; margin: 0 auto 24px auto; line-height: 1.6;">
        ${recProduct.description}
      </p>

      <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
        <button class="btn-checkout" style="max-width: 320px;" onclick="addToCart('${recProduct.id}', 'perfume'); document.getElementById('quiz-modal').classList.remove('active');">
          Claim Your Scent • ${formatPrice(recProduct.price)}
        </button>
        <button class="btn-outline" onclick="startQuiz()">Retake Quiz</button>
      </div>
    </div>
  `;
}

// Live Search Logic
function handleSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;

  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">Search through our 15 perfumes by name, notes (Oud, Vanilla, Rose, Amber), or family.</div>';
    return;
  }

  const matches = PRODUCTS_DATA.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.tagline.toLowerCase().includes(q) ||
    p.family.toLowerCase().includes(q) ||
    p.topNotes.some(n => n.toLowerCase().includes(q)) ||
    p.baseNotes.some(n => n.toLowerCase().includes(q)) ||
    p.ingredients.some(i => i.name.toLowerCase().includes(q))
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">No fragrances match your search query. Try "Oud", "Midnight", "Vanilla", or "Rose".</div>';
  } else {
    resultsContainer.innerHTML = matches.map(p => `
      <div class="product-card" onclick="openQuickView('${p.id}'); document.getElementById('search-modal').classList.remove('active');">
        <div class="product-visual-wrap" style="aspect-ratio: 1/1;">
          <img src="${p.image}" alt="${p.name}" class="product-img">
        </div>
        <div style="padding: 16px;">
          <div style="font-family: var(--font-serif); font-size: 1.1rem; color: #fff; font-weight: 700;">${p.name}</div>
          <div style="font-size: 0.75rem; color: var(--gold-light); font-weight: 600;">${formatPrice(p.price)}</div>
        </div>
      </div>
    `).join('');
  }
}

// Checkout Step 1: Open Delivery Details Form Modal
function handleCheckout() {
  if (state.cart.length === 0) {
    showToast('Your shopping bag is empty.');
    return;
  }

  // Close cart drawer
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  if (cartDrawer) cartDrawer.classList.remove('active');
  if (cartOverlay) cartOverlay.classList.remove('active');

  const subtotalPKR = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const discountPKR = subtotalPKR * state.discount;
  const freeThreshold = 4000;
  const shippingFeePKR = subtotalPKR >= freeThreshold ? 0 : 250;
  const finalTotalPKR = subtotalPKR - discountPKR + shippingFeePKR;

  const modal = document.getElementById('quickview-modal');
  const body = document.getElementById('quickview-modal-body');
  if (!modal || !body) return;

  const itemsSummaryHtml = state.cart.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.82rem;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="${item.image}" alt="${item.name}" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-gold);">
        <div>
          <div style="color: #fff; font-weight: 600;">${item.name}</div>
          <div style="color: var(--text-muted); font-size: 0.72rem;">Qty: ${item.qty}</div>
        </div>
      </div>
      <div style="color: var(--gold-light); font-weight: 600;">${formatPrice(item.price * item.qty)}</div>
    </div>
  `).join('');

  body.innerHTML = `
    <div class="checkout-modal-wrap">
      <div style="text-align: center; margin-bottom: 22px;">
        <span class="section-tag">Express Courier Across Pakistan</span>
        <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: #fff; margin-bottom: 6px;">Customer & Delivery Information</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Apna delivery address aur details provide karein taake order foran dispatch kiya ja sakay.</p>
      </div>

      <form id="checkout-delivery-form" onsubmit="submitOrder(event)" class="checkout-grid">
        <!-- Left Column: Delivery Details Form -->
        <div class="checkout-form-col">
          <h3 style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--gold-light); margin-bottom: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            1. Delivery Information
          </h3>

          <div class="checkout-field-row">
            <div class="checkout-field">
              <label for="cust-name">Full Name *</label>
              <input type="text" id="cust-name" required placeholder="e.g. Saad / Ayesha Khan">
            </div>
            <div class="checkout-field">
              <label for="cust-phone">WhatsApp / Mobile Number *</label>
              <input type="tel" id="cust-phone" required placeholder="0300-1234567" pattern="[0-9+ -]{10,15}">
            </div>
          </div>

          <div class="checkout-field">
            <label for="cust-address">Street / House Address *</label>
            <textarea id="cust-address" rows="2" required placeholder="House / Flat #, Street name, Phase / Sector, Landmark"></textarea>
          </div>

          <div class="checkout-field-row">
            <div class="checkout-field">
              <label for="cust-city">City *</label>
              <select id="cust-city" required onchange="const w = document.getElementById('other-city-wrap'); if(w) w.style.display = (this.value === 'Other') ? 'block' : 'none';">
                <option value="" disabled selected>— Select Your City —</option>
                <optgroup label="🌟 Sindh (Including Jacobabad)">
                  <option value="Jacobabad">Jacobabad</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Sukkur">Sukkur</option>
                  <option value="Larkana">Larkana</option>
                  <option value="Shikarpur">Shikarpur</option>
                  <option value="Nawabshah">Nawabshah (Shaheed Benazirabad)</option>
                  <option value="Mirpur Khas">Mirpur Khas</option>
                  <option value="Khairpur">Khairpur</option>
                  <option value="Kandhkot / Kashmore">Kandhkot / Kashmore</option>
                  <option value="Ghotki">Ghotki</option>
                  <option value="Dadu">Dadu</option>
                  <option value="Badin">Badin</option>
                  <option value="Thatta">Thatta</option>
                </optgroup>
                <optgroup label="🌟 Punjab">
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Multan">Multan</option>
                  <option value="Gujranwala">Gujranwala</option>
                  <option value="Sialkot">Sialkot</option>
                  <option value="Bahawalpur">Bahawalpur</option>
                  <option value="Sargodha">Sargodha</option>
                  <option value="Gujrat">Gujrat</option>
                  <option value="Sheikhupura">Sheikhupura</option>
                  <option value="Jhelum">Jhelum</option>
                  <option value="Sahiwal">Sahiwal</option>
                  <option value="Rahim Yar Khan">Rahim Yar Khan</option>
                  <option value="Dera Ghazi Khan">Dera Ghazi Khan</option>
                  <option value="Kasur">Kasur</option>
                </optgroup>
                <optgroup label="🌟 Khyber Pakhtunkhwa">
                  <option value="Peshawar">Peshawar</option>
                  <option value="Abbottabad">Abbottabad</option>
                  <option value="Mardan">Mardan</option>
                  <option value="Swat / Mingora">Swat / Mingora</option>
                  <option value="Kohat">Kohat</option>
                  <option value="Dera Ismail Khan">Dera Ismail Khan</option>
                </optgroup>
                <optgroup label="🌟 Balochistan">
                  <option value="Quetta">Quetta</option>
                  <option value="Gwadar">Gwadar</option>
                  <option value="Hub">Hub</option>
                  <option value="Turbat">Turbat</option>
                  <option value="Jaffarabad / Dera Allah Yar">Jaffarabad / Dera Allah Yar</option>
                </optgroup>
                <optgroup label="🌟 Azad Kashmir & Gilgit">
                  <option value="Muzaffarabad">Muzaffarabad</option>
                  <option value="Mirpur (AJK)">Mirpur (AJK)</option>
                  <option value="Gilgit">Gilgit</option>
                  <option value="Skardu">Skardu</option>
                </optgroup>
                <optgroup label="🌟 Other Location">
                  <option value="Other">Other City / Tehsil in Pakistan</option>
                </optgroup>
              </select>
              <div id="other-city-wrap" style="display: none; margin-top: 8px;">
                <input type="text" id="cust-city-other" placeholder="Apna City / Tehsil / Area enter karein">
              </div>
            </div>
            <div class="checkout-field">
              <label for="cust-notes">Rider Instructions (Optional)</label>
              <input type="text" id="cust-notes" placeholder="e.g. Call before arrival / Gate code">
            </div>
          </div>

          <h3 style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--gold-light); margin-top: 18px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            2. Payment Method
          </h3>

          <div class="payment-radio-group">
            <label class="payment-radio-label active">
              <input type="radio" name="payment-method" value="Cash on Delivery (COD)" checked>
              <div>
                <div class="payment-title">💵 Cash on Delivery (COD) — Most Popular</div>
                <div class="payment-desc">Parcel receive karte waqt rider ko naqd adaigi karein.</div>
              </div>
            </label>

            <label class="payment-radio-label">
              <input type="radio" name="payment-method" value="JazzCash / EasyPaisa">
              <div>
                <div class="payment-title">📱 JazzCash / EasyPaisa Wallet</div>
                <div class="payment-desc">Order confirm hone par mobile account se adaigi.</div>
              </div>
            </label>

            <label class="payment-radio-label">
              <input type="radio" name="payment-method" value="Debit / Credit Card">
              <div>
                <div class="payment-title">💳 Visa / Mastercard Online</div>
                <div class="payment-desc">Safe & encrypted 256-bit payment gateway.</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Right Column: Order Summary & Place Order -->
        <div class="checkout-summary-col">
          <h3 style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--gold-light); margin-bottom: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            Bag Summary
          </h3>

          <div style="max-height: 180px; overflow-y: auto; margin-bottom: 14px;">
            ${itemsSummaryHtml}
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 12px; font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--text-secondary);">
              <span>Subtotal:</span>
              <span>${formatPrice(subtotalPKR)}</span>
            </div>
            ${state.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #ff6b6b;">
                <span>VIP Discount (20%):</span>
                <span>-${formatPrice(discountPKR)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: var(--text-secondary);">
              <span>Express Delivery:</span>
              <span style="color: ${shippingFeePKR === 0 ? 'var(--gold-light)' : '#fff'};">
                ${shippingFeePKR === 0 ? 'FREE (Orders Over Rs. 4,000)' : formatPrice(shippingFeePKR)}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-gold); padding-top: 10px; margin-bottom: 18px;">
              <span style="color: #fff; font-weight: 700; font-size: 1rem;">Total Payable:</span>
              <span style="color: var(--gold-light); font-weight: 800; font-size: 1.25rem;">${formatPrice(finalTotalPKR)}</span>
            </div>
          </div>

          <button type="submit" class="btn-checkout" style="width: 100%;">
            Place Order (Cash on Delivery)
          </button>

          <p style="font-size: 0.7rem; color: var(--text-muted); text-align: center; margin-top: 10px;">
            🔒 30-Day Luxury Authenticity Guarantee • Free Returns
          </p>
        </div>
      </form>
    </div>
  `;

  modal.classList.add('active');
}

// Checkout Step 2: Process Order & Show Official Confirmation Invoice
function submitOrder(event) {
  event.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  let city = document.getElementById('cust-city').value;
  if (city === 'Other') {
    const customCity = document.getElementById('cust-city-other')?.value.trim();
    if (customCity) {
      city = customCity;
    }
  }
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'Cash on Delivery (COD)';

  const subtotalPKR = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const discountPKR = subtotalPKR * state.discount;
  const shippingFeePKR = subtotalPKR >= 4000 ? 0 : 250;
  const finalTotalPKR = subtotalPKR - discountPKR + shippingFeePKR;
  const orderNum = 'AURA-PK-' + Math.floor(100000 + Math.random() * 900000);

  const orderItemsList = state.cart.map(i => `${i.name} (x${i.qty})`).join(', ');

  playLuxurySpraySound();

  const modal = document.getElementById('quickview-modal');
  const body = document.getElementById('quickview-modal-body');

  const waMessage = encodeURIComponent(
    `Salam! I just placed an order on Aura Fragrances.\n\n` +
    `*Order Number:* ${orderNum}\n` +
    `*Customer Name:* ${name}\n` +
    `*Mobile/WhatsApp:* ${phone}\n` +
    `*Delivery Address:* ${address}, ${city}\n` +
    `*Items Ordered:* ${orderItemsList}\n` +
    `*Total Payable:* Rs. ${finalTotalPKR.toLocaleString()} (${paymentMethod})\n\n` +
    `Please confirm my parcel dispatch!`
  );

  body.innerHTML = `
    <div style="padding: 30px 20px; text-align: center; max-width: 620px; margin: 0 auto;">
      <div style="font-size: 3.2rem; margin-bottom: 8px;">⚜️</div>
      <span class="reel-true-story-pill">👑 ORDER CONFIRMED</span>
      <h2 style="font-family: var(--font-serif); font-size: 2rem; color: var(--gold-light); margin-top: 10px; margin-bottom: 6px;">
        Thank You, ${name}!
      </h2>
      <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 24px;">
        Aapka luxury parcel packaging department ko bhej diya gaya hai. It will be delivered in our gold-embossed velvet box.
      </p>

      <!-- Invoice Details Box -->
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-gold); border-radius: 12px; padding: 22px; text-align: left; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
          <span style="color: var(--text-muted); font-size: 0.8rem;">Order Number:</span>
          <strong style="color: #fff; font-family: monospace; font-size: 0.95rem;">${orderNum}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
          <span style="color: var(--text-muted); font-size: 0.8rem;">Recipient:</span>
          <span style="color: #fff; font-size: 0.85rem;">${name} (${phone})</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
          <span style="color: var(--text-muted); font-size: 0.8rem;">Delivery Address:</span>
          <span style="color: #fff; font-size: 0.85rem; text-align: right; max-width: 60%;">${address}, ${city}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
          <span style="color: var(--text-muted); font-size: 0.8rem;">Payment Method:</span>
          <span style="color: var(--gold-light); font-size: 0.85rem; font-weight: 600;">${paymentMethod}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
          <span style="color: var(--text-muted); font-size: 0.8rem;">Estimated Delivery:</span>
          <span style="color: var(--gold-light); font-size: 0.85rem;">2 – 3 Working Days (TCS / Leopard / Call Courier)</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 6px;">
          <span style="color: var(--text-secondary); font-size: 0.9rem; font-weight: 600;">Total Payable on Delivery:</span>
          <strong style="color: var(--gold-light); font-size: 1.25rem;">${formatPrice(finalTotalPKR)}</strong>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <a href="https://wa.me/923001234567?text=${waMessage}" target="_blank" class="btn-gold" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <span>💬</span> Confirm Order on WhatsApp
        </a>
        <button class="btn-outline" onclick="state.cart = []; saveCart(); updateCartUI(); document.getElementById('quickview-modal').classList.remove('active');">
          Continue Exploring Aura Fragrances
        </button>
      </div>
    </div>
  `;

  // Clear state cart
  state.cart = [];
  saveCart();
  updateCartUI();
}

// WhatsApp VIP Concierge Action
function openWhatsAppVIP() {
  const text = encodeURIComponent("Salam! I would like personal fragrance consultation from Maison Aura.");
  window.open(`https://wa.me/923001234567?text=${text}`, '_blank');
}
