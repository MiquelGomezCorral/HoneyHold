import { pool } from '../db/pool.js';
import { monthRange, yearRange } from '../utils/dates.js';
import { getGoals } from './goals.service.js';
import type { RowDataPacket } from 'mysql2';

const r2 = (n: number) => Math.round(Number(n) * 100) / 100;

interface AccountBalanceRow extends RowDataPacket {
  id: number;
  name: string;
  kind: string;
  balance: number;
}

interface TypeTotalRow extends RowDataPacket {
  type: string;
  total: number;
}

interface FixedRow extends RowDataPacket {
  is_fixed: number;
  total: number;
}

interface TagTotalRow extends RowDataPacket {
  label: string;
  value: number;
}

interface YtdRow extends RowDataPacket {
  net: number;
}

export async function getDashboard(profileId: number, year: number, month: number) {
  const [mStart, mEnd] = monthRange(year, month);
  const [yStart, yEnd] = yearRange(year);

  const [accounts, monthRows, fixedRows, tagRows, ytdRows, goals] = await Promise.all([
    pool.query<AccountBalanceRow[]>(
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

    pool.query<TypeTotalRow[]>(
      `SELECT type, COALESCE(SUM(amount), 0) AS total
         FROM transactions
        WHERE profile_id = ? AND account_id IS NOT NULL AND txn_date >= ? AND txn_date < ?
        GROUP BY type`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query<FixedRow[]>(
      `SELECT is_fixed, COALESCE(SUM(amount), 0) AS total
         FROM transactions
        WHERE profile_id = ? AND account_id IS NOT NULL AND type = 'expense' AND txn_date >= ? AND txn_date < ?
        GROUP BY is_fixed`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query<TagTotalRow[]>(
      `SELECT COALESCE(tg.name, 'Untagged') AS label, SUM(t.amount) AS value
         FROM transactions t
         LEFT JOIN tags tg ON tg.id = t.tag_id
        WHERE t.profile_id = ? AND t.account_id IS NOT NULL AND t.type = 'expense' AND t.txn_date >= ? AND t.txn_date < ?
        GROUP BY label
        ORDER BY value DESC`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query<YtdRow[]>(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net
         FROM transactions
        WHERE profile_id = ? AND account_id IS NOT NULL AND txn_date >= ? AND txn_date < ?`,
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
