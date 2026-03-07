// popup.js

// Function to show the popup
function showPopup() {
    // Create the popup element
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = '<p>This is your popup content!</p>'; 

    // Append the popup to the body
    document.body.appendChild(popup);

    // Close popup on click
    popup.addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Event listener to trigger the popup
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('yourButtonId').addEventListener('click', showPopup);
});