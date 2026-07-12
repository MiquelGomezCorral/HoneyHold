const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const money = (v: number | string) => eur.format(Number(v) || 0);

export const signedMoney = (type: 'income' | 'expense', v: number | string) =>
  `${type === 'income' ? '+' : '\u2212'}\u2009${money(v)}`; // \u2009 is a thin space and \u2212 is a minus sign (not a hyphen)

export const entryMoney = (type: 'income' | 'expense' | 'transfer', v: number | string) =>
  type === 'transfer' ? money(v) : signedMoney(type, v);

export const monthLabel = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export const timeStamp = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const compareLedgerEntries = (a: { txn_date: string; created_at: string; id: number }, b: typeof a) =>
  b.txn_date.localeCompare(a.txn_date)
    || b.created_at.localeCompare(a.created_at)
    || b.id - a.id;

export const accountLabel = (name: string, profileName?: string | null) =>
  profileName ? `${name} (${profileName})` : name;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const currentPeriod = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};
