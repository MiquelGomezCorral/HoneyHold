import type { KeyboardEvent, ReactNode } from 'react';
import { BG_COLORS, type BgColor } from '../lib/theme.js';

export interface Column<T> {
  key: string;
  label: string;
  align: 'left' | 'right' | 'none';
  width?: string;
  truncate?: boolean;
  cellKind: CellKind;
  cellClassName?: (row: T) => string;
  render: (row: T) => ReactNode;
}

interface TableHeaderProps<T> {
  columns: Column<T>[];
}

export function TableHeader<T>({ columns }: TableHeaderProps<T>) {
  const headerClass = (align: Column<T>['align']) => {
    if (align === 'none') return 'pr-3 pb-[9px] pt-2';
    return `pt-2 pr-3 pb-[9px] text-xs font-semibold tracking-[0.12em] uppercase text-muted ${align === 'right' ? 'text-right' : 'text-left'}`;
  };

  return (
    <thead className="sticky top-16 z-[2] bg-paper-blue shadow-[0_2px_0_0_#d3e2ee]">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            className={headerClass(col.align)}
            aria-label={col.label || undefined}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TableColGroup<T>({ columns }: TableHeaderProps<T>) {
  return (
    <colgroup>
      {columns.map((col) => (
        <col key={col.key} style={col.width ? { width: col.width } : undefined} />
      ))}
    </colgroup>
  );
}

interface TableRowProps<T> {
  row: T;
  columns: Column<T>[];
  bgColor?: BgColor;
  onClick?: (row: T) => void;
}

export function TableRow<T>({ row, columns, bgColor, onClick }: TableRowProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onClick || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onClick(row);
  };

  const className = [
    bgColor ? BG_COLORS[bgColor] ?? '' : '',
    onClick ? 'cursor-pointer transition hover:brightness-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset' : '',
  ].filter(Boolean).join(' ');

  return (
    <tr className={className} onClick={onClick ? () => onClick(row) : undefined} onKeyDown={handleKeyDown} tabIndex={onClick ? 0 : undefined} role={onClick ? 'button' : undefined}>
      {columns.map((col) => (
        <Cell key={col.key} kind={col.cellKind} className={col.cellClassName?.(row)} truncate={col.truncate}>
          {col.render(row)}
        </Cell>
      ))}
    </tr>
  );
}


export type CellKind = 'text' | 'muted' | 'amount' | 'action';

interface CellProps {
  kind?: CellKind;
  className?: string;
  truncate?: boolean;
  children: ReactNode;
}

const CELL_CLASSES: Record<CellKind, string> = {
  text: 'py-[11px] pr-3 align-baseline',
  muted: 'py-[11px] pr-3 align-baseline text-muted',
  amount: 'py-[11px] pr-3 align-baseline font-semibold whitespace-nowrap tabular-nums text-right',
  action: 'w-[34px] py-[11px] pr-3 align-baseline text-right',
};

export default function Cell({ kind = 'text', className, truncate, children }: CellProps) {
  const final = className
    ? `${CELL_CLASSES[kind]} ${className}`
    : CELL_CLASSES[kind];

  return (
    <td className={final}>
      {truncate ? <div className="truncate">{children}</div> : children}
    </td>
  );
}

export function DateDivider({ children, colSpan }: { children: ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="pt-5 pb-0">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.12em] uppercase text-muted">
          <span>{children}</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>
      </td>
    </tr>
  );
}
