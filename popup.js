let wishlistData = [];

// DOM Elements
const addProductBtn = document.getElementById('addProductBtn');
const addProductModal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const itemsList = document.getElementById('itemsList');
const imagePreview = document.getElementById('imagePreview');
const statsContainer = document.getElementById('statsContainer');
const controlsContainer = document.getElementById('controlsContainer');

let editingId = null; // Track if we are editing

document.addEventListener('DOMContentLoaded', () => {
  loadWishlist();
  setupEventListeners();
});

function setupEventListeners() {
  addProductBtn.addEventListener('click', () => openModal());
  document.querySelector('.close').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  addProductForm.addEventListener('submit', handleFormSubmit);
  
  // Event Delegation for Edit/Delete/Compare buttons
  itemsList.addEventListener('click', (e) => {
    const id = parseInt(e.target.dataset.id);
    if (e.target.classList.contains('item-btn-delete')) deleteProduct(id);
    if (e.target.classList.contains('item-btn-edit')) editProduct(id);
    if (e.target.classList.contains('item-btn-compare')) compareProduct(id);
  });
}

function openModal(editData = null) {
  addProductModal.classList.remove('hidden');
  if (editData) {
    editingId = editData.id;
    document.getElementById('productName').value = editData.name;
    document.getElementById('productPrice').value = editData.price;
    document.getElementById('productLink').value = editData.link;
    document.getElementById('productSite').value = editData.site;
    document.getElementById('productImage').value = editData.image;
    document.getElementById('productNotes').value = editData.notes;
    document.querySelector('.modal-content h2').textContent = "Edit Product";
  } else {
    editingId = null;
    addProductForm.reset();
    document.querySelector('.modal-content h2').textContent = "Add Product to Wishlist";
  }
}

function closeModal() {
  addProductModal.classList.add('hidden');
  editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const product = {
    id: editingId || Date.now(),
    name: document.getElementById('productName').value,
    price: parseFloat(document.getElementById('productPrice').value),
    currency: document.getElementById('productCurrency').value,
    link: document.getElementById('productLink').value,
    site: document.getElementById('productSite').value,
    image: document.getElementById('productImage').value,
    notes: document.getElementById('productNotes').value,
    addedDate: new Date().toISOString()
  };

  if (editingId) {
    wishlistData = wishlistData.map(item => item.id === editingId ? product : item);
  } else {
    wishlistData.push(product);
  }

  saveWishlist();
  renderWishlist();
  closeModal();
  showNotification(editingId ? 'Product updated!' : 'Product added!');
}

function deleteProduct(id) {
  if (confirm('Delete this item?')) {
    wishlistData = wishlistData.filter(item => item.id !== id);
    saveWishlist();
    renderWishlist();
  }
}

function editProduct(id) {
  const product = wishlistData.find(item => item.id === id);
  if (product) openModal(product);
}

function renderWishlist() {
  itemsList.innerHTML = '';
  if (wishlistData.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
    statsContainer.classList.add('hidden');
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  statsContainer.classList.remove('hidden');
  controlsContainer.classList.remove('hidden');

  wishlistData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'wishlist-item';
    div.innerHTML = `
      <div class="item-image">${item.image ? `<img src="${item.image}">` : '📦'}</div>
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        <div class="item-price">$${item.price.toFixed(2)}</div>
        <div class="item-site">${item.site}</div>
      </div>
      <div class="item-actions">
        <button class="item-btn item-btn-edit" data-id="${item.id}">✏️</button>
        <button class="item-btn item-btn-delete" data-id="${item.id}">🗑️</button>
      </div>
    `;
    itemsList.appendChild(div);
  });
  
  document.getElementById('totalItems').textContent = wishlistData.length;
  document.getElementById('totalPrice').textContent = `$${wishlistData.reduce((sum, i) => sum + i.price, 0).toFixed(2)}`;
}

function saveWishlist() {
  chrome.storage.local.set({ wishlist: wishlistData });
}

function loadWishlist() {
  chrome.storage.local.get(['wishlist'], (res) => {
    if (res.wishlist) {
      wishlistData = res.wishlist;
      renderWishlist();
    }
  });
}

function showNotification(msg) {
  const n = document.createElement('div');
  n.textContent = msg;
  n.style.cssText = "position:fixed;bottom:20px;right:20px;background:#4caf50;color:white;padding:10px;border-radius:5px;z-index:9999;";
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2000);
}
