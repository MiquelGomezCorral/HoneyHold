import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export default function Badge({ children, className }: BadgeProps) {
  const base = 'inline-block px-2 py-px border border-hairline rounded-full text-xs text-muted align-middle';
  const final = className ? `${base} ${className}` : base;

  return <span className={final}>{children}</span>;
}
