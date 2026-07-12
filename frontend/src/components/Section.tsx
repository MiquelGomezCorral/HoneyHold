import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, summary, children, className }: SectionProps) {
  const extra = className ? ` ${className}` : '';
  const summaryEl = summary != null && <span className="text-xs text-muted">{summary}</span>;

  return (
    <section className={`mt-12 border-t border-hairline pt-[14px]${extra}`}>
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="m-0 text-xs font-semibold tracking-[0.14em] uppercase text-muted">{title}</h2>
        {summaryEl}
      </div>
      {children}
    </section>
  );
}
