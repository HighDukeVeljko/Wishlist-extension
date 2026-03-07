// Wishlist data management
let wishlistData = [];

// DOM Elements
const addProductBtn = document.getElementById('addProductBtn');
const addProductModal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const itemsList = document.getElementById('itemsList');
const emptyState = document.getElementById('emptyState');
const statsContainer = document.getElementById('statsContainer');
const totalItemsSpan = document.getElementById('totalItems');
const totalPriceSpan = document.getElementById('totalPrice');
const sortBy = document.getElementById('sortBy');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const controlsContainer = document.getElementById('controlsContainer');
const wishlistContainer = document.getElementById('wishlistContainer');
const productImageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadWishlist();
  setupEventListeners();
});

function setupEventListeners() {
  addProductBtn.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  addProductForm.addEventListener('submit', handleAddProduct);
  sortBy.addEventListener('change', handleSort);
  exportBtn.addEventListener('click', handleExport);
  clearAllBtn.addEventListener('click', handleClearAll);
  productImageInput.addEventListener('change', handleImagePreview);
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addProductModal) {
      closeModal();
    }
  });
}

function openModal() {
  addProductModal.classList.remove('hidden');
  addProductForm.reset();
  imagePreview.classList.add('hidden');
  imagePreview.innerHTML = '';
}

function closeModal() {
  addProductModal.classList.add('hidden');
  addProductForm.reset();
  imagePreview.classList.add('hidden');
}

function handleAddProduct(e) {
  e.preventDefault();

  const product = {
    id: Date.now(),
    name: document.getElementById('productName').value,
    price: parseFloat(document.getElementById('productPrice').value),
    currency: document.getElementById('productCurrency').value,
    link: document.getElementById('productLink').value,
    site: document.getElementById('productSite').value,
    image: document.getElementById('productImage').value,
    notes: document.getElementById('productNotes').value,
    addedDate: new Date().toISOString()
  };

  wishlistData.push(product);
  saveWishlist();
  renderWishlist();
  closeModal();
  showNotification('Product added to wishlist!');
}

function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    wishlistData = wishlistData.filter(item => item.id !== id);
    saveWishlist();
    renderWishlist();
    showNotification('Product removed from wishlist');
  }
}

function editProduct(id) {
  const product = wishlistData.find(item => item.id === id);
  if (!product) return;

  // Populate form with current values
  document.getElementById('productName').value = product.name;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCurrency').value = product.currency;
  document.getElementById('productLink').value = product.link;
  document.getElementById('productSite').value = product.site;
  document.getElementById('productImage').value = product.image;
  document.getElementById('productNotes').value = product.notes;

  // Show image preview if exists
  if (product.image) {
    imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
    imagePreview.classList.remove('hidden');
  }

  openModal();

  // Change form submission to update instead of add
  const originalHandler = addProductForm.onsubmit;
  addProductForm.onsubmit = (e) => {
    e.preventDefault();
    product.name = document.getElementById('productName').value;
    product.price = parseFloat(document.getElementById('productPrice').value);
    product.currency = document.getElementById('productCurrency').value;
    product.link = document.getElementById('productLink').value;
    product.site = document.getElementById('productSite').value;
    product.image = document.getElementById('productImage').value;
    product.notes = document.getElementById('productNotes').value;

    saveWishlist();
    renderWishlist();
    closeModal();
    showNotification('Product updated!');
    addProductForm.onsubmit = originalHandler;
  };
}

function handleImagePreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.innerHTML = `<img src="${event.target.result}" alt="preview">`;
      imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

function handleSort(e) {
  const sortValue = e.target.value;
  
  switch(sortValue) {
    case 'date-desc':
      wishlistData.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
      break;
    case 'date-asc':
      wishlistData.sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate));
      break;
    case 'price-asc':
      wishlistData.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      wishlistData.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      wishlistData.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  
  renderWishlist();
}

function handleExport() {
  const data = {
    wishlist: wishlistData,
    exported: new Date().toISOString(),
    totalItems: wishlistData.length,
    totalPrice: calculateTotal()
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wishlist-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);

  showNotification('Wishlist exported successfully!');
}

function handleClearAll() {
  if (confirm('Are you sure you want to clear your entire wishlist? This cannot be undone.')) {
    wishlistData = [];
    saveWishlist();
    renderWishlist();
    showNotification('Wishlist cleared');
  }
}

function renderWishlist() {
  itemsList.innerHTML = '';

  if (wishlistData.length === 0) {
    emptyState.style.display = 'block';
    statsContainer.classList.add('hidden');
    controlsContainer.classList.add('hidden');
    return;
  }

  emptyState.style.display = 'none';
  statsContainer.classList.remove('hidden');
  controlsContainer.classList.remove('hidden');

  wishlistData.forEach(product => {
    const itemEl = document.createElement('div');
    itemEl.className = 'wishlist-item';
    
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      AUD: 'A$'
    };

    const symbol = currencySymbols[product.currency] || '$';

    itemEl.innerHTML = `
      <div class="item-image">
        ${product.image ? 
          `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">` : 
          '<div class="item-image-placeholder">📦</div>'
        }
      </div>
      <div class="item-details">
        <div class="item-name">${escapeHtml(product.name)}</div>
        <div class="item-site">📍 ${escapeHtml(product.site)}</div>
        <a href="${product.link}" target="_blank" class="item-link">${new URL(product.link).hostname}</a>
        <div class="item-price">${symbol}${product.price.toFixed(2)}</div>
        ${product.notes ? `<div class="item-notes">"${escapeHtml(product.notes)}"</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="item-btn item-btn-edit" onclick="editProduct(${product.id})">✏️ Edit</button>
        <button class="item-btn item-btn-compare" onclick="compareProduct(${product.id})">📄 Compare</button>
        <button class="item-btn item-btn-delete" onclick="deleteProduct(${product.id})">🗑️ Delete</button>
      </div>
    `;

    itemsList.appendChild(itemEl);
  });

  updateStats();
}

function updateStats() {
  totalItemsSpan.textContent = wishlistData.length;
  const total = calculateTotal();
  const firstProduct = wishlistData[0];
  const currency = firstProduct ? firstProduct.currency : 'USD';
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    AUD: 'A$'
  };
  const symbol = currencySymbols[currency] || '$';
  totalPriceSpan.textContent = `${symbol}${total.toFixed(2)}`;
}

function calculateTotal() {
  return wishlistData.reduce((sum, item) => sum + item.price, 0);
}

function compareProduct(id) {
  const product = wishlistData.find(item => item.id === id);
  if (!product) return;

  // Filter products with similar names or from different sites
  const similar = wishlistData.filter(item => 
    item.id !== id && 
    (item.name.toLowerCase().includes(product.name.toLowerCase()) ||
     item.name.toLowerCase().includes(product.name.toLowerCase().split(' ')[0]))
  );

  if (similar.length === 0) {
    showNotification('No similar products found in your wishlist');
    return;
  }

  // Create comparison table
  let comparisonHtml = `
    <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
      <h3 style="margin-bottom: 15px;">Similar Products</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #667eea; color: white;">
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Site</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #fff9e6;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${escapeHtml(product.name)}</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #667eea;">${product.currency} ${product.price.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(product.site)}</td>
          </tr>
  `;

  similar.forEach(item => {
    const priceDiff = item.price - product.price;
    const priceDiffText = priceDiff > 0 ? 
      `<span style="color: #ff6b6b;">+${priceDiff.toFixed(2)}</span>` : 
      `<span style="color: #4caf50;">${priceDiff.toFixed(2)}</span>`;
    
    comparisonHtml += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(item.name)}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.currency} ${item.price.toFixed(2)} ${priceDiffText}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(item.site)}</td>
      </tr>
    `;
  });

  comparisonHtml += `</tbody></table></div>`;

  // Show in modal-like popup
  alert(comparisonHtml);
}

function saveWishlist() {
  chrome.storage.local.set({ wishlist: wishlistData }, () => {
    console.log('Wishlist saved');
  });
}

function loadWishlist() {
  chrome.storage.local.get(['wishlist'], (result) => {
    if (result.wishlist) {
      wishlistData = result.wishlist;
    }
    renderWishlist();
  });
}

function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: slideInUp 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutDown 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
