
// ...existing code...
const role = localStorage.getItem('role');
const homeHref = 'home.html';

const navbarHTML = `
<nav class="user-navbar">
  <div class="nav-left">
    <a href="home.html" class="logo">ShopZone</a>
    <button id="hamburger-btn" class="hamburger-btn" style="display:none;" aria-label="Open menu">
      <i class="fas fa-bars"></i>
    </button>
  </div>

 <div class="nav-center">
  <a href="${homeHref}" class="home-link">Home</a>

  <a href="favorites.html" class="favorites-icon" id="favorites-navbar-btn" style="display:none;">
    <i class="fa-regular fa-heart"></i>
    <span id="favorites-count" style="display:none;">0</span>
  </a>

   <a href="cart.html" class="cart-icon">
    <i class="fas fa-shopping-cart"></i>
    <span id="cart-count">0</span>
  </a>
  <form id="search-form" class="navbar-search" onsubmit="return false;">
    <input type="text" id="search-input" placeholder="Search products..." />
    <button type="submit" id="search-button">
      <i class="fas fa-search"></i>
    </button>
  </form>
</div>

  <div class="nav-right">
    <label class="switch">
      <input type="checkbox" id="dark-toggle">
      <span class="slider"></span>
    </label>
    <span class="moon-icon">🌙</span>
    <span id="nav-user"></span>
  </div>
</nav>


<style>
/* Hamburger button */
.hamburger-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.7em;
  cursor: pointer;
  margin-right: 0.7em;
  display: flex;
  align-items: center;
}

/* Sidebar styles */
.sidebar-drawer {
  position: fixed;
  top: 0; left: 0;
  width: 320px;
  max-width: 90vw;
  height: 100vh;
  background: #f7fff2;
  box-shadow: 2px 0 16px rgba(60,120,80,0.13);
  z-index: 2000;
  transform: translateX(-100%);
  transition: transform 0.28s cubic-bezier(.4,1.3,.5,1);
  display: flex;
  flex-direction: column;
}
.sidebar-drawer.open {
  transform: translateX(0);
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1em 1.2em 0.7em 1.2em;
  border-bottom: 1px solid #e0e0e0;
  background: #e2f0e9;
}
.sidebar-header button {
  background: none;
  border: none;
  font-size: 2em;
  color: #4e7e39;
  cursor: pointer;
}
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.2em;
}
.sidebar-section {
  margin-bottom: 2em;
}
.sidebar-section h4 {
  margin: 0 0 0.7em 0;
  color: #356842;
  font-size: 1.1em;
}
.sidebar-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 1999;
  display: none;
}
.sidebar-backdrop.open {
  display: block;
}
@media (max-width: 600px) {
  .sidebar-drawer { width: 90vw; }
}
/* ...existing styles... */

.logo {
  font-weight: 1000;
  font-size: 2rem;    
  letter-spacing: 1px;
  color: white;     
  text-decoration: none;
}

.user-navbar a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;
}

.user-navbar a:hover {
  color:rgb(201, 245, 152);
}

.user-navbar {
 position: fixed;
 min-height: 35px; /* instead of fixed 30px */
  height: auto; 
  top: 0;
   left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  
  background:rgba(124, 194, 94, 0.93);
  color: white;
  font-family: Arial, sans-serif;
  gap: 1rem;
}

.nav-left {
  flex: 1;
}

.nav-center {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.nav-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}


.navbar-search {
  display: flex;
  align-items: center;
  background: rgba(214, 252, 192, 0.96);
  border: 2px solid rgb(71, 141, 43);
  border-radius: 20px;
  overflow: hidden;
  height: 38px; 
}

.navbar-search input {
  background: rgba(214, 252, 192, 0.96);
  border: none;
  color: black;
  padding: 0.5rem;
  font-size: 1rem;
  outline: none;
  flex-grow: 1;
  height: 100%; 
}

.user-navbar .navbar-search button {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  padding: 0 0.75rem;
  font-size: 1rem;
  color: #4e7e39;
  height: 100%;
  cursor: pointer;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar-links a {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;
}

.navbar-links a:hover {
  color: #c2f784;
}

.moon-icon {
  font-size: 1.2rem;
  color: #fff;
  user-select: none;
}

.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0;
  right: 0; bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4e7e39;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.cart-icon {
  font-size: 1.2rem;
  position: relative;
}

#cart-count {
  background: #333;
  color: white;
  font-size: 0.75rem;
  border-radius: 50%;
  padding: 2px 6px;
  position: absolute;
  top: -8px;
  right: -10px;
}

#nav-user button {
  padding: 0.4rem 0.8rem;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

#nav-user button:hover {
  background: #555;
}
#nav-user button#logout-btn {
  padding: 0.5rem 0.8rem;
  background: transparent;
  color: #fff;
  border: 1px solid #fff;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.3s ease;
  margin-left: 0.5rem;
}

#nav-user button#logout-btn:hover {
  background: rgba(26, 167, 33, 0.29);
}

/* Dropdown menu styles merged here */
.nav-user-dropdown {
  position: relative;
  display: inline-block;
}
.nav-username {
  font-weight: 600;
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  transition: background 0.2s;
}
.nav-username:hover, .nav-user-dropdown.open .nav-username {
  background: rgba(26, 167, 33, 0.18);
}
.dropdown-menu {
  position: absolute;
  top: 110%;
  right: 0;
  min-width: 160px;
  background: #b0f18aff;
  color: #132721ff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(60,120,80,0.13);
  z-index: 3000;
  padding: 0.3em 0;
  display: none;
}
.dropdown-item {
  display: block;
  padding: 0.7em 1.2em;
  color: #22352f;
  text-decoration: none;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.2s, color 0.2s;
  border-radius: 4px;
}
.dropdown-item:hover {
  background: #9dd3b1;
  color: #070707;
}

@media (max-width: 768px) {
  .navbar-search {
    order: 3;
    width: 100%;
    max-width: none;
  }

  .navbar-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
}
</style>
`;



document.getElementById('navbar-placeholder').innerHTML = navbarHTML;
document.body.classList.add('loaded'); 

// Update login/logout display
const token = localStorage.getItem('token');
const userSpan = document.getElementById('nav-user');
const darkToggle = document.getElementById('dark-toggle');

if (token) {
  // Parse user from localStorage and ensure _id is stored
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {}
  if (user && user.id && !user._id) {
    user._id = user.id;
    localStorage.setItem('user', JSON.stringify(user));
  }
  const username = (user && user.username) ? user.username : (localStorage.getItem('username') || 'User');
  let dashboardLink = '';
  let pastOrdersLink = '';
  if (role === 'admin') {
    dashboardLink = '<a href="admin.html" class="dropdown-item">Go to Dashboard</a>';
    // No past orders for admin
  } else if (role === 'seller') {
    dashboardLink = '<a href="seller.html" class="dropdown-item">Go to Dashboard</a>';
    // No past orders for seller
  } else {
    pastOrdersLink = '<a href="order-history.html" class="dropdown-item">Past Orders</a>';
  }
  userSpan.innerHTML = `
    <div class="nav-user-dropdown">
      <span id="nav-username" class="nav-username" style="cursor:pointer;user-select:none;">${username} <i class="fa fa-caret-down" style="font-size:0.9em;"></i></span>
      <div class="dropdown-menu" id="user-dropdown-menu" style="display:none;">
        <a href="profile.html" class="dropdown-item">View Profile</a>
        ${pastOrdersLink}
        ${dashboardLink}
        <button id="logout-btn" class="dropdown-item" style="width:100%;text-align:left;background:none;border:none;padding:0.5em 1em;">Logout</button>
      </div>
    </div>
  `;
  document.getElementById('logout-btn').addEventListener('click', logout);
  // Dropdown toggle logic
  const navUsername = document.getElementById('nav-username');
  const dropdownMenu = document.getElementById('user-dropdown-menu');
  let dropdownOpen = false;
  navUsername.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
    dropdownMenu.style.display = dropdownOpen ? 'block' : 'none';
  });
  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (dropdownOpen) {
      dropdownMenu.style.display = 'none';
      dropdownOpen = false;
    }
  });
} else {
  userSpan.innerHTML = `<a href="login.html">Login</a> | <a href="register.html">Register</a>`;
}


// Show favorites button for buyers only
const favoritesBtn = document.getElementById('favorites-navbar-btn');
const favoritesCount = document.getElementById('favorites-count');
if (role !== 'admin' && role !== 'seller') {
  favoritesBtn.style.display = 'inline-flex';
  updateFavoritesCount();
} else {
  favoritesBtn.style.display = 'none';
}

function updateFavoritesCount() {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  if (favs.length > 0) {
    favoritesCount.style.display = 'inline-block';
    favoritesCount.textContent = favs.length;
  } else {
    favoritesCount.style.display = 'none';
  }
}
window.updateFavoritesCount = updateFavoritesCount;

function closeSidebar() {
  sidebarDrawer.classList.remove('open');
  sidebarBackdrop.classList.remove('open');
}

// Dummy loader for orders/favorites (replace with real fetch as needed)
function loadSidebarOrders() {
  const ordersDiv = document.getElementById('sidebar-orders');
  // TODO: Replace with real fetch from /api/orders (filter by user)
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  if (!orders.length) {
    ordersDiv.innerHTML = '<div style="color:#888;">No past orders.</div>';
    return;
  }
  ordersDiv.innerHTML = orders.map(o => `
    <div style="margin-bottom:0.7em;">
      <div style="font-weight:600;">Order #${o.id || o._id || ''}</div>
      <div style="font-size:0.95em;">${o.date || ''}</div>
      <div style="color:#356842;">${o.items ? o.items.length : 0} items</div>
    </div>
  `).join('');
}

function loadSidebarFavorites() {
  const favDiv = document.getElementById('sidebar-favorites');
  // TODO: Replace with real fetch from /api/users/favorites or localStorage
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favs.length) {
    favDiv.innerHTML = '<div style="color:#888;">No favorite products.</div>';
    return;
  }
  favDiv.innerHTML = favs.map(f => `
    <div style="margin-bottom:0.7em;display:flex;align-items:center;gap:0.7em;">
      <img src="${f.image}" alt="${f.name}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;" />
      <div>
        <div style="font-weight:600;">${f.name}</div>
        <div style="color:#356842;">$${f.price?.toFixed(2) || ''}</div>
      </div>
    </div>
  `).join('');
}

// Cart count updater function
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (!cartCount) return;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalQuantity;
}

updateCartCount();

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}

// Apply saved theme and checkbox state
if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark');
  if (darkToggle) darkToggle.checked = true;
}

darkToggle?.addEventListener('change', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode',
    document.body.classList.contains('dark') ? 'enabled' : 'disabled'
  );
});

// Expose functions globally for other scripts
window.logout = logout;
window.updateCartCount = updateCartCount;