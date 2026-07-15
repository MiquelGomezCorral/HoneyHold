import assert from 'node:assert/strict';
import test from 'node:test';
import { balanceSeriesMonths, projectedFixedNet } from './dashboard.service.js';

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
