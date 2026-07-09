import { useState } from 'react';
import PeriodNav from '../../components/PeriodNav.jsx';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { currentPeriod, money, shortDate, signedMoney } from '../../lib/format.js';

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
  const { data: rows, error } = useFetch(
    `/profiles/${profileId}/transactions?${query}`,
    [profileId, period.year, period.month, type, version]
  );
  const { data: rules } = useFetch(`/profiles/${profileId}/recurring`, [profileId, version]);

  const remove = async (id) => {
    if (!window.confirm('Delete this entry from the ledger?')) return;
    await api.del(`/transactions/${id}`);
    bump();
  };

  const stopRule = async (id) => {
    if (!window.confirm('Stop this fixed rule? Past entries stay in the ledger.')) return;
    await api.del(`/recurring/${id}`);
    bump();
  };

  return (
    <>
      <div className="page-controls">
        <PeriodNav year={period.year} month={period.month} onChange={setPeriod} />
        <div className="seg" role="group" aria-label="Filter by type">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={type === f.key ? 'on' : ''} onClick={() => setType(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="eyebrow">Ledger</h2>
          <span className="eyebrow-aside">{rows ? `${rows.length} entries` : ''}</span>
        </div>
        {error && <p className="form-error">{error}</p>}
        {rows && rows.length === 0 && <p className="empty">Nothing recorded this month. Add an entry to start the page.</p>}
        {rows && rows.length > 0 && (
          <table className="ledger">
            <thead>
              <tr>
                <th>Date</th>
                <th>Concept</th>
                <th>Payer / payee</th>
                <th>Tag</th>
                <th>Account</th>
                <th className="amt-col">Amount</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="num muted">{shortDate(t.txn_date)}</td>
                  <td>
                    {t.concept}
                    {t.is_fixed === 1 && <span className="chip">fixed</span>}
                    {t.source === 'automated' && <span className="chip">auto</span>}
                  </td>
                  <td className="muted">{t.counterparty || '—'}</td>
                  <td className="muted">{t.tag_name || '—'}</td>
                  <td className="muted">{t.account_name}</td>
                  <td className={`amt num${t.type === 'income' ? ' in' : ''}`}>{signedMoney(t.type, t.amount)}</td>
                  <td className="row-actions">
                    <button type="button" className="x-btn" onClick={() => remove(t.id)} aria-label={`Delete ${t.concept}`}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="eyebrow">Fixed rules</h2>
          <span className="eyebrow-aside">Recurring entries created from "Is fixed?"</span>
        </div>
        {rules && rules.length === 0 && <p className="empty">No active rules. Turn on "Is fixed?" when adding an entry to create one.</p>}
        {rules && rules.length > 0 && (
          <ul className="rules-list">
            {rules.map((r) => (
              <li key={r.id} className="rule-row">
                <span>
                  {r.concept}
                  <span className="acc-kind">
                    {r.frequency} · {r.account_name} · next {shortDate(r.next_due)}
                  </span>
                </span>
                <span className="rule-right">
                  <span className={`amt num${r.type === 'income' ? ' in' : ''}`}>{signedMoney(r.type, r.amount)}</span>
                  <button type="button" className="link-btn" onClick={() => stopRule(r.id)}>
                    Stop
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
