import { Fragment, useCallback, useState } from 'react';
import PeriodNav from '../../components/PeriodNav.js';
import Button from '../../components/Button.js';
import Badge from '../../components/Badge.js';
import ConfirmModal from '../../components/ConfirmModal.js';
import EmptyState from '../../components/EmptyState.js';
import Icon from '../../components/Icon.js';
import Section from '../../components/Section.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import { DateDivider, TableColGroup, TableHeader, TableRow } from '../../components/Table.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { accountLabel, compareLedgerEntries, currentPeriod, entryMoney, shortDate, signedMoney, timeStamp } from '../../lib/format.js';
import { LEDGER_COLUMN_WIDTHS } from '../../lib/config.js';

import type { Column } from '../../components/Table.js';
import type { EntryType, LedgerEntry, RecurringRule, Transaction, Transfer } from '../../types.js';
const FILTERS: { key: EntryType | ''; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expenses' },
  { key: 'transfer', label: 'Transfers' },
];

export default function TransactionsView() {
  const { profileId, version, bump } = useProfile();
  const [period, setPeriod] = useState(currentPeriod);
  const [type, setType] = useState<EntryType | ''>('');
  const [confirm, setConfirm] = useState<{ kind: 'delete'; entry: LedgerEntry } | { kind: 'stop'; ruleId: number } | null>(null);

  const transactionQuery = `year=${period.year}&month=${period.month}${type === 'income' || type === 'expense' ? `&type=${type}` : ''}`;
  const transferQuery = `year=${period.year}&month=${period.month}`;
  const { data: transactionRows, error: transactionError } = useFetch<Transaction[]>(
    type === 'transfer' ? null : `/profiles/${profileId}/transactions?${transactionQuery}`,
    [profileId, period.year, period.month, type, version]
  );
  const { data: transferRows, error: transferError } = useFetch<Transfer[]>(
    type === 'income' || type === 'expense' ? null : `/profiles/${profileId}/transfers?${transferQuery}`,
    [profileId, period.year, period.month, type, version]
  );
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

  const remove = (entry: LedgerEntry) => setConfirm({ kind: 'delete', entry });

  const stopRule = (id: number) => setConfirm({ kind: 'stop', ruleId: id });

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
          <Icon src="arrows-left-right" type="white" className="inline-flex h-4 w-4 align-[-3px]" title="Transfer" />
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
          return `${accountLabel(t.from_account_name, crossProfile ? t.from_profile_name : null)} → ${accountLabel(t.to_account_name, crossProfile ? t.to_profile_name : null)}`;
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
      render: (t) => entryMoney(t.type, t.amount),
    },
    {
      key: 'actions', label: '', align: 'none', cellKind: 'action',
      width: LEDGER_COLUMN_WIDTHS.actions,
      render: (t) => (
        <Button variant="danger" size="sm" onClick={() => remove(t)} aria-label={`Delete ${t.concept}`}>
          ✕
        </Button>
      ),
    },
  ];

  const getBgColor = (t: LedgerEntry): 'Blue' | 'Green' | 'Red' | 'Yellow' | undefined => {
    if (t.type === 'income') return 'Green';
    if (t.type === 'expense') return 'Blue';
    if (t.type === 'transfer') return 'Yellow';
    return undefined;
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 pt-[22px]">
        <PeriodNav year={period.year} month={period.month} onChange={setPeriod} />
        <SegmentedControl
          ariaLabel="Filter by type"
          items={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
          value={type}
          onChange={setType}
        />
      </div>

      <Section title="Ledger" summary={rows ? `${rows.length} entries` : undefined}>
        {error && <p className="text-neg text-sm">{error}</p>}
        {rows && rows.length === 0 && <EmptyState>Nothing recorded this month. Add an entry to start the page.</EmptyState>}
        {rows && rows.length > 0 && (
          <table className="w-full table-fixed border-collapse text-sm">
            <TableColGroup columns={columns} />
            <TableHeader columns={columns} />
            <tbody>
              {rows.map((t, idx) => {
                const previousDate = idx > 0 ? rows[idx - 1].txn_date : '';

                return (
                  <Fragment key={`${t.type}-${t.id}`}>
                    {t.txn_date !== previousDate && <DateDivider colSpan={columns.length}>{shortDate(t.txn_date)}</DateDivider>}
                    <TableRow row={t} columns={columns} bgColor={getBgColor(t)} />
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
                  <Button variant="link" onClick={() => stopRule(r.id)}>Stop</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

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
          variant={confirm.kind === 'delete' ? 'danger-active' : 'primary'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
