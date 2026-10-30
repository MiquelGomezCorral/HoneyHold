import assert from 'node:assert/strict';
import test from 'node:test';
import { latestFetchSlot, nextFetchSlot } from './fetch-enable-banking.js';

test('aligns Enable Banking fetches to fixed local slots', () => {
  assert.equal(latestFetchSlot(new Date(2026, 6, 25, 7, 30)).getHours(), 0);
  assert.equal(nextFetchSlot(new Date(2026, 6, 25, 7, 30)).getHours(), 8);
  assert.equal(latestFetchSlot(new Date(2026, 6, 25, 13, 0)).getHours(), 13);
  assert.equal(nextFetchSlot(new Date(2026, 6, 25, 18, 1)).getDate(), 26);
  assert.equal(nextFetchSlot(new Date(2026, 6, 25, 18, 1)).getHours(), 0);
});
