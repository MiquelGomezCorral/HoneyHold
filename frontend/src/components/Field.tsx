import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  colSpan?: number;
  className?: string;
}

export default function Field({ label, htmlFor, children, colSpan, className }: FieldProps) {
  const colClass = colSpan ? ` col-span-${colSpan}` : '';
  const extra = className ? ` ${className}` : '';

  return (
    <div className={`flex flex-col gap-1.5 min-w-0${colClass}${extra}`}>
      <label htmlFor={htmlFor} className="text-xs font-semibold tracking-[0.1em] uppercase text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
