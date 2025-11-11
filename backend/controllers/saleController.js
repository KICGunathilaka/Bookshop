const pool = require('../config/db');

// Create a sale with items
async function addSale(req, res) {
  const client = await pool.connect();
  try {
    const {
      invoiceNo = null,
      saleDate = null, // YYYY-MM-DD
      customerName = null,
      customerPhone = null,
      customerAddress = null,
      note = null,
      items = [], // [{ inventoryId, quantity, unitPrice, brand }]
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Basic validation
    for (const [idx, item] of items.entries()) {
      const { inventoryId, quantity, unitPrice } = item || {};
      if (!inventoryId || !Number.isInteger(Number(inventoryId)) || Number(inventoryId) <= 0) {
        return res.status(400).json({ error: `Invalid inventoryId for item ${idx + 1}` });
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

    // Insert into sales
    const saleRes = await client.query(
      `INSERT INTO sales (invoice_no, sale_date, total_amount, customer_name, customer_phone, customer_address, note)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7)
       RETURNING sale_id, invoice_no, sale_date, total_amount, customer_name, customer_phone, customer_address, note, created_at`,
      [invoiceNo, saleDate, totalAmount, customerName, customerPhone, customerAddress, note]
    );

    const sale = saleRes.rows[0];

    // Validate stock availability atomically before inserting sale_items
    const requestedByInventory = new Map();
    for (const it of items) {
      const invId = Number(it.inventoryId);
      const qty = Number(it.quantity);
      requestedByInventory.set(invId, (requestedByInventory.get(invId) ?? 0) + qty);
    }

    // Lock inventory rows and verify sufficient stock
    for (const [invId, totalQty] of requestedByInventory.entries()) {
      const lockRes = await client.query(
        `SELECT stock_quantity FROM inventory_items WHERE inventory_id = $1 FOR UPDATE`,
        [invId]
      );
      if (lockRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Inventory item ${invId} not found` });
      }
      const available = Number(lockRes.rows[0].stock_quantity);
      if (available < totalQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for inventory ${invId}. Requested ${totalQty}, available ${available}.`,
        });
      }
    }

    // Insert each sale item (stock is decremented via DB trigger on sale_items)
    for (const it of items) {
      const invId = Number(it.inventoryId);
      const qty = Number(it.quantity);
      const price = Number(it.unitPrice);
      await client.query(
        `INSERT INTO sale_items (sale_id, inventory_id, quantity, unit_price, brand)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.sale_id, invId, qty, price, it.brand ?? null]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Sale created',
      sale,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add sale error:', err);
    return res.status(500).json({ error: 'Failed to create sale' });
  } finally {
    client.release();
  }
}

// List sales with aggregated items and basic filters
async function listSales(req, res) {
  const client = await pool.connect();
  try {
    const { q = '', from = null, to = null, limit = 100 } = req.query;
    const values = [];
    let where = 'WHERE 1=1';
    if (q && String(q).trim().length > 0) {
      values.push(`%${String(q).trim()}%`);
      where += ` AND (s.invoice_no ILIKE $${values.length} OR s.customer_name ILIKE $${values.length})`;
    }
    if (from) {
      values.push(String(from));
      where += ` AND s.sale_date >= $${values.length}::date`;
    }
    if (to) {
      values.push(String(to));
      where += ` AND s.sale_date <= $${values.length}::date`;
    }
    values.push(Number(limit));

    const sql = `
      SELECT
        s.sale_id,
        s.invoice_no,
        s.sale_date,
        s.total_amount,
        s.customer_name,
        s.customer_phone,
        s.customer_address,
        s.note,
        COALESCE(
          (
            SELECT json_agg(row_to_json(it))
            FROM (
              SELECT
                si.quantity,
                si.unit_price,
                si.brand,
                pr.product_id,
                pr.product_name
              FROM sale_items si
              JOIN inventory_items ii ON ii.inventory_id = si.inventory_id
              JOIN products pr ON pr.product_id = ii.product_id
              WHERE si.sale_id = s.sale_id
            ) it
          ), '[]'::json
        ) AS items
      FROM sales s
      ${where}
      ORDER BY s.sale_date DESC, s.sale_id DESC
      LIMIT $${values.length}
    `;

    const result = await client.query(sql, values);
    return res.json({ sales: result.rows });
  } catch (err) {
    console.error('List sales error:', err);
    return res.status(500).json({ error: 'Failed to list sales' });
  } finally {
    client.release();
  }
}

module.exports = { addSale, listSales };
// Suggest next invoice number based on existing numeric invoice_no values
async function getNextInvoiceNo(req, res) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT MAX(CASE WHEN invoice_no ~ '^[0-9]+' THEN invoice_no::int ELSE NULL END) AS max_no FROM sales`
    );
    const maxNo = result.rows[0]?.max_no ?? 0;
    const nextNo = Number(maxNo) + 1;
    return res.json({ nextInvoiceNo: String(nextNo) });
  } catch (err) {
    console.error('Get next sales invoice no error:', err);
    return res.status(500).json({ error: 'Failed to compute next sales invoice number' });
  } finally {
    client.release();
  }
}

module.exports.getNextInvoiceNo = getNextInvoiceNo;