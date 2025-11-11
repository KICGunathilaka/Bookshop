const express = require('express');
const router = express.Router();
const { getSalesSummary } = require('../controllers/metricsController');

// GET /api/metrics/sales-summary - aggregate today's and monthly totals
router.get('/sales-summary', getSalesSummary);

module.exports = router;