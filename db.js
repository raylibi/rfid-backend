const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'tramway.proxy.rlwy.net',
  database: 'railway',
  password: 'bTZAKgTKdUPjjoBQzGyYVIUQoQMVqWCb',
  port: 36670, 
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
