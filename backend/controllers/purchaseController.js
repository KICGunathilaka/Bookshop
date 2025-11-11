const pool = require('../config/db');

// Create a purchase with items
async function addPurchase(req, res) {
  const client = await pool.connect();
  try {
    const {
      vendorId = null,
      invoiceNo = null,
      purchaseDate = null, // YYYY-MM-DD
      note = null,
      items = [], // [{ productId, quantity, unitPrice }]
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Basic validation
    for (const [idx, item] of items.entries()) {
      const { productId, quantity, unitPrice } = item || {};
      if (!productId || !Number.isInteger(Number(productId)) || Number(productId) <= 0) {
        return res.status(400).json({ error: `Invalid productId for item ${idx + 1}` });
      }
      if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({ error: `Invalid quantity for item ${idx + 1}` });
      }
      if (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) <= 0) {
        return res.status(400).json({ error: `Invalid unitPrice for item ${idx + 1}` });
      }
    }

    await client.query('BEGIN');

    // Compute total amount from items
    const totalAmount = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);

    // Insert into purchases
    const purchaseRes = await client.query(
      `INSERT INTO purchases (vendor_id, invoice_no, purchase_date, total_amount, note)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5)
       RETURNING purchase_id, vendor_id, invoice_no, purchase_date, total_amount, note, created_at`,
      [vendorId, invoiceNo, purchaseDate, totalAmount, note]
    );

    const purchase = purchaseRes.rows[0];

    // Helper: find or create inventory item for product/vendor
    async function ensureInventoryItem(productId, vendorIdForInventory, brand, unitPrice) {
      const findRes = await client.query(
        `SELECT inventory_id FROM inventory_items WHERE product_id = $1 AND vendor_id IS NOT DISTINCT FROM $2 AND brand IS NOT DISTINCT FROM $3 LIMIT 1`,
        [productId, vendorIdForInventory, brand || null]
      );
      if (findRes.rowCount > 0) {
        return findRes.rows[0].inventory_id;
      }
      const insertRes = await client.query(
        `INSERT INTO inventory_items (product_id, vendor_id, brand, purchase_price, stock_quantity)
         VALUES ($1, $2, $3, $4, 0)
         RETURNING inventory_id`,
        [productId, vendorIdForInventory, brand || null, Number(unitPrice)]
      );
      return insertRes.rows[0].inventory_id;
    }

    // Insert each purchase item
    for (const it of items) {
      const inventoryId = await ensureInventoryItem(Number(it.productId), vendorId, it.brand ?? null, Number(it.unitPrice));
      await client.query(
        `INSERT INTO purchase_items (purchase_id, inventory_id, quantity, unit_price, brand)
         VALUES ($1, $2, $3, $4, $5)`,
        [purchase.purchase_id, inventoryId, Number(it.quantity), Number(it.unitPrice), it.brand ?? null]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Purchase created',
      purchase,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add purchase error:', err);
    return res.status(500).json({ error: 'Failed to create purchase' });
  } finally {
    client.release();
  }
}

// Suggest next invoice number based on existing numeric invoice_no values
async function getNextInvoiceNo(req, res) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT MAX(CASE WHEN invoice_no ~ '^[0-9]+' THEN invoice_no::int ELSE NULL END) AS max_no FROM purchases`
    );
    const maxNo = result.rows[0]?.max_no ?? 0;
    const nextNo = Number(maxNo) + 1;
    return res.json({ nextInvoiceNo: String(nextNo) });
  } catch (err) {
    console.error('Get next invoice no error:', err);
    return res.status(500).json({ error: 'Failed to compute next invoice number' });
  } finally {
    client.release();
  }
}

// List purchases with aggregated items and basic filters
async function listPurchases(req, res) {
  const client = await pool.connect();
  try {
    console.log('[listPurchases] query params:', req.query);
    const { q = '', vendorId = null, from = null, to = null, limit = 100 } = req.query;
    const values = [];
    let where = 'WHERE 1=1';
    if (q && String(q).trim().length > 0) {
      values.push(`%${String(q).trim()}%`);
      where += ` AND (p.invoice_no ILIKE $${values.length})`;
    }
    if (vendorId) {
      values.push(Number(vendorId));
      where += ` AND p.vendor_id = $${values.length}`;
    }
    if (from) {
      values.push(String(from));
      where += ` AND p.purchase_date >= $${values.length}::date`;
    }
    if (to) {
      values.push(String(to));
      where += ` AND p.purchase_date <= $${values.length}::date`;
    }
    values.push(Number(limit));

    const sql = `
      SELECT
        p.purchase_id,
        p.invoice_no,
        p.purchase_date,
        p.total_amount,
        v.vendor_name,
        COALESCE(
          (
            SELECT json_agg(row_to_json(it))
            FROM (
              SELECT
                pi.quantity,
                pi.unit_price,
                pi.total_price,
                pi.brand,
                pr.product_id,
                pr.product_name
              FROM purchase_items pi
              JOIN inventory_items ii ON ii.inventory_id = pi.inventory_id
              JOIN products pr ON pr.product_id = ii.product_id
              WHERE pi.purchase_id = p.purchase_id
            ) it
          ), '[]'::json
        ) AS items
      FROM purchases p
      LEFT JOIN vendors v ON v.vendor_id = p.vendor_id
      ${where}
      ORDER BY p.purchase_date DESC, p.purchase_id DESC
      LIMIT $${values.length}
    `;

    const result = await client.query(sql, values);
    console.log(`[listPurchases] rows: ${result.rowCount}`);
    return res.json({ purchases: result.rows });
  } catch (err) {
    console.error('List purchases error:', err);
    return res.status(500).json({ error: 'Failed to list purchases' });
  } finally {
    client.release();
  }
}

module.exports = { addPurchase, getNextInvoiceNo, listPurchases };