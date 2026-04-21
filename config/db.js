// ─────────────────────────────────────────────────────────────
// PostgreSQL Connection Pool
// ─────────────────────────────────────────────────────────────
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'firstfly_dashboard',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,                    // max pool size
  idleTimeoutMillis: 30000,   // close idle clients after 30s
  connectionTimeoutMillis: 5000,
});

// Log connection status
pool.on('connect', () => {
  console.log('📗  PostgreSQL client connected');
});

pool.on('error', (err) => {
  console.error('📕  PostgreSQL pool error:', err.message);
});

/**
 * Convenience query wrapper.
 * Usage: const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
