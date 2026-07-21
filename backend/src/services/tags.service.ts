import { pool } from '../db/pool.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { HttpError } from '../middleware/errors.js';
import { FALLBACK_TAG, PROTECTED_ONES } from '../config/tags.js';

interface TagRow extends RowDataPacket {
  id: number;
  name: string;
  profile_id: number | null;
  usage_count: number;
}

function cleanName(name: unknown) {
  if (typeof name !== 'string') throw new HttpError(400, 'Tag name is required');
  const clean = name.trim();
  if (!clean) throw new HttpError(400, 'Tag name is required');
  if (clean.length > 255) throw new HttpError(400, 'Tag name is too long');
  return clean;
}

function protectedTag(tag: Pick<TagRow, 'name' | 'profile_id'>) {
  return tag.profile_id === null && PROTECTED_ONES.includes(tag.name);
}

function validTagId(tagId: number) {
  if (!Number.isInteger(tagId) || tagId <= 0) throw new HttpError(400, 'Invalid tag id');
}

async function tagById(conn: typeof pool | PoolConnection, profileId: number, tagId: number) {
  const [rows] = await conn.query<TagRow[]>(
    `SELECT id, name, profile_id
       FROM tags
       WHERE id = ? AND (profile_id IS NULL OR profile_id = ?)
       LIMIT 1`,
    [tagId, profileId]
  );
  if (!rows.length) throw new HttpError(404, 'Tag not found');
  return rows[0];
}

export async function listTags(profileId: number) {
  const [rows] = await pool.query<TagRow[]>(
    `SELECT id, name, profile_id,
            (SELECT COUNT(*) FROM transactions WHERE tag_id = tags.id)
            + (SELECT COUNT(*) FROM recurring_rules WHERE tag_id = tags.id)
            + (SELECT COUNT(*) FROM transfers WHERE tag_id = tags.id) AS usage_count
      FROM tags
      WHERE profile_id IS NULL OR profile_id = ?
      ORDER BY name`,
    [profileId]
  );
  return rows.map((tag) => ({
    ...tag,
    protected: protectedTag(tag),
  }));
}

export async function ensureProtectedTags() {
  for (const name of PROTECTED_ONES) {
    await pool.query(
      `INSERT INTO tags (profile_id, name)
       SELECT NULL, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM tags WHERE profile_id IS NULL AND name = ?
       )`,
      [name, name]
    );
  }
}

export async function createTag(name: unknown) {
  const clean = cleanName(name);
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM tags WHERE name = ? LIMIT 1',
    [clean]
  );
  if (existing.length) throw new HttpError(409, 'A tag with that name already exists');

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO tags (profile_id, name) VALUES (NULL, ?)',
    [clean]
  );
  return { id: result.insertId, name: clean };
}

export async function renameTag(profileId: number, tagId: number, name: unknown) {
  validTagId(tagId);
  const clean = cleanName(name);
  const tag = await tagById(pool, profileId, tagId);
  if (protectedTag(tag)) throw new HttpError(400, 'This tag cannot be renamed');

  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tags
       WHERE id <> ? AND name = ?
       LIMIT 1`,
    [tagId, clean]
  );
  if (existing.length) throw new HttpError(409, 'A tag with that name already exists');

  await pool.query('UPDATE tags SET name = ? WHERE id = ?', [clean, tagId]);
  return { id: tagId, name: clean };
}

export async function deleteTag(profileId: number, tagId: number) {
  validTagId(tagId);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tag = await tagById(conn, profileId, tagId);
    if (protectedTag(tag)) throw new HttpError(400, 'This tag cannot be removed');

    const [fallbackRows] = await conn.query<TagRow[]>(
      'SELECT id, name, profile_id FROM tags WHERE profile_id IS NULL AND name = ? LIMIT 1 FOR UPDATE',
      [FALLBACK_TAG]
    );
    if (!fallbackRows.length) throw new HttpError(500, 'Fallback tag not found');
    const fallback = fallbackRows[0];

    await conn.query('UPDATE transactions SET tag_id = ? WHERE tag_id = ?', [fallback.id, tagId]);
    await conn.query('UPDATE recurring_rules SET tag_id = ? WHERE tag_id = ?', [fallback.id, tagId]);
    await conn.query('UPDATE transfers SET tag_id = ? WHERE tag_id = ?', [fallback.id, tagId]);
    await conn.query('DELETE FROM tags WHERE id = ?', [tagId]);
    await conn.commit();

    return { name: fallback.name };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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
