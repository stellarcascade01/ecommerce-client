document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('order-form');
  const statusPara = document.getElementById('order-status');
  const summaryDiv = document.getElementById('order-summary');

  function getBuyNowParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('buyNow') === '1';
  }

  // Determine order source: cart or buyNow
  let orderSource = 'cart';
  let orderItems = [];
  let totalAmount = 0;
  let displayItems = [];

  async function prepareOrderData() {
    if (getBuyNowParam()) {
      // Use sessionStorage buyNow
      const buyNowData = JSON.parse(sessionStorage.getItem('buyNow'));
      if (buyNowData) {
        orderSource = 'buyNow';
        orderItems = [{ productId: buyNowData.productId, quantity: buyNowData.quantity }];
        totalAmount = buyNowData.price * buyNowData.quantity;
        displayItems = [buyNowData];
      }
    } else {
      // Use cart
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      orderItems = cart.map(item => ({ productId: item.productId, quantity: item.quantity }));
      // Check for missing name/price and fetch if needed
      const itemsWithMissingInfo = cart.filter(item => !item.name || typeof item.price !== 'number');
      if (itemsWithMissingInfo.length > 0) {
        // Fetch all products from backend (could optimize to fetch only needed, but this is simple)
        try {
          const res = await fetch('https://ecommerce-server-cq95.onrender.com/api/products');
          const products = await res.json();
          // Map productId to product
          const productMap = {};
          products.forEach(p => { productMap[p._id] = p; });
          // Fill in missing info
          cart.forEach(item => {
            if (!item.name || typeof item.price !== 'number') {
              const prod = productMap[item.productId];
              if (prod) {
                item.name = prod.name;
                item.price = prod.price;
              }
            }
          });
        } catch (e) {
          // If fetch fails, leave as is
        }
      }
      totalAmount = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price * item.quantity : 0), 0);
      displayItems = cart;
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    await prepareOrderData();

    const name = form.customerName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const address = form.address.value.trim();

    if (orderItems.length === 0) {
      statusPara.textContent = orderSource === 'buyNow' ? 'No product selected.' : 'Your cart is empty.';
      return;
    }

    const order = {
      customerName: name,
      email: email,
      phone: phone,
      address: address,
      products: orderItems
    };

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html?redirect=order.html';
      return;
    }

    fetch('https://ecommerce-server-cq95.onrender.com/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(order)
    })
      .then(async res => {
        let data;
        try {
          data = await res.json();
        } catch (e) {
          data = {};
        }
        if (res.ok) {
          console.log('✅ Order saved:', data);
          summaryDiv.style.display = 'block';
          // Helper to strip HTML and rating symbols from name
          function cleanProductName(name) {
            if (!name || typeof name !== 'string') return '(Unknown Product)';
            // Remove HTML tags
            let plain = name.replace(/<[^>]*>/g, '');
            // Remove star symbols (★, ☆, etc.)
            plain = plain.replace(/[★☆]+/g, '').trim();
            return plain;
          }
          summaryDiv.innerHTML = `
            <h2>Order Summary</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Address:</strong> ${address}</p>
            <ul>
              ${displayItems.filter(item => item && item.name).map(item => `<li>${cleanProductName(item.name)} x ${item.quantity}</li>`).join('')}
            </ul>
            <p><strong>Total:</strong> ৳${totalAmount.toFixed(2)}</p>
            <h3 style="text-align:center;">Choose a Payment Method</h3>
            <div id="payment-options" style="margin-top: 20px; text-align: center;">
              <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <a href="https://www.paypal.com" title="Pay with PayPal" target="_blank" rel="noopener">
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg" alt="PayPal" width="100" />
                </a>
                <a href="https://www.mastercard.us/en-us.html" title="Pay with Mastercard" target="_blank" rel="noopener">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Mastercard-logo.png/320px-Mastercard-logo.png" alt="Mastercard" width="100" />
                </a>
                <a href="https://www.visa.com" title="Pay with Visa" target="_blank" rel="noopener">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" width="100" />
                </a>
              </div>
            </div>
          `;
          // Clear cart or buyNow after order
          if (orderSource === 'buyNow') {
            sessionStorage.removeItem('buyNow');
          } else {
            localStorage.removeItem('cart');
            if (window.updateCartCount) window.updateCartCount();
          }
          statusPara.textContent = 'Order placed successfully!';
        } else {
          console.error('❌ Order error:', data);
          statusPara.textContent = data && data.error ? data.error : 'Failed to place order.';
        }
      })
      .catch(err => {
        console.error('❌ Order error:', err);
        statusPara.textContent = 'Failed to place order.';
      });
  });
});
