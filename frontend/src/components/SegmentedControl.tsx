interface SegmentedControlItem<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T> {
  ariaLabel: string;
  items: SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  full?: boolean;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  full,
  className,
}: SegmentedControlProps<T>) {
  const extra = className ? ` ${className}` : '';
  const btnClass = `px-3 py-[6px] rounded-lg text-muted font-medium text-sm cursor-pointer transition-colors hover:text-ink${full ? ' flex-1' : ''}`;
  const activeClass = 'bg-accent-soft text-ink font-semibold';

  return (
    <div className={`inline-flex gap-0.5 p-0.5 rounded-[10px]${extra}`} role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`${btnClass} ${item.value === value ? activeClass : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
