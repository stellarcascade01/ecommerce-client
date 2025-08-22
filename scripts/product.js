// --- Buy Now Button ---
let loadedProduct = null;
const buyNowBtn = document.getElementById('buy-now-btn');
if (buyNowBtn) {
  buyNowBtn.onclick = function() {
    // Require login
    if (!localStorage.getItem('token')) {
      window.location.href = 'login.html';
      return;
    }
    // Only buy the selected product (not from cart)
    const productId = getProductId();
    if (!productId || !loadedProduct) return;
    let qty = parseInt(document.getElementById('quantity').textContent) || 1;
    const img = document.getElementById('product-img').src;
    const name = loadedProduct.name; // Use plain name from product object
    const price = loadedProduct.price;
    sessionStorage.setItem('buyNow', JSON.stringify({ productId, name, price, quantity: qty, image: img }));
    window.location.href = `order.html?buyNow=1&productId=${productId}`;
  };
}
//product.js
const productDetailsDiv = document.getElementById('product-details');
const addToCartBtn = document.getElementById('add-to-cart-btn');

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function fetchProduct(id) {
  fetch(`https://ecommerce-server-cq95.onrender.com/api/products/${id}`)
    .then(res => {
      if (!res.ok) throw new Error('Product not found');
      return res.json();
    })
    .then(product => {
      renderProduct(product);
    })
    .catch(err => {
      productDetailsDiv.textContent = err.message;
      addToCartBtn.style.display = 'none';
    });
}

function renderProduct(product) {
  loadedProduct = product;
  // Render product details into new structure
  document.getElementById('product-img').src = product.image;
  document.getElementById('product-img').alt = product.name;
  // Average rating summary
  let avgRating = 0;
  let reviewCount = 0;
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    avgRating = product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / product.reviews.length;
    reviewCount = product.reviews.length;
  }
  let starsHtml = '';
  if (reviewCount > 0) {
    const fullStars = Math.floor(avgRating);
    const halfStar = avgRating - fullStars >= 0.5;
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fa fa-star" style="color:#f7b731"></i>';
    if (halfStar) starsHtml += '<i class="fa fa-star-half-alt" style="color:#f7b731"></i>';
    for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) starsHtml += '<i class="fa-regular fa-star" style="color:#f7b731"></i>';
  } else {
    starsHtml = '<span style="color:#bbb;">No ratings</span>';
  }
  document.getElementById('product-title').innerHTML = `
    ${product.name}
    <button id="fav-btn" style="background:none;border:none;cursor:pointer;vertical-align:middle;outline:none;">
      <i class="${(JSON.parse(localStorage.getItem('favorites')) || []).some(f => f.productId === product._id) ? 'fa-solid' : 'fa-regular'} fa-heart" style="color:#e74c3c;font-size:1.2em;"></i>
    </button>
    <div style="margin:0 0 0.2em 0;">
      <span style="color:green;font-weight:600;font-size:1.1em;padding:0.22em 0.1em;border-radius:14px;box-shadow:0 1px 4px rgba(60,120,80,0.08);">৳${product.price.toFixed(2)}</span>
    </div>
    <div class="product-rating" style="margin:0.12em 0 0.35em 0; font-size:0.98em;">
      ${starsHtml}
      ${reviewCount > 0 ? `<span style='color:#444;font-size:0.93em;margin-left:0.28em;'>${avgRating.toFixed(1)} (${reviewCount})</span>` : ''}
    </div>
  `;
  document.getElementById('product-price').textContent = '';
  document.getElementById('product-description').innerHTML = `
    <strong>Category:</strong> ${product.category}<br>
    <strong>Description:</strong> ${product.description}<br>
    <strong>In stock:</strong> ${product.stock}
  `;

  // Seller shop link
  const linkDiv = document.getElementById('seller-shop-link');
  if (linkDiv && product.seller) {
    let sellerId = typeof product.seller === 'string' ? product.seller : product.seller._id;
    if (sellerId) {
      fetch(`https://ecommerce-server-cq95.onrender.com/api/users/${sellerId}`)
        .then(res => res.ok ? res.json() : null)
        .then(sellerUser => {
          let shopName = '';
          if (sellerUser && sellerUser.shopName && sellerUser.shopName.trim()) {
            shopName = sellerUser.shopName.trim();
          } else if (sellerUser && sellerUser.username) {
            shopName = sellerUser.username;
          } else {
            shopName = 'Seller';
          }
          linkDiv.innerHTML = `<a href="shop.html?sellerId=${encodeURIComponent(sellerId)}" class="seller-shop-link">Visit ${shopName}</a>`;
        })
        .catch(() => {
          linkDiv.innerHTML = `<a href="shop.html?sellerId=${encodeURIComponent(sellerId)}" class="seller-shop-link">View Seller Shop</a>`;
        });
    }
  }

  // Favorite button logic
  const favBtn = document.getElementById('fav-btn');
  favBtn.addEventListener('click', function(e) {
    e.preventDefault();
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const idx = favorites.findIndex(f => f.productId === product._id);
    if (idx > -1) {
      favorites.splice(idx, 1);
    } else {
      favorites.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image
      });
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    if (window.updateFavoritesCount) window.updateFavoritesCount();
    // Update icon
    favBtn.querySelector('i').className = (idx > -1 ? 'fa-regular' : 'fa-solid') + ' fa-heart';
  });

  addToCartBtn.onclick = () => {
    addToCart(product);
  };
}

let quantity = 1;
const qtyDisplay = document.getElementById('quantity');
const decBtn = document.getElementById('decrease-qty');
const incBtn = document.getElementById('increase-qty');

incBtn.addEventListener('click', () => {
  quantity++;
  qtyDisplay.textContent = quantity;
});

decBtn.addEventListener('click', () => {
  if (quantity > 1) {
    quantity--;
    qtyDisplay.textContent = quantity;
  }
});

function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const index = cart.findIndex(item => item.productId === product._id);
  if (index > -1) {
    cart[index].quantity += quantity;
  } else {
    cart.push({
      productId: product._id,
      name: product.name, // Use plain name from product object
      price: product.price,
      quantity: quantity,
      image: product.image
    });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  if (window.updateCartCount) window.updateCartCount();
}


// --- Review Section ---
const reviewsList = document.getElementById('reviews-list');
const reviewFormContainer = document.getElementById('review-form-container');
const user = JSON.parse(localStorage.getItem('user'));

function fetchReviews(productId) {
  fetch(`https://ecommerce-server-cq95.onrender.com/api/products/${productId}/reviews`)
    .then(res => res.json())
    .then(reviews => renderReviews(reviews))
    .catch(() => { reviewsList.textContent = 'No reviews yet.'; });
}

function renderReviews(reviews) {
  if (!reviews.length) {
    reviewsList.innerHTML = '<div style="color:#888;">No reviews yet.</div>';
    return;
  }
  reviewsList.innerHTML = reviews.map(r => `
    <div class="review-item" style="margin-bottom:1.1em;padding-bottom:0.7em;border-bottom:1px solid #eaeaea;">
      <div style="font-weight:600;">${r.username || 'User'}</div>
      <div style="color:#f5b301;font-size:1.1em;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div style="margin-top:0.2em;">${r.comment || ''}</div>
      <div style="font-size:0.9em;color:#aaa;">${new Date(r.createdAt).toLocaleString()}</div>
    </div>
  `).join('');
}

function renderReviewForm(productId) {
  if (!localStorage.getItem('token')) {
    reviewFormContainer.innerHTML = '<div style="color:#888;">Login to post a review.</div>';
    return;
  }
  reviewFormContainer.innerHTML = `
    <form id="review-form" style="margin-top:1.2em;display:flex;flex-direction:column;gap:0.7em;max-width:600px;">
      <label style="font-weight:600;">Your Rating:
        <span id="star-rating">
          ${[1,2,3,4,5].map(i => `<i class='fa-regular fa-star' data-val='${i}' style='cursor:pointer;font-size:1.5em;color:#f5b301;'></i>`).join('')}
        </span>
      </label>
      <textarea id="review-comment" placeholder="Write a comment (optional)" style="resize:vertical;min-height:50px;padding:0.7rem 1rem;border-radius:8px;border:1px solid #b7d1b7;font-size:1rem;"></textarea>
      <button type="submit" style="align-self:flex-start;margin-top:0.5rem;background:#84e77c;color:#fff;border:none;border-radius:20px;padding:0.7rem 1.5rem;font-weight:600;cursor:pointer;transition:background 0.18s;">Post Review</button>
    </form>
    <div id="review-message" style="color:#d14949;font-size:0.98em;"></div>
  `;
  let rating = 0;
  const stars = document.querySelectorAll('#star-rating i');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      rating = Number(this.dataset.val);
      stars.forEach((s, idx) => {
        s.className = idx < rating ? 'fa-solid fa-star' : 'fa-regular fa-star';
      });
    });
  });
  const form = document.getElementById('review-form');
  form.onsubmit = function(e) {
    e.preventDefault();
    if (!rating) {
      document.getElementById('review-message').textContent = 'Please select a rating.';
      return;
    }
    const comment = document.getElementById('review-comment').value.trim();
    fetch(`https://ecommerce-server-cq95.onrender.com/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
      },
      body: JSON.stringify({ rating, comment })
    })
      .then(res => res.json())
      .then(data => {
        if (data.review) {
          fetchReviews(productId);
          document.getElementById('review-message').style.color = '#28a745';
          document.getElementById('review-message').textContent = 'Review posted!';
          form.reset();
          stars.forEach(s => s.className = 'fa-regular fa-star');
          rating = 0;
        } else {
          document.getElementById('review-message').style.color = '#d14949';
          document.getElementById('review-message').textContent = data.message || 'Failed to post review.';
        }
      })
      .catch(() => {
        document.getElementById('review-message').style.color = '#d14949';
        document.getElementById('review-message').textContent = 'Network error.';
      });
  };
}

// --- Recommended Products ---
const recommendedDiv = document.getElementById('recommended-products');
function fetchRecommended(productId) {
  // Fetch all products to recommend from same category or same shop
  fetch(`https://ecommerce-server-cq95.onrender.com/api/products`)
    .then(res => res.json())
    .then(allProducts => {
      if (!loadedProduct) return renderRecommended([]);
      // Exclude current product and only show approved, not rejected
      const others = allProducts.filter(p => p._id !== productId && p.approved && !p.rejected);
      // 1. Same category
      let byCategory = others.filter(p => p.category && loadedProduct.category && p.category === loadedProduct.category);
      // 2. Same shop (seller)
      let sellerId = loadedProduct.seller && typeof loadedProduct.seller === 'object' ? loadedProduct.seller._id : loadedProduct.seller;
      let byShop = sellerId ? others.filter(p => {
        if (!p.seller) return false;
        if (typeof p.seller === 'object') return p.seller._id === sellerId;
        return p.seller === sellerId;
      }) : [];
      // Merge, prioritize category, then shop, deduplicate
      let recs = [...byCategory];
      byShop.forEach(p => {
        if (!recs.some(r => r._id === p._id)) recs.push(p);
      });
      // Limit to 8
      recs = recs.slice(0, 8);
      renderRecommended(recs);
    })
    .catch(() => { recommendedDiv.textContent = 'No recommendations.'; });
}
function renderRecommended(products) {
  if (!products.length) {
    recommendedDiv.innerHTML = '<div style="color:#888;">No recommendations.</div>';
    return;
  }
  recommendedDiv.innerHTML = products.map(p => `
    <div class="rec-card" style="min-width:160px;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(60,120,80,0.07);padding:0.7em 0.7em 1em 0.7em;display:flex;flex-direction:column;align-items:center;gap:0.5em;cursor:pointer;transition:box-shadow 0.18s;" data-id="${p._id}">
      <img src="${p.image}" alt="${p.name}" style="max-width:90px;max-height:90px;border-radius:7px;" />
      <div style="font-weight:600;font-size:1.05em;">${p.name}</div>
      <div style="color:#356842;font-weight:500;">৳${p.price.toFixed(2)}</div>
      <a href="product.html?id=${p._id}" style="color:#28a745;font-weight:600;text-decoration:none;font-size:0.98em;">View</a>
    </div>
  `).join('');
  // Make the entire card clickable
  recommendedDiv.querySelectorAll('.rec-card').forEach(card => {
    card.addEventListener('click', function(e) {
      // Prevent double navigation if 'View' button is clicked
      if (e.target.tagName === 'A') return;
      const id = card.getAttribute('data-id');
      if (id) window.location.href = `product.html?id=${id}`;
    });
    card.addEventListener('mouseover', function() {
      card.style.boxShadow = '0 4px 16px rgba(60,120,80,0.13)';
    });
    card.addEventListener('mouseout', function() {
      card.style.boxShadow = '0 2px 8px rgba(60,120,80,0.07)';
    });
  });
}

// --- Init ---
const productId = getProductId();
if (productId) {
  fetchProduct(productId);
  fetchReviews(productId);
  renderReviewForm(productId);
  fetchRecommended(productId);
} else {
  productDetailsDiv.textContent = 'No product selected.';
  addToCartBtn.style.display = 'none';
}
