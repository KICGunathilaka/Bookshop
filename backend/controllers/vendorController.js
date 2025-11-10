const pool = require('../config/db');

// Add a new vendor to the vendors table
async function addVendor(req, res) {
  try {
    const {
      vendor_name,
      contact_number = null,
      email = null,
      address = null,
    } = req.body;

    if (!vendor_name || typeof vendor_name !== 'string') {
      return res.status(400).json({ error: 'vendor_name is required' });
    }

    const result = await pool.query(
      `INSERT INTO vendors (vendor_name, contact_number, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING vendor_id, created_at`,
      [vendor_name, contact_number, email, address]
    );

    const row = result.rows[0];
    return res.status(201).json({
      message: 'Vendor created',
      vendor: {
        vendor_id: row.vendor_id,
        vendor_name,
        contact_number,
        email,
        address,
        created_at: row.created_at,
      },
    });
  } catch (err) {
    console.error('Add vendor error:', err);
    return res.status(500).json({ error: 'Failed to create vendor' });
  }
}

// List vendors with optional query and date filters
async function listVendors(req, res) {
  try {
    const { q, from_date, to_date } = req.query;
    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      where.push(
        `(vendor_name ILIKE $${params.length} OR contact_number ILIKE $${params.length} OR email ILIKE $${params.length})`
      );
    }

    // Date range filters on created_at (YYYY-MM-DD)
    if (from_date) {
      params.push(from_date);
      where.push(`DATE(created_at) >= $${params.length}::date`);
    }
    if (to_date) {
      params.push(to_date);
      where.push(`DATE(created_at) <= $${params.length}::date`);
    }

    const sql = `SELECT vendor_id, vendor_name, contact_number, email, address, created_at
                 FROM vendors
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY vendor_id DESC
                 LIMIT 200`;
    const result = await pool.query(sql, params);
    return res.json({ items: result.rows });
  } catch (err) {
    console.error('List vendors error:', err);
    return res.status(500).json({ error: 'Failed to fetch vendors' });
  }
}

module.exports = { addVendor, listVendors };