/**
 * Telos Athletic Club - Shopify Storefront Integration
 * Uses Shopify Buy SDK for product display, cart, and checkout
 *
 * SETUP: Replace the two config values below with your Shopify credentials.
 *   1. SHOPIFY_DOMAIN  — your-store.myshopify.com
 *   2. SHOPIFY_STOREFRONT_TOKEN — Storefront API access token
 *      (Shopify Admin → Settings → Apps → Develop apps → Storefront API)
 */

// ============================================================
//  CONFIG — Replace these two values
// ============================================================
const SHOPIFY_DOMAIN = 'telosathleticclub.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = 'c18766911a02794c7e00f4b7d98aea1b';
// ============================================================

let shopifyClient = null;
let cart = { lineItems: [], subtotal: '0.00', checkoutUrl: '' };
let checkoutId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async function () {
  if (typeof ShopifyBuy === 'undefined') {
    console.error('[Telos Shop] Shopify Buy SDK not loaded');
    showEmpty();
    return;
  }

  // Validate config
  if (SHOPIFY_DOMAIN.includes('YOUR_STORE')) {
    console.warn('[Telos Shop] Replace SHOPIFY_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in js/shop.js');
    showEmpty();
    return;
  }

  try {
    shopifyClient = ShopifyBuy.buildClient({
      domain: SHOPIFY_DOMAIN,
      storefrontAccessToken: SHOPIFY_STOREFRONT_TOKEN,
    });

    // Restore cart from localStorage
    const savedCheckoutId = localStorage.getItem('telos_checkout_id');
    if (savedCheckoutId) {
      try {
        const existing = await shopifyClient.checkout.fetch(savedCheckoutId);
        if (existing && !existing.completedAt) {
          checkoutId = existing.id;
          syncCartFromCheckout(existing);
        } else {
          localStorage.removeItem('telos_checkout_id');
          await createFreshCheckout();
        }
      } catch (e) {
        localStorage.removeItem('telos_checkout_id');
        await createFreshCheckout();
      }
    } else {
      await createFreshCheckout();
    }

    // Detect which page and load accordingly
    if (document.getElementById('productDetail')) {
      await loadProductDetail();
    } else if (document.getElementById('productGrid')) {
      await loadProducts();
    }
  } catch (err) {
    console.error('[Telos Shop] Init error:', err);
    showEmpty();
  }
});


// ===== CHECKOUT =====
async function createFreshCheckout() {
  const checkout = await shopifyClient.checkout.create();
  checkoutId = checkout.id;
  localStorage.setItem('telos_checkout_id', checkoutId);
}


// ===== PRODUCTS =====
async function loadProducts() {
  try {
    const products = await shopifyClient.product.fetchAll();
    const grid = document.getElementById('productGrid');
    const loading = document.getElementById('shopLoading');

    if (!products || products.length === 0) {
      showEmpty();
      return;
    }

    grid.innerHTML = '';

    products.forEach(function (product) {
      grid.appendChild(createProductCard(product));
    });

    loading.style.display = 'none';
    grid.style.display = 'grid';

    // Trigger scroll animations
    grid.querySelectorAll('.product-card').forEach(function (card) {
      card.classList.add('animate-on-scroll');
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
      observer.observe(card);
    });
  } catch (err) {
    console.error('[Telos Shop] Failed to load products:', err);
    showEmpty();
  }
}


// ===== PRODUCT DETAIL PAGE =====
async function loadProductDetail() {
  var loading = document.getElementById('productLoading');
  var notFound = document.getElementById('productNotFound');
  var detail = document.getElementById('productDetail');

  // Get handle from URL
  var params = new URLSearchParams(window.location.search);
  var handle = params.get('p');

  if (!handle) {
    loading.style.display = 'none';
    notFound.style.display = 'block';
    return;
  }

  try {
    var product = await shopifyClient.product.fetchByHandle(handle);

    if (!product) {
      loading.style.display = 'none';
      notFound.style.display = 'block';
      return;
    }

    var variant = product.variants[0];
    var price = parseFloat(variant.price.amount || variant.price);
    var comparePrice = variant.compareAtPrice
      ? parseFloat(variant.compareAtPrice.amount || variant.compareAtPrice)
      : null;
    var image = product.images[0] ? product.images[0].src : null;
    var productType = product.productType || 'Digital Product';

    // Update page title
    document.title = product.title + ' - Telos Athletic Club';

    // Image gallery
    var imageEl = document.getElementById('productImage');
    var thumbsEl = document.getElementById('productThumbs');
    var allImages = product.images || [];

    if (allImages.length > 0) {
      imageEl.innerHTML = '<img src="' + allImages[0].src + '" alt="' + escapeHtml(product.title) + '">';

      if (allImages.length > 1 && thumbsEl) {
        thumbsEl.innerHTML = allImages.map(function(img, idx) {
          return '<div class="product-thumb' + (idx === 0 ? ' active' : '') + '" onclick="switchProductImage(this, \'' + img.src + '\')">' +
            '<img src="' + img.src + '" alt="Image ' + (idx+1) + '">' +
            '</div>';
        }).join('');
      }
    } else {
      imageEl.innerHTML = '<svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
    }

    // Type
    document.getElementById('productType').textContent = productType;

    // Title
    document.getElementById('productTitle').textContent = product.title;

    // Price
    var priceEl = document.getElementById('productPrice');
    if (price === 0) {
      priceEl.innerHTML = '<span class="price-free">Free</span>';
    } else {
      priceEl.innerHTML = '$' + price.toFixed(2);
      if (comparePrice) {
        priceEl.innerHTML += '<span class="price-compare">$' + comparePrice.toFixed(2) + '</span>';
      }
    }

    // Description (render HTML)
    var descEl = document.getElementById('productDescription');
    if (product.descriptionHtml && product.descriptionHtml.trim()) {
      descEl.innerHTML = product.descriptionHtml;
    } else if (product.description && product.description.trim()) {
      descEl.textContent = product.description;
    } else {
      descEl.innerHTML = '<p style="color: var(--color-text-muted-dark); font-style: italic;">No description available.</p>';
    }

    // Add to cart button
    var addBtn = document.getElementById('productAddBtn');
    addBtn.addEventListener('click', function () {
      addToCartFromDetail(addBtn, variant.id);
    });

    // Show
    loading.style.display = 'none';
    detail.classList.add('loaded');

  } catch (err) {
    console.error('[Telos Shop] Product detail error:', err);
    loading.style.display = 'none';
    notFound.style.display = 'block';
  }
}

async function addToCartFromDetail(btnElement, variantId) {
  if (!shopifyClient || !checkoutId) return;

  btnElement.disabled = true;
  var origHTML = btnElement.innerHTML;
  btnElement.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20" /></svg> Adding...';

  try {
    var checkout = await shopifyClient.checkout.addLineItems(checkoutId, [
      { variantId: variantId, quantity: 1 }
    ]);
    syncCartFromCheckout(checkout);

    btnElement.classList.add('added');
    btnElement.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Added to Cart';

    setTimeout(function () {
      btnElement.classList.remove('added');
      btnElement.disabled = false;
      btnElement.innerHTML = origHTML;
    }, 2500);
  } catch (err) {
    console.error('[Telos Shop] Add to cart error:', err);
    btnElement.disabled = false;
    btnElement.innerHTML = 'Error — Retry';
  }
}

function createProductCard(product) {
  const variant = product.variants[0];
  const price = parseFloat(variant.price.amount || variant.price);
  const comparePrice = variant.compareAtPrice
    ? parseFloat(variant.compareAtPrice.amount || variant.compareAtPrice)
    : null;
  const image = product.images[0] ? product.images[0].src : null;
  const productType = product.productType || 'Digital Product';

  // Strip HTML from description
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = product.descriptionHtml || product.description || '';
  const description = tempDiv.textContent || tempDiv.innerText || '';

  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.cursor = 'pointer';
  card.addEventListener('click', function (e) {
    // Don't navigate if clicking the add-to-cart button
    if (e.target.closest('.btn-add-cart')) return;
    window.location.href = 'product?p=' + encodeURIComponent(product.handle);
  });
  card.innerHTML = `
    <div class="product-card-image">
      ${image
        ? `<img src="${image}" alt="${escapeHtml(product.title)}" loading="lazy">`
        : `<svg class="product-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
      }
    </div>
    <div class="product-card-body">
      <span class="product-card-type">${escapeHtml(productType)}</span>
      <h3 class="product-card-title">${escapeHtml(product.title)}</h3>
      <p class="product-card-description">${escapeHtml(description)}</p>
      <div class="product-card-footer">
        <span class="product-card-price">
          ${price === 0
            ? '<span class="price-free">Free</span>'
            : `$${price.toFixed(2)}${comparePrice ? `<span class="price-compare">$${comparePrice.toFixed(2)}</span>` : ''}`
          }
        </span>
        <button class="btn-add-cart" data-variant-id="${variant.id}" onclick="addToCart(this, '${variant.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          Add to Cart
        </button>
      </div>
    </div>
  `;

  return card;
}


// ===== CART ACTIONS =====
async function addToCart(btnElement, variantId) {
  if (!shopifyClient || !checkoutId) return;

  btnElement.disabled = true;
  btnElement.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20" /></svg>
    Adding...
  `;

  try {
    const checkout = await shopifyClient.checkout.addLineItems(checkoutId, [
      { variantId: variantId, quantity: 1 }
    ]);

    syncCartFromCheckout(checkout);

    // Feedback
    btnElement.classList.add('added');
    btnElement.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Added
    `;

    setTimeout(function () {
      btnElement.classList.remove('added');
      btnElement.disabled = false;
      btnElement.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        Add to Cart
      `;
    }, 2000);
  } catch (err) {
    console.error('[Telos Shop] Add to cart error:', err);
    btnElement.disabled = false;
    btnElement.innerHTML = 'Error — Retry';
  }
}

async function updateCartItemQty(lineItemId, quantity) {
  if (!shopifyClient || !checkoutId) return;
  try {
    const checkout = await shopifyClient.checkout.updateLineItems(checkoutId, [
      { id: lineItemId, quantity: quantity }
    ]);
    syncCartFromCheckout(checkout);
  } catch (err) {
    console.error('[Telos Shop] Update qty error:', err);
  }
}

async function removeCartItem(lineItemId) {
  if (!shopifyClient || !checkoutId) return;
  try {
    const checkout = await shopifyClient.checkout.removeLineItems(checkoutId, [lineItemId]);
    syncCartFromCheckout(checkout);
  } catch (err) {
    console.error('[Telos Shop] Remove item error:', err);
  }
}


// ===== SYNC CART STATE FROM SHOPIFY CHECKOUT =====
function syncCartFromCheckout(checkout) {
  cart.lineItems = checkout.lineItems || [];
  cart.subtotal = checkout.subtotalPrice
    ? (checkout.subtotalPrice.amount || checkout.subtotalPrice)
    : '0.00';
  cart.checkoutUrl = checkout.webUrl || '';

  updateCartBadge();
  renderCartDrawer();
}


// ===== CART BADGE =====
function updateCartBadge() {
  const totalQty = cart.lineItems.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);

  document.querySelectorAll('.cart-badge').forEach(function (badge) {
    badge.textContent = totalQty;
    if (totalQty > 0) {
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  });
}


// ===== RENDER CART DRAWER =====
function renderCartDrawer() {
  const itemsContainer = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const countEl = document.getElementById('cartDrawerCount');
  const subtotalEl = document.getElementById('cartSubtotal');

  const totalQty = cart.lineItems.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);

  countEl.textContent = totalQty > 0 ? `(${totalQty} item${totalQty > 1 ? 's' : ''})` : '';

  if (cart.lineItems.length === 0) {
    footer.style.display = 'none';
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        <p>Your cart is empty</p>
        <span>Browse the shop to add items</span>
      </div>
    `;
    return;
  }

  footer.style.display = 'block';
  subtotalEl.textContent = '$' + parseFloat(cart.subtotal).toFixed(2);

  itemsContainer.innerHTML = cart.lineItems.map(function (item) {
    const price = parseFloat(item.variant.price.amount || item.variant.price);
    const image = item.variant.image ? item.variant.image.src : null;
    const lineItemId = item.id;

    return `
      <div class="cart-item">
        <div class="cart-item-image">
          ${image
            ? `<img src="${image}" alt="${escapeHtml(item.title)}">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
          }
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(item.title)}</div>
          <div class="cart-item-price">$${(price * item.quantity).toFixed(2)}</div>
          <div class="cart-item-qty">
            <button onclick="updateCartItemQty('${lineItemId}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'style="opacity:0.3;pointer-events:none;"' : ''}>−</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartItemQty('${lineItemId}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-remove" onclick="removeCartItem('${lineItemId}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </div>
      </div>
    `;
  }).join('');
}


// ===== TOGGLE CART =====
function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = drawer.classList.contains('active');

  if (isOpen) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Close cart on Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const drawer = document.getElementById('cartDrawer');
    if (drawer && drawer.classList.contains('active')) {
      toggleCart();
    }
  }
});


// ===== CHECKOUT =====
function goToCheckout() {
  if (cart.checkoutUrl) {
    window.location.href = cart.checkoutUrl;
  }
}


// ===== IMAGE GALLERY =====
function switchProductImage(thumb, src) {
  var imageEl = document.getElementById('productImage');
  imageEl.querySelector('img').src = src;
  document.querySelectorAll('.product-thumb').forEach(function(t) {
    t.classList.remove('active');
  });
  thumb.classList.add('active');
}


// ===== HELPERS =====
function showEmpty() {
  var loading = document.getElementById('shopLoading');
  var empty = document.getElementById('shopEmpty');
  if (loading) loading.style.display = 'none';
  if (empty) empty.style.display = 'block';
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
