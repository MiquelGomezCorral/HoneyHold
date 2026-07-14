import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import { monthRange } from '../utils/dates.js';
import { accountById } from './profiles.service.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

interface TransferRow extends RowDataPacket {
  id: number;
  type: 'transfer';
  amount: number;
  txn_date: string;
  created_at: string;
  concept: string;
  source: string;
  creator_profile_id: number;
  from_account_id: number;
  from_account_name: string;
  from_profile_id: number;
  from_profile_name: string;
  to_account_id: number;
  to_account_name: string;
  to_profile_id: number;
  to_profile_name: string;
  tag_name: string | null;
}

interface ListQuery {
  year?: string;
  month?: string;
  from?: string;
  to?: string;
  accountId?: string;
  limit?: string;
}

async function resolveTransferTagId(): Promise<number | null> {
  const [existing] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tags
      WHERE profile_id IS NULL AND name = 'Transference'
      LIMIT 1`
  );
  if (existing.length) return existing[0].id;

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO tags (profile_id, name) VALUES (NULL, ?)',
    ['Transference']
  );
  return result.insertId;
}

function validate(input: { amount: unknown; txn_date: string; concept: string }): number {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Amount must be a positive number');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txn_date || '')) throw new HttpError(400, 'Date must be YYYY-MM-DD');
  if (!(input.concept || '').trim()) throw new HttpError(400, 'Concept is required');
  return amount;
}

export async function listTransfers(profileId: number, query: ListQuery) {
  const { year, month, from, to, accountId, limit } = query;
  const where = ['(fa.profile_id = ? OR ta.profile_id = ?)'];
  const params: (string | number)[] = [profileId, profileId];

  if (from || to) {
    if (from) {
      where.push('tr.txn_date >= ?');
      params.push(from);
    }
    if (to) {
      where.push('tr.txn_date <= ?');
      params.push(to);
    }
  } else if (year && month) {
    const [start, end] = monthRange(Number(year), Number(month));
    where.push('tr.txn_date >= ? AND tr.txn_date < ?');
    params.push(start, end);
  }
  if (accountId) {
    where.push('(tr.from_account_id = ? OR tr.to_account_id = ?)');
    params.push(Number(accountId), Number(accountId));
  }

  const [rows] = await pool.query<TransferRow[]>(
    `SELECT tr.id, 'transfer' AS type, tr.amount, tr.txn_date, tr.created_at, tr.concept, tr.source,
            tr.creator_profile_id,
            tr.from_account_id, fa.name AS from_account_name,
            fa.profile_id AS from_profile_id, fp.display_name AS from_profile_name,
            tr.to_account_id, ta.name AS to_account_name,
            ta.profile_id AS to_profile_id, tp.display_name AS to_profile_name,
            tg.name AS tag_name
       FROM transfers tr
       JOIN accounts fa ON fa.id = tr.from_account_id
       JOIN profiles fp ON fp.id = fa.profile_id
       JOIN accounts ta ON ta.id = tr.to_account_id
       JOIN profiles tp ON tp.id = ta.profile_id
       LEFT JOIN tags tg ON tg.id = tr.tag_id
      WHERE ${where.join(' AND ')}
      ORDER BY tr.txn_date DESC, tr.created_at DESC, tr.id DESC
      LIMIT ${Math.max(1, Math.min(Number(limit) || 200, 1000))}`,
    params
  );
  return rows;
}

export async function createFromModal(profileId: number, input: {
  from_account_id: string | number;
  to_account_id: string | number;
  amount: unknown;
  txn_date: string;
  concept: string;
}) {
  const amount = validate(input);
  const fromAccountId = Number(input.from_account_id);
  const toAccountId = Number(input.to_account_id);
  if (!Number.isInteger(fromAccountId) || !Number.isInteger(toAccountId)) throw new HttpError(400, 'Pick both accounts');
  if (fromAccountId === toAccountId) throw new HttpError(400, 'Pick two different accounts');

  await Promise.all([accountById(fromAccountId), accountById(toAccountId)]);
  const tagId = await resolveTransferTagId();

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO transfers
       (creator_profile_id, from_account_id, to_account_id, amount, txn_date, concept, tag_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [profileId, fromAccountId, toAccountId, amount, input.txn_date, input.concept.trim(), tagId]
  );
  return { kind: 'transfer' as const, id: result.insertId };
}

export async function updateFromModal(id: number, input: {
  from_account_id: string | number;
  to_account_id: string | number;
  amount: unknown;
  txn_date: string;
  concept: string;
}) {
  const amount = validate(input);
  const fromAccountId = Number(input.from_account_id);
  const toAccountId = Number(input.to_account_id);
  if (!Number.isInteger(fromAccountId) || !Number.isInteger(toAccountId)) throw new HttpError(400, 'Pick both accounts');
  if (fromAccountId === toAccountId) throw new HttpError(400, 'Pick two different accounts');

  await Promise.all([accountById(fromAccountId), accountById(toAccountId)]);
  const tagId = await resolveTransferTagId();

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE transfers
        SET from_account_id = ?, to_account_id = ?, amount = ?, txn_date = ?, concept = ?, tag_id = ?
      WHERE id = ?`,
    [fromAccountId, toAccountId, amount, input.txn_date, input.concept.trim(), tagId, id]
  );
  if (!result.affectedRows) throw new HttpError(404, 'Transfer not found');
  return { kind: 'transfer' as const, id };
}

export async function deleteTransfer(id: number) {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM transfers WHERE id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'Transfer not found');
}
