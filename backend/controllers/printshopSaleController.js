const pool = require('../config/db');

// Create a printshop sale.
// If `items` are provided, inserts into printshop_sale_items and decrements stock via DB trigger.
// If no `items`, records a service-only sale using provided `totalAmount`.
async function addPrintshopSale(req, res) {
  const client = await pool.connect();
  try {
    const {
      invoiceNo = null,
      saleDate = null, // YYYY-MM-DD
      customerName = null,
      customerPhone = null,
      customerAddress = null,
      note = null, // remark / description
      totalAmount = null, // required when items are not provided
      items = [], // optional: [{ inventoryId, quantity, unitPrice, brand }]
    } = req.body;

    // If items provided, validate them; otherwise require a valid totalAmount
    const hasItems = Array.isArray(items) && items.length > 0;

    if (!hasItems) {
      if (!Number.isFinite(Number(totalAmount)) || Number(totalAmount) <= 0) {
        return res.status(400).json({ error: 'Invalid totalAmount' });
      }
      // Service-only sale path
      const saleRes = await client.query(
        `INSERT INTO printshop_sales (invoice_no, sale_date, total_amount, customer_name, customer_phone, customer_address, note)
         VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7)
         RETURNING printshop_sale_id, invoice_no, sale_date, total_amount, customer_name, customer_phone, customer_address, note, created_at`,
        [invoiceNo, saleDate, Number(totalAmount), customerName, customerPhone, customerAddress, note]
      );
      const sale = saleRes.rows[0];
      return res.status(201).json({ message: 'Printshop service sale created', sale });
    }

    // Itemized sale path: validate items first
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

    // Compute total from items
    const computedTotal = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);

    // Insert header
    const saleRes = await client.query(
      `INSERT INTO printshop_sales (invoice_no, sale_date, total_amount, customer_name, customer_phone, customer_address, note)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7)
       RETURNING printshop_sale_id, invoice_no, sale_date, total_amount, customer_name, customer_phone, customer_address, note, created_at`,
      [invoiceNo, saleDate, computedTotal, customerName, customerPhone, customerAddress, note]
    );

    const sale = saleRes.rows[0];

    // Validate stock availability atomically before inserting items
    const requestedByInventory = new Map();
    for (const it of items) {
      const invId = Number(it.inventoryId);
      const qty = Number(it.quantity);
      requestedByInventory.set(invId, (requestedByInventory.get(invId) ?? 0) + qty);
    }

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

    // Insert each printshop sale item (stock is decremented via DB trigger on printshop_sale_items)
    for (const it of items) {
      const invId = Number(it.inventoryId);
      const qty = Number(it.quantity);
      const price = Number(it.unitPrice);
      await client.query(
        `INSERT INTO printshop_sale_items (printshop_sale_id, inventory_id, quantity, unit_price, brand)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.printshop_sale_id, invId, qty, price, it.brand ?? null]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({ message: 'Printshop sale created', sale });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add printshop sale error:', err);
    return res.status(500).json({ error: 'Failed to create printshop sale' });
  } finally {
    client.release();
  }
}

// Suggest next invoice number for printshop sales
async function getNextInvoiceNo(req, res) {
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT invoice_no FROM printshop_sales WHERE invoice_no IS NOT NULL ORDER BY printshop_sale_id DESC LIMIT 1`);
    let nextInvoiceNo = 'PS-0001';
    if (r.rowCount > 0 && r.rows[0].invoice_no) {
      const last = String(r.rows[0].invoice_no);
      const match = last.match(/^(PS-)?(\d{4,})$/);
      if (match) {
        const n = String(Number(match[2]) + 1).padStart(match[2].length, '0');
        nextInvoiceNo = `PS-${n}`;
      }
    }
    return res.json({ nextInvoiceNo });
  } catch (err) {
    console.error('Next invoice error:', err);
    return res.status(500).json({ error: 'Failed to compute next invoice' });
  } finally {
    client.release();
  }
}

// List printshop sales
async function listPrintshopSales(req, res) {
  const client = await pool.connect();
  try {
    const { q = '', from = null, to = null, limit = 100 } = req.query;
    const values = [];
    let where = 'WHERE 1=1';
    if (q && String(q).trim().length > 0) {
      values.push(`%${String(q).trim()}%`);
      where += ` AND (ps.invoice_no ILIKE $${values.length} OR ps.customer_name ILIKE $${values.length})`;
    }
    if (from) {
      values.push(String(from));
      where += ` AND ps.sale_date >= $${values.length}::date`;
    }
    if (to) {
      values.push(String(to));
      where += ` AND ps.sale_date <= $${values.length}::date`;
    }
    values.push(Number(limit));

    const sql = `
      SELECT
        ps.printshop_sale_id,
        ps.invoice_no,
        ps.sale_date,
        ps.total_amount,
        ps.customer_name,
        ps.customer_phone,
        ps.customer_address,
        ps.note,
        COALESCE(
          (
            SELECT json_agg(row_to_json(it))
            FROM (
              SELECT
                psi.quantity,
                psi.unit_price,
                psi.brand,
                pr.product_id,
                pr.product_name
              FROM printshop_sale_items psi
              JOIN inventory_items ii ON ii.inventory_id = psi.inventory_id
              JOIN products pr ON pr.product_id = ii.product_id
              WHERE psi.printshop_sale_id = ps.printshop_sale_id
            ) it
          ), '[]'::json
        ) AS items
      FROM printshop_sales ps
      ${where}
      ORDER BY ps.sale_date DESC, ps.printshop_sale_id DESC
      LIMIT $${values.length}
    `;

    const result = await client.query(sql, values);
    return res.json({ sales: result.rows });
  } catch (err) {
    console.error('List printshop sales error:', err);
    return res.status(500).json({ error: 'Failed to list printshop sales' });
  } finally {
    client.release();
  }
}

module.exports = { addPrintshopSale, getNextInvoiceNo, listPrintshopSales };