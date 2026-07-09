import { pool } from '../db/pool.js';
import { nextOccurrence, todayISO } from '../utils/dates.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface RecurringRuleRow extends RowDataPacket {
  id: number;
  profile_id: number;
  account_id: number;
  type: string;
  amount: number;
  concept: string;
  counterparty: string | null;
  tag_id: number | null;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_due: string;
  is_active: number;
}

const MAX_OCCURRENCES_PER_RUN = 240;

async function emitDue(rule: RecurringRuleRow): Promise<number> {
  const today = todayISO();
  let due = rule.next_due;
  let created = 0;

  while (due <= today && created < MAX_OCCURRENCES_PER_RUN) {
    if (rule.end_date && due > rule.end_date) break;
    await pool.query<ResultSetHeader>(
      `INSERT INTO transactions
         (profile_id, account_id, type, amount, txn_date, concept,
          counterparty, tag_id, is_fixed, source, recurring_rule_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'recurring', ?)`,
      [rule.profile_id, rule.account_id, rule.type, rule.amount, due,
       rule.concept, rule.counterparty, rule.tag_id, rule.id]
    );
    created += 1;
    due = nextOccurrence(due, rule.frequency);
  }

  const stillActive = !rule.end_date || due <= rule.end_date;
  await pool.query<ResultSetHeader>(
    'UPDATE recurring_rules SET next_due = ?, is_active = ? WHERE id = ?',
    [due, stillActive ? 1 : 0, rule.id]
  );
  return created;
}

export async function materializeRule(ruleId: number): Promise<number> {
  const [rows] = await pool.query<RecurringRuleRow[]>(
    'SELECT * FROM recurring_rules WHERE id = ? AND is_active = 1',
    [ruleId]
  );
  return rows.length ? emitDue(rows[0]) : 0;
}

export async function materializeAll(): Promise<number> {
  const [rules] = await pool.query<RecurringRuleRow[]>(
    'SELECT * FROM recurring_rules WHERE is_active = 1 AND next_due <= CURDATE()'
  );
  let total = 0;
  for (const rule of rules) total += await emitDue(rule);
  if (total) console.log(`[recurring] materialized ${total} transaction(s) from ${rules.length} rule(s)`);
  return total;
}

export function scheduleMaterializer({ intervalMs = 12 * 60 * 60 * 1000 } = {}) {
  const run = () =>
    materializeAll().catch((err: Error) => console.warn('[recurring] run failed:', err.message));
  setTimeout(run, 3000);
  setInterval(run, intervalMs);
}
