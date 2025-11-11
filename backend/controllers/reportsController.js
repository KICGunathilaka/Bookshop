const pool = require('../config/db');

// GET /api/reports/printshop-items.csv
// Exports a CSV of printshop_items with product details and totals
async function exportPrintshopItemsCsv(req, res) {
  try {
    const { from = null, to = null, limit = 5000 } = req.query;
    const params = [];
    const where = [];
    if (from) {
      params.push(String(from));
      where.push(`pi.created_at::date >= $${params.length}::date`);
    }
    if (to) {
      params.push(String(to));
      where.push(`pi.created_at::date <= $${params.length}::date`);
    }
    params.push(Number(limit));

    const sql = `
      SELECT
        pi.printshop_item_id,
        pi.inventory_id,
        pr.product_id,
        pr.product_name,
        COALESCE(pi.brand, '') AS brand,
        pi.quantity,
        pi.unit_price,
        (pi.quantity * pi.unit_price) AS total_amount,
        pi.created_at
      FROM printshop_items pi
      JOIN products pr ON pr.product_id = pi.product_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY pi.created_at DESC, pi.printshop_item_id DESC
      LIMIT $${params.length}
    `;

    const result = await pool.query(sql, params);

    const header = [
      'printshop_item_id',
      'inventory_id',
      'product_id',
      'product_name',
      'brand',
      'quantity',
      'unit_price',
      'total_amount',
      'created_at',
    ];
    const lines = [header.join(',')];

    for (const row of result.rows) {
      const values = [
        row.printshop_item_id,
        row.inventory_id,
        row.product_id,
        row.product_name,
        row.brand || '',
        row.quantity,
        Number(row.unit_price).toFixed(2),
        Number(row.total_amount).toFixed(2),
        new Date(row.created_at).toISOString(),
      ];
      const escaped = values.map((v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? '"' + s.replace(/"/g, '""') + '"'
          : s;
      });
      lines.push(escaped.join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="printshop_items.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Export printshop_items CSV error:', err);
    return res.status(500).send('Failed to export printshop items');
  }
}

module.exports = { exportPrintshopItemsCsv };