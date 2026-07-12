import type { ReactNode } from 'react';

interface EmptyStateProps {
  children: ReactNode;
  className?: string;
}

export default function EmptyState({ children, className }: EmptyStateProps) {
  const final = className
    ? `text-muted text-sm ${className}`
    : 'text-muted text-sm';

  return <p className={final}>{children}</p>;
}
