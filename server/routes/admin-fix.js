/**
 * Admin Fix Route
 * Special route to fix admin permissions issues
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/init');

// Debug route to check database connection
router.get('/debug', (req, res) => {
  try {
    res.json({
      message: 'Admin fix debug route is working',
      dbAvailable: !!db,
      time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all users for debugging
router.get('/list-users', (req, res) => {
  db.all('SELECT * FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ users });
  });
});

// List all roles for debugging
router.get('/list-roles', (req, res) => {
  db.all('SELECT * FROM roles', (err, roles) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ roles });
  });
});

/**
 * Fix admin roles directly
 * This is a one-time utility to repair admin user privileges
 */
router.get('/fix-admin-roles', (req, res) => {
  const debugInfo = {};
  
  // First get all available roles
  db.all('SELECT * FROM roles', (err, roles) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to get roles', details: err.message });
    }
    
    debugInfo.availableRoles = roles;
    
    // Find the admin user
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, adminUser) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to get admin user', details: err.message });
      }
      
      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      
      debugInfo.adminUser = adminUser;
      
      // Find super-admin and user-admin role IDs
      const superAdminRole = roles.find(r => r.name === 'super-admin');
      const userAdminRole = roles.find(r => r.name === 'user-admin');
      
      if (!superAdminRole || !userAdminRole) {
        return res.status(500).json({ 
          error: 'Required roles not found', 
          superAdminExists: !!superAdminRole,
          userAdminExists: !!userAdminRole,
          debugInfo
        });
      }
      
      // First, ensure the roles exist
      const createRolesQuery = `
        INSERT OR IGNORE INTO roles (name) VALUES ('super-admin');
        INSERT OR IGNORE INTO roles (name) VALUES ('user-admin');
      `;
      
      db.exec(createRolesQuery, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to ensure roles exist', details: err.message, debugInfo });
        }
        
        // Now assign roles to admin
        const assignRoleQuery = `
          INSERT OR IGNORE INTO user_roles (user_id, role_id) 
          VALUES (?, ?);
        `;
        
        // Assign super-admin role
        db.run(assignRoleQuery, [adminUser.id, superAdminRole.id], (err) => {
          if (err) {
            return res.status(500).json({ 
              error: 'Failed to assign super-admin role', 
              details: err.message,
              debugInfo 
            });
          }
          
          // Assign user-admin role
          db.run(assignRoleQuery, [adminUser.id, userAdminRole.id], (err) => {
            if (err) {
              return res.status(500).json({ 
                error: 'Failed to assign user-admin role', 
                details: err.message,
                debugInfo 
              });
            }
            
            // Check if assignment was successful
            const checkQuery = `
              SELECT u.username, u.email, GROUP_CONCAT(r.name) AS roles
              FROM users u
              LEFT JOIN user_roles ur ON u.id = ur.user_id
              LEFT JOIN roles r ON ur.role_id = r.id
              WHERE u.username = 'admin'
              GROUP BY u.id
            `;
            
            db.get(checkQuery, (err, result) => {
              if (err) {
                return res.status(500).json({ 
                  error: 'Failed to verify role assignment', 
                  details: err.message,
                  debugInfo 
                });
              }
              
              return res.json({
                message: 'Admin role fix completed',
                admin: result,
                debugInfo
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
