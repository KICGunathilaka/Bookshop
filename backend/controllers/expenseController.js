const pool = require('../config/db');

// Create a new expense entry
async function addExpense(req, res) {
  try {
    const { expenseName, expenseDate = null, amount, note = null } = req.body;

    if (!expenseName || typeof expenseName !== 'string') {
      return res.status(400).json({ error: 'expenseName is required' });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'amount must be > 0' });
    }

    const result = await pool.query(
      `INSERT INTO expenses (expense_name, expense_date, amount, note)
       VALUES ($1, $2, $3, $4)
       RETURNING expense_id, created_at`,
      [expenseName, expenseDate || null, amt, note]
    );

    const row = result.rows[0];
    return res.status(201).json({
      message: 'Expense recorded',
      expense: {
        expense_id: row.expense_id,
        expense_name: expenseName,
        expense_date: expenseDate || null,
        amount: amt,
        note,
        created_at: row.created_at,
      },
    });
  } catch (err) {
    console.error('Add expense error:', err);
    return res.status(500).json({ error: 'Failed to record expense' });
  }
}

module.exports = { addExpense };

// List expenses with filters
async function listExpenses(req, res) {
  try {
    const { q = '', from = null, to = null, limit = 200 } = req.query;
    const params = [];
    const where = [];
    if (q && String(q).trim().length > 0) {
      params.push(`%${String(q).trim()}%`);
      where.push(`expense_name ILIKE $${params.length}`);
    }
    if (from) {
      params.push(String(from));
      where.push(`COALESCE(expense_date, DATE(created_at)) >= $${params.length}::date`);
    }
    if (to) {
      params.push(String(to));
      where.push(`COALESCE(expense_date, DATE(created_at)) <= $${params.length}::date`);
    }
    params.push(Number(limit));

    const sql = `
      SELECT expense_id, expense_name, expense_date, amount, note, created_at
      FROM expenses
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY COALESCE(expense_date, DATE(created_at)) DESC, expense_id DESC
      LIMIT $${params.length}
    `;

    const result = await require('../config/db').query(sql, params);
    return res.json({ expenses: result.rows });
  } catch (err) {
    console.error('List expenses error:', err);
    return res.status(500).json({ error: 'Failed to list expenses' });
  }
}

module.exports.listExpenses = listExpenses;