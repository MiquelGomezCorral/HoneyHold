import cn from 'classnames';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export default function Badge({ children, className }: BadgeProps) {
  return <span className={cn('inline-block px-2 py-px border border-hairline rounded-full text-xs text-muted align-middle', className)}>{children}</span>;
}
