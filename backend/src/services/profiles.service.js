import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';

export async function listProfiles() {
  const [rows] = await pool.query(
    'SELECT id, slug, display_name FROM profiles ORDER BY id'
  );
  return rows;
}

export async function listAccounts(profileId) {
  const [rows] = await pool.query(
    `SELECT id, name, kind, initial_balance
       FROM accounts
      WHERE profile_id = ? AND is_active = 1
      ORDER BY name`,
    [profileId]
  );
  return rows;
}

// Returns the account row iff it belongs to the profile — used to validate writes.
export async function accountInProfile(accountId, profileId) {
  const [rows] = await pool.query(
    'SELECT id, profile_id FROM accounts WHERE id = ? AND profile_id = ? AND is_active = 1',
    [accountId, profileId]
  );
  if (!rows.length) throw new HttpError(400, 'Account does not belong to this profile');
  return rows[0];
}

export async function accountById(accountId) {
  const [rows] = await pool.query(
    'SELECT id, profile_id FROM accounts WHERE id = ? AND is_active = 1',
    [accountId]
  );
  if (!rows.length) throw new HttpError(400, 'Unknown account');
  return rows[0];
}
