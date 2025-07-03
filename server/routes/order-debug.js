/**
 * Order Debugging Routes
 * Special routes to help diagnose order creation issues
 */

const express = require('express');
const router = express.Router();
const { OrderModel } = require('../models/order');
const { db } = require('../db/init');

// Middleware to check database tables and schemas
router.get('/check-schema', async (req, res) => {
  try {
    // Check orders table
    db.all(`PRAGMA table_info(orders)`, (err, ordersColumns) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error checking orders table schema',
          error: err.message
        });
      }

      // Check order_medications table
      db.all(`PRAGMA table_info(order_medications)`, (medErr, medicationsColumns) => {
        if (medErr) {
          return res.status(500).json({
            success: false,
            message: 'Error checking order_medications table schema',
            error: medErr.message
          });
        }

        // Return all schema information
        res.json({
          success: true,
          schema: {
            orders: ordersColumns,
            order_medications: medicationsColumns
          }
        });
      });
    });
  } catch (error) {
    console.error('Error checking database schema:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking database schema',
      error: error.message
    });
  }
});

// Test simple order creation
router.post('/test-create', async (req, res) => {
  try {
    console.log('Starting test order creation');
    
    // Create a minimal test order
    const testOrderData = {
      type: 'ward-stock', // Use ward-stock as it's simpler (no patient data)
      wardId: 1, // Use numeric ward ID to match INTEGER column type
      medications: [
        {
          name: 'Test Medication',
          quantity: '1'
        }
      ],
      requester: {
        name: 'Test User',
        role: 'testing'
      }
    };
    
    console.log('Test order data:', JSON.stringify(testOrderData, null, 2));
    
    // Attempt to create the order
    const result = await OrderModel.createOrder(testOrderData);
    
    res.json({
      success: true,
      message: 'Test order created successfully',
      result
    });
  } catch (error) {
    console.error('Error in test order creation:', error);
    res.status(500).json({
      success: false,
      message: 'Error in test order creation',
      error: error.message,
      stack: error.stack
    });
  }
});

// Fix for the potential race condition in insertMedications
router.post('/create-with-fix', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields - same as the main route
    const { type, wardId, medications, requester } = orderData;
    
    if (!type || !wardId || !medications || !requester) {
      return res.status(400).json({
        success: false, 
        message: 'Missing required fields: type, wardId, medications, requester'
      });
    }
    
    if (!medications.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one medication is required'
      });
    }
    
    // Create a fixed version of the order with the same data
    // This version will use Promise.all for medication insertion
    const orderId = `ORD${Date.now().toString().substring(6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const timestamp = new Date().toISOString();
    
    console.log(`Creating fixed test order ${orderId} with data:`, JSON.stringify(orderData, null, 2));
    
    try {
      // First, insert the main order record
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO orders (
            id, type, ward_id, timestamp, status, 
            requester_name, requester_role, notes, is_duplicate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId, type, wardId, timestamp, 'pending',
            requester.name, requester.role, orderData.notes || null, false
          ],
          function(err) {
            if (err) {
              console.error('Error inserting order:', err);
              reject(err);
            } else {
              console.log(`✅ ORDER INSERT SUCCESS - ID: ${orderId}`);
              resolve();
            }
          }
        );
      });
      
      // Then insert medications one by one but using Promise.all to handle errors properly
      const medInsertPromises = medications.map(med => {
        return new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO order_medications (
              order_id, name, form, strength, quantity, dose, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              med.name,
              med.form || null,
              med.strength || null,
              med.quantity,
              med.dose || null,
              med.notes || null
            ],
            function(err) {
              if (err) {
                console.error(`Error inserting medication "${med.name}":`, err);
                reject(err);
              } else {
                console.log(`✅ MEDICATION INSERT SUCCESS - Order ID: ${orderId}, Med: "${med.name}"`);
                resolve();
              }
            }
          );
        });
      });
      
      // Wait for all medication inserts to complete
      await Promise.all(medInsertPromises);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully with fixed implementation',
        orderId
      });
      
    } catch (error) {
      console.error('Error in fixed order creation:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating order with fixed implementation',
        error: error.message
      });
    }
  } catch (outerError) {
    console.error('Unexpected error in fixed order route:', outerError);
    res.status(500).json({
      success: false,
      message: 'Unexpected error in fixed order creation route',
      error: outerError.message
    });
  }
});

module.exports = router;
