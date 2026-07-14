import cn from 'classnames';
import Icon from './Icon.js';

interface DualRangeSliderProps {
  min: number;
  max: number;
  minGap?: number;
  minValue: number;
  maxValue: number | null;
  onChange: (next: { min: number; max: number | null }) => void;
}

const rangeInputClasses = 'pointer-events-none absolute inset-x-0 top-1/3 h-8 w-full -translate-y-1/2 appearance-none border-0 bg-transparent p-0 accent-accent [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:transition-colors hover:[&::-moz-range-thumb]:bg-accent-deep [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-colors hover:[&::-webkit-slider-thumb]:bg-accent-deep';

export default function DualRangeSlider({ min, max, minGap = 0, minValue, maxValue, onChange }: DualRangeSliderProps) {
  const gap = Math.max(0, Math.min(minGap, max - min));
  const rawMax = maxValue == null ? max : Math.max(min + gap, Math.min(maxValue, max));
  const safeMin = Math.max(min, Math.min(minValue, rawMax - gap));
  const safeMax = maxValue == null ? max : Math.max(safeMin + gap, Math.min(maxValue, max));
  const range = max - min || 1;
  const minPercent = ((safeMin - min) / range) * 100;
  const maxPercent = ((safeMax - min) / range) * 100;

  function setMin(value: number) {
    onChange({ min: Math.min(value, safeMax - gap), max: maxValue == null ? null : safeMax });
  }

  function setMax(value: number) {
    const nextMax = Math.max(value, safeMin + gap);
    onChange({ min: safeMin, max: nextMax >= max ? null : nextMax });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-hairline/70" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent/25"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step="10"
          value={safeMin}
          onChange={(event) => setMin(Number(event.target.value))}
          className={cn(rangeInputClasses, 'z-10')}
          aria-label="Minimum amount"
        />
        <input
          type="range"
          min={min}
          max={max}
          step="10"
          value={safeMax}
          onChange={(event) => setMax(Number(event.target.value))}
          className={cn(rangeInputClasses, 'z-20')}
          aria-label="Maximum amount"
        />
      </div>
      <div className="flex justify-between text-xs text-muted tabular-nums">
        <span>{safeMin}</span>
        <span className="inline-flex h-4 items-center">
          {maxValue == null ? <Icon src="infinity" type="black" title="No maximum" className="m-0 h-3.5 w-3.5 opacity-60" /> : safeMax}
        </span>
      </div>
    </div>
  );
}
