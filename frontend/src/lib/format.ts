import type { LedgerEntry } from '../types.js';

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

function dbTimestamp(value: string) {
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

export function scopedAccountLabel(name: string, accountProfileId: number | null | undefined, accountProfileName: string | null | undefined, profileId: number | null) {
  return accountProfileId && accountProfileId !== profileId ? accountLabel(name, accountProfileName) : name;
}

export function entryTag(entry: LedgerEntry) {
  return entry.type === 'transfer' ? entry.tag_name || 'Transference' : entry.tag_name || '';
}

export function entryAccountIds(entry: LedgerEntry) {
  if (entry.type === 'transfer') return [String(entry.from_account_id), String(entry.to_account_id)];
  return entry.account_id ? [String(entry.account_id)] : [];
}

export function entryAccountText(entry: LedgerEntry, profileId: number | null) {
  if (entry.type === 'transfer') {
    const crossProfile = entry.from_profile_id !== entry.to_profile_id;
    const from = accountLabel(entry.from_account_name, crossProfile ? entry.from_profile_name : null);
    const to = accountLabel(entry.to_account_name, crossProfile ? entry.to_profile_name : null);
    return [from, to, `${from} ${to}`];
  }

  if (!entry.account_name) return '';
  return scopedAccountLabel(entry.account_name, entry.account_profile_id, entry.account_profile_name, profileId);
}

export function entryIds(entry: LedgerEntry) {
  return entry.type === 'transfer'
    ? [String(entry.id), String(entry.from_account_id), String(entry.to_account_id)]
    : [String(entry.id), entry.account_id ? String(entry.account_id) : ''];
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
