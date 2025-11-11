const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const result = await pool.query('SELECT user_id, username, password_hash FROM users WHERE username=$1', [username]);
    if (!result.rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];

    // Allow passwordless login when explicitly enabled via environment flag
    const allowPasswordless = String(process.env.ALLOW_PASSWORDLESS_LOGIN || '').toLowerCase() === 'true';
    if (!allowPasswordless) {
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    res.json({ message: 'Login successful', user: { user_id: user.user_id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};