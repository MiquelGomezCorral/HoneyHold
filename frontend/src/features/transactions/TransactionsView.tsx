import { useState } from 'react';
import PeriodNav from '../../components/PeriodNav.js';
import Button from '../../components/Button.js';
import Badge from '../../components/Badge.js';
import EmptyState from '../../components/EmptyState.js';
import Section from '../../components/Section.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import { TableHeader, TableRow } from '../../components/Table.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { currentPeriod, money, shortDate, signedMoney } from '../../lib/format.js';
import type { Column } from '../../components/Table.js';
import type { Transaction, RecurringRule } from '../../types.js';
import type { ReactNode } from 'react';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expenses' },
];

export default function TransactionsView() {
  const { profileId, version, bump } = useProfile();
  const [period, setPeriod] = useState(currentPeriod);
  const [type, setType] = useState('');

  const query = `year=${period.year}&month=${period.month}${type ? `&type=${type}` : ''}`;
  const { data: rows, error } = useFetch<Transaction[]>(
    `/profiles/${profileId}/transactions?${query}`,
    [profileId, period.year, period.month, type, version]
  );
  const { data: rules } = useFetch<RecurringRule[]>(`/profiles/${profileId}/recurring`, [profileId, version]);

  const remove = async (id: number) => {
    if (!window.confirm('Delete this entry from the ledger?')) return;
    await api.del(`/transactions/${id}`);
    bump();
  };

  const stopRule = async (id: number) => {
    if (!window.confirm('Stop this fixed rule? Past entries stay in the ledger.')) return;
    await api.del(`/recurring/${id}`);
    bump();
  };

  const columns: Column<Transaction>[] = [
    { key: 'date', label: 'Date', align: 'left', cellKind: 'muted', render: (t) => shortDate(t.txn_date) },
    {
      key: 'concept', label: 'Concept', align: 'left', cellKind: 'text',
      render: (t) => (
        <>
          {t.concept}
          {t.is_fixed === 1 && <Badge className="ml-2">fixed</Badge>}
          {t.source === 'automated' && <Badge className="ml-2">auto</Badge>}
        </>
      ),
    },
    { key: 'counterparty', label: 'Payer / payee', align: 'left', cellKind: 'muted', render: (t) => t.counterparty || '—' },
    { key: 'tag', label: 'Tag', align: 'left', cellKind: 'muted', render: (t) => t.tag_name || '—' },
    { key: 'account', label: 'Account', align: 'left', cellKind: 'muted', render: (t) => t.account_name },
    {
      key: 'amount', label: 'Amount', align: 'right', cellKind: 'amount',
      cellClassName: (t) => t.type === 'income' ? 'text-accent' : '',
      render: (t) => signedMoney(t.type, t.amount),
    },
    {
      key: 'actions', label: '', align: 'none', cellKind: 'action',
      render: (t) => (
        <Button variant="close" onClick={() => remove(t.id)} aria-label={`Delete ${t.concept}`}>
          ✕
        </Button>
      ),
    },
  ];

  const getBgColor = (t: Transaction): 'Blue' | 'Green' | 'Red' | 'Yellow' | undefined => {
    if (t.type === 'income') return 'Green';
    if (t.type === 'expense') return 'Blue';
    if (t.type === 'transference') return 'Yellow';
    return undefined;
  }

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
          <table className="w-full border-collapse text-[14.5px]">
            <TableHeader columns={columns} />
            <tbody>
              {rows.map((t) => (
                <TableRow key={t.id} row={t} columns={columns} bgColor={getBgColor(t)} />
              ))}
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
    </>
  );
}
