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

interface MonthNetRow extends RowDataPacket {
  m: number;
  net: number;
}

interface SnapshotBalanceRow extends RowDataPacket {
  month: number;
  balance: number;
}

export async function getDashboard(profileId: number, year: number, month: number) {
  const [mStart, mEnd] = monthRange(year, month);
  const [yStart, yEnd] = yearRange(year);

  const [accounts, monthRows, fixedRows, tagRows, ytdRows, goals] = await Promise.all([
    pool.query<AccountBalanceRow[]>(
      `SELECT a.id, a.name, a.kind,
              a.initial_balance
              + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0)
              + COALESCE((SELECT SUM(amount) FROM transfers WHERE to_account_id = a.id), 0)
              - COALESCE((SELECT SUM(amount) FROM transfers WHERE from_account_id = a.id), 0)
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
        WHERE profile_id = ? AND txn_date >= ? AND txn_date < ?
        GROUP BY type`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query<FixedRow[]>(
      `SELECT is_fixed, COALESCE(SUM(amount), 0) AS total
         FROM transactions
        WHERE profile_id = ? AND type = 'expense' AND txn_date >= ? AND txn_date < ?
        GROUP BY is_fixed`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query<TagTotalRow[]>(
      `SELECT COALESCE(tg.name, 'Untagged') AS label, SUM(t.amount) AS value
         FROM transactions t
         LEFT JOIN tags tg ON tg.id = t.tag_id
        WHERE t.profile_id = ? AND t.type = 'expense' AND t.txn_date >= ? AND t.txn_date < ?
        GROUP BY label
        ORDER BY value DESC`,
      [profileId, mStart, mEnd]
    ).then(([r]) => r),

    pool.query<YtdRow[]>(
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

/**
 * Cumulative end-of-month balance for every month of `year`.
 * Bucket 0 folds in the opening balance (initial balances + everything before
 * the year); buckets 1‑12 are that month's net movement, then we run a total.
 */
export async function getBalanceSeries(profileId: number, year: number) {
  const [yStart, yEnd] = yearRange(year);

  const [snapshotRows, base, txnRows, transferRows] = await Promise.all([
    pool.query<SnapshotBalanceRow[]>(
      `SELECT s.month, COALESCE(SUM(s.balance), 0) AS balance
         FROM account_balance_snapshots s
         JOIN accounts a ON a.id = s.account_id AND a.profile_id = ? AND a.is_active = 1
        WHERE s.year = ?
        GROUP BY s.month
        ORDER BY s.month`,
      [profileId, year]
    ).then(([r]) => r),

    pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(initial_balance), 0) AS base
         FROM accounts WHERE profile_id = ? AND is_active = 1`,
      [profileId]
    ).then(([r]) => Number(r[0]?.base ?? 0)),

    pool.query<MonthNetRow[]>(
      // Account-owned rows use account profile; imported aggregate rows have no account.
      `SELECT CASE WHEN t.txn_date < ? THEN 0 ELSE MONTH(t.txn_date) END AS m,
              COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS net
         FROM transactions t
         LEFT JOIN accounts a ON a.id = t.account_id AND a.profile_id = ? AND a.is_active = 1
        WHERE t.txn_date < ?
          AND ((t.account_id IS NULL AND t.profile_id = ?) OR a.id IS NOT NULL)
        GROUP BY m`,
      [yStart, profileId, yEnd, profileId]
    ).then(([r]) => r),

    pool.query<MonthNetRow[]>(
      `SELECT CASE WHEN tr.txn_date < ? THEN 0 ELSE MONTH(tr.txn_date) END AS m,
              COALESCE(SUM(
                CASE WHEN ain.id  IS NOT NULL THEN tr.amount ELSE 0 END
              - CASE WHEN aout.id IS NOT NULL THEN tr.amount ELSE 0 END
              ), 0) AS net
         FROM transfers tr
         LEFT JOIN accounts ain  ON ain.id  = tr.to_account_id   AND ain.profile_id  = ? AND ain.is_active  = 1
         LEFT JOIN accounts aout ON aout.id = tr.from_account_id AND aout.profile_id = ? AND aout.is_active = 1
        WHERE (ain.id IS NOT NULL OR aout.id IS NOT NULL) AND tr.txn_date < ?
        GROUP BY m`,
      [yStart, profileId, profileId, yEnd]
    ).then(([r]) => r),
  ]);

  const delta = new Array(13).fill(0);
  for (const row of [...txnRows, ...transferRows]) delta[Number(row.m)] += Number(row.net);

  if (snapshotRows.length) {
    const byMonth = new Map(snapshotRows.map((row) => [Number(row.month), Number(row.balance)]));
    let running = 0;
    return Array.from({ length: 12 }, (_, i) => {
      running += delta[i + 1];
      running = byMonth.get(i + 1) ?? running;
      return { month: i + 1, balance: r2(running) };
    });
  }

  let running = base + delta[0];
  return Array.from({ length: 12 }, (_, i) => {
    running += delta[i + 1];
    return { month: i + 1, balance: r2(running) };
  });
}
