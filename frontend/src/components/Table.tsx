import cn from 'classnames';
import { Fragment, type CSSProperties, type Key, type KeyboardEvent, type ReactNode } from 'react';
import { BG_COLORS, type BgColor } from '../lib/theme.js';

export interface Column<T> {
  key: string;
  label: string;
  align: 'left' | 'right' | 'center' | 'none';
  span?: number;
  width?: number | string;
  truncate?: boolean;
  cellKind: CellKind;
  header?: ReactNode;
  headerClassName?: string;
  cellClassName?: (row: T) => string;
  render: (row: T) => ReactNode;
}

interface TableHeaderProps<T> {
  columns: Column<T>[];
  className?: string;
  sticky?: boolean;
}

export function TableHeader<T>({ columns, className, sticky = true }: TableHeaderProps<T>) {
  function headerClass(align: Column<T>['align'], index: number) {
    return cn(
      'py-2',
      index === 0 ? 'pl-3 pr-3' : 'pr-3',
      {
        'text-xs font-semibold tracking-[0.12em] uppercase text-muted': align !== 'none',
        'text-right': align === 'right',
        'text-left': align === 'left',
        'text-center': align === 'center',
      }
    );
  };

  return (
    <thead className={cn('z-[2] border-b border-hairline bg-paper-blue', { 'sticky top-16': sticky }, className)}>
      <tr>
        {columns.map((col, index) => (
          <th
            key={col.key}
            className={cn(headerClass(col.align, index), col.headerClassName)}
            aria-label={col.label || undefined}
          >
            {col.header ?? col.label}
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
        <col key={col.key} style={col.width != null ? { width: col.width } : col.span ? { width: `${(col.span / 12) * 100}%` } : undefined} />
      ))}
    </colgroup>
  );
}

export interface TableRowProps<T> {
  row: T;
  columns: Column<T>[];
  bgColor?: BgColor;
  position?: 'single' | 'first' | 'middle' | 'last';
  onClick?: (row: T) => void;
  className?: string;
}

export function TableRow<T>({ row, columns, bgColor, position = 'middle', onClick, className }: TableRowProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onClick || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onClick(row);
  };

  const bgClass = bgColor ? BG_COLORS[bgColor] : '';
  const trClass = cn({
    'cursor-pointer transition-[filter,box-shadow,transform] duration-300 hover:brightness-[0.97] [&:not(:has(button:active))]:active:scale-[0.98] active:duration-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset': onClick,
  });

  return (
    <tr className={cn(trClass, className)} onClick={onClick ? () => onClick(row) : undefined} onKeyDown={handleKeyDown} tabIndex={onClick ? 0 : undefined} role={onClick ? 'button' : undefined}>
      {columns.map((col, index) => (
        <Cell
          key={col.key}
          kind={col.cellKind}
          className={col.cellClassName?.(row)}
          truncate={col.truncate}
          bgClass={bgClass}
          index={index}
          total={columns.length}
          position={position}
        >
          {col.render(row)}
        </Cell>
      ))}
    </tr>
  );
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: readonly T[];
  rowKey: (row: T, index: number) => Key;
  wrapperClassName?: string;
  tableClassName?: string;
  tableStyle?: CSSProperties;
  headerClassName?: string;
  stickyHeader?: boolean;
  bodyStart?: ReactNode;
  beforeRow?: (row: T, index: number, rows: readonly T[]) => ReactNode;
  rowProps?: (row: T, index: number, rows: readonly T[]) => Omit<TableRowProps<T>, 'row' | 'columns'>;
  footer?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  wrapperClassName,
  tableClassName,
  tableStyle,
  headerClassName,
  stickyHeader,
  bodyStart,
  beforeRow,
  rowProps,
  footer,
}: DataTableProps<T>) {
  return (
    <div className={wrapperClassName}>
      <table className={tableClassName} style={tableStyle}>
        <TableColGroup columns={columns} />
        <TableHeader columns={columns} className={headerClassName} sticky={stickyHeader} />
        <tbody>
          {bodyStart}
          {rows.map((row, index) => (
            <Fragment key={rowKey(row, index)}>
              {beforeRow?.(row, index, rows)}
              <TableRow row={row} columns={columns} {...rowProps?.(row, index, rows)} />
            </Fragment>
          ))}
        </tbody>
        {footer}
      </table>
    </div>
  );
}


type CellKind = 'text' | 'muted' | 'amount' | 'action';

interface CellProps {
  kind?: CellKind;
  className?: string;
  truncate?: boolean;
  bgClass?: string;
  index?: number;
  total?: number;
  position?: TableRowProps<unknown>['position'];
  children: ReactNode;
}

const CELL_CLASSES: Record<CellKind, string> = {
  text: 'py-3 pr-3 align-baseline',
  muted: 'py-3 pr-3 align-baseline text-muted',
  amount: 'py-3 pr-3 align-baseline font-semibold whitespace-nowrap tabular-nums text-right',
  action: 'w-9 py-3 pr-3 align-baseline text-right',
};

export default function Cell({ kind = 'text', className, truncate, bgClass, index = 0, total = 1, position = 'middle', children }: CellProps) {
  const roundedClass = cn(
    bgClass,
    {
      'rounded-tl-lg': index === 0 && (position === 'single' || position === 'first'),
      'rounded-tr-lg': index === total - 1 && (position === 'single' || position === 'first'),
      'rounded-bl-lg': index === 0 && (position === 'single' || position === 'last'),
      'rounded-br-lg': index === total - 1 && (position === 'single' || position === 'last'),
    }
  );
  const final = cn(CELL_CLASSES[kind], { 'pl-3': index === 0 }, roundedClass, className);

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
