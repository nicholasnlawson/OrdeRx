/**
 * Database debugging routes
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db/init');
const authMiddleware = require('../middleware/auth');

/**
 * Check if a table exists and return its schema
 * GET /api/db-debug/table/:tableName
 */
router.get('/table/:tableName', authMiddleware.verifyToken, async (req, res) => {
    const tableName = req.params.tableName;
    
    try {
        // Check if table exists
        db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            [tableName],
            function(err, row) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Database error',
                        details: err.message
                    });
                }
                
                if (!row) {
                    return res.status(404).json({
                        success: false,
                        exists: false,
                        message: `Table '${tableName}' does not exist`
                    });
                }
                
                // Get table schema
                db.all(
                    `PRAGMA table_info(${tableName})`,
                    [],
                    function(err, columns) {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                error: 'Failed to get table schema',
                                details: err.message
                            });
                        }
                        
                        res.json({
                            success: true,
                            exists: true,
                            tableName,
                            columns
                        });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

/**
 * List all tables in the database
 * GET /api/db-debug/tables
 */
router.get('/tables', authMiddleware.verifyToken, async (req, res) => {
    try {
        db.all(
            "SELECT name FROM sqlite_master WHERE type='table'",
            [],
            function(err, tables) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Database error',
                        details: err.message
                    });
                }
                
                res.json({
                    success: true,
                    tables: tables.map(t => t.name)
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: error.message
        });
    }
});

/**
 * Run a manual migration for order_groups table
 * POST /api/db-debug/fix-order-groups
 */
router.post('/fix-order-groups', authMiddleware.verifyToken, async (req, res) => {
    try {
        // Create order_groups table with proper schema
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Create the order_groups table
            db.run(`
                CREATE TABLE IF NOT EXISTS order_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_number TEXT NOT NULL UNIQUE,
                    notes TEXT,
                    created_by INTEGER,
                    timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
                    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
                )
            `, function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to create order_groups table',
                        details: err.message
                    });
                }
                
                // Add group_id column to orders table if it doesn't exist
                db.run(`
                    PRAGMA foreign_keys=off;
                    BEGIN TRANSACTION;
                    
                    -- Add column if it doesn't exist
                    -- SQLite doesn't have a direct "ADD COLUMN IF NOT EXISTS" syntax,
                    -- so we need to check if the column exists first
                    SELECT CASE 
                        WHEN (SELECT COUNT(*) FROM pragma_table_info('orders') WHERE name='group_id') = 0 THEN
                            'ALTER TABLE orders ADD COLUMN group_id INTEGER REFERENCES order_groups(id) ON DELETE SET NULL'
                        ELSE
                            'SELECT 1' -- Dummy query that does nothing
                    END AS sql_to_run;
                `, function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to prepare group_id column check',
                            details: err.message
                        });
                    }
                    
                    // Create indexes
                    db.run(`
                        CREATE INDEX IF NOT EXISTS idx_orders_group_id ON orders(group_id);
                        CREATE INDEX IF NOT EXISTS idx_order_groups_group_number ON order_groups(group_number);
                        
                        COMMIT;
                        PRAGMA foreign_keys=on;
                    `, function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({
                                success: false,
                                error: 'Failed to create indexes',
                                details: err.message
                            });
                        }
                        
                        res.json({
                            success: true,
                            message: 'Order groups table structure has been fixed'
                        });
                    });
                });
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            error: 'Server error',
            details: error.message
        });
    }
});

module.exports = router;
