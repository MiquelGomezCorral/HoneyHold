import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import { accountById } from './profiles.service.js';
import { resolveTagId } from './tags.service.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface InboxEntryRow extends RowDataPacket {
  id: number;
  source: string;
  external_id: string | null;
  profile_id: number | null;
  account_id: number | null;
  suggested_type: string;
  amount: number;
  txn_date: string;
  concept: string | null;
  counterparty: string | null;
  raw_payload: string;
  created_at: string;
}

export async function listPending(profileId: number) {
  const [rows] = await pool.query<InboxEntryRow[]>(
    `SELECT id, source, external_id, profile_id, account_id, suggested_type,
            amount, txn_date, concept, counterparty, raw_payload, created_at
       FROM inbox_entries
      WHERE status = 'pending' AND (profile_id IS NULL OR profile_id = ?)
      ORDER BY created_at DESC, id DESC`,
    [profileId]
  );
  return rows;
}

export async function countPending(profileId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM inbox_entries
      WHERE status = 'pending' AND (profile_id IS NULL OR profile_id = ?)`,
    [profileId]
  );
  return rows[0].count;
}

export async function updateEntry(id: number, fields: Record<string, unknown>) {
  const allowed = ['account_id', 'suggested_type', 'amount', 'txn_date', 'concept', 'counterparty'];
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`);
      params.push((fields as Record<string, unknown>)[key] ?? null);
    }
  }
  if (!sets.length) throw new HttpError(400, 'Nothing to update');
  params.push(id);
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE inbox_entries SET ${sets.join(', ')} WHERE id = ? AND status = 'pending'`,
    params
  );
  if (!result.affectedRows) throw new HttpError(404, 'Pending inbox entry not found');
}

interface ApproveOverrides {
  account_id?: number | string;
  type?: string;
  amount?: number | string;
  txn_date?: string;
  concept?: string;
  counterparty?: string | null;
  tag?: string | null;
}

export async function approveEntry(id: number, overrides: ApproveOverrides = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT * FROM inbox_entries WHERE id = ? AND status = 'pending' FOR UPDATE",
      [id]
    );
    if (!rows.length) throw new HttpError(409, 'Entry is not pending (already reviewed?)');
    const entry = rows[0];

    const final = {
      account_id: Number(overrides.account_id ?? entry.account_id),
      type: overrides.type ?? entry.suggested_type,
      amount: Number(overrides.amount ?? entry.amount),
      txn_date: overrides.txn_date ?? entry.txn_date,
      concept: (overrides.concept ?? entry.concept ?? '').trim(),
      counterparty: (overrides.counterparty ?? entry.counterparty) || null,
      tag: overrides.tag ?? null,
    };

    if (!final.account_id) throw new HttpError(400, 'Pick an account before approving');
    if (!['income', 'expense'].includes(final.type)) throw new HttpError(400, 'Type must be income or expense');
    if (!Number.isFinite(final.amount) || final.amount <= 0) throw new HttpError(400, 'Amount must be a positive number');
    if (!final.txn_date) throw new HttpError(400, 'Date is required');
    if (!final.concept) throw new HttpError(400, 'Concept is required');

    const account = await accountById(final.account_id);
    const tagId = await resolveTagId(account.profile_id, final.tag);

    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO transactions
         (profile_id, account_id, type, amount, txn_date, concept, counterparty, tag_id, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'automated')`,
      [account.profile_id, final.account_id, final.type, final.amount,
       final.txn_date, final.concept, final.counterparty, tagId]
    );

    await conn.query(
      `UPDATE inbox_entries
          SET status = 'approved', transaction_id = ?, account_id = ?,
              profile_id = ?, reviewed_at = NOW()
        WHERE id = ?`,
      [ins.insertId, final.account_id, account.profile_id, id]
    );

    await conn.commit();
    return { transaction_id: ins.insertId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function rejectEntry(id: number) {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE inbox_entries SET status = 'rejected', reviewed_at = NOW()
      WHERE id = ? AND status = 'pending'`,
    [id]
  );
  if (!result.affectedRows) throw new HttpError(409, 'Entry is not pending (already reviewed?)');
}
