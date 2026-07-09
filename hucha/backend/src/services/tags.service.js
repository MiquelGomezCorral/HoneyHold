import { pool } from '../db/pool.js';

// Global tags (profile_id NULL) plus the profile's own tags.
export async function listTags(profileId) {
  const [rows] = await pool.query(
    `SELECT id, name, profile_id
       FROM tags
      WHERE profile_id IS NULL OR profile_id = ?
      ORDER BY name`,
    [profileId]
  );
  return rows;
}

// The UI sends tags as free text; reuse an existing tag or create a profile one.
export async function resolveTagId(profileId, name) {
  const clean = (name || '').trim();
  if (!clean) return null;

  const [existing] = await pool.query(
    `SELECT id FROM tags
      WHERE name = ? AND (profile_id IS NULL OR profile_id = ?)
      ORDER BY profile_id IS NULL DESC
      LIMIT 1`,
    [clean, profileId]
  );
  if (existing.length) return existing[0].id;

  const [result] = await pool.query(
    'INSERT INTO tags (profile_id, name) VALUES (?, ?)',
    [profileId, clean]
  );
  return result.insertId;
}
