import { pool } from '../db/pool.js';
import { addMonths, monthRange, nextOccurrence, todayISO, yearRange } from '../utils/dates.js';
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
  month: string;
  net: number;
}

interface MonthlyAmountRow extends MonthNetRow {
  fixed_net: number;
}

interface IncomeExpenseRow extends RowDataPacket {
  month: string;
  income: number;
  expense: number;
}

interface SnapshotBalanceRow extends RowDataPacket {
  month: string;
  balance: number;
}

interface FirstDateRow extends RowDataPacket {
  first_date: string | null;
}

interface RecurringProjection {
  type: 'income' | 'expense';
  amount: number;
  frequency: string;
  next_due: string;
  end_date: string | null;
}

interface RecurringProjectionRow extends RowDataPacket, RecurringProjection {}

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

export function projectedFixedNet(
  rules: RecurringProjection[],
  start: string,
  end: string
) {
  let net = 0;
  for (const rule of rules) {
    let due = rule.next_due;
    while (due < end && (!rule.end_date || due <= rule.end_date)) {
      if (due >= start) net += rule.type === 'income' ? Number(rule.amount) : -Number(rule.amount);
      due = nextOccurrence(due, rule.frequency);
    }
  }
  return r2(net);
}

export function balanceSeriesMonths(currentMonth: string, firstDate: string | undefined) {
  const windowStart = addMonths(currentMonth, -11);
  const start = !firstDate
    ? currentMonth
    : firstDate.slice(0, 7) > windowStart.slice(0, 7)
      ? `${firstDate.slice(0, 7)}-01`
      : windowStart;
  const rangeEnd = addMonths(currentMonth, 1);
  const months: string[] = [];
  for (let month = start; month < rangeEnd; month = addMonths(month, 1)) months.push(month.slice(0, 7));
  return months;
}

/**
 * Rolls the running balance forward across the twelve calendar months of `year`,
 * honouring balance snapshots the same way {@link getBalanceSeries} does. Pure so
 * the month-by-month maths can be unit-tested without the database.
 */
export function annualBalances(
  year: number,
  base: number,
  snapshots: { month: string; balance: number }[],
  deltas: Map<string, number>
) {
  const ordered = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const snapMap = new Map(ordered.map((s) => [s.month, Number(s.balance)]));
  const janKey = `${year}-01`;

  const prior = ordered.filter((s) => s.month < janKey).at(-1);
  let running = prior ? Number(prior.balance) : base;
  const anchor = prior?.month;
  for (const [month, delta] of deltas) {
    if ((!anchor || month > anchor) && month < janKey) running += delta;
  }

  const opening = r2(running);
  const balances = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    running += deltas.get(key) ?? 0;
    running = snapMap.get(key) ?? running;
    return r2(running);
  });

  return { opening, balances };
}

export async function getAnnualSummary(profileId: number, year: number) {
  const [yStart, yEnd] = yearRange(year);

  const [base, snapshotRows, txnBalanceRows, transferRows, flowRows, categoryRows] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(initial_balance), 0) AS base
         FROM accounts WHERE profile_id = ? AND is_active = 1`,
      [profileId]
    ).then(([r]) => Number(r[0]?.base ?? 0)),

    pool.query<SnapshotBalanceRow[]>(
      `SELECT CONCAT(s.year, '-', LPAD(s.month, 2, '0')) AS month,
              COALESCE(SUM(s.balance), 0) AS balance
         FROM account_balance_snapshots s
         JOIN accounts a ON a.id = s.account_id AND a.profile_id = ? AND a.is_active = 1
        WHERE CONCAT(s.year, '-', LPAD(s.month, 2, '0'), '-01') < ?
        GROUP BY s.year, s.month
        ORDER BY s.year, s.month`,
      [profileId, yEnd]
    ).then(([r]) => r),

    pool.query<MonthNetRow[]>(
      `SELECT DATE_FORMAT(t.txn_date, '%Y-%m') AS month,
              COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS net
         FROM transactions t
         LEFT JOIN accounts a ON a.id = t.account_id AND a.profile_id = ? AND a.is_active = 1
        WHERE t.txn_date < ?
          AND ((t.account_id IS NULL AND t.profile_id = ?) OR a.id IS NOT NULL)
        GROUP BY month`,
      [profileId, yEnd, profileId]
    ).then(([r]) => r),

    pool.query<MonthNetRow[]>(
      `SELECT DATE_FORMAT(tr.txn_date, '%Y-%m') AS month,
              COALESCE(SUM(
                CASE WHEN ain.id  IS NOT NULL THEN tr.amount ELSE 0 END
              - CASE WHEN aout.id IS NOT NULL THEN tr.amount ELSE 0 END
              ), 0) AS net
         FROM transfers tr
         LEFT JOIN accounts ain  ON ain.id  = tr.to_account_id   AND ain.profile_id  = ? AND ain.is_active  = 1
         LEFT JOIN accounts aout ON aout.id = tr.from_account_id AND aout.profile_id = ? AND aout.is_active = 1
        WHERE (ain.id IS NOT NULL OR aout.id IS NOT NULL) AND tr.txn_date < ?
        GROUP BY month`,
      [profileId, profileId, yEnd]
    ).then(([r]) => r),

    pool.query<IncomeExpenseRow[]>(
      `SELECT DATE_FORMAT(txn_date, '%Y-%m') AS month,
              COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
         FROM transactions
        WHERE profile_id = ? AND txn_date >= ? AND txn_date < ?
        GROUP BY month`,
      [profileId, yStart, yEnd]
    ).then(([r]) => r),

    pool.query<TagTotalRow[]>(
      `SELECT COALESCE(tg.name, 'Untagged') AS label, SUM(t.amount) AS value
         FROM transactions t
         LEFT JOIN tags tg ON tg.id = t.tag_id
        WHERE t.profile_id = ? AND t.type = 'expense' AND t.txn_date >= ? AND t.txn_date < ?
        GROUP BY label
        ORDER BY value DESC`,
      [profileId, yStart, yEnd]
    ).then(([r]) => r),
  ]);

  const balanceDelta = new Map<string, number>();
  for (const row of [...txnBalanceRows, ...transferRows]) {
    balanceDelta.set(row.month, (balanceDelta.get(row.month) ?? 0) + Number(row.net));
  }
  const flow = new Map(flowRows.map((row) => [row.month, row]));
  const { opening, balances } = annualBalances(year, base, snapshotRows, balanceDelta);

  const months = balances.map((balance, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    const income = r2(Number(flow.get(key)?.income ?? 0));
    const expense = r2(Number(flow.get(key)?.expense ?? 0));
    const net = r2(income - expense);
    const hasData = income !== 0 || expense !== 0 || balanceDelta.has(key);
    return {
      month: i + 1,
      income,
      expense,
      net,
      savingsRate: income > 0 ? r2(net / income) : null,
      balance,
      hasData,
    };
  });

  const dataMonths = months.filter((m) => m.hasData);
  const totalIncome = r2(dataMonths.reduce((sum, m) => sum + m.income, 0));
  const totalExpense = r2(dataMonths.reduce((sum, m) => sum + m.expense, 0));
  const totalNet = r2(totalIncome - totalExpense);

  return {
    year,
    openingBalance: opening,
    months,
    totals: {
      income: totalIncome,
      expense: totalExpense,
      net: totalNet,
      savingsRate: totalIncome > 0 ? r2(totalNet / totalIncome) : null,
      balance: dataMonths.at(-1)?.balance ?? opening,
    },
    byCategory: categoryRows.map((r) => ({ label: r.label, value: Number(r.value) })),
  };
}

export async function getBalanceSeries(profileId: number) {
  const currentMonth = `${todayISO().slice(0, 7)}-01`;
  const windowStart = addMonths(currentMonth, -11);
  const rangeEnd = addMonths(currentMonth, 1);

  const [snapshotRows, base, txnBalanceRows, transferRows, monthlyRows, firstDates, rules] = await Promise.all([
    pool.query<SnapshotBalanceRow[]>(
      `SELECT CONCAT(s.year, '-', LPAD(s.month, 2, '0')) AS month,
              COALESCE(SUM(s.balance), 0) AS balance
         FROM account_balance_snapshots s
         JOIN accounts a ON a.id = s.account_id AND a.profile_id = ? AND a.is_active = 1
        WHERE CONCAT(s.year, '-', LPAD(s.month, 2, '0'), '-01') < ?
        GROUP BY s.year, s.month
        ORDER BY s.year, s.month`,
      [profileId, rangeEnd]
    ).then(([r]) => r),

    pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(initial_balance), 0) AS base
         FROM accounts WHERE profile_id = ? AND is_active = 1`,
      [profileId]
    ).then(([r]) => Number(r[0]?.base ?? 0)),

    pool.query<MonthNetRow[]>(
      `SELECT DATE_FORMAT(t.txn_date, '%Y-%m') AS month,
              COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS net
         FROM transactions t
         LEFT JOIN accounts a ON a.id = t.account_id AND a.profile_id = ? AND a.is_active = 1
         WHERE t.txn_date < ?
           AND ((t.account_id IS NULL AND t.profile_id = ?) OR a.id IS NOT NULL)
        GROUP BY month`,
      [profileId, rangeEnd, profileId]
    ).then(([r]) => r),

    pool.query<MonthNetRow[]>(
      `SELECT DATE_FORMAT(tr.txn_date, '%Y-%m') AS month,
              COALESCE(SUM(
                CASE WHEN ain.id  IS NOT NULL THEN tr.amount ELSE 0 END
              - CASE WHEN aout.id IS NOT NULL THEN tr.amount ELSE 0 END
              ), 0) AS net
         FROM transfers tr
         LEFT JOIN accounts ain  ON ain.id  = tr.to_account_id   AND ain.profile_id  = ? AND ain.is_active  = 1
         LEFT JOIN accounts aout ON aout.id = tr.from_account_id AND aout.profile_id = ? AND aout.is_active = 1
         WHERE (ain.id IS NOT NULL OR aout.id IS NOT NULL) AND tr.txn_date < ?
        GROUP BY month`,
      [profileId, profileId, rangeEnd]
    ).then(([r]) => r),

    pool.query<MonthlyAmountRow[]>(
      `SELECT DATE_FORMAT(txn_date, '%Y-%m') AS month,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS net,
              COALESCE(SUM(CASE WHEN is_fixed = 1
                THEN CASE WHEN type = 'income' THEN amount ELSE -amount END
                ELSE 0 END), 0) AS fixed_net
         FROM transactions
        WHERE profile_id = ? AND txn_date >= ? AND txn_date < ?
        GROUP BY month`,
      [profileId, windowStart, rangeEnd]
    ).then(([r]) => r),

    Promise.all([
      pool.query<FirstDateRow[]>(
        'SELECT MIN(txn_date) AS first_date FROM transactions WHERE profile_id = ? AND txn_date < ?',
        [profileId, rangeEnd]
      ).then(([r]) => r[0]?.first_date ?? null),
      pool.query<FirstDateRow[]>(
        `SELECT MIN(tr.txn_date) AS first_date
           FROM transfers tr
           JOIN accounts af ON af.id = tr.from_account_id
           JOIN accounts at ON at.id = tr.to_account_id
          WHERE (af.profile_id = ? OR at.profile_id = ?) AND tr.txn_date < ?`,
        [profileId, profileId, rangeEnd]
      ).then(([r]) => r[0]?.first_date ?? null),
      pool.query<FirstDateRow[]>(
        `SELECT MIN(CONCAT(s.year, '-', LPAD(s.month, 2, '0'), '-01')) AS first_date
           FROM account_balance_snapshots s
           JOIN accounts a ON a.id = s.account_id
          WHERE a.profile_id = ? AND CONCAT(s.year, '-', LPAD(s.month, 2, '0'), '-01') < ?`,
        [profileId, rangeEnd]
      ).then(([r]) => r[0]?.first_date ?? null),
    ]),

    pool.query<RecurringProjectionRow[]>(
      `SELECT type, amount, frequency, next_due, end_date
         FROM recurring_rules
        WHERE profile_id = ? AND is_active = 1 AND next_due < ?
          AND (end_date IS NULL OR next_due <= end_date)`,
      [profileId, rangeEnd]
    ).then(([r]) => r),
  ]);

  const firstDate = firstDates.filter((date): date is string => Boolean(date)).sort()[0];
  const months = balanceSeriesMonths(currentMonth, firstDate);
  const start = `${months[0]}-01`;

  const snapshots = new Map(snapshotRows.map((row) => [row.month, Number(row.balance)]));
  const balanceDelta = new Map<string, number>();
  for (const row of [...txnBalanceRows, ...transferRows]) {
    balanceDelta.set(row.month, (balanceDelta.get(row.month) ?? 0) + Number(row.net));
  }
  const monthly = new Map(monthlyRows.map((row) => [row.month, row]));

  const priorSnapshot = snapshotRows.filter((row) => row.month < start.slice(0, 7)).at(-1);
  let running = priorSnapshot ? Number(priorSnapshot.balance) : base;
  const anchor = priorSnapshot?.month;
  for (const [month, delta] of balanceDelta) {
    if ((!anchor || month > anchor) && month < start.slice(0, 7)) running += delta;
  }

  const remainingFixed = projectedFixedNet(rules, currentMonth, rangeEnd);
  let previousActual = r2(running);
  return months.map((month) => {
    running += balanceDelta.get(month) ?? 0;
    running = snapshots.get(month) ?? running;
    const actual = r2(running);
    const values = monthly.get(month);
    const expected = r2(previousActual + Number(values?.fixed_net ?? 0) + (month === currentMonth.slice(0, 7) ? remainingFixed : 0));
    previousActual = actual;
    const [year, monthNumber] = month.split('-').map(Number);
    return {
      year,
      month: monthNumber,
      balance: actual,
      net: r2(Number(values?.net ?? 0)),
      expected,
    };
  });
}
