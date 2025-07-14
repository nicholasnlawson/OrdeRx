/**
 * Auth utilities for handling user authentication across the application
 */

const AuthUtils = {
  _userData: null,
  _dataLoaded: false,

  /**
   * Initialize AuthUtils, load user data, and dispatch ready event.
   */
  init() {
    if (this._dataLoaded) return;

    try {
      const encryptedData = localStorage.getItem('userData');
      if (encryptedData) {
        const decryptedData = this.decryptData(encryptedData);
        if (decryptedData) {
          this._userData = JSON.parse(decryptedData);
        }
      }
    } catch (error) {
      console.error('Error initializing AuthUtils:', error);
      this._userData = null;
    }
    
    this._dataLoaded = true;
    // Use a timeout to ensure the event is dispatched after the main thread is less busy
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('authDataReady', { detail: { userData: this._userData } }));
    }, 0);
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get user data from the cached property.
   * @returns {Object|null} - User data object or null if not available
   */
  getUserData() {
    if (!this._dataLoaded) {
      console.warn('AuthUtils.getUserData() called before init(). This may lead to race conditions.');
      this.init(); // Fallback to ensure data is loaded
    }
    return this._userData;
  },

  /**
   * Update user data in localStorage and the local cache.
   * @param {Object} userData - Updated user data
   * @returns {boolean} - True if successful, false otherwise
   */
  updateUserData(userData) {
    try {
      if (!userData) return false;
      
      this._userData = userData; // Update local cache

      const userDataStr = JSON.stringify(userData);
      const encryptionKey = 'pharmacy-secure-key-change-in-production';
      const encryptedData = CryptoJS.AES.encrypt(userDataStr, encryptionKey).toString();
      
      localStorage.setItem('userData', encryptedData);
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  },

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check for
   * @returns {boolean} - True if user has the role, false otherwise
   */
  hasRole(role) {
    const userData = this.getUserData();
    return !!(userData && userData.roles && userData.roles.includes(role));
  },

  /**
   * Check if user has any admin role (user-admin or super-admin)
   * @returns {boolean} - True if user has any admin role, false otherwise
   */
  hasAnyAdminRole() {
    const userData = this.getUserData();
    if (!userData || !userData.roles) return false;
    
    const adminRoles = ['user-admin', 'super-admin'];
    
    // Convert both arrays to lowercase for case-insensitive comparison
    const userRolesLower = userData.roles.map(r => typeof r === 'string' ? r.toLowerCase() : r);
    const adminRolesLower = adminRoles.map(r => r.toLowerCase());
    
    // Check if any admin role exists in user roles (case-insensitive)
    return adminRolesLower.some(role => userRolesLower.includes(role));
  },

  /**
   * Check if user has full admin access (super-admin only)
   * @returns {boolean} - True if user has full admin access, false otherwise
   */
  hasFullAdminAccess() {
    return this.hasRole('super-admin');
  },

  /**
   * Decrypts data using AES encryption
   * @param {string} encryptedData - Data to decrypt
   * @returns {string} - Decrypted data
   */
  decryptData(encryptedData) {
    try {
      const encryptionKey = 'pharmacy-secure-key-change-in-production';
      const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  },

  /**
   * Log out the current user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this._userData = null;
    this._dataLoaded = false;
    window.location.href = '/login.html';
  }
};

// Initialize AuthUtils as soon as the script is loaded.
AuthUtils.init();
