import cn from 'classnames';
import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
  hideBorder?: boolean;
}

export default function Section({ title, summary, children, className, hideBorder }: SectionProps) {
  const summaryEl = summary != null && <span className="text-xs text-muted">{summary}</span>;

  return (
    <section className={cn('mt-12 pt-3.5', className, { 'border-t border-hairline': !hideBorder })}>
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="m-0 text-xs font-semibold tracking-[0.14em] uppercase text-muted">{title}</h2>
        {summaryEl}
      </div>
      {children}
    </section>
  );
}
