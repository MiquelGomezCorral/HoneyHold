const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export const money = (v) => eur.format(Number(v) || 0);

export const signedMoney = (type, v) =>
  `${type === 'income' ? '+' : '\u2212'}\u2009${money(v)}`;

export const monthLabel = (year, month) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const currentPeriod = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};
