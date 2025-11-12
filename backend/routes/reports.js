const express = require('express');
const router = express.Router();
const { exportPrintshopItemsCsv } = require('../controllers/reportsController');

// GET /api/reports/printshop-items.csv
router.get('/printshop-items.csv', exportPrintshopItemsCsv);

module.exports = router;