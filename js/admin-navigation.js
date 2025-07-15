/**
 * Admin Navigation Controller
 * Manages visibility of admin sections based on user roles
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure AuthUtils is available
  if (typeof AuthUtils === 'undefined') {
    console.error('AuthUtils not found. Navigation control requires authentication utilities.');
    return;
  }

  // Check if we're on an admin page
  const usersSection = document.getElementById('users-section');
  const wardsSection = document.getElementById('wards-section');
  
  if (!usersSection && !wardsSection) {
    // Not on admin page with these sections
    return;
  }
  
  // Control section visibility based on user roles
  if (usersSection) {
    // User Management: Visible to any admin role
    usersSection.style.display = AuthUtils.hasAnyAdminRole() ? 'block' : 'none';
  }
  
  if (wardsSection) {
    // Location Management: Only visible to users with full admin access
    wardsSection.style.display = AuthUtils.hasFullAdminAccess() ? 'block' : 'none';
    
    // If user doesn't have location management access but has user management access,
    // expand the user management section to take full width
    if (!AuthUtils.hasFullAdminAccess() && AuthUtils.hasAnyAdminRole() && usersSection) {
      usersSection.style.width = '100%';
    }
  }
  
  // Update page title based on available sections
  updatePageTitle();

  // Tab navigation for super admin page
  const tabs = document.querySelectorAll('.admin-tab');
  const sections = document.querySelectorAll('.admin-section');

  function showSection(targetId) {
    sections.forEach(sec => {
      sec.id === targetId ? sec.style.display = 'block' : sec.style.display = 'none';
    });
    tabs.forEach(tab => {
      tab.dataset.target === targetId ? tab.classList.add('active') : tab.classList.remove('active');
    });
  }

  // Initialize to show only user management by default
  showSection('users-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      // Prevent access to location management if not full admin
      if (target === 'wards-section' && !AuthUtils.hasFullAdminAccess()) return;
      showSection(target);
    });
  });
  
  /**
   * Update the page title to reflect available functionality
   */
  function updatePageTitle() {
    const headerTitle = document.querySelector('.header-content h1');
    if (!headerTitle) return;
    
    if (AuthUtils.hasFullAdminAccess()) {
      headerTitle.textContent = 'Pharmacy System Admin';
    } else if (AuthUtils.hasAnyAdminRole()) {
      headerTitle.textContent = 'User Management Admin';
    }
  }
});
