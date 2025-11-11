const express = require('express');
const router = express.Router();
const { addPrintshopSale, listPrintshopSales, getNextInvoiceNo } = require('../controllers/printshopSaleController');

// POST /api/printshop-sales - create a new printshop sale
router.post('/', addPrintshopSale);

// GET /api/printshop-sales/next-invoice - suggest next invoice number
router.get('/next-invoice', getNextInvoiceNo);

// GET /api/printshop-sales - list printshop sales with items
router.get('/', listPrintshopSales);

module.exports = router;