// ─────────────────────────────────────────────────────────────
// Database Setup Script — runs schema.sql then seed.sql
// Usage:  npm run setup-db
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'firstfly_dashboard',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  const client = await pool.connect();

  try {
    // 1. Run schema
    console.log('📦  Running schema.sql …');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅  Schema created.\n');

    // 2. Generate fresh bcrypt hash for the default admin
    const plainPassword = 'FirstFly@2026';
    const hash = await bcrypt.hash(plainPassword, 12);
    console.log(`🔑  Admin password hash generated (12 rounds)`);

    // 3. Read seed SQL and replace placeholder hash with fresh one
    let seed = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
    // Replace the placeholder hash in seed.sql with the real one
    seed = seed.replace(
      /\$2a\$12\$[A-Za-z0-9./]{53}/,
      hash
    );

    console.log('🌱  Running seed.sql …');
    await client.query(seed);
    console.log('✅  Seed data inserted.\n');

    // 3. Output summary
    console.log('═══════════════════════════════════════════');
    console.log('  Database setup complete!');
    console.log('  Schema & Admin account initialized.');
    console.log('  Default admin: admin@firstfly.in');
    console.log('  Password:      FirstFly@2026');
    console.log('═══════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌  Setup failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
