import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import type { RowDataPacket } from 'mysql2';

interface ProfileRow extends RowDataPacket {
  id: number;
  slug: string;
  display_name: string;
}

interface AccountRow extends RowDataPacket {
  id: number;
  name: string;
  kind: string;
  initial_balance: string;
}

export async function listProfiles() {
  const [rows] = await pool.query<ProfileRow[]>(
    'SELECT id, slug, display_name FROM profiles ORDER BY id'
  );
  return rows;
}

export async function listAccounts(profileId: number) {
  const [rows] = await pool.query<AccountRow[]>(
    `SELECT id, name, kind, initial_balance
       FROM accounts
      WHERE profile_id = ? AND is_active = 1
      ORDER BY name`,
    [profileId]
  );
  return rows;
}

export async function accountInProfile(accountId: number, profileId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, profile_id FROM accounts WHERE id = ? AND profile_id = ? AND is_active = 1',
    [accountId, profileId]
  );
  if (!rows.length) throw new HttpError(400, 'Account does not belong to this profile');
  return rows[0];
}

export async function accountById(accountId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, profile_id FROM accounts WHERE id = ? AND is_active = 1',
    [accountId]
  );
  if (!rows.length) throw new HttpError(400, 'Unknown account');
  return rows[0];
}
