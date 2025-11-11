const express = require('express');
const router = express.Router();
const { listInventory, consumeInventory } = require('../controllers/inventoryController');

// GET /api/inventory - list inventory items with filters
router.get('/', listInventory);

// POST /api/inventory/consume - reduce inventory without creating sales
router.post('/consume', consumeInventory);

module.exports = router;