const bcrypt = require("bcryptjs");
const pool = require("./config/db");

(async () => {
  const username = "Admin";
  const email = "admin@example.com";
  const plain = "Admin123";

  try {
    const existing = await pool.query('SELECT user_id FROM users WHERE username=$1', [username]);
    if (existing.rows.length) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    const hash = await bcrypt.hash(plain, 10);
    await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)', [username, email, hash]);
    console.log('Admin user created');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
})();
