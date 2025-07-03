/**
 * Admin Fix Route
 * Special route to fix admin permissions issues
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/init');

/**
 * Fix admin roles directly
 * This is a one-time utility to repair admin user privileges
 */
router.get('/fix-admin-roles', async (req, res) => {
  try {
    // Run the role fix script directly
    await db.serialize(async () => {
      // Make sure the roles exist
      await db.run("INSERT OR IGNORE INTO roles (name) VALUES ('super-admin')");
      await db.run("INSERT OR IGNORE INTO roles (name) VALUES ('user-admin')");
      
      // Get the admin user ID and assign roles
      const superAdminRoleId = await db.get("SELECT id FROM roles WHERE name = 'super-admin'");
      const userAdminRoleId = await db.get("SELECT id FROM roles WHERE name = 'user-admin'");
      const adminUser = await db.get("SELECT id FROM users WHERE username = 'admin'");
      
      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      
      if (superAdminRoleId) {
        await db.run(
          "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
          [adminUser.id, superAdminRoleId.id]
        );
      }
      
      if (userAdminRoleId) {
        await db.run(
          "INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)",
          [adminUser.id, userAdminRoleId.id]
        );
      }
      
      // Verify roles were assigned
      const result = await db.all(`
        SELECT u.username, u.email, GROUP_CONCAT(r.name) AS roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.username = 'admin'
        GROUP BY u.id
      `);
      
      res.json({ 
        message: 'Admin role fix attempted', 
        result: result[0] || 'No admin user found'
      });
    });
  } catch (error) {
    console.error('Error fixing admin roles:', error);
    res.status(500).json({ error: 'Failed to fix admin roles', details: error.message });
  }
});

module.exports = router;
