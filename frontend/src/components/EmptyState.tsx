import cn from 'classnames';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  children: ReactNode;
  className?: string;
}

export default function EmptyState({ children, className }: EmptyStateProps) {
  return <p className={cn('text-muted text-sm', className)}>{children}</p>;
}
