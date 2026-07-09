const pad = (n: number) => String(n).padStart(2, '0');

export const todayISO = () => new Date().toISOString().slice(0, 10);

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export function addMonths(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const idx = m - 1 + delta;
  const ny = y + Math.floor(idx / 12);
  const nm = ((idx % 12) + 12) % 12 + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${ny}-${pad(nm)}-${pad(nd)}`;
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function nextOccurrence(iso: string, frequency: string): string {
  switch (frequency) {
    case 'weekly':    return addDays(iso, 7);
    case 'monthly':   return addMonths(iso, 1);
    case 'quarterly': return addMonths(iso, 3);
    case 'yearly':    return addMonths(iso, 12);
    default: throw new Error(`Unknown frequency: ${frequency}`);
  }
}

export function monthRange(year: number, month: number): [string, string] {
  const start = `${year}-${pad(month)}-01`;
  return [start, addMonths(start, 1)];
}

export function yearRange(year: number): [string, string] {
  return [`${year}-01-01`, `${year + 1}-01-01`];
}
