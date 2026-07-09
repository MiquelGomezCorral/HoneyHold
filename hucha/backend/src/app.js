import express from 'express';
import cors from 'cors';
import api from './routes/index.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { pool } from './db/pool.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  let db = false;
  try {
    await pool.query('SELECT 1');
    db = true;
  } catch {
    // db not reachable yet — report it, don't crash
  }
  res.json({ ok: true, db });
});

app.use('/api', api);
app.use(notFound);
app.use(errorHandler);
