// Service Worker for background tasks
console.log('Background service worker loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addFromPage') {
    // Handle adding product directly from page
    chrome.storage.local.get(['wishlist'], (result) => {
      const wishlist = result.wishlist || [];
      
      const product = {
        id: Date.now(),
        name: request.productName || 'Unnamed Product',
        price: parseFloat(request.price) || 0,
        currency: request.currency || 'USD',
        link: request.pageUrl || '',
        site: new URL(request.pageUrl).hostname || 'Unknown',
        image: request.image || '',
        notes: request.notes || '',
        addedDate: new Date().toISOString()
      };

      wishlist.push(product);
      chrome.storage.local.set({ wishlist }, () => {
        sendResponse({ success: true, message: 'Product added to wishlist' });
      });
    });

    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  }
});
