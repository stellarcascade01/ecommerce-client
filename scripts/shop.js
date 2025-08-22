
function getSellerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('sellerId');
}

const sellerId = getSellerIdFromUrl();
const productsList = document.getElementById('shop-products-list');
const emptyMsg = document.getElementById('shop-empty-message');
const sellerInfoDiv = document.getElementById('seller-info');
const shopTitle = document.getElementById('shop-title');

if (!sellerId) {
  shopTitle.textContent = 'Shop Not Found';
  emptyMsg.textContent = 'No seller specified.';
} else {
  loadSellerShop(sellerId);
}

async function loadSellerShop(sellerId) {
  productsList.innerHTML = '';
  emptyMsg.textContent = '';
  sellerInfoDiv.innerHTML = '';
  try {
        // Fetch all products (could be optimized with a backend filter)
    const res = await fetch('http://localhost:5000/api/products');
    const products = await res.json();
    const sellerProducts = products.filter(p => {
      if (!p.seller) return false;
      // Only show approved products
      if (!p.approved || p.rejected) return false;
      if (typeof p.seller === 'string') return p.seller === sellerId;
      if (p.seller._id) return p.seller._id === sellerId;
      return false;
    });
    if (!sellerProducts.length) {
      emptyMsg.textContent = 'No products found for this shop.';
      return;
    }
    // Get sellerId (string)
    let sellerIdStr = sellerProducts[0].seller && sellerProducts[0].seller._id ? sellerProducts[0].seller._id : sellerProducts[0].seller;
    let shopName = '';
    let sellerUsername = '';
    try {
      // Fetch latest seller info
      const sellerRes = await fetch(`http://localhost:5000/api/users/${sellerIdStr}`);
      if (sellerRes.ok) {
        const sellerUser = await sellerRes.json();
        shopName = sellerUser.shopName && sellerUser.shopName.trim() ? sellerUser.shopName : '';
        sellerUsername = sellerUser.username || '';
      }
    } catch {}
    if (!shopName) shopName = sellerUsername || 'Seller';
    shopTitle.textContent = shopName ;
    
    // --- Rating summary for the whole shop as a visual chart ---
    let totalReviews = 0;
    let totalRating = 0;
    // Count ratings by star (1-5)
    let ratingCounts = [0, 0, 0, 0, 0]; // index 0 = 1 star, ... index 4 = 5 stars
    sellerProducts.forEach(product => {
      if (Array.isArray(product.reviews) && product.reviews.length > 0) {
        product.reviews.forEach(r => {
          const rating = Math.round(r.rating || 0);
          if (rating >= 1 && rating <= 5) ratingCounts[rating - 1]++;
        });
        totalReviews += product.reviews.length;
        totalRating += product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      }
    });
    let shopRatingHtml = '';
    if (totalReviews > 0) {
      const avgShopRating = totalRating / totalReviews;
      let starsHtml = '';
      const fullStars = Math.floor(avgShopRating);
      const halfStar = avgShopRating - fullStars >= 0.5;
      for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fa fa-star" style="color:gold;font-size:1.15em;"></i>';
      if (halfStar) starsHtml += '<i class="fa fa-star-half-alt" style="color:gold;font-size:1.15em;"></i>';
      for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) starsHtml += '<i class="fa-regular fa-star" style="color:gold;font-size:1.15em;"></i>';
      // --- Horizontal bar chart SVG ---
      const maxCount = Math.max(...ratingCounts, 1);
      let bars = '';
      for (let i = 4; i >= 0; i--) {
        const barWidth = (ratingCounts[i] / maxCount) * 120;
        bars += `
          <g>
            <text x="0" y="${(4-i)*22+18}" font-size="1em" fill="#888" text-anchor="start">${i+1}★</text>
            <rect x="32" y="${(4-i)*22+7}" width="${barWidth}" height="14" rx="6" fill="#f7b731" />
            <text x="${36+Math.max(barWidth,18)}" y="${(4-i)*22+18}" font-size="0.98em" fill="#444" text-anchor="start">${ratingCounts[i]}</text>
          </g>
        `;
      }
      shopRatingHtml = `
        <div style="margin-bottom:0.7em;font-size:1.08em;color:#444;display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;">
          <span style="font-weight:600;">Shop Rating:</span>
          <span>${starsHtml}</span>
          <span style="color:#888;font-size:0.98em;">${avgShopRating.toFixed(2)} (${totalReviews} review${totalReviews>1?'s':''})</span>
        </div>
        <div style="margin-bottom:1.1em;padding-left:18px;">
          <svg width="220" height="120" viewBox="0 0 220 120" style="display:block;max-width:100%;">
            ${bars}
          </svg>
        </div>
      `;
    } else {
      shopRatingHtml = `<div style="margin-bottom:0.7em;font-size:1.08em;color:#888;">No ratings yet</div>`;
    }
    sellerInfoDiv.innerHTML = shopRatingHtml;

    // Render products with average rating (per product)
    sellerProducts.forEach(product => {
      const card = document.createElement('div');
      card.style.background = '#fff';
      card.style.borderRadius = '12px';
      card.style.boxShadow = '0 2px 12px rgba(60,120,80,0.07)';
      card.style.padding = '1.1em';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.gap = '0.7em';
      card.style.cursor = 'pointer';
      card.title = 'View product details';
      card.onclick = () => {
        window.location.href = `product.html?id=${product._id}`;
      };
      if (product.image) {
        card.innerHTML += `<img src="${product.image}" alt="img" style="max-width:120px;max-height:120px;border-radius:8px;box-shadow:0 1px 4px rgba(64,96,80,0.10);">`;
      }
      card.innerHTML += `<div style="font-weight:700;font-size:1.1em;">${product.name}</div>`;
      card.innerHTML += `<div style="color:#356842;font-size:1em;">৳${product.price}</div>`;
      // --- Rating stars and count ---
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
        for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fa fa-star" style="color:#f7b731;font-size:1.1em;"></i>';
        if (halfStar) starsHtml += '<i class="fa fa-star-half-alt" style="color:#f7b731;font-size:1.1em;"></i>';
        for (let i = fullStars + (halfStar ? 1 : 0); i < 5; i++) starsHtml += '<i class="fa-regular fa-star" style="color:#f7b731;font-size:1.1em;"></i>';
        starsHtml += `<span style='color:#444;font-size:0.98em;margin-left:0.28em;'>${avgRating.toFixed(1)} (${reviewCount})</span>`;
      } else {
        starsHtml = '<span style="color:#bbb;font-size:1em;">No ratings</span>';
      }
      card.innerHTML += `<div class="product-rating" style="margin:0.12em 0 0.35em 0; font-size:0.98em;">${starsHtml}</div>`;
      // --- End rating ---
      card.innerHTML += `<div style="font-size:0.98em;color:#888;">${product.category || ''}</div>`;
      // --- Minimal card: add to cart and favorite icon ---
      card.innerHTML += `
        <div class="card-actions" style="display:flex;flex-direction:column;align-items:center;gap:0.7em;width:100%;position:absolute;left:0;bottom:0;padding-bottom:1em;background:linear-gradient(to top, #fff 90%, transparent 100%);">
          <button class="add-to-cart" data-id="${product._id}" style="background:#d6f896;color:#264216;border:none;border-radius:20px;font-weight:bold;padding:0.4em 1.1em;cursor:pointer;font-size:1em;transition:background 0.3s, color 0.3s;width:90%;max-width:180px;margin-bottom:0.3em;">Add to Cart</button>
          <button class="fav-btn" data-id="${product._id}" style="background:none;border:none;cursor:pointer;vertical-align:middle;outline:none;">
            <i class="${(JSON.parse(localStorage.getItem('favorites')) || []).some(f => f.productId === product._id) ? 'fa-solid' : 'fa-regular'} fa-heart" style="color:#e74c3c;font-size:1.3em;"></i>
          </button>
        </div>
      `;
      card.style.position = 'relative';
      card.style.minHeight = '350px';
      productsList.appendChild(card);
    });
    // Add event listeners for add to cart and favorite
    productsList.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const productId = btn.getAttribute('data-id');
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existing = cart.find(item => item.productId === productId);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({ productId, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        if (window.updateCartCount) window.updateCartCount();
      };
    });
    
  } catch (err) {
    emptyMsg.textContent = 'Failed to load shop.';
    // Optionally log error: console.error(err);
  }
}
