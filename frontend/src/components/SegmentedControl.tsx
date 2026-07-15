import cn from 'classnames';

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
  activeClassName?: string;
}

export default function SegmentedControl<T extends string>({
  ariaLabel,
  items,
  value,
  onChange,
  full,
  className,
  activeClassName,
}: SegmentedControlProps<T>) {
  const btnClass = cn(
    'px-3 py-1.5 rounded-lg text-muted font-medium text-sm cursor-pointer transition-[color,background-color,transform] duration-300 active:duration-75 active:scale-95 hover:text-ink',
    { 'flex-1': full }
  );

  return (
    <div className={cn('inline-flex gap-0.5 rounded-xl p-0.5', className)} role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={cn(btnClass, { 'bg-accent-soft text-ink font-semibold': item.value === value }, item.value === value && activeClassName)}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
