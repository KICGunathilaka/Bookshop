const express = require('express');
const router = express.Router();
const { addProduct, listProducts, updateProduct } = require('../controllers/productController');

// POST /api/products - create a new product
router.post('/', addProduct);
router.get('/', listProducts);
router.put('/:id', updateProduct);

module.exports = router;