import { useState } from 'react';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { todayISO } from '../../lib/format.js';
import type { InboxEntry, Account } from '../../types.js';

interface Draft {
  account_id: number | string;
  type: string;
  amount: number | string;
  txn_date: string;
  concept: string;
  counterparty: string;
  tag: string;
}

function InboxRow({ entry, accounts, onDone }: { entry: InboxEntry; accounts: Account[]; onDone: () => void }) {
  const [draft, setDraft] = useState<Draft>({
    account_id: entry.account_id ?? '',
    type: entry.suggested_type ?? 'expense',
    amount: entry.amount ?? '',
    txn_date: entry.txn_date ?? todayISO(),
    concept: entry.concept ?? '',
    counterparty: entry.counterparty ?? '',
    tag: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (err) {
      setError((err as Error).message);
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
    <li className="py-5 border-b border-hairline last:border-b-0">
      <div className="flex items-center gap-2.5 mb-3 text-xs text-muted">
        <span className="inline-block px-2 py-px border border-hairline rounded-full text-[11px] text-muted align-middle ml-0">{entry.source}</span>
        <span>received {entry.created_at?.slice(0, 10)}</span>
        {!entry.profile_id && <span>· unassigned</span>}
      </div>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`ib-date-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Date</label>
          <input id={`ib-date-${entry.id}`} type="date" value={draft.txn_date} onChange={set('txn_date')} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 col-span-2">
          <label htmlFor={`ib-concept-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Concept</label>
          <input id={`ib-concept-${entry.id}`} type="text" value={draft.concept} onChange={set('concept')} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`ib-who-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Payer / payee</label>
          <input id={`ib-who-${entry.id}`} type="text" value={draft.counterparty} onChange={set('counterparty')} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`ib-amount-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Amount (€)</label>
          <input id={`ib-amount-${entry.id}`} type="number" inputMode="decimal" step="0.01" min="0.01" value={draft.amount} onChange={set('amount')} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`ib-type-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Type</label>
          <select id={`ib-type-${entry.id}`} value={draft.type} onChange={set('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`ib-account-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Account</label>
          <select id={`ib-account-${entry.id}`} value={draft.account_id} onChange={set('account_id')}>
            <option value="">Choose an account…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor={`ib-tag-${entry.id}`} className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Tag</label>
          <input id={`ib-tag-${entry.id}`} type="text" value={draft.tag} onChange={set('tag')} placeholder="Optional" />
        </div>
      </div>

      {entry.raw_payload && (
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer">Raw payload</summary>
          <pre className="m-2 mt-0 p-2.5 bg-accent-soft rounded-lg overflow-auto text-ink">{JSON.stringify(entry.raw_payload, null, 2)}</pre>
        </details>
      )}

      {error && <p className="m-0 text-sm text-neg mt-3" role="alert">{error}</p>}

      <div className="flex justify-end gap-2.5 mt-[14px]">
        <button type="button" className="bg-transparent text-accent px-4 py-[9px] rounded-[9px] font-semibold text-sm cursor-pointer transition-colors border border-hairline hover:bg-accent-soft disabled:opacity-45" onClick={reject} disabled={busy}>Reject</button>
        <button type="button" className="border-0 bg-accent text-white px-4 py-[9px] rounded-[9px] font-semibold text-sm cursor-pointer transition-colors hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default" onClick={approve} disabled={busy || !draft.account_id}>Approve</button>
      </div>
    </li>
  );
}

export default function InboxView() {
  const { profileId, version, bump } = useProfile();
  const { data: entries } = useFetch<InboxEntry[]>(`/profiles/${profileId}/inbox`, [profileId, version]);
  const { data: accounts } = useFetch<Account[]>(`/profiles/${profileId}/accounts`, [profileId]);

  return (
    <section className="mt-12 border-t border-hairline pt-[14px]">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="m-0 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">Inbox</h2>
        <span className="text-xs text-muted">{entries ? `${entries.length} waiting for review` : ''}</span>
      </div>
      <p className="-mt-2 mb-5 max-w-[56ch] text-muted">Automated entries land here first — nothing touches the ledger until you approve it.</p>
      {entries && entries.length === 0 && (
        <p className="text-muted text-sm">Inbox zero. Push entries with the sample feed: <code>docker compose exec backend node scripts/simulate-bank-feed.js</code></p>
      )}
      {entries && entries.length > 0 && accounts && (
        <ul className="list-none m-0 p-0">
          {entries.map((e) => <InboxRow key={e.id} entry={e} accounts={accounts} onDone={bump} />)}
        </ul>
      )}
    </section>
  );
}
