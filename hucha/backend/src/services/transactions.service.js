import { pool } from '../db/pool.js';
import { HttpError } from '../middleware/errors.js';
import { monthRange } from '../utils/dates.js';
import { accountInProfile } from './profiles.service.js';
import { resolveTagId } from './tags.service.js';
import { createRule } from './recurring.service.js';
import { materializeRule } from '../jobs/materialize.js';

export async function listTransactions(profileId, { year, month, type, accountId, limit = 200 }) {
  const where = ['t.profile_id = ?'];
  const params = [profileId];

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

  const [rows] = await pool.query(
    `SELECT t.id, t.type, t.amount, t.txn_date, t.concept, t.counterparty,
            t.is_fixed, t.source, a.name AS account_name, tg.name AS tag_name
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       LEFT JOIN tags tg ON tg.id = t.tag_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.txn_date DESC, t.id DESC
      LIMIT ${Math.max(1, Math.min(Number(limit) || 200, 1000))}`,
    params
  );
  return rows;
}

function validate(input) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Amount must be a positive number');
  if (!['income', 'expense'].includes(input.type)) throw new HttpError(400, 'Type must be income or expense');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txn_date || '')) throw new HttpError(400, 'Date must be YYYY-MM-DD');
  if (!(input.concept || '').trim()) throw new HttpError(400, 'Concept is required');
  return amount;
}

export async function insertTransaction(txn) {
  const [result] = await pool.query(
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

// Entry point for the "Add income / expense" modal.
// If is_fixed + recurrence → create a rule and let the materializer emit the
// due occurrences (including today's), so recurring entries have one code path.
export async function createFromModal(input) {
  const amount = validate(input);
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
      start_date: recurrence.start_date,
      end_date: recurrence.end_date,
    });
    const created = await materializeRule(ruleId);
    return { kind: 'rule', rule_id: ruleId, transactions_created: created };
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
  return { kind: 'transaction', id };
}

export async function deleteTransaction(id) {
  const [result] = await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'Transaction not found');
}
