import cn from 'classnames';
import type { ReactNode } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
}

export default function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', className)}>
      <span className="relative h-6 w-10 flex-shrink-0 mt-px">
        <input
          type="checkbox"
          className="absolute inset-0 opacity-0 m-0 cursor-pointer peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <i className="absolute inset-0 rounded-full bg-hairline peer-checked:bg-accent transition-colors pointer-events-none after:content-[''] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
      </span>
      {label}
    </label>
  );
}
