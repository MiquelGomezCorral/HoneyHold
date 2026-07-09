import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

// Lazy pool: no connection is opened until the first query runs,
// so the API boots even while MySQL is still warming up.
export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL → number
  dateStrings: true,    // DATE/DATETIME → 'YYYY-MM-DD…' strings (JSON-safe)
});
