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
  profile_id: number;
  profile_name: string;
}

export async function listProfiles() {
  const [rows] = await pool.query<ProfileRow[]>(
    'SELECT id, slug, display_name FROM profiles ORDER BY id'
  );
  return rows;
}

export async function listAccounts(profileId: number, includeCross = false) {
  if (includeCross) {
    const [rows] = await pool.query<AccountRow[]>(
      `SELECT a.id, a.name, a.kind, a.initial_balance,
              a.profile_id, p.display_name AS profile_name
         FROM accounts a
         JOIN profiles p ON p.id = a.profile_id
        WHERE a.is_active = 1
        ORDER BY a.profile_id <> ?, p.display_name, a.name`,
      [profileId]
    );
    return rows;
  }

  const [rows] = await pool.query<AccountRow[]>(
    `SELECT a.id, a.name, a.kind, a.initial_balance,
            a.profile_id, p.display_name AS profile_name
       FROM accounts a
       JOIN profiles p ON p.id = a.profile_id
      WHERE a.profile_id = ? AND a.is_active = 1
      ORDER BY a.name`,
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
