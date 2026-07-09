import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';

export async function getGoals(profileId, year) {
  const [rows] = await pool.query(
    'SELECT period, target_amount FROM goals WHERE profile_id = ? AND year = ?',
    [profileId, year]
  );
  return {
    monthly: rows.find((r) => r.period === 'monthly')?.target_amount ?? null,
    annual: rows.find((r) => r.period === 'annual')?.target_amount ?? null,
  };
}

export async function upsertGoal(profileId, { period, year, target_amount }) {
  if (!['monthly', 'annual'].includes(period)) throw new HttpError(400, 'Period must be monthly or annual');
  const target = Number(target_amount);
  if (!Number.isFinite(target) || target < 0) throw new HttpError(400, 'Target must be a non-negative number');
  await pool.query(
    `INSERT INTO goals (profile_id, period, year, target_amount)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)`,
    [profileId, period, Number(year), target]
  );
  return getGoals(profileId, Number(year));
}
