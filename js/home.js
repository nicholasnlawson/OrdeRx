/**
 * Home page JavaScript
 * Handles home page functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication - common.js already handles redirect if not authenticated
  if (!AuthUtils.isAuthenticated()) {
    return;
  }
  
  // Get user data and display name
  const userData = AuthUtils.getUserData();
  if (userData) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      const displayName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.username || 'User';
      userNameElement.textContent = displayName;
    }
    
    // Show/hide admin card based on admin access
    const adminCard = document.getElementById('admin-card');
    if (adminCard && !AuthUtils.hasAnyAdminRole()) {
      adminCard.style.display = 'none';
    }
  }

  // Check for unauthorized access reason in URL
  console.log('Home page loaded. Checking for unauthorized reason...');
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reason') === 'unauthorized') {
      console.log('Unauthorized reason found in URL. Displaying modal.');
      const modal = document.getElementById('auth-modal'); // Corrected ID
      const closeBtn = document.querySelector('.close-button'); // Corrected class
      
      if (modal && closeBtn) {
          modal.style.display = 'block';
          
          closeBtn.onclick = function() {
              console.log('Closing modal.');
              modal.style.display = 'none';
          }
          
          window.onclick = function(event) {
              if (event.target == modal) {
                  console.log('Closing modal due to outside click.');
                  modal.style.display = 'none';
              }
          }
      } else {
          console.error('Modal or close button not found.');
      }
  } else {
      console.log('No unauthorized reason found in URL.');
  }
});
