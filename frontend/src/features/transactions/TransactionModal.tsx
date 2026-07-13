import { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import Field from '../../components/Field.js';
import Icon from '../../components/Icon.js';
import Toggle from '../../components/Toggle.js';
import AccountSelect from '../../components/AccountSelect.js';
import DateField from '../../components/DateField.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import SelectField from '../../components/SelectField.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { todayISO } from '../../lib/format.js';
import { TEXT_LIMITS } from '../../lib/config.js';
import type { Account, EntryType, LedgerEntry } from '../../types.js';

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];

interface FormState {
  type: EntryType;
  amount: string;
  txn_date: string;
  concept: string;
  counterparty: string;
  tag: string;
  account_id: string;
  from_account_id: string;
  to_account_id: string;
  is_fixed: boolean;
  frequency: string;
  start_date: string;
}

interface Props {
  defaultType?: EntryType;
  entry?: LedgerEntry;
  onClose: () => void;
}

const blankForm = (type: EntryType): FormState => ({
  type,
  amount: '',
  txn_date: todayISO(),
  concept: '',
  counterparty: '',
  tag: '',
  account_id: '',
  from_account_id: '',
  to_account_id: '',
  is_fixed: false,
  frequency: 'monthly',
  start_date: todayISO(),
});

const formFromEntry = (entry: LedgerEntry): FormState => ({
  ...blankForm(entry.type),
  amount: String(entry.amount),
  txn_date: entry.txn_date,
  concept: entry.concept,
  tag: entry.tag_name || '',
  start_date: entry.txn_date,
  ...(entry.type === 'transfer'
    ? {
      from_account_id: String(entry.from_account_id),
      to_account_id: String(entry.to_account_id),
    }
    : {
      counterparty: entry.counterparty || '',
      account_id: entry.account_id ? String(entry.account_id) : '',
      is_fixed: entry.is_fixed === 1,
    }),
});

export default function TransactionModal({ defaultType = 'expense', entry, onClose }: Props) {
  const { profileId, bump } = useProfile();
  const { data: accounts } = useFetch<Account[]>(`/profiles/${profileId}/accounts?include_cross=1`, [profileId]);
  const { data: tags } = useFetch<{ id: number; name: string }[]>(`/profiles/${profileId}/tags`, [profileId]);
  const editing = !!entry;

  const [form, setForm] = useState<FormState>(() => entry ? formFromEntry(entry) : blankForm(defaultType));
  const [conceptEdited, setConceptEdited] = useState(editing || defaultType !== 'transfer');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  }

  const accountId = useMemo(
    () => form.account_id || accounts?.[0]?.id || '',
    [form.account_id, accounts]
  );

  const fromAccountId = useMemo(
    () => form.from_account_id || accounts?.[0]?.id || '',
    [form.from_account_id, accounts]
  );
  const toAccountId = useMemo(
    () => form.to_account_id || accounts?.find((a) => String(a.id) !== String(fromAccountId))?.id || '',
    [form.to_account_id, fromAccountId, accounts]
  );
  const fromAccount = accounts?.find((a) => String(a.id) === String(fromAccountId));
  const toAccount = accounts?.find((a) => String(a.id) === String(toAccountId));

  useEffect(() => {
    if (form.type !== 'transfer' || conceptEdited || !fromAccount || !toAccount) return;
    setForm((f) => ({ ...f, concept: `Transfer ${fromAccount.name} → ${toAccount.name}` }));
  }, [form.type, conceptEdited, fromAccount, toAccount]);

  const changeType = (type: EntryType) => {
    setConceptEdited(editing || type !== 'transfer' || !!form.concept.trim());
    setForm((f) => ({ ...f, type }));
  // function changeType(type: EntryType) {
  //   setConceptEdited(type !== 'transfer' || !!form.concept.trim());
  //   setForm((f) => ({ ...f, type, is_fixed: type === 'transfer' ? false : f.is_fixed }));
  };

  function setConcept(e: React.ChangeEvent<HTMLInputElement>) {
    setConceptEdited(true);
    setForm((f) => ({ ...f, concept: e.target.value }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!(Number(form.amount) > 0)) return setError('Enter an amount greater than zero.');
    if (!form.concept.trim()) return setError('Enter a concept.');
    if (form.type === 'transfer') {
      if (!fromAccountId || !toAccountId) return setError('Pick both accounts.');
      if (String(fromAccountId) === String(toAccountId)) return setError('Pick two different accounts.');
    } else if (!accountId) {
      return setError('Pick an account.');
    }

    setSaving(true);
    try {
      const transferBody = {
        type: form.type,
        profile_id: profileId,
        from_account_id: Number(fromAccountId),
        to_account_id: Number(toAccountId),
        amount: Number(form.amount),
        txn_date: form.txn_date,
        concept: form.concept,
      };
      const transactionBody = {
        profile_id: profileId,
        account_id: Number(accountId),
        type: form.type,
        amount: Number(form.amount),
        txn_date: form.txn_date,
        concept: form.concept,
        counterparty: form.counterparty.slice(0, TEXT_LIMITS.counterparty),
        tag: form.tag,
        is_fixed: form.is_fixed,
        recurrence: form.is_fixed
          ? { frequency: form.frequency, start_date: form.start_date }
          : null,
      };

      if (entry) {
        await api.put(entry.type === 'transfer' ? `/transfers/${entry.id}` : `/transactions/${entry.id}`, form.type === 'transfer' ? transferBody : transactionBody);
      } else if (form.type === 'transfer') {
        await api.post(`/profiles/${profileId}/transfers`, transferBody);
      } else {
        await api.post('/transactions', transactionBody);
      }
      bump();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const tagOptions = tags?.map((t) => ({ value: t.name, label: t.name })) ?? [];

  return (
    <Modal title={editing ? 'Edit entry' : 'Add entry'} onClose={onClose} bgColor={form.type === 'income' ? 'Green' : form.type === 'transfer' ? 'Yellow' : 'Blue'}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <SegmentedControl
          ariaLabel="Entry type"
          items={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
            { value: 'transfer', label: 'Transfer' },
          ]}
          value={form.type}
          onChange={changeType}
          full
        />

        <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
          <Field label="Amount (€)" htmlFor="tm-amount">
            <input id="tm-amount" type="number" inputMode="decimal" step="0.01" min="0.01" value={form.amount} onChange={set('amount')} autoFocus required />
          </Field>
          <DateField id="tm-date" label="Date" value={form.txn_date} onChange={(v) => setForm((f) => ({ ...f, txn_date: v }))} />
        </div>

        <Field label="Concept" htmlFor="tm-concept">
          <input id="tm-concept" type="text" value={form.concept} onChange={setConcept} maxLength={TEXT_LIMITS.concept} placeholder={form.type === 'transfer' ? 'Transfer Savings → Checking' : 'Groceries at Mercadona'} required />
        </Field>

        {form.type === 'transfer' ? (
          <div className="grid grid-cols-[1fr_auto_1fr] gap-[10px] items-end max-sm:grid-cols-1">
            <AccountSelect
              id="tm-from-account"
              accounts={accounts ?? []}
              value={fromAccountId}
              label="From"
              placeholder="Pick account"
              onChange={(v) => setForm((f) => ({ ...f, from_account_id: v }))}
            />
            <Button
              variant="ghost"
              className="h-[38px] px-3 max-sm:w-full"
              onClick={() => setForm((f) => ({ ...f, from_account_id: String(toAccountId), to_account_id: String(fromAccountId) }))}
              aria-label="Swap transfer accounts"
            >
              <Icon src="arrows-left-right" type="black" className="h-5 w-5" title="Swap accounts" />
            </Button>
            <AccountSelect
              id="tm-to-account"
              accounts={accounts ?? []}
              value={toAccountId}
              label="To"
              placeholder="Pick account"
              onChange={(v) => setForm((f) => ({ ...f, to_account_id: v }))}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
              <Field label={form.type === 'income' ? 'Payer' : 'Payee'} htmlFor="tm-who">
                <input id="tm-who" type="text" value={form.counterparty} onChange={set('counterparty')} maxLength={TEXT_LIMITS.counterparty} />
              </Field>
              <SelectField
                id="tm-tag"
                label="Tag"
                value={form.tag}
                groups={[{ key: 'tags', options: tagOptions }]}
                
                onChange={(v) => setForm((f) => ({ ...f, tag: v.slice(0, TEXT_LIMITS.tag) }))}
              />
            </div>

            <AccountSelect
              id="tm-account"
              accounts={accounts ?? []}
              value={accountId}
              onChange={(v) => setForm((f) => ({ ...f, account_id: v }))}
            />

            <Toggle
              checked={form.is_fixed}
              onChange={(v) => setForm((f) => ({ ...f, is_fixed: v }))}
              label={(
                <span>
                  Is fixed?
                  <small className="block text-muted text-xs">Repeats automatically as a recurring entry</small>
                </span>
              )}
            />
          </>
        )}

        {form.type !== 'transfer' && form.is_fixed && (
          <div className="flex flex-col gap-3 pl-[14px] border-l-2 border-accent-soft">
            <div className="grid grid-cols-2 gap-[14px] max-sm:grid-cols-1">
              <Field label="Frequency" htmlFor="tm-freq">
                <select id="tm-freq" value={form.frequency} onChange={set('frequency')}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Starts on" htmlFor="tm-start">
                <input id="tm-start" type="date" value={form.start_date} onChange={set('start_date')} required />
              </Field>
            </div>
            <p className="m-0 text-xs text-muted">Past occurrences since the start date are added right away.</p>
          </div>
        )}

        {error && <p className="m-0 text-sm text-neg" role="alert">{error}</p>}

        <div className="flex justify-between gap-2.5 mt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : form.type === 'income' ? 'Add income' : form.type === 'transfer' ? 'Add transfer' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
