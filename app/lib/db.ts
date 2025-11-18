import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ASzfsdpoXmeHSmrovzuRAEdLgrryeKIB@metro.proxy.rlwy.net:59255/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
