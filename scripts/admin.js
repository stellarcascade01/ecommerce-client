const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const username = localStorage.getItem('username');

if (!token || role !== 'admin') {
  alert('Access denied. Admins only.');
  window.location.href = 'login.html';
}

// Logout
document.getElementById('logout-btn').onclick = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};

// Load pending products
async function loadPendingProducts() {
  const spinner = document.getElementById('pending-spinner');
  const tbody = document.querySelector('#products-table tbody');
  if (spinner) spinner.style.display = 'block';
  tbody.innerHTML = '';
  try {
    const res = await fetch('https://ecommerce-server-cq95.onrender.com/api/products/pending', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const products = await res.json();

    if (!Array.isArray(products)) {
      alert('Something went wrong while fetching products');
      console.error('Expected array but got:', products);
      if (spinner) spinner.style.display = 'none';
      return;
    }

    products.forEach(product => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${product.name}</td>
        <td>${product.seller?.username || 'Unknown'}</td>
        <td>৳${product.price || ''}</td>
        <td>${product.category || ''}</td>
        <td>${product.stock ?? product.quantity ?? 0}</td>
        <td>${product.image ? `<img src="${product.image}" alt="img" style="max-width:60px;max-height:60px;">` : ''}</td>
        <td><div class="action-btns">
          <button class="approve" data-id="${product._id}">Approve</button>
          <button class="reject" data-id="${product._id}">Reject</button>
        </div></td>
      `;
      tbody.appendChild(tr);
    });

    // Approve/Reject buttons
    document.querySelectorAll('.approve').forEach(btn => {
      btn.onclick = () => {
        // Approve instantly, no feedback needed
        updateProductStatus(btn.dataset.id, 'approved', '');
      };
    });
    document.querySelectorAll('.reject').forEach(btn => {
      btn.onclick = () => showAdminPopup('Reject this product?', '', (feedback) => {
        updateProductStatus(btn.dataset.id, 'rejected', feedback);
      });
    });
  } catch (error) {
    alert('Failed to load products.');
    console.error(error);
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

// Update product status
async function updateProductStatus(productId, status, reason) {
  try {
    const res = await fetch(`https://ecommerce-server-cq95.onrender.com/api/products/${productId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ status, reason }),
    });
    if (res.ok) {
      showPopupMsg(`Product ${status}`);
      loadPendingProducts();
    } else {
      showPopupMsg('Failed to update product status.', false);
    }
  } catch {
    showPopupMsg('Network error.', false);
  }
}

// Popup modal for admin
function showAdminPopup(title, defaultFeedback, onConfirm) {
  const modal = document.getElementById('admin-popup-modal');
  const titleEl = document.getElementById('popup-modal-title');
  const feedbackEl = document.getElementById('popup-modal-feedback');
  const confirmBtn = document.getElementById('popup-modal-confirm');
  const cancelBtn = document.getElementById('popup-modal-cancel');

  titleEl.textContent = title;
  feedbackEl.value = defaultFeedback || '';
  modal.style.display = 'flex';

  confirmBtn.onclick = () => {
    modal.style.display = 'none';
    onConfirm(feedbackEl.value.trim());
  };
  cancelBtn.onclick = () => { modal.style.display = 'none'; };
}

// Minimal popup message
function showPopupMsg(msg, success = true) {
  let popup = document.getElementById('popup-message');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'popup-message';
    Object.assign(popup.style, {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      background: 'rgba(0,0,0,0.82)',
      borderRadius: '32px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      padding: '1.1rem 1.5rem', zIndex: '3000',
      fontSize: '1.1rem', fontWeight: '600', minWidth: '80px', minHeight: '80px',
      textAlign: 'center', color: '#fff', backdropFilter: 'blur(2px)',
      transition: 'opacity 0.2s', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: '0.3rem'
    });
    document.body.appendChild(popup);
  }
  popup.innerHTML = (success
    ? '<span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:#28a745;display:flex;align-items:center;justify-content:center;margin-bottom:0.2em;"><svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10.5L9 13.5L15 7.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
    : '<span style="font-size:2.2rem;display:block;line-height:1;margin-bottom:0.2em;">❌</span>') 
    + `<span style="font-size:1rem;font-weight:500;">${msg}</span>`;
  popup.style.opacity = '1';
  popup.style.display = 'flex';
  setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => { popup.style.display = 'none'; }, 200);
  }, 1800);
}

// View Users

// Tab switching logic
document.addEventListener('DOMContentLoaded', () => {
  const tabProducts = document.getElementById('tab-products');
  const tabPastProducts = document.getElementById('tab-past-products');
  const tabUsers = document.getElementById('tab-users');
  const productsSection = document.getElementById('products-section');
  const pastProductsSection = document.getElementById('past-products-section');
  const usersSection = document.getElementById('users-section');
  const usersTableBody = document.getElementById('users-table').getElementsByTagName('tbody')[0];
  const pastProductsTableBody = document.getElementById('past-products-table').getElementsByTagName('tbody')[0];

  function activateTab(tabBtn, section) {
    [tabProducts, tabPastProducts, tabUsers].forEach(btn => btn.classList.remove('active'));
    [productsSection, pastProductsSection, usersSection].forEach(sec => sec.style.display = 'none');
    tabBtn.classList.add('active');
    section.style.display = '';
  }

  tabProducts.onclick = function() {
    activateTab(tabProducts, productsSection);
  };

  tabPastProducts.onclick = async function() {
    activateTab(tabPastProducts, pastProductsSection);
    // Load past products
    try {
      const res = await fetch('https://ecommerce-server-cq95.onrender.com/api/products?approvedOnly=false');
      const products = await res.json();
      pastProductsTableBody.innerHTML = '';
      products.filter(p => p.status === 'approved' || p.status === 'rejected').forEach(product => {
        pastProductsTableBody.innerHTML += `
          <tr>
            <td>${product.name}</td>
            <td>${product.seller?.username || 'Unknown'}</td>
            <td>৳${product.price || ''}</td>
            <td>${product.category || ''}</td>
            <td>${product.stock ?? product.quantity ?? 0}</td>
            <td>${product.image ? `<img src="${product.image}" alt="img" style="max-width:60px;max-height:60px;">` : ''}</td>
            <td style="font-weight:600;color:${product.status === 'approved' ? '#28a745' : '#ff5858'}">${product.status.charAt(0).toUpperCase() + product.status.slice(1)}</td>
            <td>${product.reason ? product.reason : ''}</td>
          </tr>
        `;
      });
    } catch {
      pastProductsTableBody.innerHTML = '<tr><td colspan="8">Failed to load products</td></tr>';
    }
  };

  tabUsers.onclick = async function() {
    activateTab(tabUsers, usersSection);
    // Load users
    try {
      const res = await fetch('https://ecommerce-server-cq95.onrender.com/api/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const users = await res.json();
      usersTableBody.innerHTML = '';
      users.forEach(user => {
        if (user.role === 'admin') return; // Hide admin users from the list
        const isBlocked = user.status === 'blocked';
        usersTableBody.innerHTML += `<tr><td>${user.username}</td><td>${user.email || ''}</td><td>${user.role}</td><td>${isBlocked ? 'Blocked' : 'Active'}</td><td>
          <button class="block-btn" data-id="${user._id}" data-blocked="${isBlocked}">
            ${isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button class="delete-btn" data-id="${user._id}">Delete</button>
        </td></tr>`;
      });
      // Add event listeners for block/unblock buttons
      usersTableBody.querySelectorAll('.block-btn').forEach(btn => {
        if (btn.disabled) return;
        btn.onclick = async function() {
          const userId = btn.dataset.id;
          const isBlocked = btn.dataset.blocked === 'true';
          const action = isBlocked ? 'unblock' : 'block';
          if (!confirm(`Are you sure you want to ${action} this user?`)) return;
          try {
            const res = await fetch(`https://ecommerce-server-cq95.onrender.com/api/users/${userId}/${action}`, {
              method: 'PATCH',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              showPopupMsg(`User ${action}ed`);
              // Toggle status and button
              const statusTd = btn.closest('tr').querySelector('td:nth-child(4)');
              if (isBlocked) {
                statusTd.textContent = 'Active';
                btn.textContent = 'Block';
                btn.style.background = '#ffb347';
                btn.dataset.blocked = 'false';
              } else {
                statusTd.textContent = 'Blocked';
                btn.textContent = 'Unblock';
                btn.style.background = '#28a745';
                btn.dataset.blocked = 'true';
              }
            } else {
              showPopupMsg(`Failed to ${action} user`, false);
            }
          } catch {
            showPopupMsg('Network error', false);
          }
        };
      });
      // Add event listeners for delete buttons
      usersTableBody.querySelectorAll('.delete-btn').forEach(btn => {
        if (btn.disabled) return;
        btn.onclick = async function() {
          const userId = btn.dataset.id;
          if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
          try {
            const res = await fetch(`https://ecommerce-server-cq95.onrender.com/api/users/${userId}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              showPopupMsg('User deleted');
              btn.closest('tr').remove();
            } else {
              showPopupMsg('Failed to delete user', false);
            }
          } catch {
            showPopupMsg('Network error', false);
          }
        };
      });
    } catch {
      usersTableBody.innerHTML = '<tr><td colspan="5">Failed to load users</td></tr>';
    }
  };
});

loadPendingProducts();
