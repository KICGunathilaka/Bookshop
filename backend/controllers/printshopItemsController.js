const pool = require('../config/db');

// List printshop items with optional filters
// Query params: q (product name/brand), from (YYYY-MM-DD), to (YYYY-MM-DD), limit
exports.listPrintshopItems = async (req, res) => {
  try {
    const { q, from, to, limit } = req.query;

    const params = [];
    const where = [];

    if (q && q.trim()) {
      const like1 = params.push(`%${q.trim()}%`); // index for product_name
      const like2 = params.push(`%${q.trim()}%`); // index for brand
      where.push(`(p.product_name ILIKE $${like1} OR pi.brand ILIKE $${like2})`);
    }
    if (from) {
      params.push(from);
      where.push('pi.created_at::date >= $' + params.length);
    }
    if (to) {
      params.push(to);
      where.push('pi.created_at::date <= $' + params.length);
    }

    const limitVal = Math.min(Number(limit) || 200, 1000);

    const sql = `
      SELECT
        pi.printshop_item_id AS item_id,
        pi.product_id,
        p.product_name,
        pi.brand AS brand,
        pi.quantity,
        pi.unit_price,
        pi.total_amount,
        pi.created_at
      FROM printshop_items pi
      LEFT JOIN products p ON p.product_id = pi.product_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY pi.created_at DESC
      LIMIT ${limitVal}
    `;

    const { rows } = await pool.query(sql, params);
    return res.json({ items: rows });
  } catch (err) {
    console.error('listPrintshopItems error:', err);
    return res.status(500).send('Failed to fetch printshop items');
  }
};