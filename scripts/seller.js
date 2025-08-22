// Authentication & seller check
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const username = localStorage.getItem('username');
const userId = localStorage.getItem('userId');

if (!token || role !== 'seller') {
  alert('Access denied. Sellers only.');
  window.location.href = 'login.html';
}

// Logout
document.getElementById('logout-btn').onclick = () => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = 'login.html';
  }
};

// Go to Homepage
const homeBtn = document.getElementById('home-btn');
if (homeBtn) {
  homeBtn.onclick = () => {
    window.location.href = 'home.html';
  };
}

// View My Shop
const viewShopBtn = document.getElementById('view-shop-btn');
if (viewShopBtn && userId) {
  viewShopBtn.onclick = () => {
    window.location.href = `shop.html?sellerId=${encodeURIComponent(userId)}`;
  };
}

// Media preview and remove (multiple images/videos)

const imageInput = document.getElementById('mediaFileInput');
const previewContainer = document.getElementById('image-preview-container');
previewContainer.innerHTML = '';

function renderMediaPreviews(files) {
  previewContainer.innerHTML = '';
  if (!files.length) {
    previewContainer.style.display = 'none';
    return;
  }
  previewContainer.style.display = 'flex';
  Array.from(files).forEach((file, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginRight = '10px';
    let mediaEl;
    if (file.type.startsWith('image/')) {
      mediaEl = document.createElement('img');
      mediaEl.src = URL.createObjectURL(file);
      mediaEl.style.maxWidth = '80px';
      mediaEl.style.maxHeight = '80px';
      mediaEl.style.borderRadius = '6px';
      mediaEl.style.marginBottom = '4px';
    } else if (file.type.startsWith('video/')) {
      mediaEl = document.createElement('video');
      mediaEl.src = URL.createObjectURL(file);
      mediaEl.controls = true;
      mediaEl.style.maxWidth = '80px';
      mediaEl.style.maxHeight = '80px';
      mediaEl.style.borderRadius = '6px';
      mediaEl.style.marginBottom = '4px';
    }
    if (mediaEl) wrapper.appendChild(mediaEl);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginTop = '2px';
    removeBtn.onclick = () => {
      const dt = new DataTransfer();
      Array.from(imageInput.files).forEach((f, i) => { if (i !== idx) dt.items.add(f); });
      imageInput.files = dt.files;
      renderMediaPreviews(imageInput.files);
    };
    wrapper.appendChild(removeBtn);
    previewContainer.appendChild(wrapper);
  });
}

imageInput.addEventListener('change', function(e) {
  renderMediaPreviews(e.target.files);
});

// Clear previews if input is reset elsewhere
imageInput.addEventListener('input', function(e) {
  if (!e.target.files.length) renderMediaPreviews([]);
});

// Upload product form submission
document.getElementById('upload-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const description = form.description.value.trim();
  const price = parseFloat(form.price.value);
  let category = form.category.value;
  const quantity = parseInt(form.quantity.value);
  if (!category) category = 'misc';
  const imageFiles = imageInput.files;

  if (!name || isNaN(price) || price < 0 || isNaN(quantity) || quantity < 0) {
    showFormMessage('Please fill all required fields (name, price, quantity).', true);
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('category', category);
  formData.append('stock', quantity);
  if (imageFiles && imageFiles.length) {
    // Only send the first file, as backend expects a single file
    formData.append('imageFile', imageFiles[0]);
  }

  const uploadBtn = document.getElementById('upload-btn');
  uploadBtn.disabled = true;

  try {
    const res = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    if (res.ok) {
      showPopupMessage('Product uploaded! Pending admin approval.', true);
      form.reset();
      renderMediaPreviews([]);
      const data = await res.json();
      showUploadSummary({
        name,
        price,
        category,
        quantity,
        description,
        image: data.product?.image || '',
      });
      loadSellerProducts();
    } else {
      showFormMessage('Failed to upload product.', true);
      showPopupMessage('Failed to upload product.', false);
    }
  } catch {
    showFormMessage('Network error.', true);
    showPopupMessage('Network error.', false);
  }

  uploadBtn.disabled = false;
});

// Helper functions
function showFormMessage(msg, isError) {
  const el = document.getElementById('form-message');
  el.textContent = msg;
  el.style.color = isError ? '#d9534f' : '#28a745';
}

function showPopupMessage(msg, isSuccess) {
  const popup = document.getElementById('popup-message');
  let icon = isSuccess
    ? '<span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:#28a745;display:flex;align-items:center;justify-content:center;margin-bottom:0.2em;"><svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10.5L9 13.5L15 7.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
    : '<span style="font-size:2.2rem;display:block;line-height:1;margin-bottom:0.2em;">❌</span>';
  let text = isSuccess
    ? (msg.toLowerCase().includes('delete') ? 'Deleted' : 'Pending for Admin Approval')
    : 'Error';
  popup.innerHTML = icon + `<span style="font-size:1rem;font-weight:500;">${text}</span>`;
  popup.style.display = 'flex';
  popup.style.opacity = '1';
  setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => { popup.style.display = 'none'; }, 200);
  }, 2000);
}

function showUploadSummary(product) {
  const container = document.getElementById('upload-summary-container');
  const content = document.getElementById('upload-summary-content');
  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:1.2rem;">
      ${product.image ? `<img src="${product.image}" alt="img" style="max-width:70px;max-height:70px;border-radius:8px;box-shadow:0 1px 4px rgba(64,96,80,0.10);">` : ''}
      <div style="flex:1;">
        <div><b>Name:</b> ${product.name}</div>
        <div><b>Price:</b> ৳${product.price}</div>
        <div><b>Category:</b> ${product.category}</div>
        <div><b>Quantity:</b> ${product.quantity}</div>
        ${product.description ? `<div><b>Description:</b> ${product.description}</div>` : ''}
      </div>
    </div>
  `;
  container.style.display = 'block';
}

// Tabs
let currentTab = 'pending';
function setActiveTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tab + '-tab').classList.add('active');
  updateTableHeader();
}

function updateTableHeader() {
  const thead = document.querySelector('#seller-products-table thead');
  if (!thead) return;
  let headerHTML = `<tr>
    <th>Name</th>
    <th>Price</th>
    <th>Category</th>
    <th>Stock</th>
    <th>Image</th>
    ${currentTab === 'rejected' ? '<th id="reason-header">Reason</th>' : ''}
    <th>Status</th>
    <th>Action</th>
  </tr>`;
  thead.innerHTML = headerHTML;
}

document.getElementById('approved-tab').onclick = () => {
  currentTab = 'approved';
  setActiveTab('approved');
  loadSellerProducts();
};
document.getElementById('rejected-tab').onclick = () => {
  currentTab = 'rejected';
  setActiveTab('rejected');
  loadSellerProducts();
};
document.getElementById('pending-tab').onclick = () => {
  currentTab = 'pending';
  setActiveTab('pending');
  loadSellerProducts();
};

// Load seller products
async function loadSellerProducts() {
  document.getElementById('loading-spinner').style.display = '';
  document.getElementById('empty-message').textContent = '';

  try {
    const res = await fetch('http://localhost:5000/api/products', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const products = await res.json();
    const tbody = document.querySelector('#seller-products-table tbody');
    tbody.innerHTML = '';
    const filtered = products.filter(p => p.seller === userId || (p.seller && p.seller._id === userId));
    let hasProducts = false;


    // --- Performance summary ---
    const summaryDiv = document.getElementById('summary-content');
    const graphCanvas = document.getElementById('performance-graph');
    if (graphCanvas) {
      graphCanvas.width = 800;
      graphCanvas.height = 320;
    }
    if (summaryDiv) {
      // Only approved products for graph
      const approvedProducts = filtered.filter(p => p.approved && !p.rejected);
      let totalReviews = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let productNames = [];
      let avgRatings = [];
      let reviewCounts = [];
      approvedProducts.forEach(p => {
        productNames.push(p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name);
        let prodReviews = Array.isArray(p.reviews) ? p.reviews : [];
        let prodAvg = prodReviews.length > 0 ? prodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / prodReviews.length : 0;
        avgRatings.push(prodAvg);
        reviewCounts.push(prodReviews.length);
        if (prodReviews.length > 0) {
          totalReviews += prodReviews.length;
          totalRating += prodReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
          ratingCount += prodReviews.length;
        }
      });
      let avgRating = ratingCount > 0 ? (totalRating / ratingCount) : 0;
      summaryDiv.innerHTML = `
        <div><b>Average Rating:</b> ${ratingCount > 0 ? avgRating.toFixed(2) : 'N/A'}</div>
        <div><b>Total Reviews:</b> ${totalReviews}</div>
      `;
      // --- Draw bar chart: Average Rating per Product ---
      if (graphCanvas && approvedProducts.length > 0) {
        const ctx = graphCanvas.getContext('2d');
        ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
        // Chart settings
        const barWidth = 48; // wide bars
        const gap = 32;
        const leftPad = 60;
        const canvasHeight = graphCanvas.height;
        const canvasWidth = graphCanvas.width;
        const topPad = Math.floor(canvasHeight * 0.13); // 13% top padding
        const bottomPad = Math.floor(canvasHeight * 0.18); // 18% bottom padding for labels
        const maxBarHeight = canvasHeight - topPad - bottomPad;
        const maxRating = 5;
        // Draw axes
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(leftPad, topPad);
        ctx.lineTo(leftPad, topPad + maxBarHeight);
        ctx.lineTo(leftPad + (approvedProducts.length) * (barWidth + gap) - gap, topPad + maxBarHeight);
        ctx.stroke();
        // Draw bars for average rating
        for (let i = 0; i < approvedProducts.length; i++) {
          const ratingBarH = (avgRatings[i] / maxRating) * maxBarHeight;
          ctx.fillStyle = '#f7b731';
          ctx.fillRect(leftPad + i * (barWidth + gap), topPad + maxBarHeight - ratingBarH, barWidth, ratingBarH);
          // Product name (x axis)
          ctx.save();
          ctx.translate(leftPad + i * (barWidth + gap) + barWidth/2, topPad + maxBarHeight + 18);
          ctx.rotate(-Math.PI/7);
          ctx.font = '13px Arial';
          ctx.fillStyle = '#444';
          ctx.textAlign = 'right';
          ctx.fillText(productNames[i], 0, 0);
          ctx.restore();
          // Rating value on top of bar
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#22352f';
          ctx.textAlign = 'center';
          ctx.fillText(avgRatings[i] > 0 ? avgRatings[i].toFixed(2) : '', leftPad + i * (barWidth + gap) + barWidth/2, topPad + maxBarHeight - ratingBarH - 8);
        }
        // Y axis label
        ctx.save();
        ctx.translate(18, topPad + maxBarHeight/2);
        ctx.rotate(-Math.PI/2);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('Average Rating', 0, 0);
        ctx.restore();
       // Draw y-axis ticks (0-5)
        ctx.font = '12px Arial';
        ctx.fillStyle = '#bbb';
        ctx.textAlign = 'right';
        for (let r = 0; r <= 5; r++) {
          const y = topPad + maxBarHeight - (r/5)*maxBarHeight;
          ctx.fillText(r, leftPad - 8, y + 4);
          ctx.beginPath();
          ctx.moveTo(leftPad - 4, y);
          ctx.lineTo(leftPad, y);
          ctx.strokeStyle = '#bbb';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // --- Table rows: no rating/review columns ---
    const renderRow = (product, status, reason = '') => {
      hasProducts = true;
      tbody.innerHTML += `<tr class="${status}-row">
        <td>${product.name}</td>
        <td>৳${product.price || ''}</td>
        <td>${product.category || ''}</td>
        <td>${product.stock ?? product.quantity ?? ''}</td>
        <td>${product.image ? `<img src="${product.image}" alt="img" style="max-width:60px;max-height:60px;">` : ''}</td>
        ${status === 'rejected' ? `<td>${reason}</td>` : ''}
        <td class="status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</td>
        <td><button class="delete-btn" data-id="${product._id}">Delete</button></td>
      </tr>`;
    };

    if (currentTab === 'approved') {
      filtered.filter(p => p.approved && !p.rejected).forEach(p => renderRow(p, 'approved'));
    } else if (currentTab === 'rejected') {
      filtered.filter(p => p.rejected).forEach(p => renderRow(p, 'rejected', p.rejectionReason || ''));
    } else if (currentTab === 'pending') {
      filtered.filter(p => !p.approved && !p.rejected).forEach(p => renderRow(p, 'pending'));
    }

    if (!hasProducts) {
      document.getElementById('empty-message').textContent = 'No products found in this tab.';
    }
  } catch (err) {
    document.getElementById('empty-message').textContent = 'Failed to load products.';
    console.error('Failed to load seller products:', err);
  }
  document.getElementById('loading-spinner').style.display = 'none';

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      const row = btn.closest('tr');
      row.style.transition = 'background 0.3s';
      row.style.background = '#ffe6e6';
      showDeleteConfirmation(async (confirmed) => {
        if (confirmed) {
          try {
            const res = await fetch(`http://localhost:5000/api/products/${btn.dataset.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
              showPopupMessage('Product deleted.', true);
              row.style.transition = 'background 0.3s, opacity 0.3s';
              row.style.opacity = '0.3';
              setTimeout(() => loadSellerProducts(), 300);
            } else {
              showPopupMessage('Failed to delete product.', false);
              row.style.background = '';
            }
          } catch {
            showPopupMessage('Network error.', false);
            row.style.background = '';
          }
        } else {
          row.style.background = '';
        }
      });
    };
  });

  function showDeleteConfirmation(callback) {
    const popup = document.getElementById('popup-message');
    popup.innerHTML = `
      <span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:#ff5858;display:flex;align-items:center;justify-content:center;margin-bottom:0.2em;">
        <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L14 14M14 6L6 14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
      </span>
      <span style="font-size:1rem;font-weight:500;">Delete this product?</span>
      <div style="display:flex;gap:1.2rem;margin-top:0.7em;">
        <button id="confirm-delete-yes" style="background:#28a745;color:#fff;padding:0.4em 1.2em;border:none;border-radius:18px;font-weight:600;cursor:pointer;">Yes</button>
        <button id="confirm-delete-no" style="background:#888;color:#fff;padding:0.4em 1.2em;border:none;border-radius:18px;font-weight:600;cursor:pointer;">No</button>
      </div>
    `;
    popup.style.display = 'flex';
    popup.style.opacity = '1';

    const yesBtn = popup.querySelector('#confirm-delete-yes');
    const noBtn = popup.querySelector('#confirm-delete-no');
    yesBtn.onclick = () => { popup.style.opacity = '0'; setTimeout(() => { popup.style.display = 'none'; }, 200); callback(true); };
    noBtn.onclick = () => { popup.style.opacity = '0'; setTimeout(() => { popup.style.display = 'none'; }, 200); callback(false); };
  }
}


// Initialize
setActiveTab('pending');
loadSellerProducts();

window.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('popup-message');
  popup.style.display = 'none';
  popup.style.opacity = '0';
  popup.innerHTML = '';
});