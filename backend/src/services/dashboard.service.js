import { pool } from '../db/pool.js';
import { monthRange, yearRange } from '../utils/dates.js';
import { getGoals } from './goals.service.js';

const r2 = (n) => Math.round(Number(n) * 100) / 100; // keep JSON money 2-decimal clean

// Everything the dashboard needs, scoped to one profile + one month,
// gathered in parallel. Switching profiles only changes the ? bindings.
export async function getDashboard(profileId, year, month) {
  const [mStart, mEnd] = monthRange(year, month);
  const [yStart, yEnd] = yearRange(year);

  const [accounts, monthRows, fixedRows, tagRows, ytdRows, goals] = await Promise.all([
    pool.query(
      `SELECT a.id, a.name, a.kind,
              a.initial_balance
              + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0)
              AS balance
         FROM accounts a
         LEFT JOIN transactions t ON t.account_id = a.id
        WHERE a.profile_id = ? AND a.is_active = 1
        GROUP BY a.id
        ORDER BY a.name`,
      [profileId]
    ).then(([r]) => r),

    pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) AS total
         FROM transactions
        WHERE profile_id = ? AND txn_date >= ? AND txn_date < ?
        GROUP BY type`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query(
      `SELECT is_fixed, COALESCE(SUM(amount), 0) AS total
         FROM transactions
        WHERE profile_id = ? AND type = 'expense' AND txn_date >= ? AND txn_date < ?
        GROUP BY is_fixed`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query(
      `SELECT COALESCE(tg.name, 'Untagged') AS label, SUM(t.amount) AS value
         FROM transactions t
         LEFT JOIN tags tg ON tg.id = t.tag_id
        WHERE t.profile_id = ? AND t.type = 'expense' AND t.txn_date >= ? AND t.txn_date < ?
        GROUP BY label
        ORDER BY value DESC`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net
         FROM transactions
        WHERE profile_id = ? AND txn_date >= ? AND txn_date < ?`,
      [profileId, yStart, yEnd]
    ).then(([r]) => r[0]?.net ?? 0),

    getGoals(profileId, year),
  ]);

  const income = Number(monthRows.find((r) => r.type === 'income')?.total ?? 0);
  const expense = Number(monthRows.find((r) => r.type === 'expense')?.total ?? 0);
  const fixed = Number(fixedRows.find((r) => r.is_fixed === 1)?.total ?? 0);
  const variable = Number(fixedRows.find((r) => r.is_fixed === 0)?.total ?? 0);

  return {
    period: { year, month },
    accounts,
    totalBalance: r2(accounts.reduce((sum, a) => sum + Number(a.balance), 0)),
    month: { income: r2(income), expense: r2(expense), net: r2(income - expense) },
    fixedVsVariable: [
      { label: 'Fixed', value: fixed },
      { label: 'Variable', value: variable },
    ],
    byTag: tagRows.map((r) => ({ label: r.label, value: Number(r.value) })),
    goals: {
      monthly: { target: goals.monthly, actual: r2(income - expense) },
      annual: { target: goals.annual, actual: r2(ytdRows) },
    },
  };
}
