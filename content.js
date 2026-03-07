// Content script - runs on every webpage

// Add context menu listener
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'ADD_TO_WISHLIST') {
    chrome.runtime.sendMessage({
      action: 'addFromPage',
      productName: event.data.productName,
      price: event.data.price,
      currency: event.data.currency,
      pageUrl: window.location.href,
      image: event.data.image,
      notes: event.data.notes
    }, (response) => {
      if (response && response.success) {
        console.log('Product added to wishlist from page');
      }
    });
  }
});

// Try to auto-detect product information
function detectProductInfo() {
  // Look for common product price patterns
  const pricePatterns = /\$\s?\d+\.?\d*/g;
  const prices = document.body.innerText.match(pricePatterns);

  // Look for product name in title or h1
  const productName = document.title || document.querySelector('h1')?.innerText || 'Product';

  // Look for product image
  const images = document.querySelectorAll('img');
  let productImage = '';
  if (images.length > 0) {
    productImage = images[0].src;
  }

  return {
    name: productName,
    price: prices ? prices[0] : '',
    image: productImage
  };
}

// Add floating button to add products
function createAddButton() {
  const button = document.createElement('div');
  button.id = 'wishlist-add-btn';
  button.textContent = '🛍️ Add to Wishlist';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 30px;
    cursor: pointer;
    z-index: 10000;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    border: none;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-3px)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  button.addEventListener('click', () => {
    const productInfo = detectProductInfo();
    
    // Send message to popup
    window.postMessage({
      type: 'ADD_TO_WISHLIST',
      productName: productInfo.name,
      price: productInfo.price,
      currency: 'USD',
      image: productInfo.image,
      notes: ''
    }, '*');

    // Show feedback
    button.textContent = '✅ Added!';
    setTimeout(() => {
      button.textContent = '🛍️ Add to Wishlist';
    }, 2000);
  });

  document.body.appendChild(button);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createAddButton);
} else {
  createAddButton();
}
