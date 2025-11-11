const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const pool = require('./config/db');

async function run() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  console.log(`Running ${files.length} migration(s)...`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const file of files) {
      const p = path.join(dir, file);
      const sql = fs.readFileSync(p, 'utf8');
      console.log(`Applying: ${file}`);
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('Migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

run();