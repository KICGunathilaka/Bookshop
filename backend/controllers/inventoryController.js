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

// Consume inventory items for printshop without recording a sale
// POST /api/inventory/consume
// Body: { items: [{ inventoryId, quantity, unitPrice?: number }], note?: string }
async function consumeInventory(req, res) {
  const client = await pool.connect();
  try {
    const { items = [], note = null } = req.body || {};
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
      if (unitPrice !== undefined && (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) <= 0)) {
        return res.status(400).json({ error: `Invalid unitPrice for item ${idx + 1}` });
      }
    }

    await client.query('BEGIN');

    // Aggregate quantities by inventoryId
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

    // For each line: insert into printshop_items and let trigger decrement stock
    for (const it of items) {
      const invId = Number(it.inventoryId);
      const qty = Number(it.quantity);
      // Fetch inventory details to capture product and brand, and default price if not provided
      const invRes = await client.query(
        `SELECT ii.brand, ii.selling_price, ii.purchase_price, ii.product_id
         FROM inventory_items ii WHERE ii.inventory_id = $1 FOR UPDATE`,
        [invId]
      );
      if (invRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Inventory item ${invId} not found` });
      }
      const inv = invRes.rows[0];
      const price = it.unitPrice !== undefined && it.unitPrice !== null && Number(it.unitPrice) > 0
        ? Number(it.unitPrice)
        : Number(inv.selling_price ?? inv.purchase_price ?? 0);
      if (!Number.isFinite(price) || price <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Missing or invalid unit price for inventory ${invId}` });
      }

      await client.query(
        `INSERT INTO printshop_items (inventory_id, product_id, brand, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [invId, Number(inv.product_id), inv.brand ?? null, qty, price]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({ message: 'Printshop consumption recorded', note: note || null, items: items.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Consume inventory error:', err);
    return res.status(500).json({ error: 'Failed to consume inventory' });
  } finally {
    client.release();
  }
}

module.exports.consumeInventory = consumeInventory;