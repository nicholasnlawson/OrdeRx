// Login functionality
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const togglePasswordButton = document.getElementById('toggle-password');
  const passwordField = document.getElementById('password');
  const errorMessage = document.getElementById('error-message');

  // Get API base URL from config
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:10000/api'
    : '/api';

  // Toggle password visibility
  togglePasswordButton.addEventListener('click', () => {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    togglePasswordButton.classList.toggle('show-password');
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Clear previous error messages
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Login successful
      // Store token securely in localStorage 
      // (for production, consider using HttpOnly cookies instead)
      localStorage.setItem('token', data.token);
      
      // Store user role information encrypted
      const encryptedUserData = encryptData(JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        roles: data.user.roles
      }));
      localStorage.setItem('userData', encryptedUserData);

      // Redirect based on user role
      redirectUserByRole(data.user.roles);

    } catch (error) {
      // Display error message
      errorMessage.textContent = error.message;
      errorMessage.classList.add('show');
    }
  });

  /**
   * Encrypts data using AES encryption
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  function encryptData(data) {
    try {
      // Use a secure key management approach in production
      const encryptionKey = 'pharmacy-secure-key-change-in-production';
      
      // Use CryptoJS for encryption (already included in dependencies)
      const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Redirect user based on their role
   * @param {Array} roles - User roles
   */
  function redirectUserByRole(roles) {
    // All users are redirected to the home page after login
    // Role-specific access is handled via navigation and permissions
    window.location.href = 'home.html';
  }

  // Check if user is already logged in
  function checkAuthenticationStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    // If token exists, verify it and redirect accordingly
    if (token && userData) {
      try {
        // For security, we should verify the token with the server
        fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': token
          }
        })
        .then(response => {
          if (response.ok) {
            // Token is valid, decrypt user data
            const decryptedData = decryptData(userData);
            if (decryptedData) {
              const user = JSON.parse(decryptedData);
              redirectUserByRole(user.roles);
            }
          } else {
            // Token invalid or expired, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        })
        .catch(error => {
          console.error('Error verifying authentication:', error);
        });
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    }
  }
  
  /**
   * Decrypts data using AES encryption
   * @param {string} encryptedData - Data to decrypt
   * @returns {string} - Decrypted data
   */
  function decryptData(encryptedData) {
    try {
      // Use the same key as encryption
      const encryptionKey = 'pharmacy-secure-key-change-in-production';
      
      // Use CryptoJS for decryption
      const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Check authentication status when page loads
  checkAuthenticationStatus();
});
