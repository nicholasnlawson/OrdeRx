/**
 * Admin Panel JavaScript
 * Handles user management functionality
 */

document.addEventListener('DOMContentLoaded', () => {

  // Additional check - only super-admin users can modify other users' roles to super-admin
  const canManageSuperAdmin = AuthUtils.hasRole('super-admin');

  // DOM Elements
  const addUserBtn = document.getElementById('add-user-btn');
  const userForm = document.getElementById('user-form');
  const userModal = document.getElementById('user-modal');
  const deleteModal = document.getElementById('confirm-delete-modal');
  const userTableBody = document.getElementById('users-table-body');
  const modalTitle = document.getElementById('modal-title');
  const passwordField = document.getElementById('password');
  const passwordHelp = document.getElementById('password-help');
  const statusGroup = document.getElementById('status-group');
  const alertBox = document.getElementById('alert-box');

  // Search and filter elements
  const userSearchName = document.getElementById('user-search-name');
  const applySearchBtn = document.getElementById('apply-search-btn');
  const resetSearchBtn = document.getElementById('reset-search-btn');
  const roleFilterSelect = document.getElementById('role-filter-select');
  
  // Store all users for filtering
  let allUsers = [];

  // Load all data for the super-admin page
  loadUsers();
  loadDispensaries();

  // Tab navigation
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.admin-section');

  // Hide all sections initially, then show the active one
  sections.forEach(section => {
    section.style.display = 'none';
  });

  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    const activeSection = document.getElementById(activeTab.dataset.target);
    if (activeSection) {
      activeSection.style.display = 'block';
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all tabs and sections
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.style.display = 'none');

      // Activate clicked tab and corresponding section
      tab.classList.add('active');
      const targetSection = document.getElementById(tab.dataset.target);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
    });
  });

  // Event Listeners
  addUserBtn.addEventListener('click', () => {
    openUserModal();
  });
  
  // Close modals when clicking on close buttons or cancel buttons
  document.querySelectorAll('.close-btn, .close-modal').forEach(element => {
    element.addEventListener('click', () => {
      closeModals();
    });
  });
  
  // Handle user form submission
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const isEditMode = !!userId;
    
    // Password validation
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Check if super-admin role is being assigned by non-super-admin user
    const superAdminCheckbox = document.querySelector('input[value="super-admin"]');
    if (superAdminCheckbox && superAdminCheckbox.checked && !canManageSuperAdmin) {
      showAlert('You do not have permission to assign super-admin role', 'error');
      return;
    }
    
    // In edit mode, both password fields can be empty to keep current password
    // Otherwise, ensure passwords match if either field has a value
    if (password || confirmPassword || !isEditMode) {
      if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please try again.', 'error');
        return;
      }
    }
    
    // Get form values
    const userData = {
      username: document.getElementById('username').value,
      first_name: document.getElementById('first_name').value,
      surname: document.getElementById('surname').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      roles: Array.from(document.querySelectorAll('input[name="roles"]:checked'))
        .map(checkbox => checkbox.value)
    };
    
    // Add is_active status for edit mode
    if (isEditMode) {
      const isActiveEl = document.querySelector('input[name="is_active"]:checked');
      userData.is_active = isActiveEl ? parseInt(isActiveEl.value) : 1;
      
      // If password is empty in edit mode, delete the property
      if (!userData.password) {
        delete userData.password;
      }
    }
    
    try {
      if (isEditMode) {
        // Update existing user
        await apiClient.updateUser(userId, userData);
        showAlert('User updated successfully', 'success');
      } else {
        // Create new user
        await apiClient.createUser(userData);
        showAlert('User created successfully', 'success');
      }
      
      // Close modal and reload users
      closeModals();
      loadUsers();
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'error');
    }
  });
  
  // Handle delete confirmation
  document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    const userId = document.getElementById('delete-user-id').value;
    
    try {
      await apiClient.deleteUser(userId);
      showAlert('User deleted successfully', 'success');
      closeModals();
      loadUsers();
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'error');
    }
  });
  
  // Handle logout buttons
  const logoutBtn = document.getElementById('logout-btn');
  const logoutLink = document.getElementById('logout-link');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      AuthUtils.logout();
    });
  }
  
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      AuthUtils.logout();
    });
  }
  
  // Event listeners for search and filter functionality
  applySearchBtn.addEventListener('click', () => {
    applyFilters();
  });
  
  resetSearchBtn.addEventListener('click', () => {
    resetFilters();
  });
  
  // Add keyup event listener for real-time filtering as user types
  userSearchName.addEventListener('keyup', (e) => {
    // Apply filters after short delay to avoid filtering on every keystroke
    if (e.key === 'Enter') {
      applyFilters();
    }
  });
  
  /**
   * Filter users based on search criteria and selected roles
   */
  function applyFilters() {
    const searchTerm = userSearchName.value.toLowerCase().trim();
    const selectedRole = roleFilterSelect.value;
      
    // Filter the users based on search term and selected roles
    const filteredUsers = allUsers.filter(user => {
      // Check if user matches search term (name or username)
      const nameMatch = searchTerm === '' || 
        user.username.toLowerCase().includes(searchTerm) ||
        `${user.first_name || ''} ${user.surname || ''}`.toLowerCase().includes(searchTerm);
        
      // Check if user has at least one of the selected roles
      if (selectedRole && !user.roles.includes(selectedRole)) {
        return false;
      }
      return nameMatch;
    });
    
    // Display filtered users
    displayUsers(filteredUsers);
  }
  
  /**
   * Reset all filters and display all users
   */
  function resetFilters() {
    userSearchName.value = '';
    roleFilterSelect.value = '';
    displayUsers(allUsers);
  }
  
  /**
   * Display users in the table
   * @param {Array} users - Array of user objects to display
   */
  function displayUsers(users) {
    // Clear existing table rows
    userTableBody.innerHTML = '';
    
    // Add user rows
    users.forEach(user => {
      const row = document.createElement('tr');
      
      // Format roles as badges
      const rolesBadges = user.roles.map(role => {
        let displayRole = role.charAt(0).toUpperCase() + role.slice(1);
        if (role === 'super-admin') {
          displayRole = 'Super-Admin';
        }
        if (role === 'user-admin') {
          displayRole = 'User-Admin';
        }
        return `<span class="user-role role-${role}">${displayRole}</span>`;
      }).join(' ');
      
      // Format date
      const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
      
      // Format status
      const status = user.is_active 
        ? '<span class="user-status status-active">Active</span>' 
        : '<span class="user-status status-inactive">Inactive</span>';
      
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.first_name || ''} ${user.surname || ''}</td>
        <td>${user.email}</td>
        <td>${rolesBadges}</td>
        <td>${lastLogin}</td>
        <td>${status}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${user.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete-btn" data-id="${user.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </td>
      `;
      
      userTableBody.appendChild(row);
    });
    

    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-id');
        openUserModal(userId);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-id');
        openDeleteModal(userId);
      });
    });
  }
  
  /**
   * Load all users from the API
   */
  async function loadUsers() {
    try {
      console.log('Loading users from API...');
      const response = await apiClient.getUsers();
      console.log('API response:', response);
      
      if (!response || !response.users) {
        console.error('Invalid API response format:', response);
        showAlert('Error: Invalid API response format', 'error');
        return;
      }
      
      const users = response.users;
      console.log('Users loaded successfully:', users.length, 'users');
      
      // Store users for filtering
      allUsers = users;
      
      // Display all users initially
      displayUsers(allUsers);
    } catch (error) {
      showAlert(`Error loading users: ${error.message}`, 'error');
    }
  }
  
  /**
   * Open user modal for adding or editing a user
   * @param {string|null} userId - User ID for editing, null for adding
   */
  async function openUserModal(userId = null) {
    // Reset form
    userForm.reset();
    document.getElementById('user-id').value = '';
    
    if (userId) {
      // Edit mode
      try {
        const response = await apiClient.getUser(userId);
        const user = response.user;
        
        // Set form values
        document.getElementById('user-id').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('first_name').value = user.first_name || '';
        document.getElementById('surname').value = user.surname || '';
        document.getElementById('email').value = user.email;
        
        // Uncheck all role checkboxes first
        document.querySelectorAll('input[name="roles"]').forEach(checkbox => {
          checkbox.checked = false;
        });
        
        // Check the appropriate roles
        user.roles.forEach(role => {
          const checkbox = document.querySelector(`input[value="${role}"]`);
          if (checkbox) checkbox.checked = true;
        });
        
        // Show active/inactive option and set it
        statusGroup.style.display = 'block';
        const statusRadio = document.querySelector(`input[name="is_active"][value="${user.is_active ? 1 : 0}"]`);
        if (statusRadio) statusRadio.checked = true;
        
        // Show password help text for edit mode
        passwordField.required = false;
        passwordHelp.style.display = 'block';
        
        modalTitle.textContent = 'Edit User';
      } catch (error) {
        showAlert(`Error loading user data: ${error.message}`, 'error');
        return;
      }
    } else {
      // Add mode
      modalTitle.textContent = 'Add New User';
      passwordField.required = true;
      passwordHelp.style.display = 'none';
      statusGroup.style.display = 'none';
    }
    
    userModal.classList.add('active');
  }
  
  /**
   * Open delete confirmation modal
   * @param {string} userId - ID of user to delete
   */
  function openDeleteModal(userId) {
    document.getElementById('delete-user-id').value = userId;
    deleteModal.classList.add('active');
  }
  
  /**
   * Close all modals
   */
  function closeModals() {
    userModal.classList.remove('active');
    deleteModal.classList.remove('active');
  }
  
  /**
   * Show alert message
   * @param {string} message - Alert message
   * @param {string} type - Alert type (success or error)
   */
  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = 'alert show alert-' + type;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      alertBox.classList.remove('show');
    }, 5000);
  }
});
