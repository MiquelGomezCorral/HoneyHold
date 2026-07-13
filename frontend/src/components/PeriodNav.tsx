import { monthLabel } from '../lib/format.js';
import Button from './Button.js';
import Icon from './Icon.js';

interface Props {
  year: number;
  month: number;
  onChange: (p: { year: number; month: number }) => void;
}

export default function PeriodNav({ year, month, onChange }: Props) {
  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    onChange({ year: y, month: m });
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button variant="nav" onClick={() => shift(-1)} aria-label="Previous month">
        <Icon src="caret-left" type="black" title="Previous month" className="h-4 w-4"  />
      </Button>
      <span className="min-w-[132px] text-center font-semibold">{monthLabel(year, month)}</span>
      <Button variant="nav" onClick={() => shift(1)} aria-label="Next month">
        <Icon src="caret-right" type="black" title="Next month" className="h-4 w-4"  />
      </Button>
    </div>
  );
}
