import cn from 'classnames';
import Button from '../../components/Button.js';
import DualRangeSlider from '../../components/DualRangeSlider.js';
import FilterPopover from '../../components/FilterPopover.js';
import Icon from '../../components/Icon.js';
import { useI18n } from '../../i18n.js';
import { AMOUNT_SLIDER_MAX, dateInputRange, toggleValue } from './transactionFilters.js';
import type { ChoiceOption, DateFilter, TransactionFilters } from './transactionFilters.js';

interface LedgerFiltersProps {
  filters: TransactionFilters;
  filtering: boolean;
  amountFiltering: boolean;
  minAmount: number | null;
  maxAmount: number | null;
  period: { year: number; month: number };
  accountOptions: ChoiceOption[];
  tagOptions: ChoiceOption[];
  onChange: (patch: Partial<TransactionFilters>) => void;
  onReset: () => void;
  onThisMonth: () => void;
}

export default function LedgerFilters({
  filters,
  filtering,
  amountFiltering,
  minAmount,
  maxAmount,
  period,
  accountOptions,
  tagOptions,
  onChange,
  onReset,
  onThisMonth,
}: LedgerFiltersProps) {
  const { t } = useI18n();
  const { query, accounts, tags, amountMin, amountMax, date } = filters;

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-lg border border-hairline bg-paper-blue-raise/35 p-3">
      <div className="flex flex-col gap-2">
        <span>{t('filters.searchLedger')}</span>
        <div className="flex min-w-0 w-full flex-1 gap-1">
          <span className="relative w-full">
            <Icon src="search" type="black" title="" className="pointer-events-none absolute left-3 top-1/2 m-0 h-4 w-4 opacity-45" />
            <input
              value={query}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder={t('filters.searchPlaceholder')}
              className="w-full rounded-lg border border-hairline bg-paper-blue-raise/70 py-2 pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </span>
          <Button variant="ghost" size="md" onClick={onReset} disabled={!filtering} className="h-10 self-end whitespace-nowrap">
            {t('filters.clear')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPopover label={accounts.length ? t('filters.accountsCount', { count: accounts.length }) : t('common.accounts')} active={accounts.length > 0} buttonClassName="w-28">
          <ChoiceList options={accountOptions} selected={accounts} onToggle={(value) => onChange({ accounts: toggleValue(accounts, value) })} empty={t('filters.noAccounts')} />
        </FilterPopover>

        <FilterPopover label={tags.length ? t('filters.tagsCount', { count: tags.length }) : t('common.tags')} active={tags.length > 0} buttonClassName="w-24">
          <ChoiceList options={tagOptions} selected={tags} onToggle={(value) => onChange({ tags: toggleValue(tags, value) })} empty={t('filters.noTags')} />
        </FilterPopover>

        <FilterPopover label={amountFilterLabel(minAmount, maxAmount, t)} active={amountFiltering} buttonClassName="w-36 tabular-nums">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                {t('common.min')}
                <input type="number" min="0" step="0.01" value={amountMin} onChange={(event) => onChange({ amountMin: event.target.value })} placeholder="0" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                {t('common.max')}
                <input type="number" min="0" step="0.01" value={amountMax} onChange={(event) => onChange({ amountMax: event.target.value })} placeholder={t('common.noMax')} />
              </label>
            </div>
            <DualRangeSlider
              min={0}
              max={AMOUNT_SLIDER_MAX}
              minGap={100}
              minValue={minAmount ?? 0}
              maxValue={maxAmount}
              onChange={(next) => onChange({
                amountMin: next.min > 0 ? String(next.min) : '',
                amountMax: next.max == null ? '' : String(next.max),
              })}
            />
          </div>
        </FilterPopover>

        <FilterPopover label={dateFilterLabel(date, period, t)} active={date.mode !== 'month'} buttonClassName="w-52">
          <DateFilterPanel
            dateFilter={date}
            period={period}
            onChange={(next) => onChange({ date: next })}
            onThisMonth={onThisMonth}
          />
        </FilterPopover>
      </div>
    </div>
  );
}

function ChoiceList({ options, selected, onToggle, empty }: { options: ChoiceOption[]; selected: string[]; onToggle: (value: string) => void; empty: string }) {
  if (options.length === 0) return <p className="m-0 text-sm text-muted">{empty}</p>;

  return (
    <div className="flex max-h-64 flex-wrap gap-2 overflow-auto pr-1">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'min-h-10 rounded-xl px-3 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-300 active:duration-75 active:scale-95',
              {
                'border border-accent bg-accent text-white': active,
                'border border-hairline bg-paper-blue-raise/60 text-ink hover:bg-accent-soft': !active,
              }
            )}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function DateFilterPanel({ dateFilter, period, onChange, onThisMonth }: { dateFilter: DateFilter; period: { year: number; month: number }; onChange: (filter: DateFilter) => void; onThisMonth: () => void }) {
  const { t } = useI18n();
  const range = dateInputRange(dateFilter, period);
  const year = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          {t('common.from')}
          <input type="date" value={range.from} onChange={(event) => onChange({ mode: 'range', from: event.target.value, to: range.to })} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          {t('common.to')}
          <input type="date" value={range.to} onChange={(event) => onChange({ mode: 'range', from: range.from, to: event.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onThisMonth}>{t('filters.thisMonth')}</Button>
        <Button variant="outline" size="sm" onClick={() => onChange({ mode: 'range', from: `${year}-01-01`, to: `${year}-12-31` })}>{t('filters.thisYear')}</Button>
        <Button variant="outline" size="sm" onClick={() => onChange({ mode: 'all' })}>{t('filters.allTime')}</Button>
      </div>
    </div>
  );
}

function dateFilterLabel(filter: DateFilter, period: { year: number; month: number }, t: (key: string) => string) {
  if (filter.mode === 'all') return t('filters.allTime');
  if (filter.mode === 'month') return t('common.date');
  const range = dateInputRange(filter, period);
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span>{range.from || t('common.any')}</span>
      <Icon src="arrow-right" type="white" title="" className="m-0 h-3 w-3 shrink-0" />
      <span>{range.to || t('common.any')}</span>
    </span>
  );
}

function amountFilterLabel(min: number | null, max: number | null, t: (key: string) => string) {
  if (min == null && max == null) return t('filters.amount');
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span>{min ?? 0}€</span>
      <Icon src="arrow-right" type="white" title="" className="m-0 h-3 w-3 shrink-0" />
      {max == null ? <Icon src="infinity" type="white" title={t('common.noMaximum')} className="m-0 h-3.5 w-3.5 shrink-0" /> : <span>{max}€</span>}
    </span>
  );
}
