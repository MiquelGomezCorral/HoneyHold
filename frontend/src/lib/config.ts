export const VERSION = '1.1.1';

export const TEXT_LIMITS = {
  concept: 255,
  counterparty: 128,
  tag: 255,
} as const;

export const LEDGER_COLUMN_WIDTHS = {
  date: '5.5rem',
  concept: '16rem',
  counterparty: '10rem',
  tag: '7rem',
  account: '15rem',
  amount: '7rem',
  actions: '2.5rem',
} as const;
