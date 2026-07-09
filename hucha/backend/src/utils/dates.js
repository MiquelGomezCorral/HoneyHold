const pad = (n) => String(n).padStart(2, '0');

export const todayISO = () => new Date().toISOString().slice(0, 10);

const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m: 1-12

export function addMonths(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const idx = m - 1 + delta;
  const ny = y + Math.floor(idx / 12);
  const nm = ((idx % 12) + 12) % 12 + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return `${ny}-${pad(nm)}-${pad(nd)}`;
}

export function addDays(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function nextOccurrence(iso, frequency) {
  switch (frequency) {
    case 'weekly':    return addDays(iso, 7);
    case 'monthly':   return addMonths(iso, 1);
    case 'quarterly': return addMonths(iso, 3);
    case 'yearly':    return addMonths(iso, 12);
    default: throw new Error(`Unknown frequency: ${frequency}`);
  }
}

// [first day of month, first day of next month) — index-friendly range filter.
export function monthRange(year, month) {
  const start = `${year}-${pad(month)}-01`;
  return [start, addMonths(start, 1)];
}

export function yearRange(year) {
  return [`${year}-01-01`, `${year + 1}-01-01`];
}
