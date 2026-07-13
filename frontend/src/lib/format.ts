import { LedgerEntry } from "../types";

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function money(v: number | string) {
  return eur.format(Number(v) || 0);
}

export function signedMoney(type: 'income' | 'expense', v: number | string) {
  return `${type === 'income' ? '+' : '\u2212'}\u2009${money(v)}`; // \u2009 is a thin space and \u2212 is a minus sign (not a hyphen)
}

export function entryMoney(t: LedgerEntry, profileId: number | null) {
  if (t.type !== 'transfer') return signedMoney(t.type, t.amount);
  if (t.from_profile_id === t.to_profile_id) return money(t.amount);
  return signedMoney(t.from_profile_id === profileId ? 'expense' : 'income', t.amount);
}

export function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function dbTimestamp(value: string) {
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

export function timeStamp(iso: string) {
  return dbTimestamp(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Madrid',
  });
}

export function compareLedgerEntries(a: { txn_date: string; created_at: string; id: number }, b: typeof a) {
  return b.txn_date.localeCompare(a.txn_date)
    || b.created_at.localeCompare(a.created_at)
    || b.id - a.id;
}

export function accountLabel(name: string, profileName?: string | null) {
  return profileName ? `${name} (${profileName})` : name;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};
