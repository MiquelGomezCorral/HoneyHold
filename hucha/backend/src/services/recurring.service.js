import { pool } from '../db/pool.js';

export async function createRule(rule) {
  const [result] = await pool.query(
    `INSERT INTO recurring_rules
       (profile_id, account_id, type, amount, concept, counterparty, tag_id,
        frequency, start_date, end_date, next_due)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rule.profile_id, rule.account_id, rule.type, rule.amount, rule.concept,
      rule.counterparty || null, rule.tag_id || null,
      rule.frequency, rule.start_date, rule.end_date || null, rule.start_date,
    ]
  );
  return result.insertId;
}

export async function listRules(profileId) {
  const [rows] = await pool.query(
    `SELECT r.id, r.type, r.amount, r.concept, r.counterparty, r.frequency,
            r.start_date, r.next_due, a.name AS account_name, tg.name AS tag_name
       FROM recurring_rules r
       JOIN accounts a ON a.id = r.account_id
       LEFT JOIN tags tg ON tg.id = r.tag_id
      WHERE r.profile_id = ? AND r.is_active = 1
      ORDER BY r.next_due, r.id`,
    [profileId]
  );
  return rows;
}

export async function deactivateRule(id) {
  const [result] = await pool.query(
    'UPDATE recurring_rules SET is_active = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}
