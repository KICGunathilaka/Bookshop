const express = require('express');
const router = express.Router();
const { addVendor, listVendors } = require('../controllers/vendorController');

// POST /api/vendors - create a new vendor
router.post('/', addVendor);

// GET /api/vendors - list vendors
router.get('/', listVendors);

module.exports = router;