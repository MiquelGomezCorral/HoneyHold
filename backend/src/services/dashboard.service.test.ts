import assert from 'node:assert/strict';
import test from 'node:test';
import { annualBalances, balanceSeriesMonths, projectedFixedNet } from './dashboard.service.js';

test('limits the balance series and fixed projection to the requested months', () => {
  assert.deepEqual(balanceSeriesMonths('2026-07-01', '2024-01-10'), [
    '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01',
    '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
  ]);
  assert.deepEqual(balanceSeriesMonths('2026-07-01', '2026-04-12'), [
    '2026-04', '2026-05', '2026-06', '2026-07',
  ]);
  assert.deepEqual(balanceSeriesMonths('2026-07-01', undefined), ['2026-07']);

  assert.equal(projectedFixedNet([
    { type: 'income', amount: 1000, frequency: 'monthly', next_due: '2026-07-20', end_date: null },
    { type: 'expense', amount: 50, frequency: 'weekly', next_due: '2026-07-22', end_date: null },
  ], '2026-07-01', '2026-08-01'), 900);
});

test('rolls annual balances from an opening balance built out of prior deltas', () => {
  const deltas = new Map([
    ['2025-11', 500],   // before the year → folded into the opening balance
    ['2026-01', 1000],
    ['2026-02', -400],
    ['2026-03', 200],
  ]);
  const { opening, balances } = annualBalances(2026, 6979.38, [], deltas);
  assert.equal(opening, 7479.38);
  assert.deepEqual(balances.slice(0, 3), [8479.38, 8079.38, 8279.38]);
  assert.equal(balances[11], 8279.38); // later months carry the last value forward
});

test('annual balances honour a snapshot as an override anchor', () => {
  const deltas = new Map([['2026-01', 1000], ['2026-02', 999], ['2026-03', 50]]);
  const snapshots = [{ month: '2026-02', balance: 5000 }];
  const { opening, balances } = annualBalances(2026, 0, snapshots, deltas);
  assert.equal(opening, 0);
  assert.deepEqual(balances.slice(0, 3), [1000, 5000, 5050]); // Feb snapshot wins, March builds on it
});
