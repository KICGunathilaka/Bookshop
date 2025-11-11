const express = require('express');
const router = express.Router();
const { addSale, listSales } = require('../controllers/saleController');

// POST /api/sales - create a new sale with items
router.post('/', addSale);

// GET /api/sales - list sales with items
router.get('/', listSales);

module.exports = router;