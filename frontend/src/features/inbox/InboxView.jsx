import { useState } from 'react';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { todayISO } from '../../lib/format.js';

// One pending automated entry: every suggested field is editable in place,
// then Approve promotes it to the ledger (or Reject discards it).
function InboxRow({ entry, accounts, onDone }) {
  const [draft, setDraft] = useState({
    account_id: entry.account_id ?? '',
    type: entry.suggested_type ?? 'expense',
    amount: entry.amount ?? '',
    txn_date: entry.txn_date ?? todayISO(),
    concept: entry.concept ?? '',
    counterparty: entry.counterparty ?? '',
    tag: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const act = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const approve = () =>
    act(() =>
      api.post(`/inbox/${entry.id}/approve`, {
        account_id: Number(draft.account_id),
        type: draft.type,
        amount: Number(draft.amount),
        txn_date: draft.txn_date,
        concept: draft.concept,
        counterparty: draft.counterparty,
        tag: draft.tag,
      })
    );

  const reject = () => act(() => api.post(`/inbox/${entry.id}/reject`));

  return (
    <li className="inbox-item">
      <div className="inbox-meta">
        <span className="chip">{entry.source}</span>
        <span>received {entry.created_at?.slice(0, 10)}</span>
        {!entry.profile_id && <span>· unassigned</span>}
      </div>

      <div className="inbox-grid">
        <div className="field">
          <label htmlFor={`ib-date-${entry.id}`}>Date</label>
          <input id={`ib-date-${entry.id}`} type="date" value={draft.txn_date} onChange={set('txn_date')} />
        </div>
        <div className="field span2">
          <label htmlFor={`ib-concept-${entry.id}`}>Concept</label>
          <input id={`ib-concept-${entry.id}`} type="text" value={draft.concept} onChange={set('concept')} />
        </div>
        <div className="field">
          <label htmlFor={`ib-who-${entry.id}`}>Payer / payee</label>
          <input id={`ib-who-${entry.id}`} type="text" value={draft.counterparty} onChange={set('counterparty')} />
        </div>
        <div className="field">
          <label htmlFor={`ib-amount-${entry.id}`}>Amount (€)</label>
          <input id={`ib-amount-${entry.id}`} type="number" inputMode="decimal" step="0.01" min="0.01" value={draft.amount} onChange={set('amount')} />
        </div>
        <div className="field">
          <label htmlFor={`ib-type-${entry.id}`}>Type</label>
          <select id={`ib-type-${entry.id}`} value={draft.type} onChange={set('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`ib-account-${entry.id}`}>Account</label>
          <select id={`ib-account-${entry.id}`} value={draft.account_id} onChange={set('account_id')}>
            <option value="">Choose an account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`ib-tag-${entry.id}`}>Tag</label>
          <input id={`ib-tag-${entry.id}`} type="text" value={draft.tag} onChange={set('tag')} placeholder="Optional" />
        </div>
      </div>

      {entry.raw_payload && (
        <details className="raw">
          <summary>Raw payload</summary>
          <pre>{JSON.stringify(entry.raw_payload, null, 2)}</pre>
        </details>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="inbox-actions">
        <button type="button" className="btn quiet" onClick={reject} disabled={busy}>
          Reject
        </button>
        <button type="button" className="btn" onClick={approve} disabled={busy || !draft.account_id}>
          Approve
        </button>
      </div>
    </li>
  );
}

export default function InboxView() {
  const { profileId, version, bump } = useProfile();
  const { data: entries, error } = useFetch(`/profiles/${profileId}/inbox`, [profileId, version]);
  const { data: accounts } = useFetch(`/profiles/${profileId}/accounts`, [profileId]);

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="eyebrow">Inbox</h2>
        <span className="eyebrow-aside">
          {entries ? `${entries.length} waiting for review` : ''}
        </span>
      </div>
      <p className="section-lead">
        Automated entries land here first — nothing touches the ledger until you approve it.
      </p>
      {error && <p className="form-error">{error}</p>}
      {entries && entries.length === 0 && (
        <p className="empty">
          Inbox zero. Push entries with the sample feed: <code>docker compose exec backend node scripts/simulate-bank-feed.js</code>
        </p>
      )}
      {entries && entries.length > 0 && accounts && (
        <ul className="inbox-list">
          {entries.map((e) => (
            <InboxRow key={e.id} entry={e} accounts={accounts} onDone={bump} />
          ))}
        </ul>
      )}
    </section>
  );
}
