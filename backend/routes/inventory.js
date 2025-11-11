const express = require('express');
const router = express.Router();
const { listInventory } = require('../controllers/inventoryController');

// GET /api/inventory - list inventory items with filters
router.get('/', listInventory);

module.exports = router;