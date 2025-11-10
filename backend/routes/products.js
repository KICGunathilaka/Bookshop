const express = require('express');
const router = express.Router();
const { addProduct, listProducts } = require('../controllers/productController');

// POST /api/products - create a new product
router.post('/', addProduct);
router.get('/', listProducts);

module.exports = router;