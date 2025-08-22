document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to access your profile.');
    window.location.href = 'login.html';
    return;
  }

  // Elements
  const usernameSpan = document.getElementById('profile-username');
  const emailSpan = document.getElementById('profile-email');
  const roleSpan = document.getElementById('profile-role');
  const editBtn = document.getElementById('edit-profile-btn');
  const editFormDiv = document.getElementById('edit-profile-form');
  // For seller shop name
  let shopNameDiv = document.getElementById('profile-shopname');

  let user = null;
  // Load user info from backend
  try {
    const res = await fetch('http://localhost:5000/api/users/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      user = await res.json();
      usernameSpan.textContent = user.username || '';
      emailSpan.textContent = user.email || '';
      roleSpan.textContent = user.role || 'buyer';
      // Show shop name for sellers
      if (user.role === 'seller') {
        if (!shopNameDiv) {
          // Insert shop name row if not present
          const infoDiv = roleSpan.parentElement.parentElement;
          const shopDiv = document.createElement('div');
          shopDiv.innerHTML = `<strong>Shop Name:</strong> <span id="profile-shopname">${user.shopName || ''}</span>`;
          infoDiv.appendChild(shopDiv);
          shopNameDiv = shopDiv.querySelector('#profile-shopname');
        } else {
          shopNameDiv.textContent = user.shopName || '';
        }
      }
    } else {
      alert('Failed to load profile.');
    }
  } catch {
    alert('Network error.');
  }

  // Edit profile button
  editBtn.onclick = function() {
    if (!user) return;
    if (editFormDiv.style.display === 'block') {
      editFormDiv.style.display = 'none';
      editFormDiv.innerHTML = '';
      return;
    }
    editFormDiv.style.display = 'block';
    editFormDiv.innerHTML = `
      <form id='profile-edit-form' class='profile-edit-form'>
        <label>Username: <input type='text' name='username' value='${user.username || ''}' required /></label><br>
        <label>Email: <input type='email' name='email' value='${user.email || ''}' required /></label><br>
        ${user.role === 'seller' ? `<label>Shop Name: <input type='text' name='shopName' value='${user.shopName || ''}' /></label><br>` : ''}
        <button type='submit'>Save</button>
        <button type='button' id='cancel-edit-btn'>Cancel</button>
      </form>
    `;
    document.getElementById('cancel-edit-btn').onclick = function() {
      editFormDiv.style.display = 'none';
      editFormDiv.innerHTML = '';
    };
    document.getElementById('profile-edit-form').onsubmit = async function(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const username = formData.get('username').trim();
      const email = formData.get('email').trim();
      let shopName = user.role === 'seller' ? (formData.get('shopName') || '').trim() : undefined;
      if (!username || !email) {
        alert('Username and email are required.');
        return;
      }
      const patchBody = { username, email };
      if (user.role === 'seller') patchBody.shopName = shopName;
      try {
        const res = await fetch('http://localhost:5000/api/users/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(patchBody)
        });
        if (res.ok) {
          alert('Profile updated successfully!');
          user.username = username;
          user.email = email;
          if (user.role === 'seller') {
            user.shopName = shopName;
            if (shopNameDiv) shopNameDiv.textContent = shopName;
          }
          usernameSpan.textContent = username;
          emailSpan.textContent = email;
          // Optionally update localStorage
          localStorage.setItem('username', username);
          // Hide form
          editFormDiv.style.display = 'none';
          editFormDiv.innerHTML = '';
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to update profile.');
        }
      } catch {
        alert('Network error.');
      }
    };
  };
});
