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
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        className="border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none cursor-pointer hover:text-ink hover:bg-accent-soft"
        onClick={() => shift(-1)}
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="min-w-[132px] text-center font-semibold">{monthLabel(year, month)}</span>
      <button
        type="button"
        className="border border-hairline bg-transparent text-muted w-[30px] h-[30px] rounded-lg text-base leading-none cursor-pointer hover:text-ink hover:bg-accent-soft"
        onClick={() => shift(1)}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
