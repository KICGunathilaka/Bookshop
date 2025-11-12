const express = require('express');
const router = express.Router();
const { listPrintshopItems } = require('../controllers/printshopItemsController');

// GET /api/printshop-items
router.get('/', listPrintshopItems);

module.exports = router;