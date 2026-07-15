export const VERSION = '1.3.0';

export const TEXT_LIMITS = {
  concept: 255,
  counterparty: 128,
  tag: 255,
} as const;

export const LEDGER_COLUMN_SPANS = {
  date: 1,
  concept: 2,
  counterparty: 2,
  tag: 1,
  account: 3,
  amount: 2,
  actions: 1,
} as const;
