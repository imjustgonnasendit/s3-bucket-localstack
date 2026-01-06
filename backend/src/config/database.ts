import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Force TCP connection by using 127.0.0.1 instead of 'localhost'
// This prevents pg from using Unix sockets on macOS
const pool = new Pool({
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dragdrop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export default pool;
