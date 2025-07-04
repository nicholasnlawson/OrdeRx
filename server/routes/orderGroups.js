/**
 * Routes for managing order groups
 */
const express = require('express');
const router = express.Router();
const orderGroupModel = require('../models/orderGroup');
const authMiddleware = require('../middleware/auth');

// Per-route logging middleware for all order-groups requests
router.use((req, res, next) => {
    console.log(`[OrderGroups] ${req.method} ${req.originalUrl} | Auth: ${req.headers['authorization'] ? 'present' : 'missing'}`);
    next();
});

/**
 * Create a new order group
 * POST /api/order-groups
 */
router.post('/', authMiddleware.verifyToken, async (req, res) => {
    console.log('POST /api/order-groups received a request to create a new group.');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { orderIds, groupNumber, notes, status } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            console.warn('Validation failed: Order IDs must be a non-empty array.');
            return res.status(400).json({ success: false, error: 'Order IDs must be a non-empty array' });
        }

        if (!groupNumber) {
            console.warn('Validation failed: Group number is required.');
            return res.status(400).json({ success: false, error: 'Group number is required' });
        }

        const groupData = {
            orderIds,
            groupNumber,
            notes: notes || '',
            status: status || 'processing',
            createdBy: req.user.id, // Assuming user ID is available from auth middleware
        };

        console.log('Calling orderGroupModel.createGroup with data:', groupData);
        const group = await orderGroupModel.createGroup(groupData);

        console.log('Successfully created order group:', group);
        res.status(201).json({ success: true, group });
    } catch (error) {
        console.error('Error in POST /api/order-groups:', error);
        res.status(500).json({ success: false, error: 'Failed to create order group', details: error.message });
    }
});

/**
 * Get all order groups
 * GET /api/order-groups
 */
router.get('/', authMiddleware.verifyToken, async (req, res) => {
    console.log('GET /api/order-groups received a request to fetch all groups.');
    try {
        const groups = await orderGroupModel.getGroups();
        console.log(`Successfully fetched ${groups.length} order groups.`);
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error in GET /api/order-groups:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order groups', details: error.message });
    }
});

/**
 * Get a specific order group by ID
 * GET /api/order-groups/:id
 */
router.get('/:id', authMiddleware.verifyToken, async (req, res) => {
    const groupId = req.params.id;
    console.log(`GET /api/order-groups/${groupId} received a request.`);

    try {
        const group = await orderGroupModel.getGroupById(groupId);

        if (!group) {
            console.warn(`Order group with ID ${groupId} not found.`);
            return res.status(404).json({ success: false, error: 'Order group not found' });
        }

        console.log(`Successfully fetched order group ${groupId}.`);
        res.json({ success: true, group });
    } catch (error) {
        console.error(`Error in GET /api/order-groups/${groupId}:`, error);
        res.status(500).json({ success: false, error: 'Failed to fetch order group', details: error.message });
    }
});

// Delete an order group by ID
router.delete('/:id', authMiddleware.verifyToken, async (req, res) => {
    const groupId = req.params.id;
    console.log(`DELETE /api/order-groups/${groupId} received a request.`);

    try {
        const deleted = await orderGroupModel.deleteGroup(groupId);

        if (deleted) {
            console.log(`Successfully deleted order group ${groupId}.`);
            return res.status(204).send();
        } else {
            console.warn(`Attempted to delete non-existent order group ${groupId}.`);
            return res.status(404).json({ success: false, error: 'Order group not found' });
        }
    } catch (error) {
        console.error(`Error in DELETE /api/order-groups/${groupId}:`, error);
        res.status(500).json({ success: false, error: 'Failed to delete order group', details: error.message });
    }
});

// ---------------------------
// Fallback for unhandled routes
// ---------------------------
router.all('*', (req, res) => {
    console.warn(`[OrderGroups] Unmatched route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, error: 'OrderGroups endpoint not found', path: req.originalUrl, method: req.method });
});

module.exports = router;
