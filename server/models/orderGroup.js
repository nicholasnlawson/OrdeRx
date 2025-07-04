/**
 * OrderGroup model - handles group-related operations 
 */
const { db } = require('../db/init');
const { getTimestamp } = require('../utils/timestamp');

const logger = require('../utils/logger');

class OrderGroupModel {
    /**
     * Creates a new order group
     * @param {object} groupData - Group data including orderIds, groupNumber and notes
     * @returns {Promise<object>} Created group data
     */
    async createGroup(groupData) {
        const { orderIds, groupNumber, notes } = groupData;
        
        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('Order IDs must be a non-empty array');
        }
        
        if (!groupNumber) {
            logger.error('Attempted to create group without group number');
            throw new Error('Group number is required');
        }
        
        const timestamp = getTimestamp();
        
        return new Promise((resolve, reject) => {
            // Use SQLite's run method with a transaction
            db.serialize(() => {
                logger.info(`Creating group ${groupNumber} with ${orderIds.length} orders`);
                db.run('BEGIN TRANSACTION', (beginErr) => {
                    if (beginErr && !/cannot start a transaction/i.test(beginErr.message)) {
                        // Any error other than nested transaction is fatal
                        logger.error('Failed to BEGIN TRANSACTION when creating order group:', beginErr);
                        return reject(beginErr);
                    }

                    // Insert new group into order_groups table
                    db.run(
                        'INSERT INTO order_groups (group_number, notes, timestamp) VALUES (?, ?, ?)',
                        [groupNumber, notes || '', timestamp],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                logger.error(`Error inserting new group ${groupNumber}:`, err);
                                return reject(err);
                            }
                            
                            const groupId = this.lastID;
                            
                            // Create a promise for each order update
                            const updatePromises = orderIds.map(orderId => {
                                return new Promise((resolveUpdate, rejectUpdate) => {
                                    db.run(
                                        'UPDATE orders SET group_id = ? WHERE id = ?',
                                        [groupId, orderId],
                                        (err) => {
                                            if (err) {
                                                logger.error(`Failed to update order ${orderId} with group_id ${groupId}:`, err);
                                                return rejectUpdate(err);
                                            }
                                            resolveUpdate();
                                        }
                                    );
                                });
                            });
                            
                            // Process all updates
                            Promise.all(updatePromises)
                                .then(() => {
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            logger.error(`Transaction failed when creating group ${groupNumber} due to commit error:`, err);
                                            return reject(err);
                                        }
                                        
                                        // Return the created group
                                        logger.info(`Successfully created group ${groupNumber} with ID ${groupId}`);
                                        resolve({
                                            id: groupId,
                                            groupNumber,
                                            notes,
                                            timestamp,
                                            orderIds
                                        });
                                    });
                                })
                                .catch((error) => {
                                    db.run('ROLLBACK');
                                    logger.error(`Transaction failed when creating group ${groupNumber}:`, error);
                                    reject(error);
                                });
                        }
                    );
                });
            });
        });
    }
    
    /**
     * Gets all groups
     * @returns {Promise<Array>} Array of groups
     */
    async getGroups() {
        logger.info('Fetching all order groups');
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM order_groups ORDER BY timestamp DESC',
                [],
                (err, rows) => {
                    if (err) {
                        logger.error('Error fetching order groups:', err);
                        return reject(err);
                    }
                    logger.info(`Found ${rows.length} order groups`);
                    resolve(rows);
                }
            );
        });
    }
    
    /**
     * Gets a group by ID
     * @param {number} groupId - Group ID
     * @returns {Promise<object>} Group data
     */
    async getGroupById(groupId) {
        logger.info(`Fetching group by ID: ${groupId}`);
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM order_groups WHERE id = ?',
                [groupId],
                (err, row) => {
                    if (err) {
                        logger.error(`Error fetching group ${groupId}:`, err);
                        return reject(err);
                    }
                    if (!row) {
                        logger.warn(`Group with ID ${groupId} not found`);
                        return resolve(null);
                    }
                    
                    const group = row;
                    
                    // Get orders in this group
                    db.all(
                        'SELECT id FROM orders WHERE group_id = ?',
                        [groupId],
                        (err, orderRows) => {
                            if (err) {
                                logger.error(`Error fetching orders for group ${groupId}:`, err);
                                return reject(err);
                            }
                            
                            group.orderIds = orderRows.map(row => row.id);
                            resolve(group);
                        }
                    );
                }
            );
        });
    }
    
    /**
     * Deletes a group by ID
     * @param {number|string} groupId
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async deleteGroup(groupId) {
        logger.info(`Deleting group with ID: ${groupId}`);
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM order_groups WHERE id = ?', [groupId], function(err) {
                if (err) {
                    logger.error(`Error deleting group ${groupId}:`, err);
                    return reject(err);
                }
                if (this.changes > 0) {
                    logger.info(`Successfully deleted group ${groupId}`);
                } else {
                    logger.warn(`Attempted to delete non-existent group ${groupId}`);
                }
                resolve(this.changes > 0);
            });
        });
    }
}

module.exports = new OrderGroupModel();
