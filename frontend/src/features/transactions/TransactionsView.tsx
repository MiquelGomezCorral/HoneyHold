import { useState } from 'react';
import PeriodNav from '../../components/PeriodNav.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { currentPeriod, money, shortDate, signedMoney } from '../../lib/format.js';
import type { Transaction, RecurringRule } from '../../types.js';

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

  return (
    <>
      <div className="flex items-center justify-between gap-4 pt-[22px]">
        <PeriodNav year={period.year} month={period.month} onChange={setPeriod} />
        <div className="inline-flex gap-0.5 p-0.5 " role="group" aria-label="Filter by type">
          {FILTERS.map((f) => (
            <button key={f.key} type="button"
              className={`border-0 px-3 py-[6px] rounded-lg text-muted font-medium text-sm cursor-pointer transition-colors hover:text-ink${type === f.key ? ' bg-accent-soft text-ink font-semibold' : ' bg-transparent'}`}
              onClick={() => setType(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-12 border-t border-hairline pt-[14px]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Ledger</h2>
          <span className="text-xs text-muted">{rows ? `${rows.length} entries` : ''}</span>
        </div>
        {error && <p className="text-neg text-sm">{error}</p>}
        {rows && rows.length === 0 && <p className="text-muted text-sm">Nothing recorded this month. Add an entry to start the page.</p>}
        {rows && rows.length > 0 && (
          <table className="w-full border-collapse text-[14.5px]">
            <thead>
              <tr>
                <th className="text-left pr-3 pb-[9px] border-b border-hairline text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">Date</th>
                <th className="text-left pr-3 pb-[9px] border-b border-hairline text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">Concept</th>
                <th className="text-left pr-3 pb-[9px] border-b border-hairline text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">Payer / payee</th>
                <th className="text-left pr-3 pb-[9px] border-b border-hairline text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">Tag</th>
                <th className="text-left pr-3 pb-[9px] border-b border-hairline text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">Account</th>
                <th className="text-right pr-3 pb-[9px] border-b border-hairline text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">Amount</th>
                <th className="pr-3 pb-[9px] border-b border-hairline" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="py-[11px] pr-3 border-b border-hairline align-baseline tabular-nums text-muted">{shortDate(t.txn_date)}</td>
                  <td className="py-[11px] pr-3 border-b border-hairline align-baseline">
                    {t.concept}
                    {t.is_fixed === 1 && <span className="inline-block ml-2 px-2 py-px border border-hairline rounded-full text-[11px] text-muted align-middle">fixed</span>}
                    {t.source === 'automated' && <span className="inline-block ml-2 px-2 py-px border border-hairline rounded-full text-[11px] text-muted align-middle">auto</span>}
                  </td>
                  <td className="py-[11px] pr-3 border-b border-hairline align-baseline text-muted">{t.counterparty || '—'}</td>
                  <td className="py-[11px] pr-3 border-b border-hairline align-baseline text-muted">{t.tag_name || '—'}</td>
                  <td className="py-[11px] pr-3 border-b border-hairline align-baseline text-muted">{t.account_name}</td>
                  <td className={`py-[11px] pr-3 border-b border-hairline align-baseline font-semibold whitespace-nowrap tabular-nums text-right${t.type === 'income' ? ' text-accent' : ''}`}>{signedMoney(t.type, t.amount)}</td>
                  <td className="w-[34px] py-[11px] pr-3 border-b border-hairline align-baseline text-right">
                    <button type="button" className="border-0 bg-none px-2 py-1 rounded-[7px] text-muted text-sm cursor-pointer hover:text-ink hover:bg-accent-soft" onClick={() => remove(t.id)} aria-label={`Delete ${t.concept}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-12 border-t border-hairline pt-[14px]">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Fixed rules</h2>
          <span className="text-xs text-muted">Recurring entries created from &quot;Is fixed?&quot;</span>
        </div>
        {rules && rules.length === 0 && <p className="text-muted text-sm">No active rules. Turn on &quot;Is fixed?&quot; when adding an entry to create one.</p>}
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
                  <button type="button" className="border-0 bg-none p-0 text-accent font-medium text-[13px] cursor-pointer underline underline-offset-[3px] decoration-hairline hover:decoration-accent" onClick={() => stopRule(r.id)}>Stop</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
