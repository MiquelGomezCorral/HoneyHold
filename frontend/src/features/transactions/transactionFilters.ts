import { compareLedgerEntries, entryAccountIds, entryTag } from '../../lib/format.js';
import type { EntryType, LedgerEntry, Transaction, Transfer } from '../../types.js';

export const TRANSACTION_TYPE_FILTERS: { key: EntryType | ''; labelKey: string }[] = [
  { key: '', labelKey: 'common.all' },
  { key: 'income', labelKey: 'common.income' },
  { key: 'expense', labelKey: 'common.expenses' },
  { key: 'transfer', labelKey: 'common.transfers' },
];

export const AMOUNT_SLIDER_MAX = 5000;

export type DateFilter = { mode: 'month' } | { mode: 'range'; from: string; to: string } | { mode: 'all' };
export type TransactionFilters = {
  type: EntryType | '';
  query: string;
  accounts: string[];
  tags: string[];
  amountMin: string;
  amountMax: string;
  date: DateFilter;
};
export type ChoiceOption = { value: string; label: string };

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  type: '',
  query: '',
  accounts: [],
  tags: [],
  amountMin: '',
  amountMax: '',
  date: { mode: 'month' },
};

export function mergeLedgerRows(type: EntryType | '', transactionRows: Transaction[] | null, transferRows: Transfer[] | null) {
  if (type === 'transfer') return transferRows;
  if (type === 'income' || type === 'expense') return transactionRows;
  if (!transactionRows || !transferRows) return null;
  return [...transactionRows, ...transferRows].sort(compareLedgerEntries);
}

export function dateParams(filter: DateFilter, period: { year: number; month: number }) {
  if (filter.mode === 'all') return {};
  if (filter.mode === 'range') return Object.fromEntries(Object.entries({ from: filter.from, to: filter.to }).filter(([, value]) => value));
  return { year: String(period.year), month: String(period.month) };
}

export function dateInputRange(filter: DateFilter, period: { year: number; month: number }) {
  if (filter.mode === 'all') return { from: '', to: '' };
  if (filter.mode === 'range') return { from: filter.from, to: filter.to };
  return monthRangeISO(period.year, period.month);
}

export function parseAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function passesEntryFilters(entry: LedgerEntry, accounts: string[], tags: string[], minAmount: number | null, maxAmount: number | null) {
  if (accounts.length > 0 && !entryAccountIds(entry).some((id) => accounts.includes(id))) return false;
  if (tags.length > 0 && !tags.includes(entryTag(entry))) return false;

  const amount = Math.abs(Number(entry.amount) || 0);
  if (minAmount != null && amount < minAmount) return false;
  if (maxAmount != null && amount > maxAmount) return false;
  return true;
}

export function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function monthRangeISO(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  return { from: start, to: endDate.toISOString().slice(0, 10) };
}
