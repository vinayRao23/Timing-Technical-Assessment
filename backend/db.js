const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER || 'vinay23',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'job_tracker_db',
  password: process.env.PGPASSWORD || '',
  port: process.env.PGPORT || 5432,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
