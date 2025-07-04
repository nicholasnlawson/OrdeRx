/**
 * OrderGroup model - handles group-related database operations using modern async/await.
 */
const { db } = require('../db/init');
const logger = require('../utils/logger');

// Promisify db methods for cleaner async/await syntax
const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) {
            logger.error('SQL Error in run', { error: err.message, sql, params });
            reject(err);
        } else {
            resolve(this); // 'this' contains lastID and changes
        }
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            logger.error('SQL Error in get', { error: err.message, sql, params });
            reject(err);
        } else {
            resolve(row);
        }
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) {
            logger.error('SQL Error in all', { error: err.message, sql, params });
            reject(err);
        } else {
            resolve(rows);
        }
    });
});

class OrderGroupModel {
    /**
     * Creates a new order group and links the specified orders.
     * @param {object} groupData - Group data including orderIds, groupNumber, notes, and createdBy.
     * @returns {Promise<object>} The created group data.
     */
    async createGroup(groupData) {
        const { orderIds, groupNumber, notes, createdBy } = groupData;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            throw new Error('Order IDs must be a non-empty array');
        }
        if (!groupNumber) {
            throw new Error('Group number is required');
        }
        if (!createdBy) {
            throw new Error('Created by user ID is required');
        }

        try {
            await run('BEGIN TRANSACTION');
            logger.info(`Creating group ${groupNumber} with ${orderIds.length} orders.`);

            const result = await run(
                'INSERT INTO order_groups (group_number, notes, created_by) VALUES (?, ?, ?)',
                [groupNumber, notes || '', createdBy]
            );
            const groupId = result.lastID;

            const updatePromises = orderIds.map(orderId =>
                run('UPDATE orders SET group_id = ? WHERE id = ?', [groupId, orderId])
            );
            await Promise.all(updatePromises);

            await run('COMMIT');

            const newGroup = await this.getGroupById(groupId);
            logger.info(`Successfully created group ${groupNumber} with ID ${groupId}.`);
            return newGroup;

        } catch (error) {
            await run('ROLLBACK').catch(rbError => logger.error('Failed to rollback transaction', rbError));
            logger.error(`Transaction failed when creating group ${groupNumber}:`, error);
            throw error; // Re-throw the error to be caught by the route handler
        }
    }

    /**
     * Gets all order groups.
     * @returns {Promise<Array>} An array of all order groups.
     */
    async getGroups() {
        logger.info('Fetching all order groups');
        // The created_at column has a default value and will be handled by the DB
        return all('SELECT * FROM order_groups ORDER BY created_at DESC');
    }

    /**
     * Gets a single group by its ID, including its associated orders.
     * @param {number} groupId - The ID of the group.
     * @returns {Promise<object|null>} The group data or null if not found.
     */
    async getGroupById(groupId) {
        logger.info(`Fetching group by ID: ${groupId}`);
        const group = await get('SELECT * FROM order_groups WHERE id = ?', [groupId]);

        if (!group) {
            logger.warn(`Group with ID ${groupId} not found`);
            return null;
        }

        const orderRows = await all('SELECT id FROM orders WHERE group_id = ?', [groupId]);
        group.orderIds = orderRows.map(row => row.id);

        return group;
    }

    /**
     * Deletes a group by its ID. Note: This does not delete the orders, only the group itself.
     * The group_id on orders will be set to NULL due to the foreign key constraint.
     * @param {number|string} groupId - The ID of the group to delete.
     * @returns {Promise<boolean>} True if a group was deleted, false otherwise.
     */
    async deleteGroup(groupId) {
        logger.info(`Deleting group with ID: ${groupId}`);
        const result = await run('DELETE FROM order_groups WHERE id = ?', [groupId]);
        if (result.changes > 0) {
            logger.info(`Successfully deleted group ${groupId}`);
        } else {
            logger.warn(`Attempted to delete non-existent group ${groupId}`);
        }
        return result.changes > 0;
    }
}

module.exports = new OrderGroupModel();
