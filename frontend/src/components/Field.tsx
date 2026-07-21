import cn from 'classnames';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export default function Field({ label, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold tracking-[0.1em] uppercase text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
