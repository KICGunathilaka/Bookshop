const express = require('express');
const router = express.Router();
const { addExpense, listExpenses } = require('../controllers/expenseController');

// POST /api/expenses - create a new expense entry
router.post('/', addExpense);

// GET /api/expenses - list expenses with filters
router.get('/', listExpenses);

module.exports = router;