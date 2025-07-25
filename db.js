const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'postgres.railway.internal',
  database: 'railway',
  password: 'bTZAKgTKdUPjjoBQzGyYVIUQoQMVqWCb',
  port: 5432, 
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
