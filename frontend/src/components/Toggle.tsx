import type { ReactNode } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  className?: string;
}

export default function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer select-none${className ? ` ${className}` : ''}`}>
      <span className="relative flex-shrink-0 w-[38px] h-[22px] mt-px">
        <input
          type="checkbox"
          className="absolute inset-0 opacity-0 m-0 cursor-pointer peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <i className="absolute inset-0 rounded-full bg-hairline peer-checked:bg-accent transition-colors pointer-events-none after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
      </span>
      {label}
    </label>
  );
}
