import cn from 'classnames';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import Badge from './Badge.js';
import Cell, { DataTable } from './Table.js';
import { ANNUAL_OVERVIEW } from '../lib/config.js';
import { currentPeriod, money, percent } from '../lib/format.js';
import { useI18n } from '../i18n.js';
import type { Column } from './Table.js';
import type { AnnualMonth, AnnualSummary } from '../types.js';

type Widths = Record<string, number>;
type AnnualColumn = (typeof ANNUAL_OVERVIEW.columns)[number];

interface Props {
  summary: AnnualSummary;
  target: number;
}

function clampWidth(value: number, column: AnnualColumn) {
  return Math.max(column.minWidth, Math.min(column.defaultWidth * 3, value));
}

function loadWidths(): Widths {
  const widths = Object.fromEntries(ANNUAL_OVERVIEW.columns.map((column) => [column.key, column.defaultWidth])) as Widths;
  try {
    const saved = JSON.parse(localStorage.getItem(ANNUAL_OVERVIEW.columnWidthsStorageKey) ?? '{}') as Record<string, unknown>;
    for (const column of ANNUAL_OVERVIEW.columns) {
      const value = Number(saved[column.key]);
      if (Number.isFinite(value)) widths[column.key] = clampWidth(value, column);
    }
  } catch {}
  return widths;
}

export default function AnnualSummaryTable({ summary, target }: Props) {
  const { t, tl } = useI18n();
  const [widths, setWidths] = useState<Widths>(loadWidths);
  const widthsRef = useRef(widths);
  const drag = useRef<{ column: AnnualColumn; pointerId: number; startX: number; startWidth: number } | null>(null);
  widthsRef.current = widths;
  const now = currentPeriod();
  const months = tl('chart.months');

  function persist(next: Widths) {
    try { localStorage.setItem(ANNUAL_OVERVIEW.columnWidthsStorageKey, JSON.stringify(next)); } catch {}
  }

  function updateWidth(column: AnnualColumn, value: number, save = false) {
    setWidths((current) => {
      const next = { ...current, [column.key]: clampWidth(value, column) };
      if (save) persist(next);
      return next;
    });
  }

  function startResize(event: PointerEvent<HTMLSpanElement>, column: AnnualColumn) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      column,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: widthsRef.current[column.key],
    };
  }

  function moveResize(event: PointerEvent<HTMLSpanElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    updateWidth(current.column, current.startWidth + event.clientX - current.startX);
  }

  function finishResize(event: PointerEvent<HTMLSpanElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    drag.current = null;
    persist(widthsRef.current);
  }

  function nudge(column: AnnualColumn, event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    updateWidth(column, widths[column.key] + (event.key === 'ArrowRight' ? ANNUAL_OVERVIEW.resizeStep : -ANNUAL_OVERVIEW.resizeStep), true);
  }

  useEffect(() => () => {
    if (drag.current) persist(widthsRef.current);
  }, []);

  const columns: Column<AnnualMonth>[] = ANNUAL_OVERVIEW.columns.map((column, index) => ({
    key: column.key,
    label: t(column.labelKey),
    align: column.align,
    width: widths[column.key],
    cellKind: 'text',
    headerClassName: cn('relative', index === 0 && 'sticky left-0 z-[3] bg-paper-blue', column.key === 'status' && '!px-0'),
    header: (
      <>
        <span className="block truncate">{t(column.labelKey)}</span>
        {index < ANNUAL_OVERVIEW.columns.length - 1 && (
          <span
            role="separator"
            aria-orientation="vertical"
            aria-label={t('annual.resizeColumn', { column: t(column.labelKey) })}
            aria-valuemin={column.minWidth}
            aria-valuemax={column.defaultWidth * 3}
            aria-valuenow={widths[column.key]}
            tabIndex={0}
            onPointerDown={(event) => startResize(event, column)}
            onPointerMove={moveResize}
            onPointerUp={finishResize}
            onPointerCancel={finishResize}
            onLostPointerCapture={finishResize}
            onKeyDown={(event) => nudge(column, event)}
            className="group absolute top-0 right-0 z-[4] flex h-full w-3 translate-x-1/2 cursor-col-resize touch-none select-none items-stretch justify-center focus:outline-none"
          >
            <span className="my-1 w-0.5 rounded-full bg-transparent transition-colors group-hover:bg-accent/60 group-focus-visible:bg-accent" aria-hidden />
          </span>
        )}
      </>
    ),
    cellClassName: (row) => cellClass(column.key, row, summary.year === now.year && row.month === now.month),
    render: (row) => renderCell(column.key, row, months[row.month - 1], target, t),
  }));
  const totalWidth = ANNUAL_OVERVIEW.columns.reduce((total, column) => total + widths[column.key], 0);

  return (
    <DataTable
      columns={columns}
      rows={summary.months}
      rowKey={(month) => month.month}
      wrapperClassName="w-full overflow-x-auto"
      tableClassName="w-full table-fixed border-collapse text-sm"
      tableStyle={{ width: `max(100%, ${totalWidth}px)` }}
      stickyHeader={false}
      bodyStart={
        <AnnualStaticRow
          columns={columns}
          className="border-b border-hairline/60 text-muted"
          values={{ month: t('annual.openingBalance'), balance: money(summary.openingBalance) }}
          cellClassName={openingCellClass}
        />
      }
      rowProps={(month) => ({
        className: cn('border-b border-hairline/60', { 'bg-paper-blue-raise': summary.year === now.year && month.month === now.month }),
      })}
      footer={
        <tfoot>
          <AnnualStaticRow
            columns={columns}
            className="border-t-2 border-hairline bg-paper-blue-raise font-semibold"
            values={{
              month: t('annual.total', { year: summary.year }),
              income: money(summary.totals.income),
              expense: money(summary.totals.expense),
              savings: money(summary.totals.net),
              rate: percent(summary.totals.savingsRate),
              balance: money(summary.totals.balance),
            }}
            cellClassName={(key) => totalCellClass(key, summary.totals.net)}
          />
        </tfoot>
      }
    />
  );
}

function cellClass(key: string, row: AnnualMonth, isCurrent: boolean) {
  const currentBg = isCurrent ? 'bg-paper-blue-raise' : 'bg-paper-blue';
  if (key === 'month') return cn('sticky left-0 z-[1] py-2.5 font-medium', currentBg, { 'text-accent': isCurrent });
  if (key === 'status') return 'py-2.5 !px-0 text-center';
  if (!row.hasData) return 'py-2.5 text-right tabular-nums text-muted';
  if (key === 'income') return 'py-2.5 text-right tabular-nums text-accent';
  if (key === 'savings') return cn('py-2.5 text-right font-semibold tabular-nums', { 'text-neg': row.net < 0 });
  return 'py-2.5 text-right tabular-nums';
}

function renderCell(key: string, row: AnnualMonth, month: string, target: number, t: (key: string, values?: Record<string, string | number>) => string) {
  if (key === 'month') return month;
  if (!row.hasData) return '—';
  if (key === 'income') return money(row.income);
  if (key === 'expense') return money(row.expense);
  if (key === 'savings') return money(row.net);
  if (key === 'rate' && !row.hasFlow) return '—';
  if (key === 'rate') return <RateMeter rate={row.savingsRate} target={target} />;
  if (key === 'balance') return money(row.balance);
  if (!row.hasFlow) return '—';
  const met = row.savingsRate != null && row.savingsRate >= target;
  return <Badge className={cn('border-0', met ? 'bg-paper-green text-ink' : 'bg-paper-red text-ink')}>{t(met ? 'annual.met' : 'annual.missed')}</Badge>;
}

function AnnualStaticRow({
  columns,
  className,
  values,
  cellClassName,
}: {
  columns: Column<AnnualMonth>[];
  className: string;
  values: Record<string, ReactNode>;
  cellClassName: (key: string) => string;
}) {
  return (
    <tr className={className}>
      {columns.map((column) => <Cell key={column.key} className={cellClassName(column.key)}>{values[column.key] ?? '—'}</Cell>)}
    </tr>
  );
}

function openingCellClass(key: string) {
  if (key === 'month') return 'sticky left-0 z-[1] bg-paper-blue py-2.5 italic';
  if (key === 'balance') return 'py-2.5 text-right font-semibold tabular-nums text-ink';
  return cn('py-2.5 text-muted', key === 'status' ? '!px-0 text-center' : 'text-right');
}

function totalCellClass(key: string, net: number) {
  if (key === 'month') return 'sticky left-0 z-[1] bg-paper-blue-raise py-2.5 text-xs uppercase tracking-[0.08em]';
  if (key === 'income') return 'py-2.5 text-right tabular-nums text-accent';
  if (key === 'savings') return cn('py-2.5 text-right tabular-nums', { 'text-neg': net < 0 });
  return cn('py-2.5 tabular-nums', key === 'status' ? '!px-0 text-center text-muted' : 'text-right');
}

function RateMeter({ rate, target }: { rate: number | null; target: number }) {
  const fill = Math.max(0, Math.min(100, (rate ?? 0) * 100));
  const marker = Math.max(0, Math.min(100, target * 100));

  return (
    <div className="flex items-center justify-end gap-2.5">
      <span className="shrink-0 text-xs tabular-nums">{percent(rate)}</span>
      <div className="relative h-1.5 min-w-0 flex-1 max-w-16 rounded-full bg-accent-soft" title={`${percent(rate)} · ${percent(target)}`}>
        <i className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${fill}%` }} />
        <span className="absolute inset-y-[-1.5px] w-0.5 rounded-full bg-ink/55" style={{ left: `calc(${marker}% - 1px)` }} aria-hidden />
      </div>
    </div>
  );
}
