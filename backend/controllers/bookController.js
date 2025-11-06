const pool = require('../config/db');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM books');
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// @desc    Create a book
// @route   POST /api/books
// @access  Public
exports.createBook = async (req, res, next) => {
  const { title, author, description, published_year, publisher } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO books (title, author, description, published_year, publisher) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, author, description, published_year, publisher]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// @desc    Get a single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Public
exports.updateBook = async (req, res, next) => {
  const { id } = req.params;
  const { title, author, description, published_year, publisher } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE books SET title = $1, author = $2, description = $3, published_year = $4, publisher = $5 WHERE id = $6 RETURNING *',
      [title, author, description, published_year, publisher, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Public
exports.deleteBook = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};