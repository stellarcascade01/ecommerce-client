document.addEventListener('DOMContentLoaded', () => {
  // --- Hero Carousel Logic with Typing Animation ---
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const indicators = document.querySelectorAll('.carousel-indicators .indicator');
  let currentSlide = 0;
  let autoSlideTimer = null;
  // Store original captions for typing
  const slideCaptions = Array.from(slides).map(slide => {
    const h1 = slide.querySelector('.carousel-caption h1');
    return h1 ? h1.textContent : '';
  });

  function typeCaption(slideIdx) {
    const slide = slides[slideIdx];
    const h1 = slide.querySelector('.carousel-caption h1');
    if (!h1) return;
    const text = slideCaptions[slideIdx];
    let idx = 0;
    h1.textContent = '';
    h1.classList.add('typing');
    function typeChar() {
      h1.textContent = text.slice(0, idx);
      if (idx < text.length) {
        idx++;
        setTimeout(typeChar, idx === 1 ? 350 : 55);
      } else {
        h1.classList.remove('typing');
      }
    }
    typeChar();
  }

  function showSlide(idx) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === idx);
    });
    indicators.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
    currentSlide = idx;
    // Typing animation for caption
    typeCaption(idx);
  }
  function nextSlide() {
    showSlide((currentSlide + 1) % slides.length);
  }
  function prevSlide() {
    showSlide((currentSlide - 1 + slides.length) % slides.length);
  }
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });
  indicators.forEach((dot, i) => {
    dot.addEventListener('click', () => { showSlide(i); resetAutoSlide(); });
  });
  function autoSlide() {
    autoSlideTimer = setInterval(nextSlide, 5000);
  }
  function resetAutoSlide() {
    if (autoSlideTimer) clearInterval(autoSlideTimer);
    autoSlide();
  }
  if (slides.length > 1) {
    autoSlide();
  }
  showSlide(0);
  // --- Sorting Controls ---
  // Add sorting dropdowns to the sidebar, above 'Filter by Category'
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const sortBar = document.createElement('div');
    sortBar.className = 'sidebar-sort-bar';
    sortBar.style.display = 'flex';
    sortBar.style.flexDirection = 'column';
    sortBar.style.gap = '0.5em';
    sortBar.style.marginBottom = '1.2em';
    sortBar.innerHTML = `
      <label style="font-weight:600;font-size:1.08em;">Sort Products</label>
      <div style="display:flex;gap:0.5em;align-items:center;">
        <select id="sort-type" style="padding:0.3em 0.7em;border-radius:6px;">
          <option value="price">Price</option>
          <option value="rating">Rating</option>
        </select>
        <select id="sort-order" style="padding:0.3em 0.7em;border-radius:6px;">
          <option value="desc">High to Low</option>
          <option value="asc">Low to High</option>
        </select>
      </div>
    `;
    // Insert before the first h3 (Filter by Category)
    const firstH3 = sidebar.querySelector('h3');
    if (firstH3) {
      sidebar.insertBefore(sortBar, firstH3);
    } else {
      sidebar.insertBefore(sortBar, sidebar.firstChild);
    }
  }
  let sortType = 'price';
  let sortOrder = 'desc';
  console.log('Token on home page load:', localStorage.getItem('token'));

  let products = [];
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  const searchInput = document.getElementById('search-input');
  const productContainer = document.getElementById('products');
  const priceFilter = document.getElementById('price-filter');
  const priceValue = document.getElementById('price-value');
  const categoryItems = document.querySelectorAll('.category-list li');

  let selectedCategory = 'all'; // default filter category

  function formatTaka(amount) {
    return `৳${amount.toFixed(2)}`;
  }

  async function fetchProducts() {
    try {
      const res = await fetch('https://ecommerce-server-cq95.onrender.com/api/products?approvedOnly=true');
      products = await res.json();
      displayProducts();
      updateCartCount();
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }

  function displayProducts() {
    // Get sort type/order from dropdowns if present
    const sortTypeEl = document.getElementById('sort-type');
    const sortOrderEl = document.getElementById('sort-order');
    if (sortTypeEl && sortOrderEl) {
      sortType = sortTypeEl.value;
      sortOrder = sortOrderEl.value;
    }
    const maxPrice = Number(priceFilter.value);
    const searchTerm = searchInput.value.toLowerCase();


    let filtered = products.filter(p =>
      (selectedCategory === 'all' || p.category === selectedCategory) &&
      p.price <= maxPrice &&
      p.name.toLowerCase().includes(searchTerm)
    );

    // --- Sorting ---
    filtered = filtered.slice(); // copy
    filtered.sort((a, b) => {
      if (sortType === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      } else if (sortType === 'rating') {
        // Calculate average rating for each
        const aRating = Array.isArray(a.reviews) && a.reviews.length > 0 ? a.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / a.reviews.length : 0;
        const bRating = Array.isArray(b.reviews) && b.reviews.length > 0 ? b.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / b.reviews.length : 0;
        return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
      }
      return 0;
    });

    const favs = JSON.parse(localStorage.getItem('favorites')) || [];

    productContainer.innerHTML = filtered.map(p => {
      const isFav = favs.some(f => f.productId === p._id);
      // Calculate average rating
      let avgRating = 0;
      let reviewCount = 0;
      if (Array.isArray(p.reviews) && p.reviews.length > 0) {
        avgRating = p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length;
        reviewCount = p.reviews.length;
      }
      // Render stars
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
      return `
        <div class="product">
          <button class="fav-btn" data-id="${p._id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart heart-icon"></i>
          </button>
          <a href="product.html?id=${p._id}">
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <div class="product-rating" style="margin:0.2em 0 0.5em 0; font-size:1.05em;">
              ${starsHtml}
              ${reviewCount > 0 ? `<span style='color:#444;font-size:0.98em;margin-left:0.4em;'>${avgRating.toFixed(1)} (${reviewCount})</span>` : ''}
            </div>
            <p>${formatTaka(p.price)}</p>
          </a>
          <div class="product-actions">
            <button class="add-to-cart" data-id="${p._id}">Add to Cart</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function addToCart(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) {
      console.error('❌ Product not found in local list');
      return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartCountEl.textContent = count;
    }
  }

  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      categoryItems.forEach(li => li.classList.remove('active'));
      item.classList.add('active');
      selectedCategory = item.dataset.category;
      displayProducts();
    });
  });

  priceFilter.addEventListener('input', () => {
    priceValue.textContent = priceFilter.value;
    displayProducts();
  });

  if (searchInput) {
    searchInput.addEventListener('input', displayProducts);
  }

  const searchButton = document.getElementById('search-button');
  const searchForm = document.getElementById('search-form');

  if (searchButton) searchButton.addEventListener('click', displayProducts);
  if (searchForm) {
    searchForm.addEventListener('submit', e => {
      e.preventDefault();
      displayProducts();
    });
  }

  // --- Sorting event listeners ---
  document.addEventListener('change', function(e) {
    if (e.target && (e.target.id === 'sort-type' || e.target.id === 'sort-order')) {
      displayProducts();
    }
  });

  productContainer.addEventListener('click', e => {
    // Add to cart
    if (e.target.classList.contains('add-to-cart')) {
      const productId = e.target.getAttribute('data-id');
      const product = products.find(p => p._id === productId);
      if (!product) return;
      let cartLocal = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cartLocal.find(item => item.productId === productId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cartLocal.push({ productId, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cartLocal));
      cart = cartLocal; // sync top-level cart variable
      updateCartCount();
    }
    // Buy Now button removed from home page
    // Favorite/unfavorite
    // Favorite/unfavorite
    if (e.target.closest('.fav-btn')) {
      const btn = e.target.closest('.fav-btn');
      const productId = btn.dataset.id;
      let favs = JSON.parse(localStorage.getItem('favorites')) || [];
      const idx = favs.findIndex(f => f.productId === productId);
      if (idx > -1) {
        favs.splice(idx, 1);
      } else {
        const product = products.find(p => p._id === productId);
        if (product) {
          favs.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image
          });
        }
      }
      localStorage.setItem('favorites', JSON.stringify(favs));
      if (window.updateFavoritesCount) window.updateFavoritesCount();
      displayProducts();
    }
  });

  fetchProducts();

  // Delay updating cart count until navbar is fully injected into DOM
  const waitForCartCount = setInterval(() => {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
      updateCartCount();
      clearInterval(waitForCartCount);
    }
  }, 100);

  // Back-to-top button
  const backToTopBtn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (backToTopBtn) backToTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
