-- Fix admin user role assignment
-- This script ensures the admin user has the super-admin and user-admin roles

-- Make sure the roles exist
INSERT OR IGNORE INTO roles (name) VALUES ('super-admin');
INSERT OR IGNORE INTO roles (name) VALUES ('user-admin');
INSERT OR IGNORE INTO roles (name) VALUES ('pharmacy');
INSERT OR IGNORE INTO roles (name) VALUES ('ordering');

-- Get the admin user ID
-- IMPORTANT: Change WHERE clause if username is different
INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'super-admin';

INSERT OR IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'user-admin';

-- Verify roles were assigned
SELECT u.username, u.email, GROUP_CONCAT(r.name) AS roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
GROUP BY u.id;
