const pool = require('../config/db');

// GET /api/metrics/sales-summary
// Returns aggregated totals for today and current month combining bookshop sales and printshop sales
async function getSalesSummary(req, res) {
  const client = await pool.connect();
  try {
    const sql = `
      WITH bounds AS (
        SELECT
          CURRENT_DATE AS today,
          date_trunc('month', CURRENT_DATE)::date AS month_start,
          (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date AS month_end
      ),
      bookshop AS (
        SELECT
          COALESCE(SUM(CASE WHEN s.sale_date = (SELECT today FROM bounds) THEN s.total_amount ELSE 0 END), 0) AS today_amount,
          COALESCE(SUM(CASE WHEN s.sale_date >= (SELECT month_start FROM bounds) AND s.sale_date < (SELECT month_end FROM bounds) THEN s.total_amount ELSE 0 END), 0) AS month_amount
        FROM sales s
      ),
      printshop_sales AS (
        SELECT
          COALESCE(SUM(CASE WHEN ps.sale_date = (SELECT today FROM bounds) THEN ps.total_amount ELSE 0 END), 0) AS today_amount,
          COALESCE(SUM(CASE WHEN ps.sale_date >= (SELECT month_start FROM bounds) AND ps.sale_date < (SELECT month_end FROM bounds) THEN ps.total_amount ELSE 0 END), 0) AS month_amount
        FROM printshop_sales ps
      ),
      printshop_items AS (
        SELECT
          COALESCE(SUM(CASE WHEN (pi.created_at)::date = (SELECT today FROM bounds) THEN pi.total_amount ELSE 0 END), 0) AS today_amount,
          COALESCE(SUM(CASE WHEN pi.created_at >= (SELECT month_start FROM bounds) AND pi.created_at < (SELECT month_end FROM bounds) THEN pi.total_amount ELSE 0 END), 0) AS month_amount
        FROM printshop_items pi
      ),
      printshop AS (
        SELECT
          (ps.today_amount + pi.today_amount) AS today_amount,
          (ps.month_amount + pi.month_amount) AS month_amount
        FROM printshop_sales ps, printshop_items pi
      )
      SELECT
        b.today_amount AS bookshop_today,
        p.today_amount AS printshop_today,
        (b.today_amount + p.today_amount) AS today_total,
        b.month_amount AS bookshop_month,
        p.month_amount AS printshop_month,
        (b.month_amount + p.month_amount) AS month_total
      FROM bookshop b, printshop p;
    `;

    const r = await client.query(sql);
    const row = r.rows[0] || {
      bookshop_today: 0,
      printshop_today: 0,
      today_total: 0,
      bookshop_month: 0,
      printshop_month: 0,
      month_total: 0,
    };
    return res.json({
      today: { bookshop: Number(row.bookshop_today), printshop: Number(row.printshop_today), total: Number(row.today_total) },
      month: { bookshop: Number(row.bookshop_month), printshop: Number(row.printshop_month), total: Number(row.month_total) },
    });
  } catch (err) {
    console.error('Get sales summary error:', err);
    return res.status(500).json({ error: 'Failed to get sales summary' });
  } finally {
    client.release();
  }
}

module.exports = { getSalesSummary };