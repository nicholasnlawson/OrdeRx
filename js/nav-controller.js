/**
 * Navigation Controller
 * Controls visibility of navigation links based on user roles
 */

document.addEventListener('DOMContentLoaded', () => {
  const updateNavLinks = () => {
  // Ensure user is authenticated
  if (!AuthUtils.isAuthenticated()) return;
  
  // Get navigation elements
  const adminLinks = document.querySelectorAll('a.nav-link[href*="admin"], a.nav-link#admin-nav-link');
  const wardLinks = document.querySelectorAll('a.nav-link[href*="ward"]');
  const pharmacyLinks = document.querySelectorAll('a.nav-link[href*="pharmacy"]');
  
  // Apply visibility rules based on roles
  
  // Admin links: visible to user-admin or super-admin roles
  adminLinks.forEach(link => {
    if (AuthUtils.hasAnyAdminRole()) {
      link.style.display = 'block';
    }
  });

  // Ward ordering links: visible to users with ordering or admin roles
  wardLinks.forEach(link => {
    if (AuthUtils.hasRole('ordering') || AuthUtils.hasAnyAdminRole()) {
      link.style.display = 'block';
    }
  });

  // Pharmacy links: visible to users with pharmacy or admin roles
  pharmacyLinks.forEach(link => {
    if (AuthUtils.hasRole('pharmacy') || AuthUtils.hasAnyAdminRole()) {
      link.style.display = 'block';
    }
  });
  };

  // Listen for the custom event that signals auth data is ready
  document.addEventListener('authDataReady', updateNavLinks);

  // Also, run once on load in case the event was dispatched before this listener was added
  if (AuthUtils._dataLoaded) {
      updateNavLinks();
  }
});
