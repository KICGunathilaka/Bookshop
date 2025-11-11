const pool = require('../config/db');

// List inventory items with filters
async function listInventory(req, res) {
  const client = await pool.connect();
  try {
    const { q = '', vendorId = null, brand = '', minStock = null, maxStock = null, from = null, to = null, limit = 200 } = req.query;
    const values = [];
    let where = 'WHERE 1=1';

    if (q && String(q).trim().length > 0) {
      values.push(`%${String(q).trim()}%`);
      where += ` AND (pr.product_name ILIKE $${values.length} OR ii.brand ILIKE $${values.length})`;
    }
    if (brand && String(brand).trim().length > 0) {
      values.push(`%${String(brand).trim()}%`);
      where += ` AND ii.brand ILIKE $${values.length}`;
    }
    if (vendorId) {
      values.push(Number(vendorId));
      where += ` AND ii.vendor_id = $${values.length}`;
    }
    if (minStock !== null && minStock !== undefined) {
      values.push(Number(minStock));
      where += ` AND ii.stock_quantity >= $${values.length}`;
    }
    if (maxStock !== null && maxStock !== undefined) {
      values.push(Number(maxStock));
      where += ` AND ii.stock_quantity <= $${values.length}`;
    }
    if (from) {
      values.push(String(from));
      where += ` AND ii.created_at >= $${values.length}::date`;
    }
    if (to) {
      values.push(String(to));
      where += ` AND ii.created_at <= $${values.length}::date`;
    }
    values.push(Number(limit));

    const sql = `
      SELECT
        ii.inventory_id,
        pr.product_id,
        pr.product_name,
        pr.category,
        pr.unit,
        v.vendor_id,
        v.vendor_name,
        ii.brand,
        ii.purchase_price,
        ii.selling_price,
        ii.stock_quantity,
        ii.created_at
      FROM inventory_items ii
      JOIN products pr ON pr.product_id = ii.product_id
      LEFT JOIN vendors v ON v.vendor_id = ii.vendor_id
      ${where}
      ORDER BY pr.product_name ASC, ii.brand ASC NULLS LAST
      LIMIT $${values.length}
    `;

    const result = await client.query(sql, values);
    return res.json({ items: result.rows });
  } catch (err) {
    console.error('List inventory error:', err);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  } finally {
    client.release();
  }
}

module.exports = { listInventory };