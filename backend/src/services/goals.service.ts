import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface GoalRow extends RowDataPacket {
  period: string;
  target_amount: number;
}

export async function getGoals(profileId: number, year: number) {
  const [rows] = await pool.query<GoalRow[]>(
    'SELECT period, target_amount FROM goals WHERE profile_id = ? AND year = ?',
    [profileId, year]
  );
  return {
    monthly: rows.find((r) => r.period === 'monthly')?.target_amount ?? null,
    annual: rows.find((r) => r.period === 'annual')?.target_amount ?? null,
  };
}

export async function upsertGoal(profileId: number, body: { period?: string; year?: number; target_amount?: unknown }) {
  const { period, year, target_amount } = body;
  if (!['monthly', 'annual'].includes(period || '')) throw new HttpError(400, 'Period must be monthly or annual');
  const target = Number(target_amount);
  if (!Number.isFinite(target) || target < 0) throw new HttpError(400, 'Target must be a non-negative number');
  await pool.query<ResultSetHeader>(
    `INSERT INTO goals (profile_id, period, year, target_amount)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)`,
    [profileId, period, Number(year), target]
  );
  return getGoals(profileId, Number(year));
}
