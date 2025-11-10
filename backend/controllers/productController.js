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
    const { q, category, brand, min_price, max_price } = req.query;

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