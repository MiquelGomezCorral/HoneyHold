import cn from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.js';
import PeriodNav from '../../components/PeriodNav.js';
import ConfirmModal from '../../components/ConfirmModal.js';
import EmptyState from '../../components/EmptyState.js';
import Section from '../../components/Section.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import LedgerFilters from './LedgerFilters.js';
import LedgerTable from './LedgerTable.js';
import TransactionModal from './TransactionModal.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useI18n } from '../../i18n.js';
import { currentPeriod, entryAccountText, entryIds, entryMoney, entryTag, money, scopedAccountLabel, shortDate, signedMoney, timeStamp } from '../../lib/format.js';
import { searchItems, type SearchField } from '../../lib/search.js';
import { DEFAULT_TRANSACTION_FILTERS, TRANSACTION_TYPE_FILTERS, dateParams, mergeLedgerRows, parseAmount, passesEntryFilters } from './transactionFilters.js';
import type { TransactionFilters } from './transactionFilters.js';
import type { Account, EntryType, LedgerEntry, RecurringRule, Tag, Transaction, Transfer } from '../../types.js';

export default function TransactionsView() {
  const { profileId, version, bump } = useProfile();
  const { showError, showToast } = useToast();
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState(currentPeriod);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'delete'; entry: LedgerEntry } | { kind: 'stop'; ruleId: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { type, query, accounts: selectedAccounts, tags: selectedTags, amountMin, amountMax, date: dateFilter } = filters;

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
  const { data: tags } = useFetch<Tag[]>(`/profiles/${profileId}/tags`, [profileId, version]);
  const { data: rules } = useFetch<RecurringRule[]>(`/profiles/${profileId}/recurring`, [profileId, version]);

  useEffect(() => {
    if (!tags) return;
    const tagNames = new Set(tags.map((tag) => tag.name));
    setFilters((current) => {
      const nextTags = current.tags.filter((tag) => tagNames.has(tag));
      return nextTags.length === current.tags.length ? current : { ...current, tags: nextTags };
    });
  }, [tags]);

  const rows = useMemo(() => {
    return mergeLedgerRows(type, transactionRows, transferRows);
  }, [type, transactionRows, transferRows]);

  const error = transactionError || transferError;
  const minAmount = parseAmount(amountMin);
  const maxAmount = parseAmount(amountMax);
  const amountFiltering = minAmount != null || maxAmount != null;
  const filtering = !!query.trim() || selectedAccounts.length > 0 || selectedTags.length > 0 || amountFiltering || dateFilter.mode !== 'month' || type !== '';

  const accountOptions = useMemo(() => (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: scopedAccountLabel(account.name, account.profile_id, account.profile_name, profileId),
  })), [accounts, profileId]);
  const tagOptions = useMemo(() => (tags ?? []).map((tag) => ({ value: tag.name, label: tag.name })), [tags]);

  const dateLocale = locale === 'es' ? 'es-ES' : 'en-GB';
  const searchFields = useMemo<SearchField<LedgerEntry>[]>(() => [
    { key: 'concept', score: 100, text: (entry) => entry.concept },
    { key: 'tag', score: 70, text: (entry) => entryTag(entry, t('transactions.transference')) },
    { key: 'counterparty', score: 70, text: (entry) => entry.type === 'transfer' ? t('common.transfer') : entry.counterparty || '' },
    { key: 'account', score: 45, text: (entry) => entryAccountText(entry, profileId) },
    { key: 'amount', score: 25, text: (entry) => [String(entry.amount), money(entry.amount), entryMoney(entry, profileId)] },
    { key: 'date', score: 15, text: (entry) => [entry.txn_date, shortDate(entry.txn_date, dateLocale), timeStamp(entry.created_at)] },
    { key: 'ids', score: 5, exactOnly: true, text: entryIds },
  ], [dateLocale, profileId, t]);

  const shownRows = useMemo(() => {
    if (!rows) return null;
    const narrowed = rows.filter((entry) => passesEntryFilters(entry, selectedAccounts, selectedTags, minAmount, maxAmount));
    return searchItems(narrowed, query, searchFields, { fuzzyDistance: 1, fuzzyWeight: 0.1 });
  }, [rows, selectedAccounts, selectedTags, minAmount, maxAmount, query, searchFields]);
  const summary = rows && shownRows
    ? filtering ? t('transactions.filteredEntries', { shown: shownRows.length, total: rows.length }) : t('transactions.entries', { count: shownRows.length })
    : undefined;

  function remove(entry: LedgerEntry) { setConfirm({ kind: 'delete', entry }); }
  function stopRule(id: number) { setConfirm({ kind: 'stop', ruleId: id }); }
  function updateFilters(patch: Partial<TransactionFilters>) { setFilters((current) => ({ ...current, ...patch })); }

  function resetFilters() {
    setPeriod(currentPeriod());
    setFilters(DEFAULT_TRANSACTION_FILTERS);
  }

  async function handleConfirm() {
    if (!confirm || confirming) return;
    setConfirming(true);
    try {
      if (confirm.kind === 'delete') {
        const { entry } = confirm;
        await api.del(entry.type === 'transfer' ? `/transfers/${entry.id}` : `/transactions/${entry.id}`);
        showToast(t(entry.type === 'transfer' ? 'toast.transferDeleted' : 'toast.transactionDeleted'), 'success');
      } else {
        await api.del(`/recurring/${confirm.ruleId}`);
        showToast(t('toast.ruleStopped'), 'success');
      }
      setConfirm(null);
      bump();
    } catch (err) {
      showError(err);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 pt-6">
        <PeriodNav year={period.year} month={period.month} disabled={dateFilter.mode !== 'month'} onChange={setPeriod} />
        <SegmentedControl
          ariaLabel={t('transactions.filterByType')}
          items={TRANSACTION_TYPE_FILTERS.map((filter) => ({ value: filter.key, label: t(filter.labelKey) }))}
          value={type}
          onChange={(value) => updateFilters({ type: value })}
        />
      </div>

      <LedgerFilters
        filters={filters}
        filtering={filtering}
        amountFiltering={amountFiltering}
        minAmount={minAmount}
        maxAmount={maxAmount}
        period={period}
        accountOptions={accountOptions}
        tagOptions={tagOptions}
        onChange={updateFilters}
        onReset={resetFilters}
        onThisMonth={() => {
          setPeriod(currentPeriod());
          updateFilters({ date: { mode: 'month' } });
        }}
      />

      <Section title={t('transactions.ledger')} summary={summary} hideBorder>
        {error && <p className="text-neg text-sm">{error}</p>}
        {shownRows && shownRows.length === 0 && <EmptyState>{filtering ? t('transactions.noFilterMatches') : t('transactions.nothingRecorded')}</EmptyState>}
        {shownRows && shownRows.length > 0 && <LedgerTable rows={shownRows} profileId={profileId} onEdit={setEditing} onRemove={remove} />}
      </Section>

      <Section title={t('transactions.fixedRules')} summary={t('transactions.fixedRulesSummary')}>
        {rules && rules.length === 0 && <EmptyState>{t('transactions.noActiveRules')}</EmptyState>}
        {rules && rules.length > 0 && (
          <ul className="list-none m-0 p-0">
            {rules.map((r) => (
              <li key={r.id} className="flex justify-between items-baseline gap-4 py-3 border-b border-hairline last:border-b-0">
                <span>
                  {r.concept}
                  <span className="ml-2 text-xs text-muted">{t(`entryModal.frequencies.${r.frequency}`)} · {r.account_name} · {t('transactions.nextDue', { date: shortDate(r.next_due, dateLocale) })}</span>
                </span>
                <span className="flex items-baseline gap-4">
                  <span className={cn('font-semibold whitespace-nowrap tabular-nums', { 'text-accent': r.type === 'income' })}>{signedMoney(r.type, r.amount)}</span>
                  <Button variant="danger-active" size="sm" onClick={() => stopRule(r.id)}>{t('transactions.stop')}</Button>
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
          title={confirm.kind === 'delete' ? t('transactions.deleteEntryTitle') : t('transactions.stopRuleTitle')}
          message={
            confirm.kind === 'delete'
              ? t('transactions.deleteEntryMessage')
              : t('transactions.stopRuleMessage')
          }
          confirmLabel={confirm.kind === 'delete' ? t('transactions.delete') : t('transactions.stop')}
          variant="danger-active"
          disabled={confirming}
          onConfirm={handleConfirm}
          onCancel={() => { setConfirm(null); setConfirming(false); }}
        />
      )}
    </>
  );
}
