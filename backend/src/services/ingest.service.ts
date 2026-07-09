import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface IngestItem {
  source?: string;
  external_id?: string;
  amount?: unknown;
  date?: string;
  concept?: string;
  counterparty?: string;
  type?: string;
  profile_slug?: string;
  account_name?: string;
  raw?: Record<string, unknown>;
}

export async function ingestItems(items: IngestItem[]) {
  if (!Array.isArray(items) || !items.length) {
    throw new HttpError(400, 'Body must be a non-empty array of items');
  }

  const [profiles] = await pool.query<RowDataPacket[]>('SELECT id, slug FROM profiles');
  const bySlug = Object.fromEntries(profiles.map((p: RowDataPacket) => [p.slug, p.id]));

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    const source = (item.source || '').trim();
    const rawAmount = Number(item.amount);
    if (!source || !Number.isFinite(rawAmount) || !/^\d{4}-\d{2}-\d{2}$/.test(item.date || '')) {
      throw new HttpError(400, 'Each item needs source, a numeric amount and a YYYY-MM-DD date');
    }

    const type = item.type || (rawAmount < 0 ? 'expense' : 'income');
    const amount = Math.abs(rawAmount);
    const profileId = item.profile_slug ? bySlug[item.profile_slug] ?? null : null;

    let accountId: number | null = null;
    if (profileId && item.account_name) {
      const [acc] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM accounts WHERE profile_id = ? AND name = ? AND is_active = 1',
        [profileId, item.account_name]
      );
      accountId = acc[0]?.id ?? null;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT IGNORE INTO inbox_entries
         (source, external_id, profile_id, account_id, suggested_type,
          amount, txn_date, concept, counterparty, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        source, item.external_id || null, profileId, accountId, type,
        amount, item.date, item.concept || null, item.counterparty || null,
        JSON.stringify(item.raw ?? item),
      ]
    );
    result.affectedRows ? inserted++ : skipped++;
  }

  return { inserted, skipped_duplicates: skipped };
}
