import { useMemo, useState } from 'react';
import Modal from '../../components/Modal.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { todayISO } from '../../lib/format.js';
import type { Account } from '../../types.js';

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];

interface FormState {
  type: 'income' | 'expense';
  amount: string;
  txn_date: string;
  concept: string;
  counterparty: string;
  tag: string;
  account_id: string;
  is_fixed: boolean;
  frequency: string;
  start_date: string;
}

interface Props {
  defaultType?: 'income' | 'expense';
  onClose: () => void;
}

export default function TransactionModal({ defaultType = 'expense', onClose }: Props) {
  const { profileId, bump } = useProfile();
  const { data: accounts } = useFetch<Account[]>(`/profiles/${profileId}/accounts`, [profileId]);
  const { data: tags } = useFetch<{ id: number; name: string }[]>(`/profiles/${profileId}/tags`, [profileId]);

  const [form, setForm] = useState<FormState>(() => ({
    type: defaultType,
    amount: '',
    txn_date: todayISO(),
    concept: '',
    counterparty: '',
    tag: '',
    account_id: '',
    is_fixed: false,
    frequency: 'monthly',
    start_date: todayISO(),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const accountId = useMemo(
    () => form.account_id || accounts?.[0]?.id || '',
    [form.account_id, accounts]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!(Number(form.amount) > 0)) return setError('Enter an amount greater than zero.');
    if (!form.concept.trim()) return setError('Enter a concept.');
    if (!accountId) return setError('Pick an account.');

    setSaving(true);
    try {
      await api.post('/transactions', {
        profile_id: profileId,
        account_id: Number(accountId),
        type: form.type,
        amount: Number(form.amount),
        txn_date: form.txn_date,
        concept: form.concept,
        counterparty: form.counterparty,
        tag: form.tag,
        is_fixed: form.is_fixed,
        recurrence: form.is_fixed
          ? { frequency: form.frequency, start_date: form.start_date }
          : null,
      });
      bump();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Add entry" onClose={onClose} bgColor={form.type === 'income' ? 'Green' : 'Blue'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="flex gap-0.5 p-0.5 border border-hairline rounded-[10px]" role="group" aria-label="Entry type">
          <button type="button"
            className={`border-0 bg-transparent flex-1 px-3 py-[6px] rounded-lg text-muted font-medium text-sm cursor-pointer transition-colors hover:text-ink${form.type === 'expense' ? ' bg-accent-soft text-ink font-semibold' : ''}`}
            onClick={() => setForm((f) => ({ ...f, type: 'expense' as const }))}
          >Expense</button>
          <button type="button"
            className={`border-0 bg-transparent flex-1 px-3 py-[6px] rounded-lg text-muted font-medium text-sm cursor-pointer transition-colors hover:text-ink${form.type === 'income' ? ' bg-accent-soft text-ink font-semibold' : ''}`}
            onClick={() => setForm((f) => ({ ...f, type: 'income' as const }))}
          >Income</button>
        </div>

        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="tm-amount" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Amount (€)</label>
            <input id="tm-amount" type="number" inputMode="decimal" step="0.01" min="0.01" value={form.amount} onChange={set('amount')} autoFocus required />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="tm-date" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Date</label>
            <input id="tm-date" type="date" value={form.txn_date} onChange={set('txn_date')} required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor="tm-concept" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Concept</label>
          <input id="tm-concept" type="text" value={form.concept} onChange={set('concept')} placeholder="Groceries at Mercadona" required />
        </div>

        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="tm-who" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">{form.type === 'income' ? 'Payer' : 'Payee'}</label>
            <input id="tm-who" type="text" value={form.counterparty} onChange={set('counterparty')} />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="tm-tag" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Tag</label>
            <input id="tm-tag" type="text" list="tm-tags" value={form.tag} onChange={set('tag')} placeholder="Pick or type a new one" />
            <datalist id="tm-tags">
              {tags?.map((t) => <option key={t.id} value={t.name} />)}
            </datalist>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <label htmlFor="tm-account" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Account</label>
          <select id="tm-account" value={accountId} onChange={set('account_id')}>
            {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <span className="relative flex-shrink-0 w-[38px] h-[22px] mt-px">
            <input type="checkbox" className="absolute inset-0 opacity-0 m-0 cursor-pointer peer" checked={form.is_fixed} onChange={set('is_fixed')} />
            <i className="absolute inset-0 rounded-full bg-hairline peer-checked:bg-accent transition-colors pointer-events-none after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-4" />
          </span>
          <span>
            Is fixed?
            <small className="block text-muted text-xs">Repeats automatically as a recurring entry</small>
          </span>
        </label>

        {form.is_fixed && (
          <div className="flex flex-col gap-3 pl-[14px] border-l-2 border-accent-soft">
            <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
              <div className="flex flex-col gap-1.5 min-w-0">
                <label htmlFor="tm-freq" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Frequency</label>
                <select id="tm-freq" value={form.frequency} onChange={set('frequency')}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label htmlFor="tm-start" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted">Starts on</label>
                <input id="tm-start" type="date" value={form.start_date} onChange={set('start_date')} required />
              </div>
            </div>
            <p className="m-0 text-xs text-muted">Past occurrences since the start date are added right away.</p>
          </div>
        )}

        {error && <p className="m-0 text-sm text-neg" role="alert">{error}</p>}

        <div className="flex justify-end gap-2.5 mt-1">
          <button type="button" className="bg-transparent text-accent px-4 py-[9px] rounded-[9px] font-semibold text-sm cursor-pointer transition-colors border border-hairline hover:bg-accent-soft" onClick={onClose}>Cancel</button>
          <button type="submit" className="border-0 bg-accent text-white px-4 py-[9px] rounded-[9px] font-semibold text-sm cursor-pointer transition-colors hover:bg-accent-deep disabled:opacity-45 disabled:cursor-default" disabled={saving}>
            {saving ? 'Saving…' : form.type === 'income' ? 'Add income' : 'Add expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
