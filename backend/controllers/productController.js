const pool = require('../config/db');

// Add a new product to the products table
async function addProduct(req, res) {
  try {
    const {
      product_name,
      category = null,
      brand = null,
      unit = 'pcs',
      purchase_price = 0,
      selling_price = 0,
      stock_quantity = 0,
    } = req.body;

    if (!product_name || typeof product_name !== 'string') {
      return res.status(400).json({ error: 'product_name is required' });
    }

    const purchase = Number(purchase_price);
    const selling = Number(selling_price);
    const stock = Number(stock_quantity);

    const result = await pool.query(
      `INSERT INTO products (
        product_name, category, brand, unit,
        purchase_price, selling_price, stock_quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING product_id`,
      [product_name, category, brand, unit, purchase, selling, stock]
    );

    const product_id = result.rows[0].product_id;
    return res.status(201).json({
      message: 'Product created',
      product: {
        product_id,
        product_name,
        category,
        brand,
        unit,
        purchase_price: purchase,
        selling_price: selling,
        stock_quantity: stock,
      },
    });
  } catch (err) {
    console.error('Add product error:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
}

module.exports = { addProduct };

// List products with optional filters
async function listProducts(req, res) {
  try {
    const { q, category, brand, min_price, max_price, from_date, to_date } = req.query;

    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      where.push(`(product_name ILIKE $${params.length} OR category ILIKE $${params.length} OR brand ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    if (brand) {
      params.push(brand);
      where.push(`brand = $${params.length}`);
    }
    if (min_price) {
      params.push(Number(min_price));
      where.push(`selling_price >= $${params.length}`);
    }
    if (max_price) {
      params.push(Number(max_price));
      where.push(`selling_price <= $${params.length}`);
    }

    // Date range filters on created_at
    // Expecting ISO date strings like YYYY-MM-DD
    if (from_date) {
      params.push(from_date);
      where.push(`DATE(created_at) >= $${params.length}::date`);
    }
    if (to_date) {
      params.push(to_date);
      where.push(`DATE(created_at) <= $${params.length}::date`);
    }

    const sql = `SELECT product_id, product_name, category, brand, unit, purchase_price, selling_price, stock_quantity, created_at
                 FROM products
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY product_id DESC
                 LIMIT 200`;

    const result = await pool.query(sql, params);
    return res.json({ items: result.rows });
  } catch (err) {
    console.error('List products error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}

module.exports.listProducts = listProducts;

// Update a product by ID
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const productId = Number(id);
    if (!productId || !Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const {
      product_name,
      category,
      brand,
      unit,
      purchase_price,
      selling_price,
      stock_quantity,
    } = req.body;

    const sets = [];
    const params = [];

    function pushSet(field, value) {
      params.push(value);
      sets.push(`${field} = $${params.length}`);
    }

    if (typeof product_name === 'string') pushSet('product_name', product_name);
    if (category !== undefined) pushSet('category', category);
    if (brand !== undefined) pushSet('brand', brand);
    if (typeof unit === 'string') pushSet('unit', unit);
    if (purchase_price !== undefined) pushSet('purchase_price', Number(purchase_price));
    if (selling_price !== undefined) pushSet('selling_price', Number(selling_price));
    if (stock_quantity !== undefined) pushSet('stock_quantity', Number(stock_quantity));

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // WHERE id param
    params.push(productId);
    const sql = `UPDATE products SET ${sets.join(', ')} WHERE product_id = $${params.length} RETURNING product_id`;
    const result = await pool.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Return updated product snapshot
    const productRes = await pool.query(
      `SELECT product_id, product_name, category, brand, unit, purchase_price, selling_price, stock_quantity, created_at
       FROM products WHERE product_id = $1`,
      [productId]
    );

    return res.json({
      message: 'Product updated',
      product: productRes.rows[0],
    });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
}

module.exports.updateProduct = updateProduct;