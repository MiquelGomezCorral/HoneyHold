import { pool } from '../db/pool.js';
import type { RowDataPacket } from 'mysql2';

interface TagRow extends RowDataPacket {
  id: number;
  name: string;
  profile_id: number | null;
}

export async function listTags(profileId: number) {
  const [rows] = await pool.query<TagRow[]>(
    `SELECT id, name, profile_id
       FROM tags
      WHERE profile_id IS NULL OR profile_id = ?
      ORDER BY name`,
    [profileId]
  );
  return rows;
}

export async function resolveTagId(profileId: number, name: string | null | undefined): Promise<number | null> {
  const clean = (name || '').trim();
  if (!clean) return null;

  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tags
      WHERE name = ? AND (profile_id IS NULL OR profile_id = ?)
      ORDER BY profile_id IS NULL DESC
      LIMIT 1`,
    [clean, profileId]
  );
  if (existing.length) return existing[0].id;

  const [result] = await pool.query<import('mysql2').ResultSetHeader>(
    'INSERT INTO tags (profile_id, name) VALUES (?, ?)',
    [profileId, clean]
  );
  return result.insertId;
}
