import { Fragment, useCallback, useMemo, useState } from 'react';
import PeriodNav from '../../components/PeriodNav.js';
import Button from '../../components/Button.js';
import Badge from '../../components/Badge.js';
import ConfirmModal from '../../components/ConfirmModal.js';
import DualRangeSlider from '../../components/DualRangeSlider.js';
import EmptyState from '../../components/EmptyState.js';
import FilterPopover from '../../components/FilterPopover.js';
import Icon from '../../components/Icon.js';
import Section from '../../components/Section.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import { DateDivider, TableColGroup, TableHeader, TableRow } from '../../components/Table.js';
import TransactionModal from './TransactionModal.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { accountLabel, compareLedgerEntries, currentPeriod, entryMoney, money, shortDate, signedMoney, timeStamp } from '../../lib/format.js';
import { LEDGER_COLUMN_WIDTHS } from '../../lib/config.js';
import { searchItems, type SearchField } from '../../lib/search.js';

import type { Column } from '../../components/Table.js';
import type { Account, EntryType, LedgerEntry, RecurringRule, Transaction, Transfer } from '../../types.js';

const FILTERS: { key: EntryType | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expenses' },
  { key: 'transfer', label: 'Transfers' },
];

const AMOUNT_SLIDER_MAX = 5000;

type DateFilter = { mode: 'month' } | { mode: 'range'; from: string; to: string } | { mode: 'all' };

export default function TransactionsView() {
  const { profileId, version, bump } = useProfile();
  const [period, setPeriod] = useState(currentPeriod);
  const [type, setType] = useState<EntryType | ''>('');
  const [query, setQuery] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>({ mode: 'month' });
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'delete'; entry: LedgerEntry } | { kind: 'stop'; ruleId: number } | null>(null);

  const dateQuery = dateParams(dateFilter, period);
  const transactionParams = new URLSearchParams({ ...dateQuery, limit: '1000' });
  if (type === 'income' || type === 'expense') transactionParams.set('type', type);
  const transferParams = new URLSearchParams({ ...dateQuery, limit: '1000' });
  const transactionQuery = transactionParams.toString();
  const transferQuery = transferParams.toString();
  const { data: transactionRows, error: transactionError } = useFetch<Transaction[]>(
    type === 'transfer' ? null : `/profiles/${profileId}/transactions?${transactionQuery}`,
    [profileId, transactionQuery, type, version]
  );
  const { data: transferRows, error: transferError } = useFetch<Transfer[]>(
    type === 'income' || type === 'expense' ? null : `/profiles/${profileId}/transfers?${transferQuery}`,
    [profileId, transferQuery, type, version]
  );
  const { data: accounts } = useFetch<Account[]>(`/profiles/${profileId}/accounts?include_cross=1`, [profileId]);
  const { data: tags } = useFetch<{ id: number; name: string }[]>(`/profiles/${profileId}/tags`, [profileId]);
  const { data: rules } = useFetch<RecurringRule[]>(`/profiles/${profileId}/recurring`, [profileId, version]);

  function getRows() {
    if (type === 'transfer' || type === 'income' || type === 'expense') {
      if (type === 'transfer') return transferRows;
      return transactionRows;
    }
    if (!transactionRows || !transferRows) return null;
    return [...transactionRows, ...transferRows].sort(compareLedgerEntries);
  }

  const rows = getRows();
  const error = transactionError || transferError;
  const minAmount = parseAmount(amountMin);
  const maxAmount = parseAmount(amountMax);
  const amountFiltering = minAmount != null || maxAmount != null;
  const filtering = !!query.trim() || selectedAccounts.length > 0 || selectedTags.length > 0 || amountFiltering || dateFilter.mode !== 'month' || type !== '';

  const accountOptions = useMemo(() => (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: account.profile_id && account.profile_id !== profileId ? accountLabel(account.name, account.profile_name) : account.name,
  })), [accounts, profileId]);
  const tagOptions = useMemo(() => (tags ?? []).map((tag) => ({ value: tag.name, label: tag.name })), [tags]);

  const searchFields = useMemo<SearchField<LedgerEntry>[]>(() => [
    { key: 'concept', score: 100, text: (entry) => entry.concept },
    { key: 'tag', score: 70, text: (entry) => entryTag(entry) },
    { key: 'counterparty', score: 70, text: (entry) => entry.type === 'transfer' ? 'Transfer' : entry.counterparty || '' },
    { key: 'account', score: 45, text: (entry) => entryAccountText(entry, profileId) },
    { key: 'amount', score: 25, text: (entry) => [String(entry.amount), money(entry.amount), entryMoney(entry, profileId)] },
    { key: 'date', score: 15, text: (entry) => [entry.txn_date, shortDate(entry.txn_date), timeStamp(entry.created_at)] },
    { key: 'ids', score: 5, exactOnly: true, text: entryIds },
  ], [profileId]);

  const shownRows = useMemo(() => {
    if (!rows) return null;
    const narrowed = rows.filter((entry) => passesEntryFilters(entry, selectedAccounts, selectedTags, minAmount, maxAmount));
    return searchItems(narrowed, query, searchFields, { fuzzyDistance: 1, fuzzyWeight: 0.1 });
  }, [rows, selectedAccounts, selectedTags, minAmount, maxAmount, query, searchFields]);
  const summary = rows && shownRows
    ? filtering ? `${shownRows.length}/${rows.length} entries` : `${shownRows.length} entries`
    : undefined;

  function remove(entry: LedgerEntry) { setConfirm({ kind: 'delete', entry }); }
  function stopRule(id: number) { setConfirm({ kind: 'stop', ruleId: id }); }

  function resetFilters() {
    setPeriod(currentPeriod());
    setType('');
    setQuery('');
    setSelectedAccounts([]);
    setSelectedTags([]);
    setAmountMin('');
    setAmountMax('');
    setDateFilter({ mode: 'month' });
  }

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      const { entry } = confirm;
      await api.del(entry.type === 'transfer' ? `/transfers/${entry.id}` : `/transactions/${entry.id}`);
    } else {
      await api.del(`/recurring/${confirm.ruleId}`);
    }
    setConfirm(null);
    bump();
  }, [confirm]);

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'date', label: 'Date', align: 'left', cellKind: 'muted',
      width: LEDGER_COLUMN_WIDTHS.date,
      render: (t) => timeStamp(t.created_at),
    },
    {
      key: 'concept', label: 'Concept', align: 'left', cellKind: 'text',
      width: LEDGER_COLUMN_WIDTHS.concept,
      truncate: true,
      render: (t) => (
        <>
          {t.concept}
          {t.type !== 'transfer' && t.is_fixed === 1 && <Badge className="ml-2">fixed</Badge>}
          {t.source === 'automated' && <Badge className="ml-2">auto</Badge>}
        </>
      ),
    },
    {
      key: 'counterparty', label: 'Payer / payee', align: 'left', cellKind: 'muted',
      width: LEDGER_COLUMN_WIDTHS.counterparty,
      truncate: true,
      render: (t) => t.type === 'transfer'
        ? <span className="inline-flex items-center gap-1.5">
          <Icon src="arrows-left-right" type="black" className="inline-flex h-4 w-4 align-[-3px]" title="Transfer" />
          Transfer
        </span>
        : t.counterparty || '—',
    },
    {
      key: 'tag', label: 'Tag', align: 'left', cellKind: 'muted',
      width: LEDGER_COLUMN_WIDTHS.tag,
      truncate: true,
      render: (t) => t.type === 'transfer' ? t.tag_name || 'Transference' : t.tag_name || '—',
    },
    {
      key: 'account', label: 'Account', align: 'left', cellKind: 'muted',
      width: LEDGER_COLUMN_WIDTHS.account,
      truncate: true,
      render: (t) => {
        if (t.type === 'transfer') {
          const crossProfile = t.from_profile_id !== t.to_profile_id;
          return (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="truncate">{accountLabel(t.from_account_name, crossProfile ? t.from_profile_name : null)}</span>
              <Icon src="arrow-right" type="white" title="" disabled className="m-0 h-3 w-3 shrink-0" />
              <span className="truncate">{accountLabel(t.to_account_name, crossProfile ? t.to_profile_name : null)}</span>
            </span>
          );
        }

        if (!t.account_name) return '—';
        return t.account_profile_id && t.account_profile_id !== profileId
          ? accountLabel(t.account_name, t.account_profile_name)
          : t.account_name;
      },
    },
    {
      key: 'amount', label: 'Amount', align: 'right', cellKind: 'amount',
      width: LEDGER_COLUMN_WIDTHS.amount,
      cellClassName: (t) => t.type === 'income' ? 'text-accent' : '',
      render: (t) => entryMoney(t, profileId),
    },
    {
      key: 'actions', label: '', align: 'none', cellKind: 'action',
      width: LEDGER_COLUMN_WIDTHS.actions,
      render: (t) => (
        <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); remove(t); }} aria-label={`Delete ${t.concept}`}>
          ✕
        </Button>
      ),
    },
  ];

  function getBgColor(t: LedgerEntry): 'Blue' | 'Green' | 'Red' | 'Yellow' | undefined {
    if (t.type === 'income') return 'Green';
    if (t.type === 'expense') return 'Blue';
    if (t.type === 'transfer') return 'Yellow';
    return undefined;
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 pt-[22px]">
        <PeriodNav year={period.year} month={period.month} disabled={dateFilter.mode !== 'month'} onChange={setPeriod} />
        <SegmentedControl
          ariaLabel="Filter by type"
          items={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
          value={type}
          onChange={setType}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-md bg-white/35 p-3 shadow-[0_0_0_1px_rgba(89,113,134,0.12)]">
        <div className="flex flex-col gap-2">
          <span>Search ledger</span>
          <div className="flex min-w-0 w-full flex-1 gap-1">
            <span className="relative w-full">
              <Icon src="search" type="black" title="" disabled className="pointer-events-none absolute left-3 top-1/2 m-0 h-4 w-4 opacity-45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search concept, payer, tag, account, amount, date or ID"
                className="w-full rounded-lg border border-hairline bg-white/70 py-2 pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_rgba(90,151,183,0.18)]"
              />
            </span>
            <Button variant="ghost" size="md" onClick={resetFilters} disabled={!filtering} className="self-end whitespace-nowrap">
              Clear filters
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPopover label={selectedAccounts.length ? `Accounts · ${selectedAccounts.length}` : 'Accounts'} active={selectedAccounts.length > 0} buttonClassName="w-[104px]">
            <ChoiceList options={accountOptions} selected={selectedAccounts} onToggle={(value) => setSelectedAccounts(toggleValue(selectedAccounts, value))} empty="No accounts" />
          </FilterPopover>

          <FilterPopover label={selectedTags.length ? `Tags · ${selectedTags.length}` : 'Tags'} active={selectedTags.length > 0} buttonClassName="w-[86px]">
            <ChoiceList options={tagOptions} selected={selectedTags} onToggle={(value) => setSelectedTags(toggleValue(selectedTags, value))} empty="No tags" />
          </FilterPopover>

          <FilterPopover label={amountFilterLabel(minAmount, maxAmount)} active={amountFiltering} buttonClassName={`w-[132px]${amountFiltering ? ' font-mono tabular-nums' : ''}`}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Min
                  <input type="number" min="0" step="0.01" value={amountMin} onChange={(event) => setAmountMin(event.target.value)} placeholder="0" />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  Max
                  <input type="number" min="0" step="0.01" value={amountMax} onChange={(event) => setAmountMax(event.target.value)} placeholder="No max" />
                </label>
              </div>
              <DualRangeSlider
                min={0}
                max={AMOUNT_SLIDER_MAX}
                minGap={100}
                minValue={minAmount ?? 0}
                maxValue={maxAmount}
                onChange={(next) => {
                  setAmountMin(next.min > 0 ? String(next.min) : '');
                  setAmountMax(next.max == null ? '' : String(next.max));
                }}
              />
            </div>
          </FilterPopover>

          <FilterPopover label={dateFilterLabel(dateFilter, period)} active={dateFilter.mode !== 'month'} buttonClassName="w-[200px]">
            <DateFilterPanel
              dateFilter={dateFilter}
              period={period}
              onChange={setDateFilter}
              onThisMonth={() => {
                setPeriod(currentPeriod());
                setDateFilter({ mode: 'month' });
              }}
            />
          </FilterPopover>
        </div>
      </div>

      <Section title="Ledger" summary={summary} hideBorder>
        {error && <p className="text-neg text-sm">{error}</p>}
        {shownRows && shownRows.length === 0 && <EmptyState>{filtering ? 'No entries match these filters.' : 'Nothing recorded this month. Add an entry to start the page.'}</EmptyState>}
        {shownRows && shownRows.length > 0 && (
          <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
            <TableColGroup columns={columns} />
            <TableHeader columns={columns} />
            <tbody>
              {shownRows.map((t, idx) => {
                const previousDate = idx > 0 ? shownRows[idx - 1].txn_date : '';
                const nextDate = idx < shownRows.length - 1 ? shownRows[idx + 1].txn_date : '';
                const rowPosition = t.txn_date !== previousDate
                  ? t.txn_date !== nextDate ? 'single' : 'first'
                  : t.txn_date !== nextDate ? 'last' : 'middle';

                return (
                  <Fragment key={`${t.type}-${t.id}`}>
                    {t.txn_date !== previousDate && <DateDivider colSpan={columns.length}>{shortDate(t.txn_date)}</DateDivider>}
                    <TableRow row={t} columns={columns} bgColor={getBgColor(t)} position={rowPosition} onClick={setEditing} />
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Fixed rules" summary="Recurring entries created from &quot;Is fixed?&quot;">
        {rules && rules.length === 0 && <EmptyState>No active rules. Turn on &quot;Is fixed?&quot; when adding an entry to create one.</EmptyState>}
        {rules && rules.length > 0 && (
          <ul className="list-none m-0 p-0">
            {rules.map((r) => (
              <li key={r.id} className="flex justify-between items-baseline gap-4 py-[11px] border-b border-hairline last:border-b-0">
                <span>
                  {r.concept}
                  <span className="ml-2 text-xs text-muted">{r.frequency} · {r.account_name} · next {shortDate(r.next_due)}</span>
                </span>
                <span className="flex items-baseline gap-[18px]">
                  <span className={`font-semibold whitespace-nowrap tabular-nums${r.type === 'income' ? ' text-accent' : ''}`}>{signedMoney(r.type, r.amount)}</span>
                  <Button variant="danger-active" size="sm" onClick={() => stopRule(r.id)}>Stop</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {editing && <TransactionModal entry={editing} onClose={() => setEditing(null)} />}

      {confirm && (
        <ConfirmModal
          open
          title={confirm.kind === 'delete' ? 'Delete entry?' : 'Stop fixed rule?'}
          message={
            confirm.kind === 'delete'
              ? 'Delete this entry from the ledger?'
              : 'Stop this fixed rule? Past entries stay in the ledger.'
          }
          confirmLabel={confirm.kind === 'delete' ? 'Delete' : 'Stop'}
          variant="danger-active"
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function ChoiceList({ options, selected, onToggle, empty }: { options: { value: string; label: string }[]; selected: string[]; onToggle: (value: string) => void; empty: string }) {
  if (options.length === 0) return <p className="m-0 text-sm text-muted">{empty}</p>;

  return (
    <div className="flex max-h-[260px] flex-wrap gap-2 overflow-auto pr-1">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] ${active ? 'border border-accent bg-accent text-white' : 'border border-hairline bg-white/60 text-ink hover:bg-accent-soft'}`}
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
  const range = dateInputRange(dateFilter, period);
  const year = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          From
          <input type="date" value={range.from} onChange={(event) => onChange({ mode: 'range', from: event.target.value, to: range.to })} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          To
          <input type="date" value={range.to} onChange={(event) => onChange({ mode: 'range', from: range.from, to: event.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onThisMonth}>This month</Button>
        <Button variant="outline" size="sm" onClick={() => onChange({ mode: 'range', from: `${year}-01-01`, to: `${year}-12-31` })}>This year</Button>
        <Button variant="outline" size="sm" onClick={() => onChange({ mode: 'all' })}>All time</Button>
      </div>
    </div>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function dateParams(filter: DateFilter, period: { year: number; month: number }) {
  if (filter.mode === 'all') return {};
  if (filter.mode === 'range') {
    return Object.fromEntries(Object.entries({ from: filter.from, to: filter.to }).filter(([, value]) => value));
  }
  return { year: String(period.year), month: String(period.month) };
}

function dateInputRange(filter: DateFilter, period: { year: number; month: number }) {
  if (filter.mode === 'all') return { from: '', to: '' };
  if (filter.mode === 'range') return { from: filter.from, to: filter.to };
  return monthRangeISO(period.year, period.month);
}

function dateFilterLabel(filter: DateFilter, period: { year: number; month: number }) {
  if (filter.mode === 'all') return 'All time';
  if (filter.mode === 'month') return 'Date';
  const range = dateInputRange(filter, period);
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span>{range.from || 'Any'}</span>
      <Icon src="arrow-right" type="white" title="" disabled className="m-0 h-3 w-3 shrink-0" />
      <span>{range.to || 'Any'}</span>
    </span>
  );
}

function monthRangeISO(year: number, month: number) {
  const start = `${year}-${pad(month)}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  return { from: start, to: endDate.toISOString().slice(0, 10) };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function amountFilterLabel(min: number | null, max: number | null) {
  if (min == null && max == null) return 'Amount';
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span>{min ?? 0}€</span>
      <Icon src="arrow-right" type="white" title="" disabled className="m-0 h-3 w-3 shrink-0" />
      {max == null ? <Icon src="infinity" type="white" title="No maximum" disabled className="m-0 h-3.5 w-3.5 shrink-0" /> : <span>{max}€</span>}
    </span>
  );
}

function passesEntryFilters(entry: LedgerEntry, accounts: string[], tags: string[], minAmount: number | null, maxAmount: number | null) {
  if (accounts.length > 0 && !entryAccountIds(entry).some((id) => accounts.includes(id))) return false;
  if (tags.length > 0 && !tags.includes(entryTag(entry))) return false;

  const amount = Math.abs(Number(entry.amount) || 0);
  if (minAmount != null && amount < minAmount) return false;
  if (maxAmount != null && amount > maxAmount) return false;
  return true;
}

function entryTag(entry: LedgerEntry) {
  return entry.type === 'transfer' ? entry.tag_name || 'Transference' : entry.tag_name || '';
}

function entryAccountIds(entry: LedgerEntry) {
  if (entry.type === 'transfer') return [String(entry.from_account_id), String(entry.to_account_id)];
  return entry.account_id ? [String(entry.account_id)] : [];
}

function entryAccountText(entry: LedgerEntry, profileId: number | null) {
  if (entry.type === 'transfer') {
    const crossProfile = entry.from_profile_id !== entry.to_profile_id;
    const from = accountLabel(entry.from_account_name, crossProfile ? entry.from_profile_name : null);
    const to = accountLabel(entry.to_account_name, crossProfile ? entry.to_profile_name : null);
    return [from, to, `${from} ${to}`];
  }

  if (!entry.account_name) return '';
  return entry.account_profile_id && entry.account_profile_id !== profileId
    ? accountLabel(entry.account_name, entry.account_profile_name)
    : entry.account_name;
}

function entryIds(entry: LedgerEntry) {
  return entry.type === 'transfer'
    ? [String(entry.id), String(entry.from_account_id), String(entry.to_account_id)]
    : [String(entry.id), entry.account_id ? String(entry.account_id) : ''];
}
