// cart.js
const cartContainer = document.getElementById('cart-container');
const emptyMsg = document.getElementById('empty-msg');
const orderButtonContainer = document.querySelector('.order-button-container');
const goToOrderBtn = document.getElementById('go-to-order');

let products = []; // fetched product details for cart items

// Load cart from localStorage
function loadCart() {
  const cartJSON = localStorage.getItem('cart');
  return cartJSON ? JSON.parse(cartJSON) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart count if function exists
if (window.updateCartCount) {
  window.updateCartCount();
}

// Fetch product data from backend for given ids
async function fetchProductsByIds(ids) {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const allProducts = await res.json();
    return allProducts.filter(p => ids.includes(p._id));
  } catch (err) {
    console.error('Failed to fetch products', err);
    return [];
  }
}

// Format price in Taka
function formatTaka(amount) {
  return `৳${amount.toFixed(2)}`;
}

// Render cart items on page
async function renderCart() {
  let cart = loadCart();
  if (cart.length === 0) {
    emptyMsg.style.display = 'block';
    cartContainer.innerHTML = '';
    orderButtonContainer.style.display = 'none';
    return;
  }

  emptyMsg.style.display = 'none';
  orderButtonContainer.style.display = 'flex';

  // Get product details for cart items
  const productIds = cart.map(item => item.productId);
  products = await fetchProductsByIds(productIds);

  let html = '';
  let total = 0;

  cart.forEach(item => {
    const product = products.find(p => p._id === item.productId);
    if (!product) return;

    const subTotal = product.price * item.quantity;
    total += subTotal;

    html += `
      <div class="cart-item" data-id="${product._id}">
        <img src="${product.image}" alt="${product.name}" width="100"/>
        <h3>${product.name}</h3>
        <p>Price: ${formatTaka(product.price)}</p>
        <p>Quantity: 
          <button class="dec-qty">-</button>
          <span>${item.quantity}</span>
          <button class="inc-qty">+</button>
        </p>
        <p>Subtotal: ${formatTaka(subTotal)}</p>
        <button class="remove-item">Remove</button>
      </div>
      <hr>
    `;
  });

  html += `<h3>Total: ${formatTaka(total)}</h3>`;
  cartContainer.innerHTML = html;

  // Event listeners for quantity buttons
  cartContainer.querySelectorAll('.inc-qty').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(btn, 1));
  });

  cartContainer.querySelectorAll('.dec-qty').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(btn, -1));
  });

  cartContainer.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', () => removeItem(btn));
  });
}

function updateQuantity(button, change) {
  const cart = loadCart();
  const cartItemDiv = button.closest('.cart-item');
  const productId = cartItemDiv.dataset.id;

  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity < 1) item.quantity = 1;

  saveCart(cart);
  renderCart();
  if (window.updateCartCount) updateCartCount();
}

function removeItem(button) {
  let cart = loadCart();
  const cartItemDiv = button.closest('.cart-item');
  const productId = cartItemDiv.dataset.id;

  cart = cart.filter(i => i.productId !== productId);
  saveCart(cart);
  renderCart();
  if (window.updateCartCount) updateCartCount();
}

goToOrderBtn.addEventListener('click', () => {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'order.html';
  } else {
    window.location.href = 'login.html?redirect=order.html';
  }
});

// Initial render
renderCart();
