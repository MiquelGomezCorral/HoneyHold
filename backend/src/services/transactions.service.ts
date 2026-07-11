import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import { monthRange } from '../utils/dates.js';
import { accountInProfile } from './profiles.service.js';
import { resolveTagId } from './tags.service.js';
import { createRule } from './recurring.service.js';
import { materializeRule } from '../jobs/materialize.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface TransactionRow extends RowDataPacket {
  id: number;
  type: string;
  amount: number;
  txn_date: string;
  concept: string;
  counterparty: string | null;
  is_fixed: number;
  source: string;
  account_name: string | null;
  tag_name: string | null;
}

interface TxnInput {
  profile_id: number;
  account_id: number | null;
  type: string;
  amount: number;
  txn_date: string;
  concept: string;
  counterparty?: string | null;
  tag_id?: number | null;
  is_fixed?: boolean;
  source?: string;
  recurring_rule_id?: number | null;
}

interface ListQuery {
  year?: string;
  month?: string;
  type?: string;
  accountId?: string;
  limit?: string;
}

export async function listTransactions(profileId: number, query: ListQuery) {
  const { year, month, type, accountId, limit } = query;
  const where = ['t.profile_id = ?'];
  const params: (string | number)[] = [profileId];

  if (year && month) {
    const [start, end] = monthRange(Number(year), Number(month));
    where.push('t.txn_date >= ? AND t.txn_date < ?');
    params.push(start, end);
  }
  if (type === 'income' || type === 'expense') {
    where.push('t.type = ?');
    params.push(type);
  }
  if (accountId) {
    where.push('t.account_id = ?');
    params.push(Number(accountId));
  }

  const [rows] = await pool.query<TransactionRow[]>(
    `SELECT t.id, t.type, t.amount, t.txn_date, t.concept, t.counterparty,
            t.is_fixed, t.source, a.name AS account_name, tg.name AS tag_name
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN tags tg ON tg.id = t.tag_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.txn_date DESC, t.id DESC
      LIMIT ${Math.max(1, Math.min(Number(limit) || 200, 1000))}`,
    params
  );
  return rows;
}

function validate(input: { amount: unknown; type: string; txn_date: string; concept: string }): number {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Amount must be a positive number');
  if (!['income', 'expense'].includes(input.type)) throw new HttpError(400, 'Type must be income or expense');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txn_date || '')) throw new HttpError(400, 'Date must be YYYY-MM-DD');
  if (!(input.concept || '').trim()) throw new HttpError(400, 'Concept is required');
  return amount;
}

export async function insertTransaction(txn: TxnInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO transactions
       (profile_id, account_id, type, amount, txn_date, concept, counterparty,
        tag_id, is_fixed, source, recurring_rule_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      txn.profile_id, txn.account_id, txn.type, txn.amount, txn.txn_date,
      txn.concept.trim(), txn.counterparty?.trim() || null, txn.tag_id || null,
      txn.is_fixed ? 1 : 0, txn.source || 'manual', txn.recurring_rule_id || null,
    ]
  );
  return result.insertId;
}

export async function createFromModal(input: {
  profile_id: string | number;
  account_id: string | number;
  type: string;
  amount: unknown;
  txn_date: string;
  concept: string;
  counterparty?: string | null;
  tag?: string | null;
  is_fixed?: boolean;
  recurrence?: {
    frequency?: string;
    start_date?: string;
    end_date?: string;
  } | null;
}) {
  const amount = validate(input as Parameters<typeof validate>[0]);
  const profileId = Number(input.profile_id);
  const accountId = Number(input.account_id);
  await accountInProfile(accountId, profileId);
  const tagId = await resolveTagId(profileId, input.tag);

  const recurrence = input.is_fixed ? input.recurrence : null;
  if (recurrence?.frequency) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recurrence.start_date || '')) {
      throw new HttpError(400, 'Recurrence start date must be YYYY-MM-DD');
    }
    const ruleId = await createRule({
      profile_id: profileId,
      account_id: accountId,
      type: input.type,
      amount,
      concept: input.concept.trim(),
      counterparty: input.counterparty,
      tag_id: tagId,
      frequency: recurrence.frequency,
      start_date: recurrence.start_date!,
      end_date: recurrence.end_date,
    });
    const created = await materializeRule(ruleId);
    return { kind: 'rule' as const, rule_id: ruleId, transactions_created: created };
  }

  const id = await insertTransaction({
    profile_id: profileId,
    account_id: accountId,
    type: input.type,
    amount,
    txn_date: input.txn_date,
    concept: input.concept,
    counterparty: input.counterparty,
    tag_id: tagId,
    is_fixed: !!input.is_fixed,
  });
  return { kind: 'transaction' as const, id };
}

export async function deleteTransaction(id: number) {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM transactions WHERE id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'Transaction not found');
}
