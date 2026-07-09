import { monthLabel } from '../lib/format.js';

export default function PeriodNav({ year, month, onChange }) {
  const shift = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    onChange({ year: y, month: m });
  };

  return (
    <div className="period">
      <button type="button" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
      <span className="period-label">{monthLabel(year, month)}</span>
      <button type="button" onClick={() => shift(1)} aria-label="Next month">›</button>
    </div>
  );
}
