// Wishlist Extension - popup.js
console.log('POPUP.JS LOADING...');

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

console.log('DOM Elements loaded:', {
  addProductBtn: !!addProductBtn,
  itemsList: !!itemsList,
  emptyState: !!emptyState
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  loadWishlist();
  setupEventListeners();
});

function setupEventListeners() {
  console.log('Setting up event listeners');
  if (addProductBtn) addProductBtn.addEventListener('click', openModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (addProductForm) addProductForm.addEventListener('submit', handleAddProduct);
  if (sortBy) sortBy.addEventListener('change', handleSort);
  if (exportBtn) exportBtn.addEventListener('click', handleExport);
  if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAll);
  if (productImageInput) productImageInput.addEventListener('change', handleImagePreview);
  
  window.addEventListener('click', (e) => {
    if (e.target === addProductModal) {
      closeModal();
    }
  });
}

function openModal() {
  console.log('Opening modal');
  if (addProductModal) {
    addProductModal.classList.remove('hidden');
    if (addProductForm) addProductForm.reset();
    if (imagePreview) {
      imagePreview.classList.add('hidden');
      imagePreview.innerHTML = '';
    }
  }
}

function closeModal() {
  console.log('Closing modal');
  if (addProductModal) addProductModal.classList.add('hidden');
  if (addProductForm) addProductForm.reset();
  if (imagePreview) imagePreview.classList.add('hidden');
}

function handleAddProduct(e) {
  console.log('Adding product');
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
  console.log('Product added:', product);
  saveWishlist();
  renderWishlist();
  closeModal();
  showNotification('Product added to wishlist! ✅');
}

function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    wishlistData = wishlistData.filter(item => item.id !== id);
    console.log('Product deleted. Remaining:', wishlistData.length);
    saveWishlist();
    renderWishlist();
    showNotification('Product removed from wishlist');
  }
}

function editProduct(id) {
  const product = wishlistData.find(item => item.id === id);
  if (!product) return;

  document.getElementById('productName').value = product.name;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCurrency').value = product.currency;
  document.getElementById('productLink').value = product.link;
  document.getElementById('productSite').value = product.site;
  document.getElementById('productImage').value = product.image;
  document.getElementById('productNotes').value = product.notes;

  if (product.image && imagePreview) {
    imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
    imagePreview.classList.remove('hidden');
  }

  openModal();

  // Store original handler and replace temporarily
  const originalSubmit = addProductForm.onsubmit;
  addProductForm.onsubmit = (e) => {
    e.preventDefault();
    product.name = document.getElementById('productName').value;
    product.price = parseFloat(document.getElementById('productPrice').value);
    product.currency = document.getElementById('productCurrency').value;
    product.link = document.getElementById('productLink').value;
    product.site = document.getElementById('productSite').value;
    product.image = document.getElementById('productImage').value;
    product.notes = document.getElementById('productNotes').value;

    console.log('Product updated:', product);
    saveWishlist();
    renderWishlist();
    closeModal();
    showNotification('Product updated! ✏️');
    addProductForm.onsubmit = originalSubmit;
  };
}

function handleImagePreview(e) {
  const file = e.target.files[0];
  if (file && imagePreview) {
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
  console.log('Sorting by:', sortValue);
  
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
  console.log('Exporting wishlist');
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

  showNotification('Wishlist exported successfully! 📥');
}

function handleClearAll() {
  if (confirm('Are you sure you want to clear your entire wishlist? This cannot be undone.')) {
    wishlistData = [];
    console.log('Wishlist cleared');
    saveWishlist();
    renderWishlist();
    showNotification('Wishlist cleared ⚠️');
  }
}

function renderWishlist() {
  console.log('Rendering wishlist with', wishlistData.length, 'items');
  
  if (!itemsList) {
    console.error('itemsList element not found');
    return;
  }

  itemsList.innerHTML = '';

  if (wishlistData.length === 0) {
    console.log('Wishlist is empty');
    if (emptyState) emptyState.style.display = 'block';
    if (statsContainer) statsContainer.classList.add('hidden');
    if (controlsContainer) controlsContainer.classList.add('hidden');
    return;
  }

  console.log('Showing items and stats');
  if (emptyState) emptyState.style.display = 'none';
  if (statsContainer) statsContainer.classList.remove('hidden');
  if (controlsContainer) controlsContainer.classList.remove('hidden');

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
        <a href="${product.link}" target="_blank" class="item-link">${escapeHtml(new URL(product.link).hostname)}</a>
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
  if (!totalItemsSpan || !totalPriceSpan) return;
  
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

  // Create comparison modal instead of alert
  const comparisonModal = document.createElement('div');
  comparisonModal.className = 'comparison-modal';
  comparisonModal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  let comparisonHtml = `
    <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">Similar Products</h2>
        <button onclick="this.closest('.comparison-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">✕</button>
      </div>
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

  comparisonModal.innerHTML = comparisonHtml;
  document.body.appendChild(comparisonModal);

  // Close on background click
  comparisonModal.addEventListener('click', (e) => {
    if (e.target === comparisonModal) {
      comparisonModal.remove();
    }
  });
}

function saveWishlist() {
  console.log('Saving wishlist with', wishlistData.length, 'items');
  chrome.storage.local.set({ wishlist: wishlistData }, () => {
    console.log('✓ Wishlist saved to storage');
  });
}

function loadWishlist() {
  console.log('Loading wishlist from storage');
  chrome.storage.local.get(['wishlist'], (result) => {
    console.log('Storage result:', result);
    if (result.wishlist) {
      wishlistData = result.wishlist;
      console.log('✓ Loaded', wishlistData.length, 'items from storage');
    } else {
      console.log('No wishlist data found in storage');
    }
    renderWishlist();
  });
}

function showNotification(message) {
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutDown 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✓ POPUP.JS LOADED SUCCESSFULLY');
