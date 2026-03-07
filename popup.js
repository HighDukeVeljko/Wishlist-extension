// Updated implementation of compareProduct with modal implementation
function compareProduct(productA, productB) {
    // Check for null values
    if (!productA || !productB) {
        console.error("One or both products are null.");
        return;
    }

    // Example modal implementation for comparison alert
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `<div class='modal-content'>`
                    + `<span class='close'>&times;</span>`
                    + `<p>Comparing ${productA.name} and ${productB.name}</p>`
                    + `</div>`;

    document.body.appendChild(modal);
    modal.querySelector('.close').onclick = function() { modal.remove(); };

    // Additional comparison logic...
}

// Fixed duplicate function definitions
function addToWishlist(product) {
    if (!product) {
        console.error("Product is null.");
        return;
    }
    // Logic to add the product to wishlist...
}

function removeFromWishlist(productId) {
    if (!productId) {
        console.error("Product ID is null.");
        return;
    }
    // Logic to remove the product from wishlist...
}

function displayWishlist() {
    // Logic to display wishlist...
}

// Ensure only one version of each function with null checks implemented.
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
