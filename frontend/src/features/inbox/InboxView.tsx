import { useState, type ChangeEvent } from 'react';
import Button from '../../components/Button.js';
import Badge from '../../components/Badge.js';
import Field from '../../components/Field.js';
import AccountSelect from '../../components/AccountSelect.js';
import EmptyState from '../../components/EmptyState.js';
import Section from '../../components/Section.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { todayISO } from '../../lib/format.js';
import { TEXT_LIMITS } from '../../lib/config.js';
import { inboxApprovalSchema, validationMessage } from '../../lib/validation.js';
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

  function set(key: keyof Draft) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));
  }

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  function approve() {
    const parsed = inboxApprovalSchema.safeParse(draft);
    if (!parsed.success) return setError(validationMessage(parsed.error));
    return act(() => api.post(`/inbox/${entry.id}/approve`, parsed.data));
  }

  function reject() { return act(() => api.post(`/inbox/${entry.id}/reject`)); }


  return (
    <li className="py-5 border-b border-hairline last:border-b-0">
      <div className="flex items-center gap-2.5 mb-3 text-xs text-muted">
        <Badge className="ml-0">{entry.source}</Badge>
        <span>received {entry.created_at?.slice(0, 10)}</span>
        {!entry.profile_id && <span>· unassigned</span>}
      </div>

      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
        <Field label="Date" htmlFor={`ib-date-${entry.id}`}>
          <input id={`ib-date-${entry.id}`} type="date" value={draft.txn_date} onChange={set('txn_date')} />
        </Field>
        <Field label="Concept" htmlFor={`ib-concept-${entry.id}`} className="col-span-2">
          <input id={`ib-concept-${entry.id}`} type="text" value={draft.concept} onChange={set('concept')} maxLength={TEXT_LIMITS.concept} />
        </Field>
        <Field label="Payer / payee" htmlFor={`ib-who-${entry.id}`}>
          <input id={`ib-who-${entry.id}`} type="text" value={draft.counterparty} onChange={set('counterparty')} maxLength={TEXT_LIMITS.counterparty} />
        </Field>
        <Field label="Amount (€)" htmlFor={`ib-amount-${entry.id}`}>
          <input id={`ib-amount-${entry.id}`} type="number" inputMode="decimal" step="0.01" min="0.01" value={draft.amount} onChange={set('amount')} />
        </Field>
        <Field label="Type" htmlFor={`ib-type-${entry.id}`}>
          <select id={`ib-type-${entry.id}`} value={draft.type} onChange={set('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </Field>
        <AccountSelect
          id={`ib-account-${entry.id}`}
          accounts={accounts}
          value={draft.account_id}
          onChange={(v) => setDraft((d) => ({ ...d, account_id: v }))}
          placeholder="Choose an account…"
        />
        <Field label="Tag" htmlFor={`ib-tag-${entry.id}`}>
          <input id={`ib-tag-${entry.id}`} type="text" value={draft.tag} onChange={set('tag')} maxLength={TEXT_LIMITS.tag} placeholder="Optional" />
        </Field>
      </div>

      {entry.raw_payload && (
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer">Raw payload</summary>
          <pre className="m-2 mt-0 p-2.5 bg-accent-soft rounded-lg overflow-auto text-ink">{JSON.stringify(entry.raw_payload, null, 2)}</pre>
        </details>
      )}

      {error && <p className="m-0 text-sm text-neg mt-3" role="alert">{error}</p>}

      <div className="flex justify-end gap-2.5 mt-[14px]">
        <Button variant="ghost" onClick={reject} disabled={busy}>Reject</Button>
        <Button onClick={approve} disabled={busy || !draft.account_id}>Approve</Button>
      </div>
    </li>
  );
}

export default function InboxView() {
  const { profileId, version, bump } = useProfile();
  const { data: entries } = useFetch<InboxEntry[]>(`/profiles/${profileId}/inbox`, [profileId, version]);
  const { data: accounts } = useFetch<Account[]>(`/profiles/${profileId}/accounts`, [profileId]);

  return (
    <Section title="Inbox" summary={entries ? `${entries.length} waiting for review` : undefined}>
      <p className="-mt-2 mb-5 max-w-[56ch] text-muted">Automated entries land here first — nothing touches the ledger until you approve it.</p>
      {entries && entries.length === 0 && (
        <EmptyState>
          Inbox zero. Push entries with the sample feed: <code>docker compose exec backend node scripts/simulate-bank-feed.js</code>
        </EmptyState>
      )}
      {entries && entries.length > 0 && accounts && (
        <ul className="list-none m-0 p-0">
          {entries.map((e) => <InboxRow key={e.id} entry={e} accounts={accounts} onDone={bump} />)}
        </ul>
      )}
    </Section>
  );
}
