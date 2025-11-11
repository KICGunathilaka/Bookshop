const express = require('express');
const router = express.Router();
const { addPurchase, getNextInvoiceNo, listPurchases } = require('../controllers/purchaseController');

// POST /api/purchases - create a new purchase with items
router.post('/', addPurchase);

// GET /api/purchases/next-invoice - suggest next invoice number
router.get('/next-invoice', getNextInvoiceNo);

// GET /api/purchases - list purchases with items
router.get('/', listPurchases);

module.exports = router;