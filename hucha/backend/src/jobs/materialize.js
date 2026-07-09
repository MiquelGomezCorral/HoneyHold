import { pool } from '../db/pool.js';
import { nextOccurrence, todayISO } from '../utils/dates.js';

// Turns due recurring rules into real ledger rows. Runs on boot, on an
// interval, and immediately after a rule is created from the modal — so
// "fixed" entries always flow through this single code path.
const MAX_OCCURRENCES_PER_RUN = 240; // safety valve against runaway loops

async function emitDue(rule) {
  const today = todayISO();
  let due = rule.next_due; // 'YYYY-MM-DD' strings compare correctly
  let created = 0;

  while (due <= today && created < MAX_OCCURRENCES_PER_RUN) {
    if (rule.end_date && due > rule.end_date) break;
    await pool.query(
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
  await pool.query(
    'UPDATE recurring_rules SET next_due = ?, is_active = ? WHERE id = ?',
    [due, stillActive ? 1 : 0, rule.id]
  );
  return created;
}

export async function materializeRule(ruleId) {
  const [rows] = await pool.query(
    'SELECT * FROM recurring_rules WHERE id = ? AND is_active = 1',
    [ruleId]
  );
  return rows.length ? emitDue(rows[0]) : 0;
}

export async function materializeAll() {
  const [rules] = await pool.query(
    'SELECT * FROM recurring_rules WHERE is_active = 1 AND next_due <= CURDATE()'
  );
  let total = 0;
  for (const rule of rules) total += await emitDue(rule);
  if (total) console.log(`[recurring] materialized ${total} transaction(s) from ${rules.length} rule(s)`);
  return total;
}

export function scheduleMaterializer({ intervalMs = 12 * 60 * 60 * 1000 } = {}) {
  const run = () =>
    materializeAll().catch((err) => console.warn('[recurring] run failed:', err.message));
  setTimeout(run, 3000); // give MySQL a moment after boot
  setInterval(run, intervalMs);
}
