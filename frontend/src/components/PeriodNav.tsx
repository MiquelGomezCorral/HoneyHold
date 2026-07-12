import { monthLabel } from '../lib/format.js';
import Button from './Button.js';

interface Props {
  year: number;
  month: number;
  onChange: (p: { year: number; month: number }) => void;
}

export default function PeriodNav({ year, month, onChange }: Props) {
  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    onChange({ year: y, month: m });
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button variant="nav" onClick={() => shift(-1)} aria-label="Previous month">
        ‹
      </Button>
      <span className="min-w-[132px] text-center font-semibold">{monthLabel(year, month)}</span>
      <Button variant="nav" onClick={() => shift(1)} aria-label="Next month">
        ›
      </Button>
    </div>
  );
}
