import cn from 'classnames';
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react';
import Button from '../../components/Button.js';
import NumberInput from '../../components/NumberInput.js';
import EmptyState from '../../components/EmptyState.js';
import Donut from '../../components/Donut.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useI18n } from '../../i18n.js';
import { currentPeriod, money, percent } from '../../lib/format.js';
import type { AnnualMonth, AnnualSummary } from '../../types.js';

const DEFAULT_TARGET = 0.5;
const targetKey = (profileId: number | null) => `HoneyHold.savingsRateTarget.${profileId}`;
const WIDTHS_KEY = 'HoneyHold.annualColWidths';

type Align = 'left' | 'right' | 'center';
interface ColumnDef {
  key: string;
  labelKey: string;
  min: number; // px — the column can never collapse below this
  def: number; // px — default width
  align: Align;
}

// Order MUST match the body cells rendered in MonthRow / opening / total rows.
const COLUMNS: ColumnDef[] = [
  { key: 'month', labelKey: 'annual.month', min: 76, def: 116, align: 'left' },
  { key: 'income', labelKey: 'annual.colIncome', min: 92, def: 128, align: 'right' },
  { key: 'expense', labelKey: 'annual.colExpense', min: 92, def: 118, align: 'right' },
  { key: 'savings', labelKey: 'annual.colSavings', min: 92, def: 128, align: 'right' },
  { key: 'rate', labelKey: 'annual.colRate', min: 128, def: 172, align: 'right' },
  { key: 'balance', labelKey: 'annual.colBalance', min: 100, def: 148, align: 'right' },
  { key: 'status', labelKey: 'annual.colStatus', min: 72, def: 92, align: 'center' },
];

type Widths = Record<string, number>;

function loadWidths(): Widths {
  const widths: Widths = Object.fromEntries(COLUMNS.map((c) => [c.key, c.def]));
  try {
    const saved = JSON.parse(localStorage.getItem(WIDTHS_KEY) || '{}') as Record<string, unknown>;
    for (const c of COLUMNS) {
      const v = Number(saved[c.key]);
      if (Number.isFinite(v) && v >= c.min) widths[c.key] = v;
    }
  } catch { /* corrupt or empty — fall back to defaults */ }
  return widths;
}

/** Column widths in px, with pointer-drag + keyboard resizing and localStorage persistence. */
function useColumnWidths() {
  const [widths, setWidths] = useState<Widths>(loadWidths);
  const [resizingKey, setResizingKey] = useState<string | null>(null);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;
  const drag = useRef<{ key: string; startX: number; startW: number; min: number } | null>(null);

  const persist = (w: Widths) => {
    try { localStorage.setItem(WIDTHS_KEY, JSON.stringify(w)); } catch { /* private mode, etc. */ }
  };

  const onMove = useCallback((e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const next = Math.max(d.min, d.startW + (e.clientX - d.startX));
    setWidths((w) => (w[d.key] === next ? w : { ...w, [d.key]: next }));
  }, []);

  const onUp = useCallback(() => {
    drag.current = null;
    setResizingKey(null);
    window.removeEventListener('pointermove', onMove);
    persist(widthsRef.current);
  }, [onMove]);

  const startResize = useCallback((e: ReactPointerEvent, key: string, min: number) => {
    e.preventDefault();
    drag.current = { key, startX: e.clientX, startW: widthsRef.current[key] ?? min, min };
    setResizingKey(key);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [onMove, onUp]);

  const nudge = useCallback((key: string, min: number, delta: number) => {
    setWidths((w) => {
      const updated = { ...w, [key]: Math.max(min, (w[key] ?? min) + delta) };
      persist(updated);
      return updated;
    });
  }, []);

  useEffect(() => () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  }, [onMove, onUp]);

  const total = useMemo(() => COLUMNS.reduce((sum, c) => sum + (widths[c.key] ?? c.def), 0), [widths]);

  return { widths, total, resizingKey, startResize, nudge };
}

interface Props {
  year: number;
}

export default function AnnualOverview({ year }: Props) {
  const { profileId, version } = useProfile();
  const { t, tl } = useI18n();
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const { widths, total, resizingKey, startResize, nudge } = useColumnWidths();

  const { data, loading, error } = useFetch<AnnualSummary>(
    profileId ? `/profiles/${profileId}/annual-summary?year=${year}` : null,
    [profileId, year, version]
  );

  // The savings-rate target is a personal benchmark, kept per profile in the browser.
  useEffect(() => {
    const saved = Number(localStorage.getItem(targetKey(profileId)));
    setTarget(Number.isFinite(saved) && saved > 0 ? saved : DEFAULT_TARGET);
  }, [profileId]);

  function saveTarget(ratio: number) {
    setTarget(ratio);
    localStorage.setItem(targetKey(profileId), String(ratio));
  }

  if (error) return <EmptyState className="text-neg">{t('annual.loadError', { error })}</EmptyState>;
  if (!data) return <EmptyState>{loading ? t('common.loading') : ''}</EmptyState>;

  const months = tl('chart.months');
  const now = currentPeriod();
  const dataMonths = data.months.filter((m) => m.hasData);
  const metCount = dataMonths.filter((m) => m.savingsRate != null && m.savingsRate >= target).length;

  // Only months that added to savings can take a slice of the "who contributed" pie.
  const contributionSlices = data.months
    .filter((m) => m.net > 0)
    .map((m) => ({ label: months[m.month - 1], value: m.net }));

  if (dataMonths.length === 0) return <EmptyState>{t('annual.empty')}</EmptyState>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5 mb-6">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Stat label={t('annual.savedThisYear')} value={money(data.totals.net)} accent={data.totals.net >= 0} negative={data.totals.net < 0} />
          <Stat label={t('annual.avgRate')} value={percent(data.totals.savingsRate)} />
          <Stat label={t('annual.monthsMet')} value={`${metCount} / ${dataMonths.length}`} />
        </div>
        <TargetEditor target={target} onSave={saveTarget} />
      </div>

      <div className={cn('overflow-x-auto -mx-1 px-1', { 'select-none cursor-col-resize': resizingKey })}>
        <table className="table-fixed border-collapse text-sm" style={{ width: total }}>
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: widths[col.key] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-hairline">
              {COLUMNS.map((col, i) => (
                <th
                  key={col.key}
                  className={cn(
                    'relative py-2 pr-3 align-bottom text-xs font-semibold uppercase tracking-[0.12em] text-muted',
                    col.align === 'left' && 'text-left',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center pr-0',
                    i === 0 && 'sticky left-0 z-[2] bg-paper-blue'
                  )}
                >
                  <span className="block truncate">{t(col.labelKey)}</span>
                  {/* Every internal divider gets a handle; the last column has no divider to its right. */}
                  {i < COLUMNS.length - 1 && (
                    <ResizeHandle
                      label={t(col.labelKey)}
                      active={resizingKey === col.key}
                      onStart={(e) => startResize(e, col.key, col.min)}
                      onNudge={(delta) => nudge(col.key, col.min, delta)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-hairline/60 text-muted">
              <Td className="sticky left-0 z-[1] bg-paper-blue italic" truncate>{t('annual.openingBalance')}</Td>
              <Td className="text-right">—</Td>
              <Td className="text-right">—</Td>
              <Td className="text-right">—</Td>
              <Td className="text-right">—</Td>
              <Td className="text-right font-semibold text-ink tabular-nums">{money(data.openingBalance)}</Td>
              <Td className="text-center pr-0">—</Td>
            </tr>

            {data.months.map((m) => (
              <MonthRow
                key={m.month}
                row={m}
                label={months[m.month - 1]}
                target={target}
                isCurrent={year === now.year && m.month === now.month}
                t={t}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-hairline bg-paper-blue-raise font-semibold">
              <Td className="sticky left-0 z-[1] bg-paper-blue-raise uppercase tracking-[0.08em] text-xs" truncate>
                {t('annual.total', { year })}
              </Td>
              <Td className="text-right tabular-nums text-accent">{money(data.totals.income)}</Td>
              <Td className="text-right tabular-nums">{money(data.totals.expense)}</Td>
              <Td className={cn('text-right tabular-nums', { 'text-neg': data.totals.net < 0 })}>{money(data.totals.net)}</Td>
              <Td className="text-right tabular-nums">{percent(data.totals.savingsRate)}</Td>
              <Td className="text-right tabular-nums">{money(data.totals.balance)}</Td>
              <Td className="pr-0" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-14 mt-10 pt-8 border-t border-hairline max-lg:grid-cols-1 max-lg:gap-7">
        <div>
          <h3 className="m-0 mb-3 text-sm font-semibold">{t('annual.byCategory')}</h3>
          <Donut data={data.byCategory} emptyNote={t('annual.noExpenses')} />
        </div>
        <div>
          <h3 className="m-0 mb-3 text-sm font-semibold">{t('annual.monthlyContribution')}</h3>
          <Donut
            data={contributionSlices}
            emptyNote={t('annual.noSavings')}
            formatValue={(value, sum) => percent(value / sum)}
          />
        </div>
      </div>
    </div>
  );
}

function ResizeHandle({ label, active, onStart, onNudge }: {
  label: string;
  active: boolean;
  onStart: (e: ReactPointerEvent) => void;
  onNudge: (delta: number) => void;
}) {
  const { t } = useI18n();
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={t('annual.resizeColumn', { column: label })}
      tabIndex={0}
      onPointerDown={onStart}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); onNudge(-16); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); onNudge(16); }
      }}
      className="group absolute top-0 right-0 z-[3] flex h-full w-3 translate-x-1/2 cursor-col-resize touch-none select-none items-stretch justify-center focus:outline-none"
    >
      <span
        className={cn(
          'my-1 w-0.5 rounded-full transition-colors',
          active ? 'bg-accent' : 'bg-transparent group-hover:bg-accent/60 group-focus-visible:bg-accent'
        )}
        aria-hidden
      />
    </span>
  );
}

interface MonthRowProps {
  row: AnnualMonth;
  label: string;
  target: number;
  isCurrent: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function MonthRow({ row, label, target, isCurrent, t }: MonthRowProps) {
  const cellBg = isCurrent ? 'bg-paper-blue-raise' : 'bg-paper-blue';
  const met = row.savingsRate != null && row.savingsRate >= target;

  if (!row.hasData) {
    return (
      <tr className="border-b border-hairline/60 text-muted">
        <Td className={cn('sticky left-0 z-[1]', cellBg)} truncate>{label}</Td>
        <Td className="text-center" colSpan={5}>—</Td>
        <Td className="text-center pr-0">—</Td>
      </tr>
    );
  }

  return (
    <tr className={cn('border-b border-hairline/60 transition-colors', { 'bg-paper-blue-raise': isCurrent })}>
      <Td className={cn('sticky left-0 z-[1] font-medium', cellBg, { 'text-accent': isCurrent })} truncate>{label}</Td>
      <Td className="text-right tabular-nums text-accent">{money(row.income)}</Td>
      <Td className="text-right tabular-nums">{money(row.expense)}</Td>
      <Td className={cn('text-right tabular-nums font-semibold', { 'text-neg': row.net < 0 })}>{money(row.net)}</Td>
      <Td className="pr-3">
        <RateMeter rate={row.savingsRate} target={target} met={met} />
      </Td>
      <Td className="text-right tabular-nums font-semibold">{money(row.balance)}</Td>
      <Td className="text-center pr-0"><StatusDot met={met} label={t(met ? 'annual.met' : 'annual.missed')} /></Td>
    </tr>
  );
}

// Semantic "on target" green — kept apart from the blue accent so met/missed reads at a glance.
const MET_GREEN = '#16a34a';

function RateMeter({ rate, target, met }: { rate: number | null; target: number; met: boolean }) {
  const fill = Math.max(0, Math.min(100, (rate ?? 0) * 100));
  const mark = Math.max(0, Math.min(100, target * 100));

  return (
    <div className="flex items-center justify-end gap-2.5">
      {/* Number is sized to its content (min 3rem so normal values stay aligned) and never shrinks,
          so an extreme rate like "-231.543,0 %" grows the cell instead of overlapping the bar. */}
      <span className={cn('shrink-0 min-w-[3rem] text-right text-xs tabular-nums', met ? 'text-ink font-medium' : 'text-muted')}>{percent(rate)}</span>
      {/* Bar fills to the savings rate; the tick marks the target — passing it means "met".
          min-w-0 lets it yield space to the number so they can't collide. */}
      <div className="relative h-1.5 min-w-0 flex-1 max-w-16 rounded-full bg-accent-soft" title={`${percent(rate)} · ${percent(target)}`}>
        <i className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${fill}%` }} />
        <span className="absolute inset-y-[-1.5px] w-0.5 rounded-full bg-ink/55" style={{ left: `calc(${mark}% - 1px)` }} aria-hidden />
      </div>
    </div>
  );
}

function StatusDot({ met, label }: { met: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        met ? 'bg-paper-green' : 'bg-paper-red'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: met ? MET_GREEN : 'rgb(var(--neg))' }} aria-hidden />
      {label}
    </span>
  );
}

function TargetEditor({ target, onSave }: { target: number; onSave: (ratio: number) => void }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(Math.round(target * 100)));

  function submit(e: FormEvent) {
    e.preventDefault();
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    onSave(pct / 100);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted">{t('annual.targetLabel')}</span>
        <span className="font-semibold tabular-nums">{percent(target)}</span>
        <Button variant="link" onClick={() => { setValue(String(Math.round(target * 100))); setEditing(true); }}>
          {t('goals.editTarget')}
        </Button>
      </div>
    );
  }

  return (
    <form className="flex items-center gap-2" onSubmit={submit}>
      <span className="text-xs text-muted">{t('annual.targetLabel')}</span>
      <NumberInput
        inputMode="numeric"
        min="0"
        max="100"
        increment={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        aria-label={t('annual.targetLabel')}
        className="w-24"
        decreaseLabel={t('common.decrease')}
        increaseLabel={t('common.increase')}
      />
      <span className="text-muted">%</span>
      <Button variant="primary" size="md" type="submit">{t('common.save')}</Button>
      <Button variant="ghost" size="md" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
    </form>
  );
}

function Stat({ label, value, accent, negative }: { label: string; value: string; accent?: boolean; negative?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <span className={cn('text-2xl font-semibold tabular-nums', { 'text-accent': accent && !negative, 'text-neg': negative })}>
        {value}
      </span>
    </div>
  );
}

function Td({ children, className, colSpan, truncate }: { children?: ReactNode; className?: string; colSpan?: number; truncate?: boolean }) {
  return (
    <td colSpan={colSpan} className={cn('py-2.5 pr-3 align-middle overflow-hidden whitespace-nowrap', className)}>
      {truncate ? <span className="block truncate">{children}</span> : children}
    </td>
  );
}
