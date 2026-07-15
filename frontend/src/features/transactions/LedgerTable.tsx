import { Fragment } from 'react';
import cn from 'classnames';
import Badge from '../../components/Badge.js';
import Button from '../../components/Button.js';
import Icon from '../../components/Icon.js';
import { DateDivider, TableColGroup, TableHeader, TableRow } from '../../components/Table.js';
import { LEDGER_COLUMN_SPANS } from '../../lib/config.js';
import { accountLabel, entryMoney, scopedAccountLabel, shortDate, timeStamp } from '../../lib/format.js';
import { useI18n } from '../../i18n.js';
import type { Column } from '../../components/Table.js';
import type { LedgerEntry } from '../../types.js';

interface LedgerTableProps {
  rows: LedgerEntry[];
  profileId: number | null;
  onEdit: (entry: LedgerEntry) => void;
  onRemove: (entry: LedgerEntry) => void;
}

export default function LedgerTable({ rows, profileId, onEdit, onRemove }: LedgerTableProps) {
  const { locale, t } = useI18n();
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-GB';
  const columns: Column<LedgerEntry>[] = [
    {
      key: 'date', label: t('common.date'), align: 'left', cellKind: 'muted',
      span: LEDGER_COLUMN_SPANS.date,
      render: (entry) => timeStamp(entry.created_at),
    },
    {
      key: 'concept', label: t('common.concept'), align: 'left', cellKind: 'text',
      span: LEDGER_COLUMN_SPANS.concept,
      truncate: true,
      render: (entry) => (
        <>
          {entry.concept}
          {entry.type !== 'transfer' && entry.is_fixed === 1 && <Badge className="ml-2">{t('transactions.fixed')}</Badge>}
          {entry.source === 'automated' && <Badge className="ml-2">{t('transactions.auto')}</Badge>}
        </>
      ),
    },
    {
      key: 'counterparty', label: t('common.counterparty'), align: 'left', cellKind: 'muted',
      span: LEDGER_COLUMN_SPANS.counterparty,
      truncate: true,
      render: (entry) => entry.type === 'transfer'
        ? <span className="inline-flex items-center gap-1.5">
          <Icon src="arrows-left-right" type="black" className="inline-flex h-4 w-4 align-[-3px]" title={t('common.transfer')} />
          {t('common.transfer')}
        </span>
        : entry.counterparty || '—',
    },
    {
      key: 'tag', label: t('common.tag'), align: 'left', cellKind: 'muted',
      span: LEDGER_COLUMN_SPANS.tag,
      truncate: true,
      render: (entry) => entry.type === 'transfer' ? entry.tag_name || t('transactions.transference') : entry.tag_name || '—',
    },
    {
      key: 'account', label: t('common.account'), align: 'left', cellKind: 'muted',
      span: LEDGER_COLUMN_SPANS.account,
      truncate: true,
      render: (entry) => accountCell(entry, profileId),
    },
    {
      key: 'amount', label: t('common.amount'), align: 'right', cellKind: 'amount',
      span: LEDGER_COLUMN_SPANS.amount,
      cellClassName: (entry) => cn({ 'text-accent': entry.type === 'income' }),
      render: (entry) => entryMoney(entry, profileId),
    },
    {
      key: 'actions', label: '', align: 'none', cellKind: 'action',
      span: LEDGER_COLUMN_SPANS.actions,
      render: (entry) => (
        <Button variant="danger" size="sm" onClick={(event) => { event.stopPropagation(); onRemove(entry); }} aria-label={t('transactions.deleteEntryLabel', { concept: entry.concept })}>
          ✕
        </Button>
      ),
    },
  ];

  return (
    <div className="max-lg:overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm max-lg:min-w-[60rem]">
        <TableColGroup columns={columns} />
        <TableHeader columns={columns} className="max-lg:static" />
        <tbody>
          {rows.map((entry, index) => {
            const previousDate = index > 0 ? rows[index - 1].txn_date : '';
            return (
              <Fragment key={`${entry.type}-${entry.id}`}>
                {entry.txn_date !== previousDate && <DateDivider colSpan={columns.length}>{shortDate(entry.txn_date, dateLocale)}</DateDivider>}
                <TableRow row={entry} columns={columns} bgColor={rowBgColor(entry)} position={rowPosition(rows, index)} onClick={onEdit} />
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function accountCell(entry: LedgerEntry, profileId: number | null) {
  if (entry.type === 'transfer') {
    const crossProfile = entry.from_profile_id !== entry.to_profile_id;
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="truncate">{accountLabel(entry.from_account_name, crossProfile ? entry.from_profile_name : null)}</span>
        <Icon src="arrow-right" type="white" title="" className="m-0 h-3 w-3 shrink-0" />
        <span className="truncate">{accountLabel(entry.to_account_name, crossProfile ? entry.to_profile_name : null)}</span>
      </span>
    );
  }

  return entry.account_name ? scopedAccountLabel(entry.account_name, entry.account_profile_id, entry.account_profile_name, profileId) : '—';
}

function rowPosition(rows: LedgerEntry[], index: number) {
  const entry = rows[index];
  const previousDate = index > 0 ? rows[index - 1].txn_date : '';
  const nextDate = index < rows.length - 1 ? rows[index + 1].txn_date : '';
  if (entry.txn_date !== previousDate) return entry.txn_date !== nextDate ? 'single' : 'first';
  return entry.txn_date !== nextDate ? 'last' : 'middle';
}

function rowBgColor(entry: LedgerEntry): 'Blue' | 'Green' | 'Yellow' {
  if (entry.type === 'income') return 'Green';
  if (entry.type === 'transfer') return 'Yellow';
  return 'Blue';
}
